// Mocha configuration for ES modules
module.exports = {
  'extension': ['js', 'mjs', 'cjs'],
  'loader': './test/test-loader.mjs',
  'node-option': 'experimental-vm-modules',
  'timeout': 30000,
  'exit': true,
  'require': 'esm'
};
