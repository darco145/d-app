import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,    // Dodaje Node.js globale (Buffer, setTimeout, process, itd.)
        ...globals.jest     // Dodaje Jest globale (describe, it, expect, itd.)
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  }
];
