const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(
    path.join(root, relativePath),
    "utf8"
  );
}

function javascriptFiles(directory) {
  return fs.readdirSync(directory, {
    withFileTypes: true
  }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return javascriptFiles(absolute);
    }

    return entry.isFile() && entry.name.endsWith(".js")
      ? [absolute]
      : [];
  });
}

test("the production frontend is fail-closed to the production API", () => {
  const source = read("src/services/apiService.js");

  assert.match(
    source,
    /https:\/\/field-inspections-backend-production\.up\.railway\.app/
  );
  assert.match(source, /SecureStore\.setItemAsync/);
  assert.match(source, /mfaDeviceToken/);
  assert.match(source, /pestify\.production\.auth-token\.v1/);
  assert.match(source, /pestify\.production\.mfa-device\.v1/);
  assert.doesNotMatch(
    source,
    /https:\/\/security-lab-security-lab\.up\.railway\.app/
  );
});

test("every native admin modal uses the protected timer wrapper", () => {
  const screenRoots = [
    path.join(root, "src/screens/Admin"),
    path.join(root, "src/screens/SuperAdmin")
  ];
  const modalFiles = screenRoots
    .flatMap(javascriptFiles)
    .concat([
      path.join(root, "src/components/TimeZonePicker.js"),
      path.join(root, "src/screens/Technician/ReportScreen.js")
    ])
    .filter(file => fs.readFileSync(file, "utf8").includes("<Modal"));

  assert.ok(modalFiles.length > 0);

  for (const file of modalFiles) {
    assert.match(
      fs.readFileSync(file, "utf8"),
      /ProtectedAdminModal as Modal/,
      `${path.relative(root, file)} bypasses ProtectedAdminModal`
    );
  }

  const nativeImageViewer = read(
    "src/components/SecureImageViewer.native.js"
  );
  assert.match(nativeImageViewer, /AdminHeaderSessionActions/);
  assert.match(nativeImageViewer, /HeaderComponent={Header}/);
});


test("the countdown interval never performs a session refresh", () => {
  const source = read("src/security/AdminSessionContext.js");
  const intervalStart = source.indexOf("setInterval(");
  const intervalEnd = source.indexOf(");", intervalStart);
  const intervalBody = source.slice(intervalStart, intervalEnd + 2);

  assert.ok(intervalStart >= 0);
  assert.doesNotMatch(intervalBody, /refreshAdminSession/);
  assert.match(
    read("src/components/AdminSessionTimer.js"),
    /onPress={refreshAdminSession}/
  );
});

test("administrator session timers are header-bound and never floating", () => {
  const timerSource = read("src/components/AdminSessionTimer.js");
  const headerActionsSource = read(
    "src/components/AdminHeaderSessionActions.js"
  );

  assert.doesNotMatch(
    timerSource,
    /position\s*:\s*["']absolute["']/
  );
  assert.doesNotMatch(timerSource, /styles\.overlay/);
  assert.match(
    headerActionsSource,
    /<AdminSessionTimer[\s\S]*?\binline\b[\s\S]*?\bheaderAction\b[\s\S]*?\/>/
  );

  const surfaceStart = timerSource.indexOf(
    "export function ProtectedAdminSurface"
  );
  const modalStart = timerSource.indexOf(
    "export function ProtectedAdminModal"
  );
  const surfaceSource = timerSource.slice(surfaceStart, modalStart);

  assert.ok(surfaceStart >= 0);
  assert.ok(modalStart > surfaceStart);
  assert.doesNotMatch(surfaceSource, /<AdminSessionTimer/);

  const sharedHeaderFiles = [
    "src/screens/Admin/AdminNotifications.js",
    "src/screens/Admin/AdminTechCalendarPreview.js",
    "src/screens/Admin/AdminTechSchedule.js",
    "src/screens/Admin/CustomerProfile.js",
    "src/screens/Admin/CustomerRequestScreen.js",
    "src/screens/Admin/CustomersScreen.js",
    "src/screens/Admin/MaterialsScreen.js",
    "src/screens/Admin/Statistics.js",
    "src/screens/Admin/TechniciansScreen.js",
    "src/screens/SuperAdmin/CertificateTemplateEditorScreen.js",
    "src/screens/SuperAdmin/CreateOrganizationAdmin.js",
    "src/screens/SuperAdmin/OrganizationDetailsScreen.js",
    "src/screens/SuperAdmin/OrganizationsScreen.js",
    "src/screens/Technician/ReportScreen.js",
    "src/components/TimeZonePicker.js",
    "src/components/SecureImageViewer.native.js"
  ];

  for (const relativePath of sharedHeaderFiles) {
    assert.match(
      read(relativePath),
      /AdminHeaderSessionActions/,
      relativePath + " is missing the shared header timer"
    );
  }

  for (const relativePath of [
    "src/screens/Admin/AdminHomeScreen.js",
    "src/screens/SuperAdmin/SuperAdminHomeScreen.js"
  ]) {
    assert.match(
      read(relativePath),
      /<AdminSessionTimer[\s\S]*?\binline\b[\s\S]*?\bheaderAction\b[\s\S]*?\/>/,
      relativePath + " is missing the approved home timer"
    );
  }
});


test("production source tree cannot contact Security Lab", () => {
  const sourceFiles = javascriptFiles(path.join(root, "src"));
  const securityLabOrigin =
    "security-lab-security-lab.up.railway.app";
  const violations = sourceFiles
    .filter(file =>
      fs.readFileSync(file, "utf8").includes(securityLabOrigin)
    )
    .map(file => path.relative(root, file));

  assert.deepEqual(violations, []);
});

test("uploaded images are bound to the active API origin", () => {
  const requestScreen = read(
    "src/screens/Admin/CustomerRequestScreen.js"
  );
  const apiSource = read("src/services/apiService.js");

  assert.doesNotMatch(requestScreen, /IMAGE_BASE/);
  assert.match(requestScreen, /apiService\.getUploadedFileUrl/);
  assert.match(apiSource, /absoluteUrl\.origin !== backendOrigin/);
  assert.match(
    apiSource,
    /absoluteUrl\.pathname\.startsWith\("\/uploads\/"\)/
  );
  assert.doesNotMatch(
    apiSource,
    /return value;/
  );
});

test("legacy authentication storage is explicitly purged", () => {
  const source = read("src/services/apiService.js");

  assert.match(source, /LEGACY_AUTH_TOKEN_KEY = "authToken"/);
  assert.match(source, /AsyncStorage\.removeItem\(LEGACY_AUTH_TOKEN_KEY\)/);
  assert.match(source, /authStorageInitializationError/);
});

test("customer map uploads use the active secure administrator token", () => {
  const apiSource = read("src/services/apiService.js");
  const customersSource = read("src/screens/Admin/CustomersScreen.js");

  assert.match(apiSource, /async function uploadCustomerMap\(formData\)/);
  assert.match(apiSource, /Authorization: `Bearer \$\{authToken\}`/);
  assert.equal(
    (customersSource.match(/apiService\.uploadCustomerMap\(formData\)/g) || []).length,
    2
  );
  assert.doesNotMatch(customersSource, /AsyncStorage|getItem\("authToken"\)/);
  assert.match(
    customersSource,
    /formData\.append\("customerId", createdCustomer\.customerId\)/
  );
});
