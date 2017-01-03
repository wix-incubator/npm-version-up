const fork = require('child_process').fork,
  shelljs = require('shelljs');

class Registry {
  constructor() {
    this._output = '';
  }

  latestVersionFor(name) {
    const res = shelljs.exec(`npm --registry ${this.url} view ${name} --json`, {silent: true});
    if (res.code !== 0) {
      return undefined;
    } else {
      return JSON.parse(res.output)['dist-tags'].latest;
    }
  }

  start() {
    return new Promise((resolve, reject) => {
      this._process = fork('./test/support/registry-server.js', [], {silent: true});

      this._process.stdout.on('data', data => {
        this._output += data;
        if (this._output.indexOf('Npm registry listening') > -1) {
          resolve();
        }
      });

      this._process.stderr.on('data', data => this._output += data);
      this._process.on('exit', code => {
        if (code !== 0) {
          console.error(this._output);
        }
        reject(new Error(`exited with code ${code }`));
      });
      this._process.on('error', err => {
        console.error(this._output);
        reject(err);
      });
    });
  }

  get url() {
    return 'http://localhost:3010';
  }

  stop() {
    return new Promise((resolve, reject) => {
      this._process.kill();
      this._process.on('exit', code => resolve());
      this._process.on('error', err => reject(err));
    });
  }

  get stdout() {
    return this._output;
  }

  beforeAndAfterEach() {
    beforeEach(() => this.start());
    afterEach(() => this.stop());
    return this;
  }

  beforeAndAfter() {
    before(() => this.start());
    after(() => this.stop());
    return this;
  }

}

module.exports = () => new Registry();