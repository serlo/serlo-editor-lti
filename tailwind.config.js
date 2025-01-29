// only needed because tailwind 4 is not fully supported by the vscode plugin
// can hopefully be removed soon
// /** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/frontend/**/*.{html,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
