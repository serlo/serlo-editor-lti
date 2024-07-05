import { SerloEditor, SerloRenderer } from '@serlo/editor'
import { useEffect, useState } from 'react'
import type { AccesTokenType } from '../backend'
import { jwtDecode } from 'jwt-decode'

const initialEditorState = {
  plugin: 'rows',
  state: [
    {
      plugin: 'text',
      state: [
        {
          type: 'p',
          children: [
            {
              text: '',
            },
          ],
        },
      ],
    },
  ],
}

function App() {
  const [editorState, setEditorState] = useState<string>(
    JSON.stringify(initialEditorState)
  )
  const [savePending, setSavePending] = useState<boolean>(false)
  // TODO: Fetch content json from database. Send along access token to authenticate request.

  // Save content if there are unsaved changed
  useEffect(() => {
    if (!savePending) return

    setTimeout(saveContent, 1000)
    function saveContent() {
      fetch('/entity', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          Authorization: `Bearer ${ltik}`,
        },
        body: JSON.stringify({
          accessToken,
          editorState,
        }),
      }).then((res) => {
        if (res.status === 200) {
          setSavePending(false)
        } else {
          // TODO: Handle failure
        }
      })
    }
  }, [savePending])

  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)

  const accessToken = urlParams.get('accessToken')
  const ltik = urlParams.get('ltik')
  if (!accessToken || !ltik) return <p>Access token or ltik was missing!</p>

  const decodedAccessToken = jwtDecode(accessToken) as AccesTokenType
  const mode: 'read' | 'write' = decodedAccessToken.accessRight

  const isDeeplink = urlParams.get('deeplink')

  return (
    <>
      <div style={{ marginBottom: '3rem' }}>
        {savePending || !editorState ? (
          // Show close button but disable it
          <button disabled>Close</button>
        ) : isDeeplink ? (
          // Enable close button
          <form method="post" action="/lti/finish-deeplink">
            <input type="hidden" name="accessToken" value={accessToken} />
            <input type="hidden" name="ltik" value={ltik} />
            <input type="hidden" name="editorState" value={editorState} />
            <button
              style={{
                backgroundColor: 'grey',
                borderRadius: '5px',
                padding: '5px',
              }}
              type="submit"
            >
              Close
            </button>
          </form>
        ) : (
          <></>
        )}
      </div>
      {mode === 'write' ? (
        <SerloEditor
          initialState={initialEditorState}
          onChange={({ changed, getDocument }) => {
            if (!changed) return
            const newState = getDocument()
            if (!newState) return
            setEditorState(JSON.stringify(newState))
            setSavePending(true)
          }}
        >
          {(editor) => {
            return <>{editor.element}</>
          }}
        </SerloEditor>
      ) : (
        <SerloRenderer document={initialEditorState} />
      )}
      {/* <h2>Debug info</h2>
      <h3>Access token:</h3>
      <div>{accessToken}</div>
      <h3>ltik:</h3>
      <div>{ltik}</div> */}
    </>
  )
}

export default App
