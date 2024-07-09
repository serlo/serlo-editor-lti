import { SerloEditor, SerloRenderer } from '@serlo/editor'
import { useEffect, useRef, useState } from 'react'
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
  const [resourceLinkIdFromDb, setResourceLinkIdFromDb] = useState<
    string | null
  >(null)

  const editorStateRef = useRef(editorState)

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
          editorState: editorStateRef.current,
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
  const resourceLinkIdFromUrl = urlParams.get('resourceLinkId')

  useEffect(() => {
    function fetchContent() {
      if (!accessToken || !ltik) {
        return new Error('Access token or ltik was missing!')
      }

      const queryString = new URLSearchParams()
      queryString.append('accessToken', accessToken)

      fetch('/entity?' + queryString, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ltik}`,
        },
      }).then(async (res) => {
        if (res.status === 200) {
          const entity = await res.json()
          console.log('entity: ', entity)
          setResourceLinkIdFromDb(entity.resource_link_id)
          const content = JSON.parse(entity.content)
          console.log('content: ', content)
          // TODO: Update the editor with the fetched content
        } else {
          // TODO: Handle failure
        }
      })
    }
    fetchContent()
  }, [accessToken, ltik])

  if (!accessToken || !ltik) return <p>Access token or ltik was missing!</p>

  const decodedAccessToken = jwtDecode(accessToken) as AccesTokenType
  const mode: 'read' | 'write' = decodedAccessToken.accessRight

  const isDeeplink = urlParams.get('deeplink')

  if (
    resourceLinkIdFromDb !== null &&
    resourceLinkIdFromUrl !== null &&
    resourceLinkIdFromDb !== resourceLinkIdFromUrl
  ) {
    return (
      <p>
        Warning message: This is a copy. We don't support that. TODO: Expand on
        this message, also maybe in German?
      </p>
    )
  }

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
            editorStateRef.current = JSON.stringify(newState)
            setEditorState(editorStateRef.current)
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
