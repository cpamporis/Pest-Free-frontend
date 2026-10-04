const DEVELOPMENT_VARIANT = "development";
const DEVELOPMENT_BUNDLE_IDENTIFIER = "com.cpamporis.pestfree.dev";
const DEVELOPMENT_SCHEME = "pestify-dev";

module.exports = ({ config }) => {
  const isDevelopment =
    process.env.APP_VARIANT === DEVELOPMENT_VARIANT;
  if (!isDevelopment) throw new Error("Isolated restore requires APP_VARIANT=development");
  const fieldSession = process.env.PESTIFY_VOICE_FIELD_LAB === "1";
  const voiceProbe = process.env.PESTIFY_VOICE_LAB === "1";
  if (fieldSession && !voiceProbe) throw new Error("Field session requires the voice Lab build");
  if (voiceProbe && !isDevelopment) throw new Error("Voice probe is restricted to the development variant");

  return {
    ...config,
    name: "Pestify Restore Test",
    updates: { ...config.updates, enabled: false },
    ...(voiceProbe ? {
      plugins: [...(config.plugins || []), ...(fieldSession ? ["./plugins/withPestifyFieldSession"] : []), "./plugins/withPestifyVoiceProbe"],
      updates: { ...config.updates, enabled: false },
      runtimeVersion: fieldSession ? "pestify-field-lab-5" : "pestify-voice-probe-3"
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
