module.exports = function (api) {
  const isProduction = api.env('production');

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: isProduction ? ['transform-remove-console'] : [],
  };
};
