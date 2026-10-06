// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const ngrx = require('@ngrx/eslint-plugin');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      // Includes signal-store-feature-should-use-generic-type: a custom feature
      // that declares an input without a generic parameter can make
      // signalStore() fail with "No overload matches this call".
      ...ngrx.configs.signals,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // The unused generic NgRx asks custom store features for is named `_`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_$' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
