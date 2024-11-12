import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
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
