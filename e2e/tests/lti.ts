Feature('Lti Endpoints')

Scenario(
  `requests to /lti/launch should return Unauthorized (401) if url parameter "ltik" is missing`,
  ({ I }) => {
    I.amOnPage('/lti/launch')
    I.see('"status":401,"error":"Unauthorized"')
  }
)

Scenario(
  `requests to /lti/login should return Bad Request (400) if url parameter "ltik" is missing`,
  ({ I }) => {
    I.amOnPage('/lti/login')
    I.see('"status":400,"error":"Bad Request"')
  }
)

Scenario(
  `requests to /lti/register should return Forbidden (403) if url parameter "ltik" is missing`,
  ({ I }) => {
    I.amOnPage('/lti/register')
    I.see('"status":403,"error":"Forbidden"')
  }
)

Scenario(
  `requests to /entity should return Unauthorized (401) if url parameter "ltik" is missing`,
  ({ I }) => {
    I.amOnPage('/entity')
    I.see('"status":401,"error":"Unauthorized"')
  }
)
