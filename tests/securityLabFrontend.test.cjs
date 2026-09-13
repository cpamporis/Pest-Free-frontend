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

test("the Lab frontend is fail-closed to the Security Lab API", () => {
  const source = read("src/services/apiService.js");

  assert.match(
    source,
    /https:\/\/security-lab-security-lab\.up\.railway\.app/
  );
  assert.match(source, /SecureStore\.setItemAsync/);
  assert.match(source, /mfaDeviceToken/);
  assert.doesNotMatch(
    source,
    /API_BASE_URL\s*=\s*["']https:\/\/field-inspections-backend-production/
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
  assert.match(nativeImageViewer, /AdminSessionTimer/);
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
