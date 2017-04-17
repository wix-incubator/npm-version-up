module.exports = (directoryDiff, versionFetcher, shell) => {
  return {
    compare: (name, remoteVersion) => {
      try {
        const cwd = shell.pwd();
        const currVersionPath = versionFetcher.cloneAndPack(cwd);
        const remoteVersionPath = versionFetcher.fetch(name, remoteVersion);
        versionFetcher.copyVersion(remoteVersionPath, currVersionPath, 'package.json');
        versionFetcher.copyVersion(remoteVersionPath, currVersionPath, 'npm-shrinkwrap.json');
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