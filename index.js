#!/usr/bin/env node

import Harbor from './Harbor/index.js';

const instance = new Harbor();

try {
  instance.init();
} catch (exception) {
  // eslint-disable-next-line no-console
  console.log(exception);

  process.exit(1);
}
