Serlo editor as LTI tool
Status: Early prototype

# Local dev setup

Requirements:

- Docker & Docker Compose

1. Create file `.env` and copy content from `.env-template`
2. `yarn` to install dependencies
3. `yarn build` to build the frontend
4. `yarn dev` to start docker containers
5. Go to https://saltire.lti.app/platform, sign in, navigate to "Advanced options" and upload file `saltire-platform.config`
6. Click "Connect"

The editor should open in a new tab.

# Technical details

LTI launch is handled by [ltijs](https://github.com/Cvmcosta/ltijs/).

ltijs sets up an express server.

React frontend is bundled with Vite and then provided by the `/app` route in express.

On a successful LTI launch the server returns a signed `accessToken` jwt that the client can then later use to authenticate saving content.
