/**
 * Return an Inline SVG element or the source path
 */
module.exports = (...args) => {
  if (!THEME_SPRITES || !Object.values(THEME_SPRITES).length) {
    return;
  }

  try {
    const [key, sprite, withElement] = args;
    const path =
      sprite && sprite !== true
        ? THEME_SPRITES[sprite] || Object.values(THEME_SPRITES)[0]
        : Object.values(THEME_SPRITES)[0];

    const p = `${path}${key ? `#${key}` : ''}`;

    if ((!sprite && withElement) || sprite === true || withElement) {
      return `
        <svg aria-hidden="true" aria-focusable="false">
          <use xlink:href="${p}"></use>
        </svg>
      `;
    } else {
      return p;
    }
  } catch (error) {
    console.error(error);
  }
};
