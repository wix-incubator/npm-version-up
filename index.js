var child_process = require('child_process');
var versionCalc = require('./lib/version-calculator');
var commander = require('./lib/npm-commander');
var DirectoryDiff = require('./lib/directory-diff');
var VersionFetcher = require('./lib/VersionFetcher');
var PackageHandler = require('./lib/package-handler');
var VersionComparator = require('./lib/VersionComparator');
var shelljs = require('shelljs');
var fs = require('fs');
var randomDirGenerator = {generate: () => Math.ceil(Math.random() * 100000).toString()};

exports.getRegistryPackageInfo = function getRegistryPackageInfo(packageName, cb) {
  commander.readPackage(function (err, packageJson) {
    if (err)
      cb(err);

    var registry = packageJson.publishConfig && packageJson.publishConfig.registry;
    var registryOption = registry ? "--registry " + registry : "";

    commander.execSilent("npm view " + registryOption + " --json " + packageName, function (err, output) {
      if (err) {
        if (err.message.indexOf("npm ERR! code E404") >= 0) {
          cb(undefined, undefined);
        } else {
          console.error(err.message);
          cb(err);
        }
      } else {
        cb(undefined, JSON.parse(output));
      }
    });
  });
};

exports.findPublishedVersions = function findPublishedVersions(packageName, cb) {
  exports.getRegistryPackageInfo(packageName, function (err, registryPackageinfo) {
    if (err)
      cb(err);
    else if (registryPackageinfo === undefined)
      cb(undefined, undefined);
    else
      cb(undefined, exports.normalizeVersions(registryPackageinfo.versions));
  });
};

exports.normalizeVersions = function normalizeVersions(versions) {
  if (!versions)
    return [];

  if (typeof versions === 'string')
    return [versions];
  else
    return versions;
};

exports.isSameAsPublished = function isAlreadyPublished(cb) {

  commander.readPackage(function (err, packageJson) {
    var packageName = packageJson.name;
    var registry = packageJson.publishConfig && packageJson.publishConfig.registry;
    var registryOption = registry ? "--registry " + registry : "";

    exports.findPublishedVersions(packageName, function (err, registryVersions) {
      if (err) {
        cb(err);
        return;
      }

      var localPackageVersion = packageJson.version;
      var currentPublishedVersion = versionCalc.calculateCurrentPublished(localPackageVersion, registryVersions || []);

      if (currentPublishedVersion) {
        const packageHandler = PackageHandler(fs);
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
  });
};

exports.incrementPatchVersionOfPackage = function incrementPatchVersionOfPackage(cb) {
  // We can't just require('package.json') because this code may be called from other packages
  // as part of the build process (see README.md)
  commander.readPackage(function (err, packageJson) {
    var packageName = packageJson.name;

    exports.findPublishedVersions(packageName, function (err, registryVersions) {
      if (err) {
        cb(err);
        return;
      }

      var localPackageVersion = packageJson.version;

      var nextVersion = versionCalc.calculateNextVersionPackage(localPackageVersion, registryVersions || []);

      if (nextVersion === localPackageVersion) {
        process.nextTick(function () {
          cb(undefined, nextVersion);
        });
        return;
      }

      commander.exec("npm version --no-git-tag-version " + nextVersion, function (err) {
        err ? cb(err, undefined) : cb(undefined, nextVersion);
      });

    });
  });
};

exports.shrinkwrapPackage = function (cb) {
  commander.exec("npm shrinkwrap", function (err) {
    cb(err);
  });
};

exports.prepareForRelease = function (options, cb) {
  commander.setup();

  commander.readPackage(function (err, packageJson) {
    if (err) {
      cb(err);
      return;
    }

    if (packageJson.private) {
      console.log("No release because package is private");
      cb();
      return;
    }
    exports.isSameAsPublished((err, isPublishedVersionSimilar, currentPublishedVersion) => {
      if (err) {
        cb(err);
        return;
      }

      if (isPublishedVersionSimilar) {
        packageJson.private = true;
        packageJson.version = currentPublishedVersion;
        commander.writePackage(packageJson, (err) => {
          console.log("No release because it's already published");
          cb(err);
          return;
        }); // don't publish
      } else {
        exports.incrementPatchVersionOfPackage(function (err) {
          if (err) {
            cb(err);
            return;
          }

          if (options.shouldShrinkWrap) {
            exports.shrinkwrapPackage(function (err) {
              if (err) {
                cb(err);
              }
              else
                cb();
            });
          }
          else
            cb();
        });
      }
    });
  });
};
