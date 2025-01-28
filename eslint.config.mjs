import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReactConfig from 'eslint-plugin-react/configs/jsx-runtime.js'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'

const ourCustomConfig = {
  rules: {
    'no-console': 'warn',
  },
}

export default [
  // General settings
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },

  // Recommended settings for JavaScript and TypeScript
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // Recommended settings for React
  { settings: { react: { version: 'detect' } } },
  ...fixupConfigRules(pluginReactConfig),

  // Plugin for linting React Hooks
  {
    plugins: { 'react-hooks': fixupPluginRules(pluginReactHooks) },
    rules: pluginReactHooks.configs.recommended.rules,
  },

  // Plugin for validating that components can safely be updated with fast refresh.
  {
    plugins: { 'react-refresh': fixupPluginRules(pluginReactRefresh) },
    rules: {
      'react-refresh/only-export-components': 'warn',
    },
  },

  { ignores: ['dist/**'] },

  // Our custom rules
  ourCustomConfig,
]
