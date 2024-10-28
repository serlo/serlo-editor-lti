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

const NonEmptyString = new t.Type<string, string, unknown>(
  'NonEmptyString',
  t.string.is,
  (input, context) => {
    if (t.string.is(input) && input.length > 0) {
      return t.success(input)
    }
    return t.failure(input, context)
  },
  String
)

const BaseEnv = {
  EDITOR_URL: NonEmptyString,
  SERLO_EDITOR_TESTING_SECRET: t.string,
  LTIJS_KEY: NonEmptyString,
  MYSQL_URI: NonEmptyString,
  MONGODB_URI: NonEmptyString,
  ALLOW_SALTIRE: StringOrUndefinedToBoolean,
  ALLOW_EDUSHARING_MOCK: StringOrUndefinedToBoolean,
  S3_ENDPOINT: NonEmptyString,
  BUCKET_NAME: NonEmptyString,
  BUCKET_REGION: NonEmptyString,
  // fallback to '' for now so it does not fail in CI
  BUCKET_ACCESS_KEY_ID: t.string,
  // fallback to '' for now so it does not fail in CI
  BUCKET_SECRET_ACCESS_KEY: t.string,
  MEDIA_BASE_URL: NonEmptyString,
}

const LocalEnvType = t.type({
  ...BaseEnv,
  ENVIRONMENT: t.literal('local'),
})

const DevelopmentEnvType = t.type({
  ...BaseEnv,
  ENVIRONMENT: t.literal('development'),
})

const StagingEnvType = t.type({
  ...BaseEnv,
  ENVIRONMENT: t.literal('staging'),
  ITSLEARNING_NAME: NonEmptyString,
  ITSLEARNING_URL: NonEmptyString,
  ITSLEARNING_AUTHENTICATION_ENDPOINT: NonEmptyString,
  ITSLEARNING_ACCESS_TOKEN_ENDPOINT: NonEmptyString,
  ITSLEARNING_KEYSET_ENDPOINT: NonEmptyString,
  SERLO_EDITOR_CLIENT_ID_ON_ITSLEARNING: NonEmptyString,
  EDUSHARING_RLP_URL: NonEmptyString,
  EDUSHARING_RLP_NAME: NonEmptyString,
  EDUSHARING_RLP_AUTHENTICATION_ENDPOINT: NonEmptyString,
  EDUSHARING_RLP_ACCESS_TOKEN_ENDPOINT: NonEmptyString,
  EDUSHARING_RLP_KEYSET_ENDPOINT: NonEmptyString,
  SERLO_EDITOR_CLIENT_ID_ON_EDUSHARING_RLP: NonEmptyString,
  EDUSHARING_RLP_LOGIN_ENDPOINT: NonEmptyString,
  EDUSHARING_RLP_LAUNCH_ENDPOINT: NonEmptyString,
  EDUSHARING_RLP_DETAILS_ENDPOINT: NonEmptyString,
  EDUSHARING_RLP_CLIENT_ID_ON_SERLO_EDITOR: NonEmptyString,
})

const ProductionEnvType = t.type({
  ...BaseEnv,
  ENVIRONMENT: t.literal('production'),
})

const IOEnv = t.union([
  LocalEnvType,
  DevelopmentEnvType,
  StagingEnvType,
  ProductionEnvType,
])

export const decodedConfig = IOEnv.decode(process.env)

if (decodedConfig._tag === 'Left') {
  throw new Error(
    'Config validation errors: ' + failure(decodedConfig.left).join('\n')
  )
}

const config = decodedConfig.right

export default config
