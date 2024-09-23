/* eslint no-undef: 0 */
const username = `${process.env.USER}_mongoroot`
const password = process.env.MONGODB_PASSWORD

try {
  db.auth(username, password)
  print(`User '${username}' already exists.`)
} catch {
  db.createUser({
    user: username,
    pwd: password,
    roles: ['root'],
  })
  print(`User '${username}' created.`)
}
