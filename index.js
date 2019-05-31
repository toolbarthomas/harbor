#! /usr/bin/env node

const { resolve } = require('path');
const { existsSync, readFileSync } = require('fs');
const { spawn } = require('child_process');

const packagePath = resolve(process.cwd(), 'package.json');

if (existsSync(packagePath)) {
  const { scripts } = JSON.parse(readFileSync(packagePath));

  const task = process.argv[2] && scripts[process.argv[2]] ? process.argv[2] : false;

  if (task) {
    spawn('npm', ['run', task], { shell: true, stdio: 'inherit' });
  }
}
