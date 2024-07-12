import { SerloEditor, type SerloEditorProps } from '@serlo/editor'
import { useEffect, useRef, useState } from 'react'

interface SerloContentProps {
  initialState: SerloEditorProps['initialState']
}

export default function SerloEditorWrapper(props: SerloContentProps) {
  const { initialState } = props
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const testingSecret = urlParams.get('testingSecret')
  const accessToken = urlParams.get('accessToken')
  const ltik = urlParams.get('ltik')

  const [editorState, setEditorState] = useState<string>(
    JSON.stringify(props.initialState)
  )
  const [savePending, setSavePending] = useState<boolean>(false)

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

  return (
    <div style={{ padding: '4rem', backgroundColor: 'white' }}>
      <SerloEditor
        initialState={initialState}
        onChange={({ changed, getDocument }) => {
          if (!changed) return
          const newState = getDocument()
          if (!newState) return
          editorStateRef.current = JSON.stringify(newState)
          setEditorState(editorStateRef.current)
          setSavePending(true)
        }}
        pluginsConfig={{
          general: {
            testingSecret: testingSecret || undefined,
            enableTextAreaExercise: false,
          },
        }}
      >
        {(editor) => {
          return <>{editor.element}</>
        }}
      </SerloEditor>
      {/* <h2>Debug info</h2>
      <h3>Access token:</h3>
      <div>{accessToken}</div>
      <h3>ltik:</h3>
      <div>{ltik}</div> */}
    </div>
  )
}
