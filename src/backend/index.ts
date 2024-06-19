import { IdToken, Provider as ltijs } from 'ltijs'
import 'dotenv/config'
import path from 'path'
import jwt from 'jsonwebtoken'

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

export interface AccesTokenType {
  entityId: string
  accessRight: 'read' | 'write'
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

// Opens Serlo editor
ltijs.app.get('/app', async (_, res) => {
  return res.sendFile(path.join(__dirname, '../../dist/index.html'))
})

// Endpoint to get content
ltijs.app.get('/entity', (req, res) => {
  const accessToken = req.body.accessToken
  if (typeof accessToken !== 'string') {
    return res.send('Missing or invalid access token')
  }

  // const decodedAccessToken = jwt.verify(accessToken, ltijsKey)

  // TODO: Get json from database with decodedAccessToken.entityId
  const json = {
    plugin: 'rows',
    state: [
      {
        plugin: 'text',
        state: [
          {
            type: 'p',
            children: {
              text: 'Test content',
            },
          },
        ],
      },
    ],
  }

  res.json(json)
})

// Endpoint to save content
ltijs.app.put('/entity', async (req, res) => {
  const accessToken = req.body.accessToken
  if (typeof accessToken !== 'string') {
    return res.send('Missing or invalid access token')
  }

  const decodedAccessToken = jwt.verify(accessToken, ltijsKey) as AccesTokenType

  if (decodedAccessToken.accessRight !== 'write') {
    return res.send('Access token grants no right to modify content')
  }

  // TODO: Modify entity with decodedAccessToken.entityId in database

  console.log(
    `Entity ${
      decodedAccessToken.entityId
    } modified in database. New state:\n${JSON.stringify(req.body.editorState)}`
  )

  return res.send('Success')
})

// Successful LTI launch
ltijs.onConnect((idToken, req, res) => {
  // Get entityId from lti custom claim or alternatively search query parameters
  // Using search query params is suggested by ltijs, see: https://github.com/Cvmcosta/ltijs/issues/100#issuecomment-832284300
  // @ts-expect-error @types/ltijs
  const entityId = idToken.platformContext.custom.id ?? req.query.id

  if (!entityId)
    return res.send('Search query parameter "entityId" was missing!')

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
    { entityId, accessRight: editorMode },
    ltijsKey // Reuse the symmetric HS256 key used by ltijs to sign ltik and database entries
  )

  return ltijs.redirect(res, `/app?accessToken=${accessToken}`)
}, {})

// Successful LTI deep linking launch
ltijs.onDeepLinking((_, __, res) => {
  // TODO: create new entity in database and get its ID
  const entityId = 123456

  // Generate access token (authorizing write access) and send to client
  // TODO: Maybe use registered jwt names
  const accessToken = jwt.sign(
    { entityId, accessRight: 'write' },
    ltijsKey // Reuse the symmetric HS256 key used by ltijs to sign ltik and database entries
  )

  const searchParams = new URLSearchParams()
  searchParams.append('accessToken', accessToken)
  searchParams.append('deeplink', 'true')

  return ltijs.redirect(res, `/app?${searchParams}`, {
    isNewResource: true, // Tell ltijs that this is a new resource so it can update some stuff in the database
  })
})

ltijs.app.post('/lti/finish-deeplink', async (req, res) => {
  const idToken = res.locals.token as IdToken | undefined
  if (!idToken) return res.send('Missing idToken')
  const accessToken = req.body.accessToken
  if (typeof accessToken !== 'string') {
    return res.send('Missing or invalid access token')
  }

  const decodedAccessToken = jwt.verify(accessToken, ltijsKey) as AccesTokenType

  const url = new URL(
    process.env['ENVIRONMENT'] === 'local'
      ? 'http://localhost:3000'
      : 'https://editor.serlo-staging.dev'
  )
  url.pathname = '/lti/launch'
  // Temporarily deactivated
  // url.searchParams.append("entityId", decodedAccessToken.entityId);

  // https://www.imsglobal.org/spec/lti-dl/v2p0#lti-resource-link
  const items = [
    {
      type: 'ltiResourceLink',
      url: url.href,
      title: `Serlo Editor Content ${decodedAccessToken.entityId}`,
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
        id: decodedAccessToken.entityId,
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

  // Remove all platforms
  // There might be already an entry in mongodb for this platform. On restart, we want to remove it and re-add it to prevent the issue `bad decrypt`. See: https://github.com/Cvmcosta/ltijs/issues/119#issuecomment-882898770
  const platforms = await ltijs.getAllPlatforms()
  if (platforms) {
    for (const platform of platforms) {
      // @ts-expect-error @types/ltijs is missing this
      await platform.delete()
    }
  }

  console.log(`Registered platform: ${ltiPlatform.name}`)

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
