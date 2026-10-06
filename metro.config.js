const { getDefaultConfig } = require("expo/metro-config");
const fs = require("node:fs");
const path = require("node:path");
const config = getDefaultConfig(__dirname);
const dependencies = fs.realpathSync(path.join(__dirname, "node_modules"));
// Watch only the shared dependencies, never the parent restore/secrets folder.
config.watchFolders = [dependencies];
config.resolver.nodeModulesPaths = [dependencies];
module.exports = config;

