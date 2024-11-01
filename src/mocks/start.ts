import { serverLog } from '../utils/server-log'
import { EdusharingServer } from './edusharing/server'
import { ItslearningServer } from './itslearning'

const edusharingPort = 8100
const edusharingServer = new EdusharingServer()

edusharingServer.listen(edusharingPort, () => {
  serverLog('INFO: Mocked version of edusharing is ready.')
  serverLog(
    `Open http://localhost:${edusharingPort}/ to open the Serlo Editor via LTI`
  )
})

const itslearningPort = 8101
const itslearningServer = new ItslearningServer()

itslearningServer.listen(itslearningPort, () => {
  console.log('INFO: Mocked version of itslearning is ready.')
  console.log(
    `Open http://localhost:${itslearningPort}/ to open the Serlo Editor via LTI`
  )
})
