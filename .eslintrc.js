module.exports = {
  extends: 'airbnb-base',
  env: {
    jest: true,
    node: true,
  },
  plugins: ['import'],
  rules: {
    'no-console': 'off',
  },
};
