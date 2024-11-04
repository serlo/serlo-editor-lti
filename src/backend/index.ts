import { IdToken, Provider as ltijs } from 'ltijs'
import path from 'path'

import { v4 as uuid_v4 } from 'uuid'
import * as t from 'io-ts'
import { NextFunction, Request, Response } from 'express'
import { createAccessToken } from './util/create-acccess-token'
import { registerLtiPlatforms } from './util/register-lti-platforms'
import urlJoin from 'url-join'
import config from '../utils/config'
import * as edusharing from './edusharing'
import {
  editorApp,
  editorGetEntity,
  editorPutEntity,
} from './editor-route-handlers'
import { getMariaDB } from './mariadb'
import { mediaPresignedUrl, mediaProxy } from './media-route-handlers'
import { serverLog } from '../utils/server-log'

const ltijsKey = config.LTIJS_KEY

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

const setup = async () => {
  ltijs.setup(
    ltijsKey,
    {
      url: config.MONGODB_URI,
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
        secure: config.ENVIRONMENT === 'local' ? false : true, // Set secure to true if the testing platform is in a different domain and https is being used
        sameSite: config.ENVIRONMENT === 'local' ? '' : 'None', // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
      },
    }
  )

  await edusharing.init().catch((error) => {
    serverLog(`Setup failed: ${error}`)
    throw new Error('Setup failed!')
  })

  // Disable authentication using ltik for some endpoints in edusharing embed flow.
  ltijs.whitelist(
    '/edusharing-embed/login',
    '/edusharing-embed/done',
    '/edusharing-embed/keys'
  )

  // since whitelist is not allowing wildcards we ignore the invalidToken event for selected routes
  // @ts-expect-error types probably outdated
  ltijs.onInvalidToken(
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/media/')) {
        next()
        return
      }
      return res.status(401).send(res.locals.err)
    }
  )

  const { app } = ltijs

  // Disable COEP
  app.use((_, res, next) => {
    res.removeHeader('Cross-Origin-Embedder-Policy')
    next()
  })

  // Opens Serlo editor
  app.get('/app', editorApp)

  // Endpoint to get content
  app.get('/entity', editorGetEntity)

  // Endpoint to save content
  app.put('/entity', editorPutEntity)

  // Provide endpoint to start embed flow on edu-sharing
  // Called when user clicks on "embed content from edusharing"
  app.get('/edusharing-embed/start', edusharing.start)

  // Receives an Authentication Request in payload
  // See: https://www.imsglobal.org/spec/security/v1p0/#step-2-authentication-request
  app.get('/edusharing-embed/login', edusharing.login)

  app.use('/edusharing-embed/keys', edusharing.keys)

  // Called after the resource selection on Edusharing (within iframe) when user selected what resource to embed.
  // Receives a LTI Deep Linking Response Message in payload. Contains content_items array that specifies which resource should be embedded.
  // See: https://www.imsglobal.org/spec/lti-dl/v2p0#deep-linking-response-message
  // See https://www.imsglobal.org/spec/lti-dl/v2p0#deep-linking-response-example for an example response payload
  app.post('/edusharing-embed/done', edusharing.done)

  app.get('/edusharing-embed/get', edusharing.get)

  app.get('/media/presigned-url', mediaPresignedUrl)
  app.use(mediaProxy)

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
      return
    }

    const entityId = await getEntityId(custom.nodeId)
    async function getEntityId(edusharingNodeId: string) {
      const mariaDB = getMariaDB()
      // Check if there is already a database entry with edusharing_node_id
      const existingEntity = await mariaDB.fetchOptional<Entity | null>(
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
      const insertedEntity = await mariaDB.mutate(
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
    searchParams.append('testingSecret', config.SERLO_EDITOR_TESTING_SECRET)

    return ltijs.redirect(res, `/app?${searchParams}`)
  }

  async function onConnectDefault(
    idToken: IdToken,
    req: Request,
    res: Response
  ) {
    // Get customId from lti custom claim or alternatively search query parameters
    // Using search query params is suggested by ltijs, see: https://github.com/Cvmcosta/ltijs/issues/100#issuecomment-832284300
    // @ts-expect-error @types/ltijs
    const customId = idToken.platformContext.custom.id ?? req.query.id
    if (!customId) return res.send('Missing customId!')

    // @ts-expect-error @types/ltijs
    const resourceLinkId: string = idToken.platformContext.resource.id

    console.log('ltijs.onConnect -> idToken: ', idToken)

    const mariaDB = getMariaDB()

    // Future: Might need to fetch multiple once we create new entries with the same custom_claim_id
    const entity = await mariaDB.fetchOptional<Entity | null>(
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
      await mariaDB.mutate(
        'UPDATE lti_entity SET resource_link_id = ? WHERE id = ?',
        [resourceLinkId, entity.id]
      )
    }

    const searchParams = new URLSearchParams()
    searchParams.append('accessToken', accessToken)
    searchParams.append('resourceLinkId', resourceLinkId)
    searchParams.append('testingSecret', config.SERLO_EDITOR_TESTING_SECRET)

    return ltijs.redirect(res, `/app?${searchParams}`)
  }

  // Successful LTI deep linking launch
  // @ts-expect-error @types/ltijs
  ltijs.onDeepLinking(async (idToken, __, res) => {
    const mariaDB = getMariaDB()

    const ltiCustomClaimId = uuid_v4()

    // Create new entity in database
    const { insertId: entityId } = await mariaDB.mutate(
      'INSERT INTO lti_entity (custom_claim_id, id_token_on_creation) values (?, ?)',
      [ltiCustomClaimId, JSON.stringify(idToken)]
    )

    console.log('entityId: ', entityId)

    const url = new URL(urlJoin(config.EDITOR_URL, '/lti/launch'))

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
    const form = await ltijs.DeepLinking.createDeepLinkingForm(
      idToken,
      items,
      {}
    )

    return res.send(form)
  })

  await ltijs.deploy()

  await registerLtiPlatforms()
}

setup()
