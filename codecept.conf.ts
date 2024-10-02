import { setHeadlessWhen, setCommonPlugins } from '@codeceptjs/configure'

setHeadlessWhen(process.env.HEADLESS)

// enable all common plugins https://github.com/codeceptjs/configure#setcommonplugins
setCommonPlugins()

export const config: CodeceptJS.MainConfig = {
  tests: 'e2e-tests',
  output: './output',
  helpers: {
    Playwright: {
      browser: 'chromium',
      url: 'http://localhost:3000',
      show: true
    }
  },
  include: {
    I: './steps_file'
  },
  name: 'serlo-editor-as-lti-tool'
}
