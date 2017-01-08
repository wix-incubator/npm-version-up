const expect = require('chai').use(require('sinon-chai')).expect,
  sinon = require('sinon'),
  fs = require('fs'),
  PackageHandler = require('../lib/package-handler'),
  resolve = require('path').resolve;

describe('package-handler', () => {

  it('should read a package from path', sinon.test(function () {
    fs.readFileSync = this.stub().returns('{"version":123}');

    expect(PackageHandler(fs).readPackageJson('/path')).to.deep.equal({version: 123});

    expect(fs.readFileSync).to.have.been.calledWithMatch('/path');
  }));

  it('should read a package from cwd if path is not provided', sinon.test(function () {
    fs.readFileSync = this.stub().returns('{"version":123}');

    PackageHandler(fs).readPackageJson();

    expect(fs.readFileSync).to.have.been.calledWithMatch(resolve('./package.json'));
  }));


  it('should write a package to path', sinon.test(function () {
    fs.writeFileSync = this.spy();

    PackageHandler(fs).writePackageJson({}, '/kaki.json');

    expect(fs.writeFileSync).to.have.been.calledWithMatch('/kaki.json', JSON.stringify({}));
  }));

  it('should write a package to cwd by default', sinon.test(function () {
    fs.writeFileSync = this.spy();

    PackageHandler(fs).writePackageJson({});

    expect(fs.writeFileSync).to.have.been.calledWithMatch(resolve('./package.json'), JSON.stringify({}));

  }));

});
