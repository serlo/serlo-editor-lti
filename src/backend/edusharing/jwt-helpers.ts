import { KeyObject } from 'crypto'
import jwt from 'jsonwebtoken'
import JWKSClient, { JwksClient } from 'jwks-rsa'

const jwksClients: Record<string, JwksClient | undefined> = {}

export function verifyJwt(args: {
  token: string
  verifyOptions: jwt.VerifyOptions
  keysetUrl: string
}): Promise<
  | { success: true; decoded: jwt.JwtPayload }
  | { success: false; status: number; error: string }
> {
  const { token, verifyOptions, keysetUrl } = args

  return new Promise((resolve) => {
    // We want to make ensure that the JWT is never older than 1min
    verifyOptions.maxAge = 60

    jwt.verify(token, getKey, verifyOptions, (err, decoded) => {
      if (err != null) {
        resolve({ success: false, status: 400, error: err.message })
      } else {
        // TODO: Use no "as"
        resolve({ success: true, decoded: decoded as jwt.JwtPayload })
      }
    })

    function getKey(
      header: { kid?: string },
      callback: (_: Error | null, key: string) => void
    ) {
      if (header.kid == null) {
        resolve({
          success: false,
          status: 400,
          error: 'No keyid was provided in the JWT',
        })
      } else {
        fetchSigningKey(header.kid)
          .then((key) => {
            if (typeof key === 'string') {
              callback(null, key)
            }
          })
          .catch((err) => {
            resolve({ success: false, status: 400, error: err.message })
          })
      }

      async function fetchSigningKey(keyid: string): Promise<string | null> {
        const jwksClient =
          jwksClients[keysetUrl] != null
            ? jwksClients[keysetUrl]
            : JWKSClient({
                jwksUri: keysetUrl,
                cache: process.env.NODE_ENV === 'production',
              })

        jwksClients[keysetUrl] = jwksClient

        try {
          const signingKey = await jwksClient.getSigningKey(keyid)

          return signingKey.getPublicKey()
        } catch {
          resolve({
            success: false,
            status: 502,
            error: 'An error occured while fetching key from the keyset URL',
          })

          return null
        }
      }
    }
  })
}

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
