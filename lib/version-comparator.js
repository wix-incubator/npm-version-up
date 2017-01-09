function cleanShrinkwrap(json) {
  for (let key in json) {
    if (typeof json[key] === 'object') {
      json[key] = cleanShrinkwrap(json[key]);
    } else if (typeof json[key] === 'string' && key !== 'version') {
      delete json[key];
    }
  }
  return json;
}

module.exports = (directoryDiff, versionFetcher, shell) => {
  return {
    compare: (name, remoteVersion) => {
      try {
        const cwd = shell.pwd();
        const currVersionPath = versionFetcher.cloneAndPack(cwd);
        const remoteVersionPath = versionFetcher.fetch(name, remoteVersion);
        versionFetcher.copyVersion(remoteVersionPath, currVersionPath, 'package.json');
        versionFetcher.copyVersion(remoteVersionPath, currVersionPath, 'npm-shrinkwrap.json', cleanShrinkwrap);
        return directoryDiff.compareDirectories(currVersionPath, remoteVersionPath);
      } catch (e) {
        return false;
      }
      finally {
        versionFetcher.cleanup();
      }

    }
  };
};