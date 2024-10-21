#!/bin/bash

set -e

cd /home/${USER}/serlo-editor-as-lti-tool
git checkout --force $GITHUB_REF_NAME
git pull

yarn
yarn build

s3cmd get s3://edtr-env/${USER}/.env . --force

supervisorctl restart serlo-app