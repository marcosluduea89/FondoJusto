module.exports = function (api) {
  // Expo usa Babel para transformar TypeScript y React Native antes de ejecutar la app.
  api.cache(true);

  return {
    presets: ["babel-preset-expo"]
  };
};
