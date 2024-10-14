import { IdToken, Provider as ltijs } from 'ltijs'
import path from 'path'
import jwt from 'jsonwebtoken'
import { Pool, createPool } from 'mysql2/promise'
import { Database } from './database'
import { v4 as uuid_v4 } from 'uuid'
import * as t from 'io-ts'
import { Collection, MongoClient, ObjectId } from 'mongodb'
import { readEnvVariable } from './read-env-variable'
import { Request, Response } from 'express'
import { createAccessToken } from './create-acccess-token'
import {
  getEdusharingAsToolConfiguration,
  ltiRegisterPlatformsAndTools,
} from './lti-platforms-and-tools'
import urlJoin from 'url-join'
import { createAutoFromResponse } from './create-auto-form-response'
import { verifyJwt } from './verify-jwt'
import { createJWKSResponse } from './create-jwks-response'
import { signJwtWithBase64Key } from './sign-jwt'
import { edusharingEmbedKeys } from './edusharing-embed-keys'

const ltijsKey = readEnvVariable('LTIJS_KEY')
const mongodbConnectionUri = readEnvVariable('MONGODB_URI')
const mysqlUri = readEnvVariable('MYSQL_URI')
const editorUrl = readEnvVariable('EDITOR_URL')

const edusharingAsToolDeploymentId = '1'

const mongoUri = new URL(mongodbConnectionUri)
const mongoClient = new MongoClient(mongoUri.href)

let pool: Pool | null = null

export interface AccessToken {
  entityId: string
  accessRight: 'read' | 'write'
}

export interface Entity {
  id: number
  custom_claim_id?: string
  content: string
  resource_link_id: string
  edusharing_node_id?: string
  id_token_on_creation: string
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
    staticPath: path.join(__dirname, './../../dist/frontend'), // Path to static files
    cookies: {
      secure: process.env['ENVIRONMENT'] === 'local' ? false : true, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: process.env['ENVIRONMENT'] === 'local' ? '' : 'None', // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
  }
)

// Disable authentication using ltik for some endpoints in edusharing embed flow. The
ltijs.whitelist(
  '/edusharing-embed/login',
  '/edusharing-embed/done',
  '/edusharing-embed/keys'
)

// Disable COEP
ltijs.app.use((_, res, next) => {
  res.removeHeader('Cross-Origin-Embedder-Policy')
  next()
})

// Opens Serlo editor
ltijs.app.get('/app', async (_, res) => {
  return res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'))
})

