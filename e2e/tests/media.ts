import {
  GetObjectTaggingCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import config from '../../src/utils/config'

Feature('Media upload and proxy')

const s3Client = new S3Client({
  region: config.BUCKET_REGION,
  credentials: {
    accessKeyId: config.BUCKET_ACCESS_KEY_ID,
    secretAccessKey: config.BUCKET_SECRET_ACCESS_KEY,
  },
  endpoint: config.S3_ENDPOINT,
  forcePathStyle: true,
})

const uploadedKeys: string[] = []

Scenario('Requesting media proxy with example image works', ({ I }) => {
  I.sendGetRequest('http://localhost:3000/media/four-byte-burger.png')
  I.seeResponseCodeIsSuccessful()
})

Scenario('Requesting media proxy with invalid url returns 400', ({ I }) => {
  I.sendGetRequest('http://localhost:3000/media/imaginary987.png')
  I.seeResponseCodeIs(403)
})

Scenario(
  'Media: Uploading image works and Tags and Metadata is written as expected',
  async ({ I }) => {
    const presignedResponse = await fetch(
      'http://localhost:3000/media/presigned-url?mimeType=image/png&editorVariant=test-uploads&userId=test&parentHost=localhost:3000'
    )
    const data = await presignedResponse.json()
    I.assertStartsWith(
      data.signedUrl,
      'https://s3.eu-central-3.ionoscloud.com/editor-media-assets-development/test-uploads/'
    )
    I.assertStartsWith(data.fileUrl, 'https://editor.serlo.dev/media/')

    // // 1x1 pixel png
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
        'x-amz-tagging': data.tagging,
        'Access-Control-Allow-Origin': '*',
      },
    }).catch((e) => {
      I.assertFalse(true) // fail test
      // eslint-disable-next-line no-console
      console.error(e)
    })

    I.sendGetRequest(data.fileUrl)
    I.seeResponseCodeIsSuccessful()

    const key = data.fileUrl.replace(config.MEDIA_BASE_URL + '/media/', '')

    uploadedKeys.push(key)

    const inputValues = { Bucket: 'editor-media-assets-development', Key: key }
    const taggingCommand = new GetObjectTaggingCommand(inputValues)
    const taggingResponse = await s3Client.send(taggingCommand)
    I.assertEqual(
      JSON.stringify(taggingResponse.TagSet),
      '[{"Key":"editorVariant","Value":"test-uploads"},{"Key":"parentHost","Value":"localhost:3000"},{"Key":"requestHost","Value":"localhost:3000"},{"Key":"userId","Value":"test"}]'
    )

    const headCommand = new HeadObjectCommand(inputValues)
    const metaResponse = await s3Client.send(headCommand)
    I.assertEqual(
      JSON.stringify(metaResponse.Metadata),
      '{"content-type":"image/png"}'
    )
  }
)
