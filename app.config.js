const DEVELOPMENT_VARIANT = "development";
const DEVELOPMENT_BUNDLE_IDENTIFIER = "com.cpamporis.pestfree.dev";
const DEVELOPMENT_SCHEME = "pestify-dev";

module.exports = ({ config }) => {
  const isDevelopment =
    process.env.APP_VARIANT === DEVELOPMENT_VARIANT;
  const voiceProbe = process.env.PESTIFY_VOICE_LAB === "1";
  if (voiceProbe && !isDevelopment) throw new Error("Voice probe is restricted to the development variant");

  return {
    ...config,
    name: isDevelopment ? "Pestify Dev" : config.name,
    ...(voiceProbe ? {
      plugins: [...(config.plugins || []), "./plugins/withPestifyVoiceProbe"],
      updates: { ...config.updates, enabled: false },
      runtimeVersion: "pestify-voice-probe-3"
    } : {}),
    ...(isDevelopment ? { scheme: DEVELOPMENT_SCHEME } : {}),
    ios: {
      ...config.ios,
      bundleIdentifier: isDevelopment
        ? DEVELOPMENT_BUNDLE_IDENTIFIER
        : config.ios.bundleIdentifier
    }
  };
};
