/* eslint no-undef: 0 */
const uri = `mongodb://${process.env.USER}_mongoroot:${process.env.MONGODB_PASSWORD}@127.0.0.1:27017/admin`
// eslint-disable-next-line no-console
console.log(`Attempting to connect to ${uri}`)
db = connect(uri)
