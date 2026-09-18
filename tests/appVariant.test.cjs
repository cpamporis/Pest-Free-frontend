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

test("production and development install as separate iOS apps", () => {
  const production = evaluateConfig(undefined);
  const development = evaluateConfig("development");

  assert.equal(production.name, "Pestify");
  assert.equal(
    production.ios.bundleIdentifier,
    "com.cpamporis.pestfree"
  );
  assert.equal(production.scheme, undefined);

  assert.equal(development.name, "Pestify Dev");
  assert.equal(
    development.ios.bundleIdentifier,
    "com.cpamporis.pestfree.dev"
  );
  assert.equal(development.scheme, "pestify-dev");

  assert.equal(development.slug, production.slug);
  assert.equal(
    development.extra.eas.projectId,
    production.extra.eas.projectId
  );
  assert.equal(development.updates.url, production.updates.url);
  assert.deepEqual(
    development.runtimeVersion,
    production.runtimeVersion
  );
  assert.deepEqual(development.android, production.android);
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
