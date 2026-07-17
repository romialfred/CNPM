const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    // `.angular/**` est le cache de build : Vite y pré-bundle les dépendances, et
    // analyser ce code généré fait remonter des règles d'un dépôt tiers comme des
    // erreurs du nôtre. Le cache varie selon les dépendances installées, donc son
    // analyse rendrait aussi le lint instable d'une machine à l'autre.
    ignores: [
      '.angular/**',
      'dist/**',
      'storybook-static/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'cnpm', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'cnpm', style: 'kebab-case' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
);
