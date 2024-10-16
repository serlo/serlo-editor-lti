import { generateKeyPairSync } from 'crypto'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
})
const keyId = '42' // edu-sharing expects this value

export const edusharingEmbedKeys = {
  privateKey,
  publicKey,
  keyId,
}
