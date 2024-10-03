Feature('keys')

Scenario('test something', ({ I }) => {
  I.amOnPage('/lti/keys')
  I.see('{"keys":[{"kty":')
})
