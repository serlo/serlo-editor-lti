import * as t from "io-ts";
import { spawnSync } from "node:child_process";


enum ImageTag {
  Dev = "dev",
  Latest = "latest",
}

void run();

function run() {
  const imageTag = process.argv[2];

  if (!imageTag) {
    throw new Error(
      `You have to specify image tag, ${ImageTag.Dev} or ${ImageTag.Latest}`
    );
  }
  if (
    !t.union([t.literal(ImageTag.Dev), t.literal(ImageTag.Latest)]).is(imageTag)
  ) {
    throw new Error(
      `Invalid environment name, please use ${ImageTag.Dev} or ${ImageTag.Latest}`
    );
  }
  buildDockerImage({
    name: "editor-as-lti-tool",
    imageTag,
  });
}

function buildDockerImage({
  name,
  imageTag,
}: {
  name: string;
  imageTag: ImageTag;
}) {
  const remoteName = `eu.gcr.io/serlo-shared/${name}`;
  const date = new Date();
  const timestamp = `${date.toISOString().split("T")[0]}-${date.getTime()}`;

  const { stdout: gitHashBuffer } = spawnSync("git", [
    "rev-parse",
    "--short",
    "HEAD",
  ]);

  const remoteTags = toTags(remoteName, [
    imageTag,
    timestamp,
    gitHashBuffer.toString().split("\n")[0],
  ]);
  const tags = [...remoteTags, ...toTags(name, [imageTag])];

  const dockerfile = imageTag == ImageTag.Dev ? ["-f", "Dockerfile.dev"] : [];

  spawnSync(
    "docker",
    ["build", ...dockerfile, ...tags.flatMap((tag) => ["-t", tag]), "."],
    { stdio: "inherit" }
  );

  remoteTags.forEach((remoteTag) => {
    // eslint-disable-next-line no-console
    console.log("Pushing", remoteTag);
    spawnSync("docker", ["push", remoteTag], { stdio: "inherit" });
  });
}

function toTags(name: string, versions: string[]) {
  return versions.map((version) => `${name}:${version}`);
}

