module.exports = shell => {
  function shellExec(cmd) {
    const res = shell.exec(cmd);
    if (res.code === 0 || res.code === 1) {
      return res.code === 0;
    } else {
      throw new Error(`Cmd: ${cmd} failed with: ${res.stderr}`);
    }
  }

  return {
    compareDirectories: (path1, path2) => shellExec(`diff -rq ${path1} ${path2}`)
  }
};
