#!/usr/bin/env node

var yargs = require('yargs')

yargs
  .commandDir('cmds')
  .demandCommand(1)
  .help()
  .argv
