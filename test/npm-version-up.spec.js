const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const {expect} = require('chai');
const {execSync} = require('child_process');

const pkgJson = {
  name: 'wnpm-ci',
  version: '6.2.0'
};

describe('npm-version-up cli', () => {
  let cwd;
  beforeEach(() => {
    cwd = tmp.dirSync({unsafeCleanup: true}).name;
    fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(pkgJson, null, 2));
  });

  it('should bump patch by default', () => {
    execSync(path.resolve(__dirname, '../scripts/npm-version-up.js'), {cwd});

    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')));
    expect(pkg.private).to.equal(undefined);
    expect(pkg.version).to.not.equal('6.2.0');
    expect(pkg.version).to.contain('6.2.');
  });

  it('should bump minor', () => {
    execSync(path.resolve(__dirname, '../scripts/npm-version-up.js --bump-minor'), {cwd});

    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')));
    expect(pkg.private).to.equal(undefined);
    expect(pkg.version).to.not.equal('6.2.0');
    expect(pkg.version).to.contain('6.3.');
  });
});
