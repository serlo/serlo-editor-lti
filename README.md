Serlo editor as LTI tool Status: Early prototype

# Setup

1. Copy `.env-template` to `.env` and update the LTIKEY

# Open the editor via LTI

1. `yarn build` to build the frontend
2. `yarn start` to start the express server together with mongodb
3. Go to https://saltire.lti.app/platform, navigate to "Advanced options" and
   upload file `saltire-platform.config`
4. Click "Connect"

The editor should open in a new tab.

# Technical details

LTI launch is handled by [ltijs](https://github.com/Cvmcosta/ltijs/).

ltijs sets up an express server.

React frontend is bundled with Vite and then provided by the `/app` route in
express.

On a successful LTI launch the server returns a signed `accessToken` jwt that
the client can then later use to authenticate saving content.
