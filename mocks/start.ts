import { serverLog } from '../src/utils/server-log'
import { EdusharingServer } from './edusharing/server'
import { ItslearningServer } from './itslearning'

const edusharingPort = 8100

new EdusharingServer().listen(edusharingPort, () => {
  serverLog('INFO: Mocked version of edusharing is ready.')
  serverLog(
    `Open http://localhost:${edusharingPort}/ to open the Serlo Editor via LTI`
  )
})

const itslearningPort = 8101

new ItslearningServer().listen(itslearningPort, () => {
  serverLog('INFO: Mocked version of itslearning is ready.')
  serverLog(
    `Open http://localhost:${itslearningPort}/ to open the Serlo Editor via LTI`
  )
})
