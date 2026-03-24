#!/usr/bin/env node
const { spawn } = require('node:child_process');

const flutterCmd = 'c:\\src\\flutter\\bin\\flutter.bat';
const args = process.argv.slice(2);

const child = spawn(flutterCmd, ['run', ...args], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 1));
