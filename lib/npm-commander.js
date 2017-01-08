const shelljs = require('shelljs'),
  fs = require('fs');

module.exports.exec = (cmd, cb) => exec(cmd, {silent: false}, cb);
module.exports.execSilent = (cmd, cb) => exec(cmd, {silent: true}, cb);

function exec(cmd, opts, cb) {
  let command;
  if (dotNvmrcPresent()) {
    console.log(`Running 'nvm exec ${cmd}'`);
    command = `unset npm_config_prefix && . ~/.nvm/nvm.sh > /dev/null 2>&1 && nvm install > /dev/null 2>&1 && ${cmd}`;
  } else {
    console.log(`Running '${cmd}'`);
    command = cmd;
  }

  shelljs.exec(command, opts, (code, output) => {
    if (code !== 0) {
      cb(error(cmd, code, output), undefined);
    } else {
      cb(undefined, output)
    }
  });
}

function dotNvmrcPresent() {
  return shelljs.test('-f', '.nvmrc');
}

function error(cmd, code, output) {
  return new Error(`'${cmd}' failed with code: ${code}, output: '${output}'`);
}
