const path = require('path');

module.exports = (commander, shell, randomDirGenerator, packageHandler, registryOption = '') => {
  function generateRandomDir() {
    return path.resolve(shell.tempdir(), randomDirGenerator.generate());
  }

  function rm(path) {
    shell.rm('-rf', path);
  }

  function generateDirectory() {
    const randomDir = generateRandomDir();
    shell.mkdir(randomDir);
    createdDirs.push(randomDir);
    return randomDir;
  }

  let createdDirs = [];

  return {
    fetch: (name, version) => {
      const randomDir = generateDirectory();
      shell.pushd(randomDir);
      const output = commander.exec(`npm pack ${registryOption} ${name}@${version}`);
      commander.exec(`tar -xf ${output.trim()}`);
      return `${randomDir}/package`;
    },

    cloneAndPack: (cwd) => {
      let randomDir = generateDirectory();
      shell.pushd(randomDir);
      commander.exec(`npm pack ${cwd}`);
      commander.exec(`tar -xf *.tgz`);
      return `${randomDir}/package`;
    },

    copyVersion: (remotePath, localPath, name, transformer) => {
      transformer = transformer || function (x) {
          return x;
        };
      try {
        const localFile = path.join(localPath, name);
        const remoteFile = path.join(remotePath, name);
        let currPackage = transformer(packageHandler.readPackageJson(localFile));
        let remotePackage = transformer(packageHandler.readPackageJson(remoteFile));
        currPackage.version = remotePackage.version;
        packageHandler.writePackageJson(currPackage, localFile);
        packageHandler.writePackageJson(remotePackage, remoteFile);
      } catch (e) {
      }
    },

    cleanup: () => {
      createdDirs.forEach(dir => {
        shell.popd();
        rm(dir)
      });
      createdDirs = [];
    }
  };
};
