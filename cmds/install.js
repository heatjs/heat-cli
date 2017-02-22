exports.command = 'install <command>'
exports.desc = 'Installs a Heat component'
exports.builder = (yargs) => {
  return yargs.commandDir('install_cmds')
}
exports.handler = (argv) => {}
