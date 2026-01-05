import js from '@eslint/js';
import jest from 'eslint-plugin-jest';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react/jsx-uses-react': 'error', // Asegurar que React no sea eliminado
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{js,jsx}'],
    plugins: { jest },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest, // Agregar soporte para Jest
      },
    },
    rules: {
      ...jest.configs.recommended.rules, // Usar las reglas recomendadas de Jest
    },
  },
]);
