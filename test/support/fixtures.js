const path = require('path'),
  ModuleBuilder = require('./module-builder');

module.exports.module = packageJsonOverrides => {
  const moduleDir = path.resolve('./target', Math.ceil(Math.random() * 100000).toString());
  return new ModuleBuilder(process.cwd(), moduleDir)
    .packageJson(packageJsonOverrides);
};