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
      const cwd = shell.pwd();
      return Promise.resolve()
        .then(() => versionFetcher.cloneAndPack(cwd))
        .then((currVersionPath) =>
          Promise.resolve()
            .then(() => versionFetcher.fetch(name, remoteVersion))
            .then((remoteVersionPath) => {
              versionFetcher.copyVersion(remoteVersionPath, currVersionPath, 'package.json');
              versionFetcher.copyVersion(remoteVersionPath, currVersionPath, 'npm-shrinkwrap.json', cleanShrinkwrap);

              return Promise.resolve()
                .then(() => directoryDiff.compareDirectories(currVersionPath, remoteVersionPath))
                .then((areTheSame) => {
                  versionFetcher.cleanup();
                  return areTheSame;
                })
            })
        )
        .catch(() => {
          versionFetcher.cleanup();
          return false;
        });
    }
  };
};


