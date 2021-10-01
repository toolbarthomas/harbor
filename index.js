#!/usr/bin/env node

import Harbor from './Harbor/index.js';

const instance = new Harbor();

try {
  instance.init();
} catch (exception) {
  console.log(exception);

  process.exit(1);
}
