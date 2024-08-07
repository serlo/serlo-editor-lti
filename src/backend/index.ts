import { Provider as ltijs } from 'ltijs'
import 'dotenv/config'
import path from 'path'
import jwt from 'jsonwebtoken'
import { Pool, createPool } from 'mysql2/promise'
import { Database } from './database'
import { v4 as uuidv4 } from 'uuid'

// Requires Node.js 20.11 or higher
const __dirname = import.meta.dirname

const ltijsKey = readEnvVariable('LTIJS_KEY')
const mongodbConnectionUri = readEnvVariable('MONGODB_CONNECTION_URI')
const ltiPlatform = {
  url: readEnvVariable('LTI_PLATFORM_URL'),
  name: readEnvVariable('LTI_PLATFORM_NAME'),
  clientId: readEnvVariable('LTI_PLATFORM_CLIENT_ID'),
  authenticationEndpoint: readEnvVariable(
    'LTI_PLATFORM_AUTHENTICATION_ENDPOINT'
  ),
  accessTokenEndpoint: readEnvVariable('LTI_PLATFORM_ACCESS_TOKEN_ENDPOINT'),
  keysetEndpoint: readEnvVariable('LTI_PLATFORM_KEYSET_ENDPOINT'),
}
let pool: Pool | null = null
const defaultContent = {
  plugin: 'type-generic-content',
  content: {
    plugin: 'rows',
    state: [
      {
        plugin: 'text',
        state: [
          {
            type: 'p',
            children: [
              {
                text: '',
              },
            ],
          },
        ],
      },
    ],
  },
}

export interface AccessToken {
  entityId: string
  accessRight: 'read' | 'write'
}

export interface Entity {
  id: number
  customClaimId: string
  content: string
  resource_link_id: string
}

