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

const BaseEnv = t.type({
  ENVIRONMENT: t.union([
    t.literal('local'),
    t.literal('development'),
    t.literal('staging'),
    t.literal('production'),
  ]),
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
})

const StagingSpecificEnv = t.type({
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

// If any env var is necessary for a certain environment, add it here for runtime type checking
const IOEnv = t.union([
  t.intersection([BaseEnv, t.type({ ENVIRONMENT: t.literal('local') })]),
  t.intersection([BaseEnv, t.type({ ENVIRONMENT: t.literal('development') })]),
  t.intersection([
    BaseEnv,
    t.type({ ENVIRONMENT: t.literal('staging') }),
    StagingSpecificEnv,
  ]),
  t.intersection([BaseEnv, t.type({ ENVIRONMENT: t.literal('production') })]),
])

export const decodedConfig = IOEnv.decode(process.env)

if (decodedConfig._tag === 'Left') {
  throw new Error(
    'Config validation errors: ' + failure(decodedConfig.left).join('\n')
  )
}

const config = decodedConfig.right

export default config
