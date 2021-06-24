import Harbor from './Harbor/index.js';

(async () => {
  const instance = new Harbor();

  await instance.init();
})().catch((exception) => {
  console.error(exception);

  process.exit(1);
});
