import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReactConfig from 'eslint-plugin-react/configs/jsx-runtime.js'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'

const ourCustomConfig = {
  settings: {
    react: {
      version: 'detect',
    },
  },
  // Add our custom rules here
  rules: {
    'no-console': 'warn',
  },
}

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  {
    plugins: { 'react-hooks': fixupPluginRules(pluginReactHooks) },
    rules: pluginReactHooks.configs.recommended.rules,
  },
  {
    plugins: { 'react-refresh': fixupPluginRules(pluginReactRefresh) },
    rules: {
      'react-refresh/only-export-components': 'warn',
    },
  },
  ourCustomConfig,
]
