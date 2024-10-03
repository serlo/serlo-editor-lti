Feature('keys')

Scenario('are available', ({ I }) => {
  I.amOnPage('/lti/keys')
  I.see('{"keys":[{"kty":')
})
