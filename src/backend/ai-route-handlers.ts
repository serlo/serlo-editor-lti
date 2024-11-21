import { Request, Response } from 'express'
import * as t from 'io-ts'

import config from '../utils/config'
import OpenAI, { APIError } from 'openai'
import { logger } from '../utils/logger'

const ChatCompletionMessageParamType = t.type({
  // Restricts role to 'user' or 'system'. Right now, we don't want to allow
  // assistant-, tool-, or function calls. See
  // https://github.com/openai/openai-node/blob/a048174c0e53269a01993a573a10f96c4c9ec79e/src/resources/chat/completions.ts#L405
  role: t.union([t.literal('user'), t.literal('system')]),
  content: t.string,
})

const ExecutePromptRequestType = t.array(ChatCompletionMessageParamType)

export async function generate(req: Request, res: Response) {
  if (config.ENVIRONMENT !== 'staging') {
    return res.status(400).send('You cannot use this route in this environment')
  }
  const messages = req.body?.messages
  if (!messages) {
    return res.status(400).send('Missing messages in body')
  }

  if (!ExecutePromptRequestType.is(messages)) {
    return res.status(400).send('Messages field(s) are invalid')
  }

  const hasEmptyMessage = messages.some(
    ({ content }) => typeof content === 'string' && content.trim() === ''
  )

  if (hasEmptyMessage) {
    return res.status(400).send('Missing prompt within a message')
  }

  try {
    const openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    })

    const stringMessage = response.choices[0].message.content

    if (!stringMessage) {
      return res.status(500).send('No content received from LLM!')
    }

    // As we now have the response_format defined as json_object, we shouldn't
    // need to call JSON.parse on the stringMessage. However, right now the OpenAI
    // types seem to be broken (thinking the API is returning a string or null).
    // Instead of fighting the types, we can simply adjust this in the next
    // version.
    const message = JSON.parse(stringMessage) as unknown

    if (!t.UnknownRecord.is(message)) {
      return res
        .status(500)
        .send('Invalid JSON format of content-generation-service')
    }

    return message
  } catch (error) {
    if (error instanceof APIError) {
      const detailedMessage = [
        'OpenAI API error while executing prompt.',
        `Status: ${error.status}`,
        `Type: ${error.type}`,
        `Code: ${error.code}`,
        `Param: ${error.param}`,
        `Message: ${error.message}`,
      ].join('\n')

      logger.error(detailedMessage)
    } else if (error instanceof Error) {
      logger.error(`Error while executing prompt: ${error.message}`)
    } else {
      logger.error('Unknown error occurred while executing prompt')
    }
    return res.status(500).send('Error occurred while executing prompt')
  }
}
