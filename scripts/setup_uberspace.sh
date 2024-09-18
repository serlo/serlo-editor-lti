#!/bin/bash

set -e

# Set Node.js version
if ! $(uberspace tools version show node | grep -q '20'); then
  uberspace tools version use node 20
fi

# Create MySQL table
mysql -e 'USE vitomirs; CREATE TABLE IF NOT EXISTS `lti_entity` ( `id` bigint NOT NULL AUTO_INCREMENT, `resource_link_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT NULL, `custom_claim_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL, `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL, `id_token_on_creation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL, PRIMARY KEY (`id`), KEY `idx_lti_entity_custom_claim_id` (`custom_claim_id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;'
echo 'MySQL table created successfully (or existed already)'

# Set up MongoDB
if ! $(uberspace tools version show mongodb | grep -q '6.0'); then
  uberspace tools version use mongodb 6.0
fi
mkdir -p ~/mongodb
cp ./uberspace/mongodb/mongodb.ini ~/etc/services.d/
echo $(supervisorctl reread)
echo $(supervisorctl update)
if ! $(supervisorctl status | grep -q 'RUNNING'); then
  echo 'MongoDB status is not RUNNING'
  exit 1
fi
cp ./uberspace/mongodb/.mongoshrc.js ~/
# TODO: avoid using a setup.js file here, don't commit password
cp ./uberspace/mongodb/setup.js ~/mongodb/
mongosh admin ~/mongodb/setup.js
echo 'MongoDB set up successfully'

# Set environment variables
cp .env-template .env
mysql_pw=$(grep -oP -m 1 "^password=(.*)" ~/.my.cnf | cut -d '=' -f 2-)
echo "MYSQL_URI=mysql://vitomirs:$mysql_pw@localhost:3306/vitomirs" >> .env
# TODO: don't use password directly, so that you don't commit it
echo 'MONGODB_CONNECTION_URI=mongodb://vitomirs_mongoroot:password_placeholder@127.0.0.1:27017/' >> .env
echo 'Updated environment variables'

# Install dependencies
yarn
echo 'Installed dependencies using Yarn'

# Build frontend
yarn build
echo 'Built the frontend app using Yarn'

# Run the backend as an Uberspace service
cp ./uberspace/app.ini ~/etc/services.d/
supervisorctl reread
supervisorctl update
if $(supervisorctl status | grep -q "serlo-app.*RUNNING"); then
  supervisorctl restart serlo-app
  echo 'Restarted the serlo-app Uberspace service, as it already existed'
else
  supervisorctl start serlo-app
  echo 'Started the serlo-app Uberspace service for running the backend app'
fi

# Open the LTI backend to the internet
uberspace web backend set / --http --port 3000
if ! $(uberspace web backend list | grep -q 'http:3000 => OK, listening'); then
  echo 'Uberspace web backend is not listening'
  exit 2
fi
echo 'Backend app opened to the internet'
