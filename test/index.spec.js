const expect = require('chai').expect,
  _ = require('lodash'),
  versionCalc = require('../lib/version-calculator'),
  support = require('./support'),
  shelljs = require('shelljs'),
  commander = require('../lib/npm-commander'),
  index = require('..');

const fixtures = require('./support/fixtures'),
  npmRegistry = require('./support/npm-registry');

describe('api', function() {
  this.timeout(60000);
  const registry = npmRegistry().beforeAndAfter();
  let module;

  beforeEach(() => module = {rm: _.noop});
  after(() => module.rm());

  describe("getRegistryPackageInfo", () => {

    it("should find package info of an existing package", () => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);
      const packageJson = module.readPackageJson();

      const packageInfo = index.getRegistryPackageInfo(packageJson.name);

      expect(packageInfo.name).to.equal(packageJson.name);
    });

    it("should return undefined for a non-existing package", () => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo();

      const packageInfo = index.getRegistryPackageInfo('i-really-hope-this-package-doesnt-exist');

      expect(packageInfo).to.be.undefined;
    });
  });

  describe("findPublishedVersions", () => {

    it("should find published versions of an existing package", () => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);

      const publishedVersions = index.findPublishedVersions(module.readPackageJson().name);

      expect(publishedVersions.pop()).to.equal("1.0.0");
    });

    it("should return undefined for a non-existing package", () => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo();

      const publishedVersions = index.findPublishedVersions('i-really-hope-this-package-doesnt-exist');

      expect(publishedVersions).to.be.undefined;
    });
  });

  describe("incrementPatchVersionOfPackage", () => {

    it("should increment patch version of current package", () => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);
      const packageJson = module.readPackageJson();
      const currentPackageVersion = packageJson.version;
      const publishedVersions = index.findPublishedVersions(packageJson.name);
      const expectedNextVersion = versionCalc.calculateNextVersionPackage(currentPackageVersion, publishedVersions || []);

      let nextVersion = index.incrementPatchVersionOfPackage();
      expect(nextVersion).to.equal(expectedNextVersion);
      expect(module.readPackageJson().version).to.equal(expectedNextVersion);

      // Ensure that if the increment is not needed, then it still won't fail
      nextVersion = index.incrementPatchVersionOfPackage();
      expect(nextVersion).to.equal(expectedNextVersion);
      expect(module.readPackageJson().version).to.equal(expectedNextVersion);
    });
  });

  describe("isSameAsPublished", () => {
    it("should not publish for already published version", () => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);

      const {isPublishedVersionSimilar} = index.isSameAsPublished();
      expect(isPublishedVersionSimilar).to.equal(true);
    });

    it("should publish an updated version", () => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);

      module.addFile('some-file', 'some-data');

      const {isPublishedVersionSimilar} = index.isSameAsPublished();
      expect(isPublishedVersionSimilar).to.equal(false);
    });

    it('should load latest published version', () => {
      module = fixtures.module({publishConfig: {registry: registry.url}})
        .switchTo()
        .publishTo(registry.url);

      module.addFile('some-file', 'some-data');
      module.execVersionUp();
      module.publishTo(registry.url);
      const packageJson = module.readPackageJson();
      const registryVersions = index.findPublishedVersions(packageJson.name);
      const expectedCurrentPublishedVersion = versionCalc.calculateCurrentPublished(packageJson.version, registryVersions);
      const {currentPublishedVersion} = index.isSameAsPublished();

      expect(currentPublishedVersion).to.equal(expectedCurrentPublishedVersion);
    });
  });
});
