const Harbor = require('./Harbor');

const instance = new Harbor();

const run = async () => await instance.init();

run();
