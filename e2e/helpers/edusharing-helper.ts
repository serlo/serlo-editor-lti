import { Helper } from 'codeceptjs'
import { Server } from 'http'

import { EdusharingServer } from '../../src/edusharing-server/server'

export default class EdusharingHelper extends Helper {
  private serverMock: EdusharingServer
  private server: Server

  constructor(config) {
    super(config)

    this.serverMock = new EdusharingServer()
  }

  _init(): void {
    this.server = this.serverMock.listen(8100, () => {
      // eslint-disable-next-line no-console
      console.log('INFO: Mocked version of edusharing is ready.')
    })
  }

  _before() {
    this.serverMock.init()
  }

  _finishTest() {
    this.server.close()
  }

  removePropertyInCustom(propertyName: string) {
    this.serverMock.removePropertyInCustom(propertyName)
  }
}
