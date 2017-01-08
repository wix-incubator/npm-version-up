const resolve = require('path').resolve;

exports = fs => {
  return {
    writePackageJson: (packageJson, pathToPackage = './package.json') => {
      fs.writeFileSync(resolve(pathToPackage), JSON.stringify(packageJson, null, 2), 'utf8');
    },
    readPackageJson: (pathToPackge = './package.json') => {
      return JSON.parse(fs.readFileSync(resolve(pathToPackge), {encoding: 'utf8'}));
    }
  }
};
