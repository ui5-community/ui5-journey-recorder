module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  plugins: ['unused-imports', 'sonarjs'],
  extends: [
      'eslint:recommended',
      'plugin:sonarjs/recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
      // Allows for the parsing of modern ECMAScript features
      ecmaVersion: 2018, 
      sourceType: 'module', // Allows for the use of imports
      prefixWithI: 'always',
  },
  rules: {
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/type-annotation-spacing': 1,
      '@typescript-eslint/typedef': [
          'error',
          {
              'arrowParameter': true,
              'arrayDestructuring': true,
              'objectDestructuring': true,
              'parameter': true
          }
      ],
      'unused-imports/no-unused-imports-ts': 2, 
      'unused-imports/no-unused-vars-ts': 1,
      'linebreak-style': [2, 'unix'], 
      'quotes': [2, 'single'],
      'no-prototype-builtins': 0,
      'no-case-declarations': 0,
      'indent': ['error', 4, {
          'SwitchCase': 1,
      }],
      'semi': 2,
      'arrow-parens': 1,
      'object-curly-newline': 1,
      'max-len': [1, {'code': 140, 'comments': 120, 'ignoreStrings': true}],
      'no-warning-comments': [2, {'terms': ['@TODO', '@FIXME']}],
      'space-infix-ops': 1,
      'space-before-blocks': 1,
      'keyword-spacing': 1,
      'brace-style': 1,
      'spaced-comment': 1
  },
  root: true
};
