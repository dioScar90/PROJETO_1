import js from '@eslint/js';
import globals from 'globals';

/**
 * Configuração flat do ESLint 9 para o Antigravity Finance.
 * Vanilla JS (ESM) no browser, com testes Vitest usando globals.
 */
export default [
  // Pastas geradas/externas fora do lint
  {
    ignores: ['dist/', 'node_modules/', 'coverage/']
  },

  js.configs.recommended,

  // Código-fonte da aplicação (browser)
  {
    files: ['src/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // Convenções do projeto (ver CLAUDE.md)
      indent: ['error', 2, {
        SwitchCase: 1,
        // Aceita alinhamento vertical de cadeias de métodos (ex.: sanitizeHelper)
        MemberExpression: 'off',
        // Aceita indentação livre em ramos de ternário (ex.: CategoryDistribution)
        ignoredNodes: ['ConditionalExpression *']
      }],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { allowTemplateLiterals: true }],

      // Variáveis de catch nomeadas mas não usadas são aceitas (padrão do código)
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      'no-console': 'off'
    }
  },

  // Testes Vitest (globals: true no vitest.config.js)
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.vitest
      }
    },
    rules: {
      indent: ['error', 2, {
        SwitchCase: 1,
        // Aceita alinhamento vertical de cadeias de métodos (ex.: sanitizeHelper)
        MemberExpression: 'off',
        // Aceita indentação livre em ramos de ternário (ex.: CategoryDistribution)
        ignoredNodes: ['ConditionalExpression *']
      }],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { allowTemplateLiterals: true }]
    }
  }
];