// Setup
ltijs.setup(
  ltijsKey,
  {
    url: mongodbConnectionUri,
    // @ts-expect-error @types/ltijs
    connection: {
      useNewUrlParser: true,
    },
  },
  {
    appUrl: '/lti/launch',
    loginUrl: '/lti/login',
    keysetUrl: '/lti/keys',
    dynRegRoute: '/lti/register',
    staticPath: path.join(__dirname, './../../dist'), // Path to static files
    cookies: {
      secure: process.env['ENVIRONMENT'] === 'local' ? false : true, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: process.env['ENVIRONMENT'] === 'local' ? '' : 'None', // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
  }
)

// Disable COEP
ltijs.app.use((_, res, next) => {
  res.removeHeader('Cross-Origin-Embedder-Policy')
  next()
})

// Opens Serlo editor
ltijs.app.get('/app', async (_, res) => {
  return res.sendFile(path.join(__dirname, '../../dist/index.html'))
})

// Endpoint to get content
ltijs.app.get('/entity', async (req, res) => {
  const database = getDatabase()

  const accessToken = req.query.accessToken
  if (typeof accessToken !== 'string') {
    return res.send('Missing or invalid access token')
  }

  const decodedAccessToken = jwt.verify(accessToken, ltijsKey) as AccessToken

  // Get json from database with decodedAccessToken.entityId
  const entity = await database.fetchOptional<Entity | null>(
    `
      SELECT
        id,
        resource_link_id,
        custom_claim_id as customClaimId,
        content
      FROM
        lti_entity
      WHERE
        id = ?
    `,
    [String(decodedAccessToken.entityId)]
  )

  console.log('entity: ', entity)

  res.json(entity)
})

// Endpoint to save content
ltijs.app.put('/entity', async (req, res) => {
  const database = getDatabase()

  const accessToken = req.body.accessToken
  if (typeof accessToken !== 'string') {
    return res.send('Missing or invalid access token')
  }

  const decodedAccessToken = jwt.verify(accessToken, ltijsKey) as AccessToken

  if (decodedAccessToken.accessRight !== 'write') {
    return res.send('Access token grants no right to modify content')
  }

  // Modify entity with decodedAccessToken.entityId in database
  await database.mutate('UPDATE lti_entity SET content = ? WHERE id = ?', [
    req.body.editorState,
    decodedAccessToken.entityId,
  ])
  console.log(
    `Entity ${
      decodedAccessToken.entityId
    } modified in database. New state:\n${req.body.editorState}`
  )

  return res.send('Success')
})

// Successful LTI resource link launch
// @ts-expect-error @types/ltijs
ltijs.onConnect(async (idToken, req, res) => {
  // Get customId from lti custom claim or alternatively search query parameters
  // Using search query params is suggested by ltijs, see: https://github.com/Cvmcosta/ltijs/issues/100#issuecomment-832284300
  // @ts-expect-error @types/ltijs
  const customId = idToken.platformContext.custom.id ?? req.query.id
  if (!customId) return res.send('Missing customId!')

  // @ts-expect-error @types/ltijs
  const resourceLinkId: string = idToken.platformContext.resource.id

  console.log('ltijs.onConnect -> idToken: ', idToken)

  const database = getDatabase()

  // Future: Might need to fetch multiple once we create new entries with the same custom_claim_id
  const entity = await database.fetchOptional<Entity | null>(
    `
      SELECT
        id,
        resource_link_id,
        custom_claim_id as customClaimId,
        content
      FROM
        lti_entity
      WHERE
        custom_claim_id = ?
    `,
    [String(customId)]
  )

  // MySQL table will be reset once per day. Result: Fetching content created yesterday or earlier will fail.
  if (!entity) {
    res.send(
      '<div>Dieser Inhalt wurde automatisch gelöscht. Bitte erstelle einen neuen Inhalt.</div>'
    )
    return
  }

  // https://www.imsglobal.org/spec/lti/v1p3#lis-vocabulary-for-context-roles
  // Example roles claim from itslearning
  // "https://purl.imsglobal.org/spec/lti/claim/roles":[
  //   0:"http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff"
  //   1:"http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
  // ]
  const rolesWithWriteAccess = [
    'membership#Administrator',
    'membership#ContentDeveloper',
    'membership#Instructor',
    'membership#Mentor',
    'membership#Manager',
    'membership#Officer',
    // This role is sent in the itslearning library and we disallow editing there for now
    // 'membership#Member',
  ]
  // @ts-expect-error @types/ltijs
  const courseMembershipRole = idToken.platformContext.roles?.find((role) =>
    role.includes('membership#')
  )
  const editorMode =
    courseMembershipRole &&
    rolesWithWriteAccess.some((roleWithWriteAccess) =>
      courseMembershipRole.includes(roleWithWriteAccess)
    )
      ? 'write'
      : 'read'

  // Generate access token and send to client
  // TODO: Maybe use registered jwt names
  const accessToken = jwt.sign(
    { entityId: entity.id, accessRight: editorMode },
    ltijsKey // Reuse the symmetric HS256 key used by ltijs to sign ltik and database entries
  )

  if (!entity.resource_link_id) {
    // Set resource_link_id in database
    await database.mutate(
      'UPDATE lti_entity SET resource_link_id = ? WHERE id = ?',
      [resourceLinkId, entity.id]
    )
  }

  const searchParams = new URLSearchParams()
  searchParams.append('accessToken', accessToken)
  searchParams.append('resourceLinkId', resourceLinkId)
  searchParams.append(
    'testingSecret',
    readEnvVariable('SERLO_EDITOR_TESTING_SECRET')
  )

  return ltijs.redirect(res, `/app?${searchParams}`)
}, {})

// Successful LTI deep linking launch
// @ts-expect-error @types/ltijs
ltijs.onDeepLinking(async (idToken, __, res) => {
  const database = getDatabase()

  const isLocalEnvironment = process.env['ENVIRONMENT'] === 'local'

  const ltiCustomClaimId = uuidv4()

  // Create new entity in database
  const { insertId: entityId } = await database.mutate(
    'INSERT INTO lti_entity (custom_claim_id, content, id_token_on_creation) values (?, ?, ?)',
    [ltiCustomClaimId, JSON.stringify(defaultContent), JSON.stringify(idToken)]
  )

  console.log('entityId: ', entityId)

  const url = new URL(
    isLocalEnvironment
      ? 'http://localhost:3000'
      : 'https://editor.serlo-staging.dev'
  )
  url.pathname = '/lti/launch'
  // https://www.imsglobal.org/spec/lti-dl/v2p0#lti-resource-link
  const items = [
    {
      type: 'ltiResourceLink',
      url: url.href,
      title: `Serlo Editor Content`,
      text: 'Placeholder description',
      // icon:
      // thumbnail:
      // window:
      // iframe: {
      //   width: 400,
      //   height: 300,
      // },
      custom: {
        // Important: Only use lowercase letters in key. When I used uppercase letters they were changed to lowercase letters in the LTI Resource Link launch.
        id: ltiCustomClaimId,
      },
      // lineItem:
      // available:
      // submission:

      // Custom properties
      // presentation: {
      //   documentTarget: "iframe",
      // },
    },
  ]

  // Creates the deep linking request form
  const form = await ltijs.DeepLinking.createDeepLinkingForm(idToken, items, {})

  return res.send(form)
})

// Setup function
const setup = async () => {
  await ltijs.deploy()

  // If you encounter error message `bad decrypt` or changed the ltijs encryption key this might help. See: https://github.com/Cvmcosta/ltijs/issues/119#issuecomment-882898770
  // const platforms = await ltijs.getAllPlatforms()
  // if (platforms) {
  //   for (const platform of platforms) {
  //     // @ts-expect-error @types/ltijs is missing this
  //     await platform.delete()
  //   }
  // }

  // Register platform
  await ltijs.registerPlatform({
    url: ltiPlatform.url, // LTI iss
    name: ltiPlatform.name,
    clientId: ltiPlatform.clientId, // The ID for this LTI tool on the LTI platform
    authenticationEndpoint: ltiPlatform.authenticationEndpoint,
    accesstokenEndpoint: ltiPlatform.accessTokenEndpoint,
    authConfig: {
      method: 'JWK_SET',
      key: ltiPlatform.keysetEndpoint,
    },
  })

  console.log(`Registered platform: ${ltiPlatform.name}`)

  if (process.env['ENVIRONMENT'] === 'local') {
    // Make sure there is an entity with a fixed ID in database to simplify local development
    const database = getDatabase()
    const entity = await database.fetchOptional<Entity | null>(
      `
      SELECT
        id,
        resource_link_id,
        custom_claim_id as customClaimId,
        content
      FROM
        lti_entity
      WHERE
        custom_claim_id = ?
    `,
      ['00000000-0000-0000-0000-000000000000']
    )
    if (!entity) {
      await database.mutate(
        'INSERT INTO lti_entity (custom_claim_id, content, id_token_on_creation) values (?, ?, ?)',
        [
          '00000000-0000-0000-0000-000000000000',
          JSON.stringify(defaultContent),
          JSON.stringify({}),
        ]
      )
    }
  }
}

setup()

function readEnvVariable(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing env variable ${name}. In local development, please copy '.env-template' to new file '.env' and change values if needed.`
    )
  }
  return value
}

function getDatabase() {
  if (pool === null) {
    pool = createPool(readEnvVariable('MYSQL_URI'))
  }
  return new Database(pool)
}
