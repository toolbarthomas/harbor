/**
 * Return an Inline SVG element or the source path
 */
module.exports = (...args) => {
  let themeSprites;

  try {
    themeSprites = JSON.parse(process.env.THEME_SPRITES);
  } catch (error) {
    if (error) {
      return Promise.resolve(error);
    }
  }

  if (!themeSprites || !Object.values(themeSprites).length) {
    return Promise.resolve();
  }

  try {
    const [key, sprite, withElement] = args;
    const path =
      sprite && sprite !== true
        ? themeSprites[sprite] || Object.values(themeSprites)[0]
        : Object.values(themeSprites)[0];

    const p = `${path}${key ? `#${key}` : ''}`;

    if ((!sprite && withElement) || sprite === true || withElement) {
      return Promise.resolve(`
        <svg aria-hidden="true" aria-focusable="false">
          <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${p}"></use>
        </svg>

      `);
    } else {
      return Promise.resolve(p);
    }
  } catch (error) {
    return Promise.resolve(error);
  }
};
