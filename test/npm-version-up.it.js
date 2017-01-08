const expect = require('chai').expect,
  fixtures = require('./support/fixtures'),
  npmRegistry = require('./support/npm-registry'),
  calculateNextVersionPackage = require('../lib/version-calculator').calculateNextVersionPackage;

describe("npm-version-up", function () {
  this.timeout(20000);
  const registry = npmRegistry().beforeAndAfterEach();
  let module;
  afterEach(() => module.rm());

  it('should be a noop for a private package', () => {
    module = fixtures
      .module({private: true, publishConfig: {registry: registry.url}})
      .switchTo();
    const originalPackageJson = module.readPackageJson();

    module.execVersionUp();

    expect(originalPackageJson).to.deep.equal(module.readPackageJson());
    expect(module.hasFile('npm-shrinkwrap.json')).to.equal(false);
  });

  it('should increment version and write npm-shrinkwrap.json file for an unpublished package', () => {
    module = fixtures
      .module({publishConfig: {registry: registry.url}})
      .switchTo();
    const originalPackageJson = module.readPackageJson();
    const expectedNextVersion = calculateNextVersionPackage(originalPackageJson.version, []);

    module.execVersionUp();
    module.publishTo(registry.url);

    expect(expectedNextVersion).to.deep.equal(module.readPackageJson().version);
    expect(registry.latestVersionFor(originalPackageJson.name)).to.equal(expectedNextVersion);
    expect(module.hasFile('npm-shrinkwrap.json')).to.equal(true);
  });

  it('should increment version but not write shrinkwrap file if --no-shrinkwrap is provided', () => {
    module = fixtures
      .module({publishConfig: {registry: registry.url}})
      .switchTo();

    module.execVersionUp('--no-shrinkwrap');

    expect(module.hasFile('npm-shrinkwrap.json')).to.equal(false);
  });

  it('should increment version and write npm-shrinkwrap.json for a published package', () => {
    module = fixtures.module({publishConfig: {registry: registry.url}})
      .switchTo()
      .publishTo(registry.url)
      .addFile('some-file', 'so-that-there-is-change');
    const originalPackageJson = module.readPackageJson();

    const publishedVersion = registry.latestVersionFor(originalPackageJson.name);
    const expectedNextVersion = calculateNextVersionPackage(originalPackageJson.version, []);

    module.execVersionUp();

    expect(publishedVersion).to.equal(originalPackageJson.version);
    expect(registry.latestVersionFor(originalPackageJson.name)).to.equal(expectedNextVersion);
    expect(module.hasFile('npm-shrinkwrap.json')).to.equal(true);
  });

  //TODO: maybe unpm does not support npm pack?
  it('should not increment version if package was not updated', () => {
    module = fixtures
      .module({publishConfig: {registry: registry.url}})
      .switchTo()
      .publishTo(registry.url);

    const publishedVersion = module.readPackageJson().version;

    module.execVersionUp('--no-shrinkwrap');

    expect(module.readPackageJson().version).to.equal(publishedVersion);
  });

  it('should use .nvmrc if present', () => {
    module = fixtures
      .module({publishConfig: {registry: registry.url}})
      .addFile('.nvmrc', '6')
      .switchTo();

    const output = module.execVersionUp();

    expect(output).to.be.string('Running \'nvm exec npm shrinkwrap');
  });

});