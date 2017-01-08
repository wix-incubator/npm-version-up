const versionCalc = require('./lib/version-calculator'),
  commander = require('./lib/npm-commander'),
  DirectoryDiff = require('./lib/directory-diff'),
  VersionFetcher = require('./lib/version-fetcher'),
  PackageHandler = require('./lib/package-handler'),
  VersionComparator = require('./lib/version-comparator'),
  shelljs = require('shelljs'),
  fs = require('fs'),
  randomDirGenerator = {generate: () => Math.ceil(Math.random() * 100000).toString()};

module.exports.getRegistryPackageInfo = getRegistryPackageInfo;
module.exports.findPublishedVersions = findPublishedVersions;
module.exports.normalizeVersions = normalizeVersions;
module.exports.isSameAsPublished = isSameAsPublished;
module.exports.incrementPatchVersionOfPackage = incrementPatchVersionOfPackage;
module.exports.prepareForRelease = prepareForRelease;

function prepareForRelease(options, cb) {
  try {
    const packageHandler = PackageHandler(fs);
    const packageJson = packageHandler.readPackageJson();

    if (packageJson.private) {
      console.log("No release because package is private");
      cb();
      return;
    }
    isSameAsPublished((err, isPublishedVersionSimilar, currentPublishedVersion) => {
      if (err) {
        cb(err);
        return;
      }

      if (isPublishedVersionSimilar) {
        packageJson.private = true;
        packageJson.version = currentPublishedVersion;
        packageHandler.writePackageJson(packageJson);
        console.log("No release because it's already published");
        cb();
        return;
      } else {
        incrementPatchVersionOfPackage(function (err) {
          if (err) {
            cb(err);
            return;
          }

          if (options.shouldShrinkWrap) {
            commander.exec("npm shrinkwrap");
            cb();
          }
          else
            cb();
        });
      }
    });
  } catch (e) {
    cb(e);
  }
};

function getRegistryPackageInfo(packageName, cb) {
  try {
    const packageHandler = PackageHandler(fs);
    const packageJson = packageHandler.readPackageJson();
    const registry = packageJson.publishConfig && packageJson.publishConfig.registry;
    const registryOption = registry ? "--registry " + registry : "";

    try {
      const output = commander.execSilent("npm view " + registryOption + " --json " + packageName);
      return cb(undefined, JSON.parse(output));
    } catch (err) {
      if (err.message.indexOf("npm ERR! code E404") >= 0) {
        cb(undefined, undefined);
      } else {
        console.error(err.message);
        cb(err);
      }
    }
  } catch (e) {
    cb(e);
  }
}

function findPublishedVersions(packageName, cb) {
  getRegistryPackageInfo(packageName, function (err, registryPackageinfo) {
    if (err)
      cb(err);
    else if (registryPackageinfo === undefined)
      cb(undefined, undefined);
    else
      cb(undefined, normalizeVersions(registryPackageinfo.versions));
  });
}

function isSameAsPublished(cb) {
  try {
    const packageHandler = PackageHandler(fs);
    const packageJson = packageHandler.readPackageJson();
    var packageName = packageJson.name;
    var registry = packageJson.publishConfig && packageJson.publishConfig.registry;
    var registryOption = registry ? "--registry " + registry : "";

    findPublishedVersions(packageName, function (err, registryVersions) {
      if (err) {
        cb(err);
        return;
      }

      var localPackageVersion = packageJson.version;
      var currentPublishedVersion = versionCalc.calculateCurrentPublished(localPackageVersion, registryVersions || []);

      if (currentPublishedVersion) {
        var versionFetcher = VersionFetcher(commander, shelljs, randomDirGenerator, packageHandler, registryOption);
        var directoryDiff = DirectoryDiff(shelljs);
        var versionComparator = VersionComparator(directoryDiff, versionFetcher, shelljs);

        versionComparator.compare(packageName, currentPublishedVersion)
          .then(isPublishedVersionSimilar => cb(undefined, isPublishedVersionSimilar, currentPublishedVersion))
          .catch(err => cb(err));
      } else {
        cb(undefined, false);
      }
    });

  } catch (e) {
    cb(e);
  }
}

function incrementPatchVersionOfPackage(cb) {
  try {
    const packageHandler = PackageHandler(fs);
    // We can't just require('package.json') because this code may be called from other packages as part of the build process
    const packageJson = packageHandler.readPackageJson();
    const packageName = packageJson.name;
    const localPackageVersion = packageJson.version;

    findPublishedVersions(packageName, function (err, registryVersions) {
      if (err) {
        cb(err);
        return;
      }

      const nextVersion = versionCalc.calculateNextVersionPackage(localPackageVersion, registryVersions || []);

      if (nextVersion === localPackageVersion) {
        process.nextTick(function () {
          cb(undefined, nextVersion);
        });
        return;
      }

      commander.exec("npm version --no-git-tag-version " + nextVersion);
      cb(undefined, nextVersion);
    });
  } catch (e) {
    cb(e);
  }
}

function normalizeVersions(versions) {
  if (!versions)
    return [];

  if (typeof versions === 'string')
    return [versions];
  else
    return versions;
}
