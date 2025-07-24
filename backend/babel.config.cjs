// Babel configuration for Jest tests
module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      useBuiltIns: 'usage',
      corejs: 3
    }]
  ],
  plugins: [
    '@babel/plugin-transform-runtime'
  ]
};
