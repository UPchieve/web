module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // add your custom rules here
  'rules': {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    "eol-last": 1,
    "no-console": 0,
    "no-underscore-dangle": 0,
    "no-shadow": 0,
    "strict": 2,
    "quotes": [1, "single"]
  }
}
