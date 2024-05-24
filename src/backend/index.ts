import { Provider as ltijs } from "ltijs";
import "dotenv/config";
import path from "node:path";
import * as t from "io-ts";
import * as jwt from "jsonwebtoken";

const __dirname = import.meta.dirname;

const ltiKey = process.env.LTI_KEY ?? "";

export const LtiCustomType = t.type({
  editor_mode: t.string, // "read" | "write"
  entity_id: t.string,
});

// Setup
ltijs.setup(
  ltiKey,
  {
    url: "mongodb://localhost:27017/",
  },
  {
    appUrl: "/lti-success",
    staticPath: path.join(__dirname, "./../../dist"), // Path to static files
    cookies: {
      secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: "", // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
  }
);

// Serlo editor
ltijs.app.get("/app", async (_, res) => {
  return res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

// Endpoint to save content
ltijs.app.get("/mutate", async (_, res) => {
  console.log("Request to mutate content");

  // TODO: Check if access token grants permission to mutate entity. If so, query database.

  return res.send("Mutated content");
});

// Successful LTI launch
ltijs.onConnect((_, __, res) => {
  const custom: unknown = res.locals.context?.custom;
  if (!LtiCustomType.is(custom)) {
    return res.send("Error");
  }
  const editorMode = custom.editor_mode;
  const entityId = custom.entity_id;
  // res.redirect(302, "/");
  // return res.send("User connected!");

  // Generate access token (authorizing write access) and send to client
  // TODO: Maybe use registered jwt names
  // @ts-expect-error For some reason I need `default` here
  const accessToken = jwt.default.sign(
    { entityId, accessRight: editorMode },
    ltiKey
  );

  return ltijs.redirect(res, `/app?accessToken=${accessToken}`);
}, {});

// Successful LTI deep linking launch
ltijs.onDeepLinking(() => {
  // TODO
  // return lti.redirect(res, "/deeplink", { newResource: true });
});

// Setup function
const setup = async () => {
  await ltijs.deploy();

  /**
   * Register platform
   */
  await ltijs.registerPlatform({
    url: "https://saltire.lti.app/platform",
    name: "saltire.lti.app",
    clientId: "saltire.lti.app",
    authenticationEndpoint: "https://saltire.lti.app/platform/auth",
    accesstokenEndpoint:
      "https://saltire.lti.app/platform/token/sc24671cd70c6e45554e6c405a2f5d966",
    authConfig: {
      method: "JWK_SET",
      key: "https://saltire.lti.app/platform/jwks/sc24671cd70c6e45554e6c405a2f5d966",
    },
  });
};

setup();
