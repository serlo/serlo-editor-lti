import jwt from 'jsonwebtoken'
import { KeyObject } from 'crypto'

const defaultExpireAfterSeconds = 15

export function signJwtWithBase64Key({
  payload,
  keyid,
  privateKey,
  expireAfterSeconds,
}: {
  payload: Omit<jwt.JwtPayload, 'iat'>
  keyid: string
  privateKey: KeyObject
  expireAfterSeconds?: number
}) {
  return signJwt({
    payload,
    keyid,
    privateKey,
    expireAfterSeconds,
  })
}

function signJwt({
  payload,
  keyid,
  privateKey,
  expireAfterSeconds = defaultExpireAfterSeconds,
}: {
  payload: Omit<jwt.JwtPayload, 'iat'>
  keyid: string
  privateKey: KeyObject
  expireAfterSeconds?: number
}) {
  return jwt.sign(
    { ...payload, iat: Math.floor(Date.now() / 1000) },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: expireAfterSeconds,
      keyid,
    }
  )
}
