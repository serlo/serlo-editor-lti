import { Request, Response } from 'express'

import jwt from 'jsonwebtoken'
import path from 'path'
import { AccessToken, Entity } from '.'
import { getMariaDB } from './mariadb'
import config from '../utils/config'
import { IdToken, Provider } from 'ltijs'

const ltijsKey = config.LTIJS_KEY

export async function editorApp(_: Request, res: Response) {
  return res.sendFile(path.join(__dirname, '../../dist/frontend/index.html'))
}

export async function editorGetEntity(req: Request, res: Response) {
  const idToken = res.locals.token as IdToken
  const isEdusharing = idToken.iss.includes('edu-sharing')

  if (isEdusharing) {
    return await edusharingGetEntity(req, res)
  }

  const database = getMariaDB()

  const accessToken = req.query.accessToken
  if (typeof accessToken !== 'string') {
    return res.send('Missing or invalid access token')
  }

  let decodedAccessToken
  try {
    decodedAccessToken = jwt.verify(accessToken, ltijsKey) as AccessToken
  } catch (error) {
    console.error(error)
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

  console.log('entity: ', entity)

  res.json(entity)
}

async function edusharingGetEntity(req: Request, res: Response) {
  const idToken = res.locals.token as IdToken
  const platform = await Provider.getPlatform(idToken.iss)
  if (!platform) throw new Error('Platform was null')
  const privateKey = await platform.platformPrivateKey()
  const keyId = await platform.platformKid()
  if (!privateKey || !keyId)
    throw new Error('Private key or key id could not be retrieved')
  const { appId, nodeId, user, getContentApiUrl, version, dataToken } = res
    .locals.context?.custom as {
    appId: string
    nodeId: string
    user: string
    getContentApiUrl: string
    version?: string
    dataToken: string
  }
  const payload = {
    appId,
    nodeId,
    user,
    ...(version != null ? { version } : {}),
    dataToken,
  }
  const message = jwt.sign(payload, privateKey, { keyid: keyId })

  const url = new URL(getContentApiUrl)
  url.searchParams.append('jwt', message)

  const edusharingResponse = await fetch(url.href)

  const edusharingResponseJson = await edusharingResponse.json()

  const response = {
    id: '1',
    resource_link_id: '1',
    custom_claim_id: '1',
    content: edusharingResponseJson,
  }

  return res.json(response)
}

export async function editorPutEntity(req: Request, res: Response) {
  const idToken = res.locals.token as IdToken
  const isEdusharing = idToken.iss.includes('edu-sharing')

  if (isEdusharing) {
    return await edusharingPutEntity(req, res)
  }

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
    req.body.editorState,
    decodedAccessToken.entityId,
  ])
  console.log(
    `Entity ${
      decodedAccessToken.entityId
    } modified in database. New state:\n${req.body.editorState}`
  )

  return res.send('Success')
}

async function edusharingPutEntity(req: Request, res: Response) {
  const editorState = req.body.editorState
  const idToken = res.locals.token as IdToken
  const platform = await Provider.getPlatform(idToken.iss)
  if (!platform) throw new Error('Platform was null')
  const privateKey = await platform.platformPrivateKey()
  const keyId = await platform.platformKid()
  if (!privateKey || !keyId)
    throw new Error('Private key or key id could not be retrieved')
  const { appId, nodeId, user, postContentApiUrl, dataToken } = res.locals
    .context?.custom as {
    appId: string
    nodeId: string
    user: string
    postContentApiUrl: string
    dataToken: string
  }
  const payload = {
    appId,
    nodeId,
    user,
    dataToken,
  }
  const message = jwt.sign(payload, privateKey, { keyid: keyId })

  const url = new URL(postContentApiUrl)
  url.searchParams.append('jwt', message)
  url.searchParams.append('mimetype', 'application/json')
  url.searchParams.append('versionComment', 'Automatische Speicherung')

  const blob = new Blob([JSON.stringify(editorState)], {
    type: 'application/json',
  })

  const data = new FormData()
  data.set('file', blob)

  // https://medium.com/deno-the-complete-reference/sending-form-data-using-fetch-in-node-js-8cedd0b2af85
  const response = await fetch(url.href, {
    method: 'POST',
    body: data,
  })

  if (!response.ok) return res.send('Response not ok')

  return res.send('Success')
}
