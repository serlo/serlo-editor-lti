import { IdToken } from 'ltijs'
import express from 'express'
import jwt from 'jsonwebtoken'
import * as t from 'io-ts'
import { readEnvVariable } from '../read-env-variable'
import { getEdusharingAsToolConfiguration } from '../lti-platforms-and-tools'
import urlJoin from 'url-join'
import { createAutoFromResponse } from '../create-auto-form-response'
import { verifyJwt } from '../verify-jwt'
import { createJWKSResponse } from '../create-jwks-response'
import { signJwtWithBase64Key } from '../sign-jwt'
import { edusharingEmbedKeys } from '../edusharing-embed-keys'
import { Collection, ObjectId } from 'mongodb'

export const edusharingRouter = express.Router()

const editorUrl = readEnvVariable('EDITOR_URL')

const edusharingAsToolDeploymentId = '1'

let edusharingEmbedNonces: Collection
let edusharingEmbedSessions: Collection

// Provide endpoint to start embed flow on edu-sharing
// Called when user clicks on "embed content from edusharing"
edusharingRouter.get('/edusharing-embed/start', async (_, res) => {
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
edusharingRouter.get('/edusharing-embed/login', async (req, res) => {
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

edusharingRouter.use('/edusharing-embed/keys', async (_req, res) => {
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
edusharingRouter.post('/edusharing-embed/done', async (req, res) => {
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

edusharingRouter.get('/edusharing-embed/get', async (req, res) => {
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

function parseObjectId(objectId: string): ObjectId | null {
  try {
    return new ObjectId(objectId)
  } catch {
    return null
  }
}
