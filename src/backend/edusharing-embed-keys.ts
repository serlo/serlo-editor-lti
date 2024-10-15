import { generateKeyPairSync } from 'crypto'
import { v4 as uuid_v4 } from 'uuid'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
})
const keyId = uuid_v4()

export const edusharingEmbedKeys = {
  privateKey,
  publicKey,
  keyId,
}
