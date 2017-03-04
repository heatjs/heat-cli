var bcrypt = require('bcrypt')

exports.command = 'daemon'
exports.desc = 'Installs the heat daemon'
exports.builder = (yargs) => {
  yargs
    .option('t', {
      alias: 'type',
      default: 'slave',
      choices: ['master', 'slave'],
      describe: 'which node type',
      type: 'string'
    })
    .option('sa', {
      alias: 'salt',
      default: () => {
        return bcrypt.genSaltSync(10)
      },
      descripe: 'salt for security',
      type: 'string'
    })
    .option('p', {
      alias: 'password',
      demand: true,
      describe: 'password to use',
      type: 'string'
    })
    .option('m', {
      alias: 'masters',
      default: [],
      describe: 'hostnames of other masters (only if type=master)',
      type: 'array'
    })
    .option('s', {
      alias: 'slaves',
      default: [],
      describe: 'hostnames of slaves (only if type=master)',
      type: 'array'
    })
    .option('')
}
exports.handler = (argv) => {
  var yaml = require('js-yaml')
  var execSync = require('child_process').execSync
  var fs = require('fs')
  var path = require('path')

  // Setup config file
  var config = {}
  config.salt = argv.salt
  config.password = (argv.type === 'slave') ? bcrypt.hashSync(argv.password, argv.salt) : argv.password
  switch (argv.type) {
    case 'master':
      config.masters = argv.masters
      config.slaves = argv.slaves
      break
  }
  var configYaml = yaml.safeDump(config)

  var repoHolder = 'heatjs'
  var repoName = 'heat-daemon'
  var env = {
    repoUrl: `https://github.com/${repoHolder}/${repoName}.git`,
    user: 'heat',
    daemonTempPath: path.join('~', repoName),
    configYamlPath: path.join('~/', repoName, 'config', 'production.yaml'),
    daemonInstallPath: path.join('/opt', repoName)
  }

  // Add heat user
  var result = execSync(`sudo useradd -p $(openssl passwd -1 "${argv.password}") ${env.user}`)
  console.log(result)

  // Install heat cluster node
  result = execSync(`git clone ${env.repoUrl} ${env.daemonTempPath}`)
  console.log(result)

  // add config file to heat cluster node
  fs.writeFileSync(env.configYamlPath, configYaml)

  result = execSync(`sudo mv ${env.daemonTempPath} /opt`)

  // Setup correct folder owner
  result = execSync(`sudo chown -R ${env.user}.users /opt/heat-daemon`)
  console.log(result)

  result = execSync(`sudo -u ${env.user} npm --prefix install`)
  console.log(result)
}
