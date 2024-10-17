Prototype: Serlo editor as LTI tool

# Local dev setup

Requirements:

- Docker 24.0.0 or later

1. Create a copy of `.env.local.template` as `.env`
2. (optional) Add secret values to `.env`
3. `yarn` to install dependencies
4. `yarn dev` to start the databases and the express backend & build the
   frontend

Now, the editor is running locally. On code changes the express server will
restart and the frontend will be rebuild.

## Launch through Saltire

1. Go to https://saltire.lti.app/platform, sign in, navigate to "Advanced
   options" and upload file `saltire-platform_[TYPE].config` of the
   [`saltire-configs/`](./saltire-configs) directory. `TYPE=LTIDeepLinking`
   shows flow of creating a new Serlo Editor element.
   `TYPE=LTIResourceLink_Instructor` shows flow of opening an existing Serlo
   Editor element as Instructor (editable). `TYPE=LTIResourceLink_Learner` shows
   flow of opening an existing Serlo Editor element as Learner (non-editable).
2. Click "Connect"

## Launch through edu-sharing mock

1. `yarn dev-edusharing` to start the edu-sharing mock
2. Open `http://localhost:8100`

# Technical details

LTI launch is handled by [ltijs](https://github.com/Cvmcosta/ltijs/).

ltijs sets up an express server.

React frontend is bundled with Vite and then provided by the `/app` route in
express.

On a successful LTI launch the server returns a signed `accessToken` jwt that
the client can then later use to authenticate saving content.