// Endpoint to get content
ltijs.app.get('/entity', async (req, res) => {
  const database = getMysqlDatabase()

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
        custom_claim_id,
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
  const database = getMysqlDatabase()

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

// Provide endpoint to start embed flow on edu-sharing
// Called when user clicks on "embed content from edusharing"
ltijs.app.get('/edusharing-embed/start', async (_, res) => {
  const idToken = res.locals.token as IdToken
  const issWhenEdusharingLaunchedSerloEditor = idToken.iss

  const custom: unknown = res.locals.context.custom

  const customType = t.type({
    dataToken: t.string,
    nodeId: t.string,
    user: t.string,
  })

  if (!customType.is(custom) || !custom.dataToken) {
    res
      .status(400)
      .send('dataToken, nodeId or user was missing in custom')
      .end()
    return
  }

  const { user, dataToken, nodeId } = custom

  const insertResult = await edusharingEmbedSessions.insertOne({
    createdAt: new Date(),
    user,
    dataToken,
    nodeId,
    iss: issWhenEdusharingLaunchedSerloEditor,
  })
  if (!insertResult.acknowledged) {
    res
      .status(400)
      .send('Failed to add edusharing session information to mongodb')
      .end()
    return
  }

  const edusharingAsToolConfiguration = getEdusharingAsToolConfiguration({
    issWhenEdusharingLaunchedSerloEditor,
  })
  if (!edusharingAsToolConfiguration) {
    res
      .status(400)
      .send(
        `Could not find endpoints for iss ${issWhenEdusharingLaunchedSerloEditor}`
      )
      .end()
    return
  }

  // Create a Third-party Initiated Login request
  // See: https://www.imsglobal.org/spec/security/v1p0/#step-1-third-party-initiated-login
  createAutoFromResponse({
    res,
    method: 'GET',
    targetUrl: edusharingAsToolConfiguration.loginEndpoint,
    params: {
      iss: editorUrl,
      target_link_uri: edusharingAsToolConfiguration.launchEndpoint,
      login_hint: insertResult.insertedId.toString(),
      client_id: edusharingAsToolConfiguration.clientId,
      lti_deployment_id: edusharingAsToolDeploymentId,
    },
  })
})

// Receives an Authentication Request in payload
// See: https://www.imsglobal.org/spec/security/v1p0/#step-2-authentication-request
ltijs.app.get('/edusharing-embed/login', async (req, res) => {
  const loginHint = req.query['login_hint']
  if (typeof loginHint !== 'string') {
    res.status(400).send('login_hint is not valid').end()
    return
  }

  const edusharingEmbedSessionId = parseObjectId(loginHint)

  if (edusharingEmbedSessionId == null) {
    res.status(400).send('login_hint is not valid').end()
    return
  }

  const findResult = await edusharingEmbedSessions.findOneAndDelete({
    _id: edusharingEmbedSessionId,
  })
  if (!findResult) {
    res.status(400).send('could not find edusharingEmbedSession').end()
    return
  }

  const { value: edusharingEmbedSession } = findResult

  if (
    !t
      .type({
        user: t.string,
        nodeId: t.string,
        dataToken: t.string,
        iss: t.string,
      })
      .is(edusharingEmbedSession)
  ) {
    res.status(400).send('login_hint is invalid or session is expired').end()
    return
  }

  const { user, nodeId, dataToken, iss } = edusharingEmbedSession

  const edusharingAsToolConfig = getEdusharingAsToolConfiguration({
    issWhenEdusharingLaunchedSerloEditor: iss,
  })
  if (!edusharingAsToolConfig) {
    res.status(400).send(`Could not find endpoints for LTI tool ${iss}`).end()
    return
  }

  const nonce = req.query['nonce']
  const state = req.query['state']

  if (typeof nonce !== 'string') {
    res.status(400).send('nonce is not valid').end()
    return
  } else if (typeof state !== 'string') {
    res.status(400).send('state is not valid').end()
    return
  } else if (
    req.query['redirect_uri'] !== edusharingAsToolConfig.launchEndpoint
  ) {
    res.status(400).send('redirect_uri is not valid').end()
    return
  } else if (req.query['client_id'] !== edusharingAsToolConfig.clientId) {
    res.status(400).send('client_id is not valid').end()
    return
  }

  const insertResult = await edusharingEmbedNonces.insertOne({
    createdAt: new Date(),
    nonce,
  })

  const platformDoneEndpoint = new URL(
    urlJoin(editorUrl, '/edusharing-embed/done')
  )

  // Construct a Authentication Response
  // See: https://www.imsglobal.org/spec/security/v1p0/#step-3-authentication-response
  // An id token is sent back containing a LTI Deep Linking Request Message.
  // See: https://www.imsglobal.org/spec/lti-dl/v2p0#dfn-deep-linking-request-message
  // See https://www.imsglobal.org/spec/lti-dl/v2p0#deep-linking-request-example
  // for an example of a deep linking request payload
  const payload = {
    iss: editorUrl,

    // TODO: This should be a list. Fix this when edusharing has fixed the
    // parsing of the JWT.
    aud: edusharingAsToolConfig.clientId,
    sub: user,

    nonce,
    dataToken,

    'https://purl.imsglobal.org/spec/lti/claim/deployment_id':
      edusharingAsToolDeploymentId,
    'https://purl.imsglobal.org/spec/lti/claim/message_type':
      'LtiDeepLinkingRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/roles': [],
    'https://purl.imsglobal.org/spec/lti/claim/context': { id: nodeId },
    'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings': {
      accept_types: ['ltiResourceLink'],
      accept_presentation_document_targets: ['iframe'],
      accept_multiple: true,
      auto_create: false,
      deep_link_return_url: platformDoneEndpoint,
      title: '',
      text: '',
      data: insertResult.insertedId.toString(),
    },
  }

  const token = signJwtWithBase64Key({
    payload,
    keyid: edusharingEmbedKeys.keyId,
    privateKey: edusharingEmbedKeys.privateKey,
  })

  createAutoFromResponse({
    res,
    method: 'POST',
    targetUrl: edusharingAsToolConfig.launchEndpoint,
    params: { id_token: token, state },
  })
})

ltijs.app.use('/edusharing-embed/keys', async (_req, res) => {
  createJWKSResponse({
    res,
    keyid: edusharingEmbedKeys.keyId,
    publicKey: edusharingEmbedKeys.publicKey,
  })
})

// Called after the resource selection on Edusharing (within iframe) when user selected what resource to embed.
// Receives a LTI Deep Linking Response Message in payload. Contains content_items array that specifies which resource should be embedded.
// See: https://www.imsglobal.org/spec/lti-dl/v2p0#deep-linking-response-message
// See https://www.imsglobal.org/spec/lti-dl/v2p0#deep-linking-response-example for an example response payload
ltijs.app.post('/edusharing-embed/done', async (req, res) => {
  if (req.headers['content-type'] !== 'application/x-www-form-urlencoded') {
    res
      .status(400)
      .send('"content-type" is not "application/x-www-form-urlencoded"')
      .end()
    return
  }

  if (typeof req.body.JWT !== 'string') {
    res.status(400).send('JWT token is missing in the request').end()
    return
  }

  const decodedJwt = jwt.decode(req.body.JWT)

  if (!t.type({ iss: t.string }).is(decodedJwt)) {
    res.status(400).send('Failed to decode jwt').end()
    return
  }

  const edusharingClientIdOnSerloEditor = decodedJwt.iss

  const edusharingAsToolConfig = getEdusharingAsToolConfiguration({
    edusharingClientIdOnSerloEditor,
  })
  if (!edusharingAsToolConfig) {
    res
      .status(400)
      .send(
        `Could not find endpoints for LTI tool ${edusharingClientIdOnSerloEditor}`
      )
      .end()
    return
  }
  const verifyResult = await verifyJwt({
    token: req.body.JWT,
    keysetUrl: edusharingAsToolConfig.keysetEndpoint,
    verifyOptions: {
      issuer: edusharingAsToolConfig.clientId,
      audience: editorUrl,
    },
  })

  if (verifyResult.success === false) {
    res.status(verifyResult.status).send(verifyResult.error)
    return
  }

  const { decoded } = verifyResult
  const data = decoded['https://purl.imsglobal.org/spec/lti-dl/claim/data']

  if (typeof data !== 'string') {
    res.status(400).send('data claim in JWT is missing').end()
    return
  }

  const nonceId = parseObjectId(data)

  if (nonceId == null) {
    res.status(400).send('data claim in JWT is invalid').end()
    return
  }

  const findResult = await edusharingEmbedNonces.findOneAndDelete({
    _id: nonceId,
  })
  if (!findResult.ok) {
    res.status(400).send('No entry found in deeplinkNonces').end()
    return
  }

  const deeplinkNonce = findResult.value

  if (!t.type({ nonce: t.string }).is(deeplinkNonce)) {
    res.status(400).send('deeplink flow session expired').end()
    return
  }

  if (decoded.nonce !== deeplinkNonce.nonce) {
    res.status(400).send('nonce is invalid').end()
    return
  }

  const expectedJwtType = t.type({
    'https://purl.imsglobal.org/spec/lti-dl/claim/content_items': t.array(
      t.type({
        custom: t.type({
          nodeId: t.string,
          repositoryId: t.string,
        }),
      })
    ),
  })
  if (!expectedJwtType.is(decoded)) {
    res.status(400).send('malformed custom claim in JWT send').end()
    return
  }

  const { repositoryId, nodeId } =
    decoded['https://purl.imsglobal.org/spec/lti-dl/claim/content_items'][0]
      .custom

  res
    .setHeader('Content-type', 'text/html')
    .send(
      `<!DOCTYPE html>
            <html>
              <body>
                <script type="text/javascript">
                  parent.postMessage({
                    repositoryId: '${repositoryId}',
                    nodeId: '${nodeId}'
                  }, '${editorUrl}')
                </script>
              </body>
            </html>
          `
    )
    .end()
})

ltijs.app.get('/edusharing-embed/get', async (req, res) => {
  const idToken = res.locals.token
  const { iss } = idToken
  const edusharingAsToolConfig = getEdusharingAsToolConfiguration({
    issWhenEdusharingLaunchedSerloEditor: iss,
  })
  if (!edusharingAsToolConfig) {
    res.json({
      detailsSnippet: `<b>Could not find endpoints for LTI tool ${iss}</b>`,
    })
    return
  }

  const custom: unknown = res.locals.context.custom

  if (!t.type({ dataToken: t.string }).is(custom)) {
    res.json({
      detailsSnippet: `<b>The LTI claim https://purl.imsglobal.org/spec/lti/claim/custom was invalid during request to endpoint ${req.path}</b>`,
    })
    return
  }

  const nodeId = req.query['nodeId']
  const repositoryId = req.query['repositoryId']
  if (!nodeId || !repositoryId) {
    res.json({
      detailsSnippet: `<b>Missing nodeId or missing repositoryId</b>`,
    })
    return
  }

  const payload = {
    aud: edusharingAsToolConfig.clientId,
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id':
      edusharingAsToolDeploymentId,
    expiresIn: 60,
    dataToken: custom.dataToken,
    'https://purl.imsglobal.org/spec/lti/claim/context': {
      id: edusharingAsToolConfig.clientId,
    },
  }

  const message = signJwtWithBase64Key({
    payload,
    keyid: edusharingEmbedKeys.keyId,
    privateKey: edusharingEmbedKeys.privateKey,
  })

  const url = new URL(
    urlJoin(edusharingAsToolConfig.detailsEndpoint, `${repositoryId}/${nodeId}`)
  )

  url.searchParams.append('displayMode', 'inline')
  url.searchParams.append('jwt', encodeURIComponent(message))

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (response.status != 200) {
    res.json({
      responseStatus: response.status,
      responseText: await response.text(),
      detailsSnippet:
        '<b>Es ist ein Fehler aufgetreten, den edu-sharing Inhalt einzubinden. Bitte wenden Sie sich an den Systemadministrator.</b>',
      characterEncoding: response.headers.get('content-type'),
    })
  } else {
    res.json(await response.json())
  }
})

// Successful LTI resource link launch
// @ts-expect-error @types/ltijs
ltijs.onConnect(async (idToken, req, res) => {
  if (
    idToken.iss ===
      'https://repository.staging.cloud.schulcampus-rlp.de/edu-sharing' ||
    idToken.iss === 'http://localhost:8100/edu-sharing'
  ) {
    await onConnectEdusharing(idToken, req, res)
  } else {
    onConnectDefault(idToken, req, res)
  }
}, {})

async function onConnectEdusharing(
  idToken: IdToken,
  _: Request,
  res: Response
) {
  // @ts-expect-error @types/ltijs
  const resourceLinkId: string = idToken.platformContext.resource.id
  // @ts-expect-error @types/ltijs
  const custom: unknown = idToken.platformContext.custom

  const expectedCustomType = t.intersection([
    t.type({
      getContentApiUrl: t.string,
      appId: t.string,
      dataToken: t.string,
      nodeId: t.string,
      user: t.string,
    }),
    t.partial({
      fileName: t.string,
      /** Is set when editor was opened in edit mode */
      postContentApiUrl: t.string,
      version: t.string,
    }),
  ])

  if (!expectedCustomType.is(custom)) {
    res
      .status(400)
      .send(
        `Unexpected type of LTI 'custom' claim. Got ${JSON.stringify(custom)}`
      )
      .end()
    return
  }

  const entityId = await getEntityId(custom.nodeId)
  async function getEntityId(edusharingNodeId: string) {
    const mysqlDatabase = getMysqlDatabase()
    // Check if there is already a database entry with edusharing_node_id
    const existingEntity = await mysqlDatabase.fetchOptional<Entity | null>(
      `
      SELECT
          id
          FROM
          lti_entity
        WHERE
        edusharing_node_id = ?
        `,
      [String(edusharingNodeId)]
    )
    if (existingEntity) {
      return existingEntity.id
    }
    // If there is no existing entity, create one
    const insertedEntity = await mysqlDatabase.mutate(
      'INSERT INTO lti_entity (edusharing_node_id, id_token_on_creation, resource_link_id) values (?, ?, ?)',
      [edusharingNodeId, JSON.stringify(idToken), resourceLinkId]
    )
    return insertedEntity.insertId
  }

  const editorMode =
    typeof custom.postContentApiUrl === 'string' ? 'write' : 'read'
  const accessToken = createAccessToken(editorMode, entityId, ltijsKey)

  const searchParams = new URLSearchParams()
  searchParams.append('accessToken', accessToken)
  searchParams.append('resourceLinkId', resourceLinkId)
  searchParams.append('ltik', res.locals.ltik)
  searchParams.append(
    'testingSecret',
    readEnvVariable('SERLO_EDITOR_TESTING_SECRET')
  )

  return ltijs.redirect(res, `/app?${searchParams}`)
}

async function onConnectDefault(idToken: IdToken, req: Request, res: Response) {
  // Get customId from lti custom claim or alternatively search query parameters
  // Using search query params is suggested by ltijs, see: https://github.com/Cvmcosta/ltijs/issues/100#issuecomment-832284300
  // @ts-expect-error @types/ltijs
  const customId = idToken.platformContext.custom.id ?? req.query.id
  if (!customId) return res.send('Missing customId!')

  // @ts-expect-error @types/ltijs
  const resourceLinkId: string = idToken.platformContext.resource.id

  console.log('ltijs.onConnect -> idToken: ', idToken)

  const mysqlDatabase = getMysqlDatabase()

  // Future: Might need to fetch multiple once we create new entries with the same custom_claim_id
  const entity = await mysqlDatabase.fetchOptional<Entity | null>(
    `
      SELECT
        id,
        resource_link_id,
        custom_claim_id,
        content
      FROM
        lti_entity
      WHERE
        custom_claim_id = ?
    `,
    [String(customId)]
  )

  if (!entity) {
    res.send('<div>Dieser Inhalt wurde nicht gefunden.</div>')
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

  const accessToken = createAccessToken(editorMode, entity.id, ltijsKey)

  if (!entity.resource_link_id) {
    // Set resource_link_id in database
    await mysqlDatabase.mutate(
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
}

// Successful LTI deep linking launch
// @ts-expect-error @types/ltijs
ltijs.onDeepLinking(async (idToken, __, res) => {
  const mysqlDatabase = getMysqlDatabase()

  const ltiCustomClaimId = uuid_v4()

  // Create new entity in database
  const { insertId: entityId } = await mysqlDatabase.mutate(
    'INSERT INTO lti_entity (custom_claim_id, id_token_on_creation) values (?, ?)',
    [ltiCustomClaimId, JSON.stringify(idToken)]
  )

  console.log('entityId: ', entityId)

  const url = new URL(urlJoin(editorUrl, '/lti/launch'))

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

let edusharingEmbedNonces: Collection
let edusharingEmbedSessions: Collection

// Setup function
const setup = async () => {
  await ltijs.deploy()
  await mongoClient.connect()

  edusharingEmbedNonces = mongoClient.db().collection('edusharing_embed_nonce')
  edusharingEmbedSessions = mongoClient
    .db()
    .collection('edusharing_embed_session')

  const sevenDaysInSeconds = 604800
  await edusharingEmbedNonces.createIndex(
    { createdAt: 1 },
    // The nonce is generated and stored in the database when the user clicks "embed content from edu sharing". It needs to stay valid until the user selects & embeds a content from edu-sharing within the iframe. But it should not exist indefinitely and the database should be cleared from old nonce values at some point. So we make them expire after 7 days.
    // https://www.mongodb.com/docs/manual/tutorial/expire-data/
    { expireAfterSeconds: sevenDaysInSeconds }
  )
  await edusharingEmbedSessions.createIndex(
    { createdAt: 1 },
    // Since edusharing should directly redirect the user to our page a small
    // max age should be fine her
    { expireAfterSeconds: 20 }
  )

  // If you encounter error message `bad decrypt` or changed the ltijs encryption key this might help. See: https://github.com/Cvmcosta/ltijs/issues/119#issuecomment-882898770
  // const platforms = await ltijs.getAllPlatforms()
  // if (platforms) {
  //   for (const platform of platforms) {
  //     // @ts-expect-error @types/ltijs is missing this
  //     await platform.delete()
  //   }
  // }

  await ltiRegisterPlatformsAndTools()

  const database = getMysqlDatabase()
  await database.mutate(
    `
    CREATE TABLE IF NOT EXISTS lti_entity (
      id bigint NOT NULL AUTO_INCREMENT, 
      resource_link_id varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL, 
      custom_claim_id varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
      edusharing_node_id varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL, 
      content longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL, 
      id_token_on_creation text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL, 
      
      PRIMARY KEY (id), 
      KEY idx_lti_entity_custom_claim_id (custom_claim_id),
      KEY idx_lti_entity_edusharing_node_id (edusharing_node_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
    `
  )

  if (process.env['ENVIRONMENT'] === 'local') {
    // Make sure there is an entity with a fixed ID in database to simplify local development

    const entity = await database.fetchOptional<Entity | null>(
      `
      SELECT
        id,
        resource_link_id,
        custom_claim_id,
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
        'INSERT INTO lti_entity (custom_claim_id, id_token_on_creation) values (?, ?)',
        ['00000000-0000-0000-0000-000000000000', JSON.stringify({})]
      )
    }
  }
}

setup()

function getMysqlDatabase() {
  if (pool === null) {
    pool = createPool(mysqlUri)
  }
  return new Database(pool)
}

function parseObjectId(objectId: string): ObjectId | null {
  try {
    return new ObjectId(objectId)
  } catch {
    return null
  }
}
