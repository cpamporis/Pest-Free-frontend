const DEVELOPMENT_VARIANT = "development";
const DEVELOPMENT_BUNDLE_IDENTIFIER = "com.cpamporis.pestfree.dev";
const DEVELOPMENT_SCHEME = "pestify-dev";

module.exports = ({ config }) => {
  const isDevelopment =
    process.env.APP_VARIANT === DEVELOPMENT_VARIANT;

  if (!isDevelopment) throw new Error("Hetzner test branch refuses production builds and updates");
  require("./src/security/drTarget.cjs").resolveTarget(process.env.EXPO_PUBLIC_PESTIFY_TARGET, process.env.EXPO_PUBLIC_HETZNER_API_ORIGIN);
  const voiceEnabled = process.env.PESTIFY_VOICE_ENABLED === "1";
  if (process.env.PESTIFY_VOICE_LAB === "1" || process.env.PESTIFY_VOICE_FIELD_LAB === "1")
    throw new Error("Use the Security Lab checkout for Lab build flags");
  if (voiceEnabled && (isDevelopment || config.ios.bundleIdentifier !== "com.cpamporis.pestfree"))
    throw new Error("Production voice requires the production variant and bundle");
  if (voiceEnabled && process.env.EAS_BUILD_PLATFORM && process.env.EAS_BUILD_PLATFORM !== "ios")
    throw new Error("Production voice is currently iOS-only");

  return {
    ...config,
    ...(voiceEnabled ? {
      version: "1.4.0",
      plugins: [...(config.plugins || []), "./plugins/withPestifyVoice"],
      runtimeVersion: "pestify-ios-voice-1"
    } : {}),
    updates: { ...(config.updates || {}), enabled: false },
    runtimeVersion: "pestify-hetzner-dr-test-1",
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
