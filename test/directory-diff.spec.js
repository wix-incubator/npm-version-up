const expect = require('chai').use(require('sinon-chai')).expect,
  directoryDiff = require('../lib/directory-diff'),
  sinon = require('sinon');

describe('directory-diff', () => {

  it('should call linux diff', () => {
    const {exec, compareDirectories} = setupWithExecReturns(0, 'output');

    compareDirectories('v1', 'v2');

    expect(exec).to.have.been.calledWith('diff -rq v1 v2');
  });

  it("should return true when code is 0", () => {
    const {compareDirectories} = setupWithExecReturns(0, 'output');

    expect(compareDirectories('v1', 'v2')).to.equal(true);
  });

  it("should return false when diff returns code 1", () => {
    const {compareDirectories} = setupWithExecReturns(1, "output", 'stderr');

    expect(compareDirectories('v1', 'v2')).to.equal(false);
  });

  it('should return err when diff returns code other than 0..1', () => {
    const {compareDirectories} = setupWithExecReturns(2, "123", 'error');

    expect(() => compareDirectories('v1', 'v2')).to.throw('error');
  });

  function setupWithExecReturns(code, stdout, stderr) {
    const exec = sinon.stub().returns({code, stdout, stderr});
    const compareDirectories = directoryDiff({exec}).compareDirectories;
    return {exec, compareDirectories};
  }
});