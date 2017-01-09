const sinon = require('sinon'),
  expect = require('chai').expect,
  assert = require('chai').assert,
  VersionFetcher = require('../lib/version-fetcher');

describe('version-fetcher', () => {
  const packageVersion = '1.2.3';
  const packageName = 'moshe';
  const rootTempPath = '/tmp';

  let commander;
  const aggregateCommand = cmdName => arg => {
    let tmpl = `${arg}`;
    if (cmdName) {
      tmpl = `${cmdName} ${arg}`
    }
    commands.push(tmpl);
  };

  const tarFileName = `${packageName}-${packageVersion}.tgz`;
  const randomDir = 'v1';

  let shell;
  let randomDirGenerator;
  let packageHandler;
  let versionFetcher;
  let commands;
  beforeEach(() => {
    commands = [];

    commander = {
      exec: arg => {
        commands.push(arg);
        if (arg.indexOf('npm pack') > -1) {
          return tarFileName;
        }
      }
    };

    shell = {
      exec: aggregateCommand(),
      tempdir: () => rootTempPath,
      pushd: aggregateCommand('pushd'),
      popd: () => commands.push('popd'),
      mkdir: aggregateCommand('mkdir'),
      cp: (flag, from, dest) => commands.push(`cp ${flag} ${from} ${dest}`),
      rm: (options, dest) => commands.push(`rm ${options} ${dest}`)
    };

    randomDirGenerator = {
      generate: sinon.stub().returns(randomDir)
    };
    packageHandler = {
      readPackageJson: sinon.stub().returns({version: '123'}),
      writePackageJson: sinon.stub().returns()
    };

    versionFetcher = VersionFetcher(commander, shell, randomDirGenerator, packageHandler);
  });

  it('should retrieve the version from npm and pack it', () => {
    const pathToVersion = versionFetcher.fetch(packageName, packageVersion);
    assert.deepEqual(commands, [
      'mkdir /tmp/v1',
      'pushd /tmp/v1',
      `npm pack  ${packageName}@${packageVersion}`,
      `tar -xf ${tarFileName}`
    ]);
    expect(pathToVersion).to.be.string(`${rootTempPath}/v1/package`);
  });

  it('should pack current package', () => {
    var cwd = 'cwd';

    const pathToCloned = versionFetcher.cloneAndPack(cwd);
    assert.deepEqual(commands, [
      'mkdir /tmp/v1',
      'pushd /tmp/v1',
      `npm pack ${cwd}`,
      `tar -xf *.tgz`
    ]);
    expect(pathToCloned).to.be.string(`${rootTempPath}/v1/package`);
  });

  it('should copy the version from one package to another', () => {
    const remotePath = '/remote';
    const localPath = '/local';
    const remoteFile = '/remote/kaki.json';
    const localFile = '/local/kaki.json';
    const remoteVersion = 'remote version';
    const localVersion = 'local version';

    const jsons = {
      [remoteFile]: `{"version" : "${remoteVersion}"}`,
      [localFile]: `{"version":"${localVersion}"}`
    };

    const packageHandler = {
      readPackageJson: path => JSON.parse(jsons[path]),
      writePackageJson: (currPackage, path) => jsons[path] = JSON.stringify(currPackage)
    };

    const versionFetcher = VersionFetcher(commander, shell, randomDirGenerator, packageHandler);
    versionFetcher.copyVersion(remotePath, localPath, 'kaki.json', x => Object.assign(x, {abc: 123}));
    expect(packageHandler[remoteFile]).to.eql(packageHandler[localFile]);
    expect(packageHandler.readPackageJson(localFile).version).to.eql(remoteVersion);
    expect(packageHandler.readPackageJson(localFile).abc).to.eql(123);
  });

  it('should ignore exceptions when copying versions', () => {
    const versionFetcher = VersionFetcher(commander, shell, randomDirGenerator, {});
    versionFetcher.copyVersion('/a', '/b', 'kaki.json');
  });

  it('should remove directories when done', () => {
    const cwd = '/';
    const randomDir1 = 'randomDir1';
    const randomDir2 = 'randomDir2';
    randomDirGenerator.generate
      .onCall(0).returns(randomDir1)
      .onCall(1).returns(randomDir2);

    versionFetcher.fetch(packageName, packageVersion);
    versionFetcher.cloneAndPack(cwd);
    versionFetcher.cleanup();
    expect(commands).to.contain('popd');
    expect(commands).to.contain(`rm -rf ${rootTempPath + '/' + randomDir1}`);
    expect(commands).to.contain(`rm -rf ${rootTempPath + '/' + randomDir2}`);
  });

  describe('should propagate errors', () => {
    const cwd = '/';

    // TODO handle errors in shelljs non-callbacked functions
    describe('shelljs err', () => {
      let versionFetcher;

      beforeEach(() => {
        const givenNpmErr = {
          exec: () => {
            throw new Error('error');
          }
        };

        versionFetcher = VersionFetcher(givenNpmErr,
          shell,
          randomDirGenerator,
          packageHandler);
      });
      it('fetch', () => {
        expect(() => versionFetcher.fetch('name', 'version')).to.throw('error');
      });

      it('cloneAndPack', () => {
        expect(() => versionFetcher.cloneAndPack(cwd)).to.throw('error');
      });
    });

    describe('commander err', () => {
      let versionFetcher;

      beforeEach(() => {
        commander = {
          exec: () => {
            throw new Error('error');
          }
        };


        versionFetcher = VersionFetcher(commander,
          shell,
          randomDirGenerator,
          packageHandler);
      });

      it('fetch', () => {
        expect(() => versionFetcher.fetch('name', 'version')).to.throw('error');
      });

      it('cloneAndPack', () => {
        expect(() => versionFetcher.cloneAndPack(cwd)).to.throw('error');
      });
    });
  });
});
