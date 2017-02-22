var bcrypt = require('bcrypt')

exports.command = 'cluster-node'
exports.desc = 'Installs and configures single node'
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

  // Install pm2
  var result = execSync('npm install -g pm2')
  console.log(result)

  // Install heat cluster node
  result = execSync('sudo useradd -p $(openssl passwd -1 "' + argv.password + '") heat')
  console.log(result)
  result = execSync('sudo git clone https://github.com/heatjs/heat-cluster-node.git /opt/heat-cluster-node')
  console.log(result)

  // add config file to heat cluster node
  var configYamlPath = path.join('/opt', 'heat-cluster-node', 'config', 'production.yaml')
  fs.writeFileSync(configYamlPath, configYaml)

  // Setup correct folder owner
  result = execSync('sudo chown -R heat.users /opt/heat-cluster-node')
  console.log(result)

  // Register and start pm2
  result = execSync('sudo -u heat pm2 start /opt/heat-cluster-node')
  console.log(result)

  result = execSync('sudo pm2 startup -u heat --hp /home/heat/.pm2')
  var resultLines = result.split("\n")
  console.log(resultLines[1])
  result = exexSync(resultLines[1])
  console.log(result)
}

