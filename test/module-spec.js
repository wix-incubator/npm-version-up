var expect = require('chai').expect;
var _ = require('lodash');
var versionCalc = require('../lib/version-calculator');
var support = require('./support');
var shelljs = require('shelljs');
var commander = require('../lib/npm-commander');

var index = require('..');

const fixtures = require('./support/fixtures'),
  npmRegistry = require('./support/npm-registry');

describe('package', function () {
  this.timeout(60000);
  const registry = npmRegistry().beforeAndAfter();
  let module;

  beforeEach(() => module = {rm: _.noop});
  after(() => module.rm());

  describe("#getRegistryPackageInfo", function () {

    it("should find package info of an existing package", function (done) {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);
      const packageJson = module.readPackageJson();

      index.getRegistryPackageInfo(packageJson.name, function (err, packageInfo) {
        expect(err).to.be.undefined;
        expect(packageInfo.name).to.equal(packageJson.name);
        done(err);
      });
    });

    it("should return undefined for a non-existing package", function (done) {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo();

      index.getRegistryPackageInfo('i-really-hope-this-package-doesnt-exist', function (err, packageInfo) {
        expect(err).to.be.undefined;
        expect(packageInfo).to.be.undefined;
        done(err);
      });
    });
  });

  describe("#findPublishedVersions", function () {

    it("should find published versions of an existing package", function (done) {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);
      const packageJson = module.readPackageJson();

      index.findPublishedVersions(packageJson.name, function (err, publishedVersions) {
        expect(err).to.be.undefined;
        expect(publishedVersions.pop()).to.equal("1.0.0");
        done(err);
      });
    });

    it("should return undefined for a non-existing package", function (done) {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo();

      index.findPublishedVersions('i-really-hope-this-package-doesnt-exist', function (err, publishedVersions) {
        expect(err).to.be.undefined;
        expect(publishedVersions).to.be.undefined;
        done(err);
      });
    });
  });

  describe("#normalizeVersions", function () {

    it("should support version that is not an array (happens when there is only one version)", function () {
      expect(index.normalizeVersions("1.4")).to.deep.equal(["1.4"]);
    });

    it("should support no version", function () {
      expect(index.normalizeVersions(undefined)).to.deep.equal([]);
    });

    it("should support empty array", function () {
      expect(index.normalizeVersions([])).to.deep.equal([]);
    });

    it("should support empty string", function () {
      expect(index.normalizeVersions("")).to.deep.equal([]);
    });
  });

  describe("#incrementPatchVersionOfPackage", function () {

    it("should increment patch version of current package", function (done) {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);
      const packageJson = module.readPackageJson();
      const currentPackageVersion = packageJson.version;

      index.findPublishedVersions(packageJson.name, function (err, publishedVersions) {
        if (err) {
          done(err);
          return;
        }

        var expectedNextVersion = versionCalc.calculateNextVersionPackage(currentPackageVersion,
          publishedVersions || []);

        index.incrementPatchVersionOfPackage(function (err, nextVersion) {
          expect(err).to.be.undefined;
          expect(nextVersion).to.equal(expectedNextVersion);
          expect(module.readPackageJson().version).to.equal(expectedNextVersion);
          if (err) {
            done(err);
            return;
          }
          // Ensure that if the increment is not needed, then it still won't fail
          index.incrementPatchVersionOfPackage(function (err, nextVersion) {
            expect(err).to.be.undefined;
            expect(nextVersion).to.equal(expectedNextVersion);
            expect(module.readPackageJson().version).to.equal(expectedNextVersion);
            done(err);
          });
        });
      });
    });
  });

  describe("#isSameAsPublished", function () {
    it("should not publish for already published version", function (done) {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);

      expect(index.isSameAsPublished(function (err, isSameAsPublished) {
        expect(isSameAsPublished).to.be.true;
        done();
      }))
    });

    it("should publish an updated version", function (done) {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);

      module.addFile('some-file', 'some-data');

      expect(index.isSameAsPublished(function (err, isSameAsPublished) {
        expect(isSameAsPublished).to.be.false;
        done();
      }))
    });

    it('should load latest published version', (done) => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);

      module.addFile('some-file', 'some-data');
      module.execVersionUp();
      module.publishTo(registry.url);
      const packageJson = module.readPackageJson();

      index.findPublishedVersions(packageJson.name, (err, registryVersions) => {
        const expectedCurrentPublishedVersion = versionCalc.calculateCurrentPublished(packageJson.version, registryVersions);
        expect(index.isSameAsPublished(function (err, isSameAsPublished, currentPublishedVersion) {
          expect(currentPublishedVersion).to.equal(expectedCurrentPublishedVersion);
          done();
        }))
      });
    });
  });
});
