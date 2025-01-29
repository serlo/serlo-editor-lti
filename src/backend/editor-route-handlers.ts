import { Request, Response } from 'express'

import jwt from 'jsonwebtoken'
import path from 'path'
import { AccessToken, Entity } from '.'
import { getMariaDB } from './mariadb'
import config from '../utils/config'
import { logger } from '../utils/logger'
import { IdToken } from 'ltijs'
import urljoin from 'url-join'
import { v4 as uuid_v4 } from 'uuid'

import { Provider as ltijs } from 'ltijs'
import { fileURLToPath } from 'url'

const ltijsKey = config.LTIJS_KEY

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function app(_: Request, res: Response) {
  return res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'))
}

export async function selectContentType(
  __: IdToken,
  _: Request,
  res: Response
) {
  return res.send(`
    <!doctype html>
    <html lang="de">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Serlo Editor</title>
      <style>
        #clicktarget {
          display: block; width: 760px; height: 568px;
          background: url('https://editor.serlo.dev/media/serlo-org/fzinqkwqekgnx9jhgrazvfe4/image.svg')
            no-repeat center center;
          background-size: contain;
        }
          /* hide visually */
        #clicktarget span {
          border: 0; clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; width: 1px;
        }
      </style>
    </head>
    <body style="margin:0; padding:0"><a id="clicktarget" href="/deeplinking-done?type=serlo-editor&ltik=${res.locals.ltik}"><span>Serlo Editor Inhalt (ohne Vorlage)</span></a></body>
  </html>
  `)
}

export async function deeplinkingDone(req: Request, res: Response) {
  const idToken = res.locals.token

  if (!idToken) return res.status(400).send('Missing idToken')

  const mariaDB = getMariaDB()

  const ltiCustomClaimId = uuid_v4()

  // Create new entity in database
  const { insertId: entityId } = await mariaDB.mutate(
    'INSERT INTO lti_entity (custom_claim_id, id_token_on_creation) values (?, ?)',
    [ltiCustomClaimId, JSON.stringify(idToken)]
  )

  logger.info('entityId: ', entityId)

  const url = new URL(urljoin(config.EDITOR_URL, '/lti/launch'))

  // https://www.imsglobal.org/spec/lti-dl/v2p0#lti-resource-link
  const items = [
    {
      type: 'ltiResourceLink',
      url: url.href,
      title: `Serlo Editor Content`,
      text: 'Placeholder description',
      icon: {
        url: 'https://editor.serlo.dev/media/serlo-org/skkwa1vksa3v2yc7bj9z0bni/image.png',
        width: 500,
        height: 500,
      },
      // thumbnail:
      // window:
      // iframe: {
      //   width: 400,
      //   height: 300,
      // },
      custom: {
        // Important: Only use lowercase letters in key. When I used uppercase letters they were changed to lowercase letters in the LTI Resource Link launch.
        id: ltiCustomClaimId,
        type: req.query['type'],
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
}

export async function getEntity(req: Request, res: Response) {
  const database = getMariaDB()

  const accessToken = req.query.accessToken
  if (typeof accessToken !== 'string') {
    return res.send('Missing or invalid access token')
  }

  let decodedAccessToken
  try {
    decodedAccessToken = jwt.verify(accessToken, ltijsKey) as AccessToken
  } catch (error) {
    logger.error(error)
    return res.json({ content: 'Invalid access token' })
  }

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

  logger.info('entity: ', entity)

  res.json(entity)
}

export async function putEntity(req: Request, res: Response) {
  const database = getMariaDB()

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
    JSON.stringify(req.body.editorState),
    decodedAccessToken.entityId,
  ])
  logger.info(
    `Entity ${
      decodedAccessToken.entityId
    } modified in database. New state:\n${req.body.editorState}`
  )

  return res.send('Success')
}
