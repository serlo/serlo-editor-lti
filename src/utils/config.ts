import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'

// Inspiration from https://github.com/gcanti/io-ts-types/blob/master/src/BooleanFromString.ts
const StringOrUndefinedToBoolean = new t.Type<boolean, string, unknown>(
  'StringOrUndefinedToBoolean',
  t.boolean.is,
  (input, context) => {
    if (input === 'true') {
      return t.success(true)
    }
    if (!input || input === 'false') {
      return t.success(false)
    }
    return t.failure(input, context)
  },
  String
)

const IOEnv = t.type({
  ENVIRONMENT: t.string,
  EDITOR_URL: t.string,
  SERLO_EDITOR_TESTING_SECRET: t.string,
  LTIJS_KEY: t.string,
  MYSQL_URI: t.string,
  MONGODB_URI: t.string,
  ALLOW_SALTIRE: StringOrUndefinedToBoolean,
  ALLOW_EDUSHARING_MOCK: StringOrUndefinedToBoolean,
  S3_ENDPOINT: t.string,
  BUCKET_NAME: t.string,
  BUCKET_REGION: t.string,
  BUCKET_ACCESS_KEY_ID: t.string,
  BUCKET_SECRET_ACCESS_KEY: t.string,
  MEDIA_BASE_URL: t.string,
})

const decodedConfig = IOEnv.decode(process.env)

if (decodedConfig._tag === 'Left') {
  throw new Error(
    'Config validation errors: ' + failure(decodedConfig.left).join('\n')
  )
}

const config = decodedConfig.right

export default config
