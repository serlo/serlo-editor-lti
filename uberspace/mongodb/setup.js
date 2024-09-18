const username = 'vitomirs_mongoroot'
const password = 'password_placeholder'
const roles = ['root']

try {
  db.auth(username, password)
  print(`User '${username}' already exists.`)
} catch {
  db.createUser({
    user: username,
    pwd: password,
    roles: roles,
  })
  print(`User '${username}' created.`)
}
