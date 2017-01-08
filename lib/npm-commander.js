const shelljs = require('shelljs');

exports.exec = cmd => exec(cmd, {silent: false});
exports.execSilent = cmd => exec(cmd, {silent: true});

function exec(cmd, opts) {
  let command;
  if (dotNvmrcPresent()) {
    console.log(`Running 'nvm exec ${cmd}'`);
    command = `unset npm_config_prefix && . ~/.nvm/nvm.sh > /dev/null 2>&1 && nvm install > /dev/null 2>&1 && ${cmd}`;
  } else {
    console.log(`Running '${cmd}'`);
    command = cmd;
  }

  const res = shelljs.exec(command, opts);
  if (res.code !== 0) {
    throw error(cmd, res.code, res.output);
  } else {
    return res.output;
  }
}

function dotNvmrcPresent() {
  return shelljs.test('-f', '.nvmrc');
}

function error(cmd, code, output) {
  return new Error(`'${cmd}' failed with code: ${code}, output: '${output}'`);
}
