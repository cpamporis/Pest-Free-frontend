const fs = require("node:fs");
const path = require("node:path");
const { withInfoPlist, withXcodeProject, IOSConfig } = require("expo/config-plugins");

module.exports = function withPestifyVoiceProbe(config) {
  if (config.ios?.bundleIdentifier !== "com.cpamporis.pestfree.dev") {
    throw Error("Voice probe requires the Pestify Dev bundle identifier");
  }
  config = withInfoPlist(config, c => {
    c.modResults.PestifyVoiceLabProbeEnabled = true;
    c.modResults.NSMicrophoneUsageDescription = "Δοκιμή φωνητικής καταχώρισης στο Security Lab. Ο ήχος χρησιμοποιείται προσωρινά στη συσκευή και δεν αποθηκεύεται.";
    c.modResults.NSSpeechRecognitionUsageDescription = "Δοκιμή αναγνώρισης ελληνικών αποκλειστικά στη συσκευή. Αν δεν υποστηρίζεται, η δοκιμή δεν ξεκινά.";
    return c;
  });
  return withXcodeProject(config, c => {
    const name = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
    const filename = "PestifyVoiceProbe.m";
    const relative = `${name}/${filename}`;
    const dest = path.join(c.modRequest.platformProjectRoot, name, filename);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(__dirname, "../native/voice-probe", filename), dest);
    if (!c.modResults.hasFile(relative)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath: relative, groupName: name, project: c.modResults });
    }
    for (const framework of ["Speech.framework", "AVFoundation.framework"]) {
      c.modResults.addFramework(framework, { link: true });
    }
    return c;
  });
};
