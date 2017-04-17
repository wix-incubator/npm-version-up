const versionCalc = require('./lib/version-calculator'),
  commander = require('./lib/npm-commander'),
  DirectoryDiff = require('./lib/directory-diff'),
  VersionFetcher = require('./lib/version-fetcher'),
  PackageHandler = require('./lib/package-handler'),
  VersionComparator = require('./lib/version-comparator'),
  shelljs = require('shelljs'),
  fs = require('fs'),
  _ = require('lodash'),
  randomDirGenerator = {generate: () => Math.ceil(Math.random() * 100000).toString()};

module.exports.getRegistryPackageInfo = getRegistryPackageInfo;
module.exports.findPublishedVersions = findPublishedVersions;
module.exports.isSameAsPublished = isSameAsPublished;
module.exports.incrementPatchVersionOfPackage = incrementPatchVersionOfPackage;
module.exports.prepareForRelease = prepareForRelease;

function prepareForRelease(options) {
  const packageHandler = PackageHandler(fs);
  const packageJson = packageHandler.readPackageJson();

  if (packageJson.private) {
    console.log("No release because package is private");
    return;
  }

  if (options.shouldShrinkWrap) {
    commander.exec("npm shrinkwrap");
  }

  const {isPublishedVersionSimilar, currentPublishedVersion} = isSameAsPublished();

  if (isPublishedVersionSimilar) {
    packageJson.private = true;
    packageJson.version = currentPublishedVersion;
    packageHandler.writePackageJson(packageJson);
    console.log("No release because it's already published");
  } else {
    incrementPatchVersionOfPackage();
  }
}

function getRegistryPackageInfo(packageName) {
  const packageHandler = PackageHandler(fs);
  const packageJson = packageHandler.readPackageJson();
  const registry = packageJson.publishConfig && packageJson.publishConfig.registry;
  const registryOption = registry ? "--registry " + registry : "";

  try {
    const output = commander.execSilent("npm view --cache-min=0 " + registryOption + " --json " + packageName);
    const res = JSON.parse(output);
    console.log('Version resolved from registry:', res['dist-tags'].latest);
    return res;
  } catch (err) {
    if (err.message.indexOf("npm ERR! code E404") >= 0) {
      return undefined;
    } else {
      throw err;
    }
  }
}

function findPublishedVersions(packageName) {
  const registryPackageInfo = getRegistryPackageInfo(packageName);

  if (registryPackageInfo) {
    const versionsFromEnvVariable = [process.env['npmPackageVersion']];
    const versionsFromRegistry = registryPackageInfo.versions || [];

    return _.compact(versionsFromEnvVariable.concat(versionsFromRegistry)).sort();
  } else {
    return undefined;
  }
}

function isSameAsPublished() {
  const packageHandler = PackageHandler(fs);
  const packageJson = packageHandler.readPackageJson();
  const packageName = packageJson.name;
  const registry = packageJson.publishConfig && packageJson.publishConfig.registry;
  const registryOption = registry ? "--registry " + registry : "";
  const registryVersions = findPublishedVersions(packageName);

  const localPackageVersion = packageJson.version;
  const currentPublishedVersion = versionCalc.calculateCurrentPublished(localPackageVersion, registryVersions || []);

  if (currentPublishedVersion) {
    const versionFetcher = VersionFetcher(commander, shelljs, randomDirGenerator, packageHandler, registryOption);
    const directoryDiff = DirectoryDiff(shelljs);
    const versionComparator = VersionComparator(directoryDiff, versionFetcher, shelljs);
    const isPublishedVersionSimilar = versionComparator.compare(packageName, currentPublishedVersion);
    return {isPublishedVersionSimilar, currentPublishedVersion};
  } else {
    return {isPublishedVersionSimilar: false, currentPublishedVersion: undefined};
  }
}


function incrementPatchVersionOfPackage() {
  const packageHandler = PackageHandler(fs);
  // We can't just require('package.json') because this code may be called from other packages as part of the build process
  const packageJson = packageHandler.readPackageJson();
  const packageName = packageJson.name;
  const localPackageVersion = packageJson.version;
  const registryVersions = findPublishedVersions(packageName);

  const nextVersion = versionCalc.calculateNextVersionPackage(localPackageVersion, registryVersions || []);

  if (nextVersion === localPackageVersion) {
    return nextVersion;
  }

  commander.exec("npm version --no-git-tag-version " + nextVersion);
  return nextVersion;
}