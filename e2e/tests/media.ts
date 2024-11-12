Feature('Media upload and proxy')

Scenario('Requesting media proxy with example image works', ({ I }) => {
  I.sendGetRequest('http://localhost:3000/media/four-byte-burger.png')
  I.seeResponseCodeIsSuccessful()
})

Scenario('Requesting media proxy with invalid url returns 400', ({ I }) => {
  I.sendGetRequest('http://localhost:3000/media/imaginary987.png')
  I.seeResponseCodeIs(403)
})
