/** Regular expressions for exceptions to the max-len rule
 *
 * @note {1} Ignore HTML elements. Keep in mind that the rule doesn't support
 *           mutiline regex, thus you have to make sure to add the closing tag
 *           at the end of your line to prevent the error.
 * @note {2} Ignore the single line methods in NetworkService. This regex could
 *           theoretically be more concise, but for some reason ESLint refused
 *           to recognize some quantifiers and literals here.
 * @note {3} HTML attributes with long values.
 */
const listOfPatterns = [
  '((<.*>)*(\n?\s*)(.*)(\n?\s*)<\/.*>)',  // {1}
  '(\ \ \ \ return\ context\..*http.*;)', // {2}
  '([a-z]*(-*[a-z])*=".*")',              // {3}
];
const theOnePatternToRuleThemAll = listOfPatterns.join('|');

/**
 * @note {0} Why this config: https://bit.ly/2oiXnf7.
 * @note {1} To allow debugger during development.
 * @note {2} To allow modifying properties of components passed as arguments.
 * @note {3} Specific patterns are documented above. 
 * @note {4} The actual max length is 80 columns. The extra padding is meant to
 *           allow you to finish an expression in the same line if it only goes
 *           a few characters beyond the 80th column AND if breaking the 
 *           expression into several lines is undesirable because it would make
 *           it look funny.
 * @note {5} Stroustrup was chosen because it keeps related logical statements
 *           perfectly aligned.
 * @note {6} These settings are used by the plug-ins eslint-plugin-import and
 *           eslint-import-resolver-webpack. 
 */
module.exports = {
  "root": true,
  "parserOptions": {
    "sourceType": "module",
    "parser": "babel-eslint",
  },
  "extends": [
    "airbnb-base",
    "plugin:vue/recommended"
  ],
  "rules": {
    "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0, // {1}
    "no-console": 0,
    "no-underscore-dangle": 0,
    "no-shadow": 0,
    "strict": 2,
    "no-param-reassign": [
      "error", 
      { "props": false } // {2}
    ], 
    "max-len": [ 
      "error", 
      {
        "ignorePattern": theOnePatternToRuleThemAll, // {3}
        "code": 85, // {4}    
        "ignoreStrings": true,
        "ignoreUrls": true,
      } 
    ],
    "operator-linebreak": [
      "error",
      "after", 
      {
        "overrides": { "=": "before" } 
      }
    ],
    "brace-style": ["error", "stroustrup"], // {5}
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
  },
  "settings": { // {6}
    "import/resolver": {
      "webpack": {
        "config": "./build/webpack.dev.conf.js"
      }
    }
  },
}
