const DEVELOPMENT_VARIANT = "development";
const DEVELOPMENT_BUNDLE_IDENTIFIER = "com.cpamporis.pestfree.dev";
const DEVELOPMENT_SCHEME = "pestify-dev";

module.exports = ({ config }) => {
  const isDevelopment =
    process.env.APP_VARIANT === DEVELOPMENT_VARIANT;

  return {
    ...config,
    name: isDevelopment ? "Pestify Dev" : config.name,
    ...(isDevelopment ? { scheme: DEVELOPMENT_SCHEME } : {}),
    ios: {
      ...config.ios,
      bundleIdentifier: isDevelopment
        ? DEVELOPMENT_BUNDLE_IDENTIFIER
        : config.ios.bundleIdentifier
    }
  };
};
