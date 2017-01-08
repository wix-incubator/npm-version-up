const assert = require('assert'),
  expect = require('chai').expect,
  versionCalc = require('../lib/version-calculator');

describe('version-calculator', () => {
  const publishedVersionsToTest = ['1.1.1', '1.1.2', '5.1.3', '5.4.0', '5.3.2', '5.4.1', '5.4.3'];

  describe('calculateNextVersionPackage', () => {

    it("should return a patch version increment when it's part of the latest 'branch'", () => {
      expect(nextVersionOfPackage('5.4.1')).to.equal('5.4.4');
    });

    it("should return a patch version increment when it's part of a previous 'branch'", () => {
      expect(nextVersionOfPackage('1.1.1')).to.equal('1.1.3');
    });

    it("should return itself when it's the largest version of the latest 'branch'", () => {
      expect(nextVersionOfPackage('5.4.5')).to.equal('5.4.5');
    });

    it("should return itself when it's the largest version of the previous 'branch'", () => {
      expect(nextVersionOfPackage('1.1.4')).to.equal('1.1.4');
    });

    it("should return itself when it's the only version of a 'branch'", () => {
      expect(nextVersionOfPackage('2.0.4')).to.equal('2.0.4');
    });

    it("should return itself when it's the only version of the previous 'branch'", () => {
      expect(nextVersionOfPackage('2.0.4')).to.equal('2.0.4');
    });

    it("should return a patch version increment when it's the same as the latest version of the latest 'branch'", () => {
      expect(nextVersionOfPackage('5.4.3')).to.equal('5.4.4');
    });

    it("should return a patch version increment when it's the same as the latest version of the previous 'branch'", () => {
      expect(nextVersionOfPackage('1.1.2')).to.equal('1.1.3');
      assert.equal('1.1.3', versionCalc.calculateNextVersionPackage('1.1.2', publishedVersionsToTest));
    });

    it("should return itself when no published versions", () => {
      expect(nextVersionOfPackage('1.1.3', [])).to.equal('1.1.3');
    });

    function nextVersionOfPackage(version, publishedVersions = publishedVersionsToTest) {
      return versionCalc.calculateNextVersionPackage(version, publishedVersions);
    }
  });

  describe('calculateCurrentPublished', () => {
    it('should correctly resolved current published version', () => {
      expect(currentPublished('5.4.1')).to.equal('5.4.3');
      expect(currentPublished('1.1.1')).to.equal('1.1.2');
      expect(currentPublished('5.4.3')).to.equal('5.4.3');
      expect(currentPublished('1.1.2')).to.equal('1.1.2');
    });

    it('should return false when current package version is not published', () => {
      expect(currentPublished('5.4.5')).to.equal(false);
      expect(currentPublished('1.1.4')).to.equal(false);
      expect(currentPublished('2.0.4')).to.equal(false);
      expect(currentPublished('1.1.3', [])).to.equal(false);
    });

    function currentPublished(version, publishedVersions = publishedVersionsToTest) {
      return versionCalc.calculateCurrentPublished(version, publishedVersions);
    }
  });
});
