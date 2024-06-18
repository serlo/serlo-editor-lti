# syntax=docker/dockerfile:1

FROM node:20.14.0-alpine

ENV NODE_ENV production

WORKDIR /usr/src/app

USER node

COPY . .

EXPOSE 3000

ENTRYPOINT ["yarn", "start"]