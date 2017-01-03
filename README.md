# npm-version-up

Module that can be used to auto-increment package version for publishing. When it can be useful for you:
 - running a continuous integration set-up with org-local packages where you want to release with each ci build, but don't want to up versions manually;
 - want to auto-release patch versions of packages for a public modules - be cautious though!

This module exports a bin (`npm-version-up`) that knows how to build and release a module. It also exports functions that can help write an alternative release logic if somebody wants to.

## What does `npm-version-up` do?
  - Nothing if the package is private. Leave it there still for future use;
  - Increments the version in package.json so that publishing will succeed(see below to understand the algorithm of version incrementing);
    - Note that since CI is running `wnpm-release` during the build, the version change in `package.json` will not be committed to git;
  - shrinkwraps the package (when `--shrinkwrap` is provided) so that the published package will always use the dependent versions that are the same as the ones at the time of the build;
    - Note that since CI does this, it will not be committed to git.

## How `npm-version-up` increments the version?
  - TL;DR - it increments by one the patch version of the latest patch version in the npm registry;
  - It increments only the patch version (i.e. the '5' in 3.4.5);
  - It reads the registry to retrieve the published versions of this package;
  - It ignores all versions who's major.minor versions are not the same as the major.minor version in the package;
  - It takes the latest patch number of the biggest versions in the list of unignored version from previous bullet;
  - If the version found in the previous bullet is bigger than the version in the package.json, it uses it (and increments it by one) otherwise it uses the version in the package.json.

**What it means**: Think of each list of 'major.minor' versions as a branch. The algorithm finds the branch of the version in the package json, and ignores all other branches. If the branch is empty, it will just use the version in package.json, otherwise it will use the Max of (the latest version in the branch, the package.json version) + 1.

# Install

```bash
npm install --save-dev npm-version-up
```

# Usage

Say you have a package that is being build by travis and you want to auto-publish it with patch version up on successful ci build.
  
For this you should have a minimal `package.json`:
  
```json
{
  "name": "my-package",
  "version": "1.0.0",
  "scripts": {
    "release": "npm-version-up"
  },
  "devDependencies": {
    "npm-version-up": "latest"
  }
}
```

Here you have defined "release" script that is not invoked during default "npm publish" lifecycle, but instead is hooked-up in `.travis.yml`:

```yaml
language: node_js
node_js: # build matrix
- '4'
- '6'
- '7'
before_deploy: npm run release --shrinkwrap
deploy:
  skip_cleanup: true # so that version update and npm-shrinkwrap.json files are not reset before release
  provider: npm
  email: you@example.org
  api_key:
    secure: ***
  on:
    branch: master
    node: '7' # release only after last build success
```

And given a build matrix set-up it's recommended to set concurrency to '1' so that auto-release would happen only after all successful builds.

```bash
travis settings maximum_number_of_builds --set 1
```

# What if I don't like what `npm-version-up` does?

Write your own! We even give you all the logic that we use in our own `npm-version-up`, as an api:
  - `require('npm-version-up')` exposes various apis that you can use to build your own release logic;
  - `require('npm-version-up/lib/version-calculations')` exposes more apis that can also be used.

# License

MIT

# Credits

This is a rework/clean-up of [wnpm-ci](https://github.com/wix/wnpm-ci) that was created by [GilT](https://github.com/giltayar) with help of other awesome devs @ Wix. 