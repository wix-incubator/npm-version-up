const registry = require('unpm'),
  url = require('url'),
  shelljs = require('shelljs'),
  join = require('path').join,
  fsBackend = require('unpm-fs-backend'),
  fs = require('fs');

const userData = {
  'name': 'qwe',
  'email': 'qwe@qwe.lt',
  'date': '2017-01-03T21:08:03.211Z',
  'password_hash': 'sha512$7defe95a0da84a993b9f89ab850696$10$2f560beffd47e096d0a2dea687e31c7b4fab93b249f0a88cff5ebcb3f568650e43e9b5ba6c9e8907bbbd8b50e839fbe2f5486ebe0783794e2641a476f2458567'
};

const tempDir = './target/unpm';
const port = 3010;
const dirs = {
  logDir: tempDir,
  metaDir: join(tempDir, 'data/meta'),
  userDir: join(tempDir, 'data/user'),
  tarballsDir: join(tempDir, 'data/tarballs'),
};
console.log('Cleaning unpm folder: ', tempDir);
shelljs.rm('-rf', tempDir);
console.log('Creating unpm folders: ', tempDir);
Object.keys(dirs).forEach(dir => shelljs.mkdir('-p', dirs[dir]));
console.log('Adding user');
fs.writeFileSync(join(dirs.userDir + 'qwe.json'), JSON.stringify(userData));

npmRegistry = registry({
  host: {
    port: port,
    hostname: 'localhost',
    protocol: 'http',
  },
  checkAuth: false,
  verbose: true,
  log: 'debug',
  logDir: join(dirs.logDir),
  backend: fsBackend(dirs.metaDir, dirs.userDir, dirs.tarballsDir)
});

npmRegistry.server.listen(port, () => console.log(`Npm registry listening on ${port}`));