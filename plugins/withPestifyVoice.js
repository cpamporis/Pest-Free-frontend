const fs = require('node:fs');
const path = require('node:path');
const {withInfoPlist,withXcodeProject,IOSConfig} = require('expo/config-plugins');
function applyVoiceInfoPlist(plist) {
  return {...plist,
    PestifyVoiceEnabled:true,
    UIBackgroundModes:[...new Set([...(plist.UIBackgroundModes || []),'audio'])],
    NSMicrophoneUsageDescription:'Το Pestify χρησιμοποιεί το μικρόφωνο για φωνητική καταχώριση σταθμών. Μετά την έναρξη παραμένει ενεργό και με κλειδωμένη οθόνη μέχρι τη διακοπή. Ο ήχος επεξεργάζεται στη συσκευή χωρίς αποθήκευση.',
    NSSpeechRecognitionUsageDescription:'Το Pestify αναγνωρίζει ελληνικές εντολές μόνο στη συσκευή, ώστε να συμπληρώνετε ελέγχους σταθμών χωρίς να αγγίζετε το κινητό. Δεν αποστέλλεται ήχος ή απομαγνητοφώνηση για αναγνώριση.'
  };
}
module.exports = config => {
  if(config.ios?.bundleIdentifier !== 'com.cpamporis.pestfree')throw Error('Production voice requires the production iOS bundle');
  config=withInfoPlist(config,c=>{c.modResults=applyVoiceInfoPlist(c.modResults);return c;});
  return withXcodeProject(config,c=>{
    const name=IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
    for(const filename of ['PestifyVoiceProbe.m','PestifyFieldSession.m']) {
      const relative=`${name}/${filename}`;
      const dest=path.join(c.modRequest.platformProjectRoot,name,filename);
      fs.mkdirSync(path.dirname(dest),{recursive:true});
      fs.copyFileSync(path.join(__dirname,'../native/voice-probe',filename),dest);
      if(!c.modResults.hasFile(relative))IOSConfig.XcodeUtils.addBuildSourceFileToGroup({filepath:relative,groupName:name,project:c.modResults});
    }
    for(const framework of ['Speech.framework','AVFoundation.framework'])c.modResults.addFramework(framework,{link:true});
    return c;
  });
};
module.exports.applyVoiceInfoPlist=applyVoiceInfoPlist;
