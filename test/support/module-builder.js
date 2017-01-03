const path = require('path'),
  shelljs = require('shelljs'),
  fs = require('fs');

class ModuleBuilder {
  constructor(cwd, dir) {
    this._cwd = cwd;
    this._dir = dir;
    shelljs.mkdir('-p', this._dir);
    console.log(path.join(this._dir + '/.npmrc'));
    fs.writeFileSync(path.join(this._dir + '/.npmrc'), 'registry=http://localhost:3010\n//localhost:3010/:_password=cXdl\n//localhost:3010/:username=qwe\n//localhost:3010/:email=qwe@qwe.lt\n//localhost:3010/:always-auth=false');
  }

  packageJson(overrides) {
    return this.addFile('package.json', aPackageJson(overrides));
  }

  addFile(name, payload) {
    if (payload && typeof payload !== 'string') {
      fs.writeFileSync(path.join(this._dir, name), JSON.stringify(payload, null, 2));
    } else {
      fs.writeFileSync(path.join(this._dir, name), payload || '');
    }

    return this;
  }

  publishTo(registryUrl) {
    shelljs.exec(`npm --registry ${registryUrl} publish .`);
    return this;
  }

  hasFile(name) {
    return shelljs.test('-f', name);
  }

  readFile(name) {
    return shelljs.cat(path.join(this._dir, name));
  }

  readJsonFile(name) {
    return JSON.parse(this.readFile(name));
  }

  readPackageJson() {
    return this.readJsonFile('package.json');
  }

  execVersionUp(args) {
    const res = shelljs.exec(path.join(__dirname, '/../../scripts/npm-version-up.js') + ` ${args || ''}`,{silent: false});
    const output = res.output;
    if (res.code !== 0) {
      const error = new Error(`Program exited with error code: ${res.code} and output ${output}`);
      error.output = output;
      throw error;
    } else {
      return res.output;
    }
  }

  exec(cmd) {
    const res = shelljs.exec(cmd);
    const output = res.output;
    if (res.code !== 0) {
      throw new Error(`Script exited with error code: ${res.code} and output ${output}`);
    } else {
      return output;
    }
  }

  switchTo() {
    process.chdir(this._dir);
    return this;
  }

  rm() {
    process.chdir(this._cwd);
    shelljs.rm('-rf', this._dir);
    return this;
  }

}

function aPackageJson(overrides) {
  return Object.assign({}, {
    version: '1.0.0',
    name: 'npm-module-for-testing-publish' + Math.ceil(Math.random() * 100000).toString(),
    description: '',
    main: 'index.js',
    scripts: {
      test: 'echo "test script"'
    },
    author: '',
    license: 'ISC'
  }, overrides);
}

module.exports = ModuleBuilder;
