const SPLIT_VERSION_REGEX = /[\.\-]/;

exports.calculateCurrentPublished = calculateCurrentPublished;
exports.calculateNextVersionPackage = calculateNextVersionPackage;

function calculateCurrentPublished(version, publishedVersions) {
  const publishedVersionsOfMinorBranch = findPublishedVersionsOfMinorBranch(publishedVersions, majorMinorVersionOf(version));
  const versionFields = splitVersion(version);

  const currentPatchVersion =
    publishedVersionsOfMinorBranch.length > 0 ?
      (patchVersionOf(publishedVersionsOfMinorBranch[publishedVersionsOfMinorBranch.length - 1]) || 0) :
      (patchVersionOf(version) || 0);


  versionFields[1] = (versionFields[1] || 0);
  versionFields[2] = Math.max(patchVersionOf(version), currentPatchVersion);

  const currentVersion = fieldsToVersion(versionFields);
  return publishedVersions.indexOf(currentVersion) > -1 && currentVersion;
}

function calculateNextVersionPackage(version, publishedVersions) {
  const publishedVersionsOfMinorBranch = findPublishedVersionsOfMinorBranch(publishedVersions, majorMinorVersionOf(version));
  const versionFields = splitVersion(version);

  const nextPatchVersion =
    publishedVersionsOfMinorBranch.length > 0 ?
      (patchVersionOf(publishedVersionsOfMinorBranch[publishedVersionsOfMinorBranch.length - 1]) || 0) + 1 :
      (patchVersionOf(version) || 0);


  versionFields[1] = (versionFields[1] || 0);
  versionFields[2] = Math.max(patchVersionOf(version), nextPatchVersion);

  return fieldsToVersion(versionFields);
}

function findPublishedVersionsOfMinorBranch(publishedVersions, minorVersion) {
  return publishedVersions.filter(publishedVersion => majorMinorVersionOf(publishedVersion) === minorVersion);
}

function majorMinorVersionOf(version) {
  const versionFields = splitVersion(version);

  return (versionFields.length >= 1) ? take(versionFields, Math.min(versionFields.length, 2)).join('.') : undefined;
}

function patchVersionOf(version) {
  const versionFields = splitVersion(version);

  return (versionFields.length >= 2) ? parseInt(versionFields[2]) : undefined;
}

function take(array, lengthToTake) {
  const ret = [];

  for (let i = 0; i < Math.min(array.length, lengthToTake); ++i) {
    ret.push(array[i]);
  }

  return ret;
}

function fieldsToVersion(versionFields) {
  const patch = versionFields[3] ? "-" + versionFields[3] : "";
  return `${versionFields[0]}.${versionFields[1]}.${versionFields[2]}${patch}`;
}

function splitVersion(version) {
  return version.split(SPLIT_VERSION_REGEX);
}
