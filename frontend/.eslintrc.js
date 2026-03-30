module.exports = {
  root: true,
  extends: ['eslint-config-expo'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 'warn',
    // These rules require @typescript-eslint v7+ but we have v6; disable to avoid config errors
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-wrapper-object-types': 'off',
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'android/', 'ios/'],
};
