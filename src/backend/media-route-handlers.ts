import { createId } from '@paralleldrive/cuid2'
import * as t from 'io-ts'
import {
  GetObjectTaggingCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createProxyMiddleware } from 'http-proxy-middleware'
import type { Request, Response } from 'express'
import config from '../utils/config'
import { serverLog } from '../utils/server-log'

const endpoint = config.S3_ENDPOINT
const bucketName = config.BUCKET_NAME

const target = new URL(endpoint)
target.pathname = bucketName

/**
 * Minimal proxy implementation for media assets.
 * Requests to editor.{domain}/media/… are proxied to the bucket for the current environment.
 * We do this so the urls of the image don't need to change if we change our bucket.
 * It could also allow us to setup additional restictions in the future.
 */
export const mediaProxy = createProxyMiddleware({
  target: target.href,
  changeOrigin: true,
  pathFilter: (path) => path.startsWith('/media'),
  pathRewrite: { '^/media': '' },
  on: {
    proxyRes: (proxyRes) => {
      proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    },
  },
})

const s3Client = new S3Client({
  region: config.BUCKET_REGION,
  credentials: {
    accessKeyId: config.BUCKET_ACCESS_KEY_ID,
    secretAccessKey: config.BUCKET_SECRET_ACCESS_KEY,
  },
  endpoint,
  forcePathStyle: true,
})

const mimeTypeDecoder = t.union([
  t.literal('image/gif'),
  t.literal('image/jpeg'),
  t.literal('image/png'),
  t.literal('image/svg+xml'),
  t.literal('image/webp'),
])

export async function mediaPresignedUrl(req: Request, res: Response) {
  if (!mimeTypeDecoder.is(req.query.mimeType)) {
    res.status(400).send('Missing or invalid mimeType')
    return
  }
  const mimeType = req.query.mimeType

  if (
    !t.string.is(req.query.editorVariant) ||
    req.query.editorVariant.length > 50 ||
    /^[a-z0-9-]+$/.test(req.query.editorVariant) === false
  ) {
    res.status(400).send('Missing or invalid editorVariant')
    return
  }
  const editorVariant = req.query.editorVariant

  const editorHost = req.headers.host
  if (!t.string.is(editorHost) || !editorHost.length) {
    res.status(400).send('Missing header: host')
    return
  }

  const userId = req.query.userId
  if (
    userId &&
    (!t.string.is(userId) ||
      userId.length > 100 ||
      /^[a-z0-9-]+$/i.test(userId) === false)
  ) {
    res.status(400).send('Invalid userId')
    return
  }
  const userIdTag = userId ? `&userId=${userId}` : ''

  const fileHash = createId() // cuid since they are shorter and look less frightening 🙀

  const variantFolder = editorVariant === 'unknown' ? 'all' : editorVariant

  const [mediaType, mediaSubtype] = mimeType.split('/')
  const fileExtension = mimeType === 'image/svg+xml' ? 'svg' : mediaSubtype

  // Keys with slashes are expected in S3 (rendered as folders in bucket webview for example)
  const fileName = `${variantFolder}/${fileHash}/${mediaType}.${fileExtension}`

  const params: PutObjectCommandInput = {
    Key: fileName,
    Bucket: bucketName,
    ContentType: mimeType,
    Metadata: { 'Content-Type': mimeType },
    // saved as tags so we can potentially use it in IAM policies later:
    Tagging: `editorVariant=${editorVariant}&editorHost=${editorHost}${userIdTag}`,
  }

  const command = new PutObjectCommand(params)
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

  if (!signedUrl) {
    res.status(500).send('Could not generate signed URL')
    return
  }

  const imgUrl = new URL(config.MEDIA_BASE_URL)
  imgUrl.pathname = '/media/' + fileName

  res.json({ signedUrl, imgSrc: imgUrl.href })
}

export async function runTestUpload(_req: Request, res: Response) {
  const presignedResponse = await fetch(
    'http://localhost:3000/media/presigned-url?mimeType=image/png&editorVariant=test-uploads&userId=test'
  )
  const data = await presignedResponse.json()

  // 1x1 pixel png
  const base64Data =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z/C/HwAF/gL+Tf7XNQAAAABJRU5ErkJggg=='
  const binaryData = atob(base64Data)
  const byteArray = Uint8Array.from(binaryData, (char) => char.charCodeAt(0))
  const file = new File([byteArray], '1x1.png', { type: 'image/png' })

  await fetch(data.signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      'Access-Control-Allow-Origin': '*',
    },
  }).catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
  })

  const checkResponse = await fetch(data.imgSrc)
  const imageData = await checkResponse.blob()
  serverLog('type: ' + imageData.type)
  serverLog('size: ' + imageData.size)

  const key = data.imgSrc.replace(config.MEDIA_BASE_URL + '/media/', '')

  const inputValues = {
    Bucket: 'editor-media-assets-development',
    Key: key,
  }
  const command = new GetObjectTaggingCommand(inputValues)
  const s3response = await s3Client.send(command)
  serverLog(String(s3response.TagSet))

  res.end('Done testing, check server logs for results')
}
