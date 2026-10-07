const test = require("node:test");
const assert = require("node:assert/strict");

const appConfig = require("../app.config.js");
const staticConfig = require("../app.json").expo;
const easConfig = require("../eas.json");

function evaluateConfig(variant) {
  const previousVariant = process.env.APP_VARIANT;

  try {
    if (variant === undefined) {
      delete process.env.APP_VARIANT;
    } else {
      process.env.APP_VARIANT = variant;
    }

    return appConfig({ config: staticConfig });
  } finally {
    if (previousVariant === undefined) {
      delete process.env.APP_VARIANT;
    } else {
      process.env.APP_VARIANT = previousVariant;
    }
  }
}

test("only the Dev identity is available, with OTA updates disabled", () => {
  assert.throws(() => evaluateConfig(undefined), /refuses production/);
  process.env.EXPO_PUBLIC_PESTIFY_TARGET = "hetzner-dr-test";
  process.env.EXPO_PUBLIC_HETZNER_API_ORIGIN = "https://dr.example.test";
  try {
    const development = evaluateConfig("development");
    assert.equal(development.name, "Pestify Dev");
    assert.equal(development.ios.bundleIdentifier, "com.cpamporis.pestfree.dev");
    assert.equal(development.scheme, "pestify-dev");
    assert.equal(development.updates.enabled, false);
    assert.equal(development.runtimeVersion, "pestify-hetzner-dr-test-1");
  } finally {
    delete process.env.EXPO_PUBLIC_PESTIFY_TARGET;
    delete process.env.EXPO_PUBLIC_HETZNER_API_ORIGIN;
  }
});

test("the EAS development profile selects only the development variant", () => {
  assert.equal(
    easConfig.build.development.env.APP_VARIANT,
    "development"
  );
  assert.equal(easConfig.build.development.channel, "development");
  assert.equal(easConfig.build.production.channel, "production");
  assert.equal(easConfig.build.production.env, undefined);
});
