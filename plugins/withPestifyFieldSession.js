const fs = require('node:fs');
const path = require('node:path');
const {withInfoPlist,withXcodeProject,IOSConfig} = require('expo/config-plugins');
module.exports = config => {
  if(config.ios?.bundleIdentifier !== 'com.cpamporis.pestfree.dev') throw Error('Field session is Lab-only');
  config=withInfoPlist(config,c=>{
    c.modResults.PestifyFieldSessionEnabled=true;
    c.modResults.UIBackgroundModes=[...new Set([...(c.modResults.UIBackgroundModes||[]),'audio'])];
    c.modResults.NSMicrophoneUsageDescription='Η λειτουργία πεδίου κρατά ενεργό το μικρόφωνο, ακόμη και με κλειδωμένη οθόνη, μέχρι να την τερματίσετε. Ο ήχος επεξεργάζεται τοπικά χωρίς αποθήκευση.';
    c.modResults.NSSpeechRecognitionUsageDescription='Τοπική αναγνώριση της φράσης Pestify Alert και ελληνικών εντολών. Δεν χρησιμοποιείται αναγνώριση μέσω δικτύου.';
    return c;
  });
  return withXcodeProject(config,c=>{
    const name=IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
    const filename='PestifyFieldSession.m';
    const relative=`${name}/${filename}`;
    const dest=path.join(c.modRequest.platformProjectRoot,name,filename);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.copyFileSync(path.join(__dirname,'../native/voice-probe',filename),dest);
    if(!c.modResults.hasFile(relative)) IOSConfig.XcodeUtils.addBuildSourceFileToGroup({filepath:relative,groupName:name,project:c.modResults});
    return c;
  });
};
