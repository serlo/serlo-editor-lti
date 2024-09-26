import { BaseEditor, SerloEditor, type SerloEditorProps } from '@serlo/editor'
import React, { useEffect, useRef, useState } from 'react'

interface SerloContentProps {
  initialState: SerloEditorProps['initialState']
}

// HACK: Skip rerendering SerloEditor. It leads to slate error (not finding DOM node) and resets the cursor position. But, I don't think we need to support rerendering currently. There is probably a better way to do this but the way `initialState` and `onChange` works makes it tricky.
const MemoSerloEditor = React.memo(SerloEditor, () => true)

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
    <div
      style={{ padding: '3rem', backgroundColor: 'white', minWidth: '600px' }}
    >
      {/* <div style={{ color: 'grey' }}>
        {savePending ? 'Ungespeicherte Änderungen' : 'Gespeichert'}
      </div> */}
      <MemoSerloEditor
        initialState={initialState}
        onChange={(newState) => {
          editorStateRef.current = JSON.stringify(newState)
          setEditorState(editorStateRef.current)
          setSavePending(true)
        }}
        editorVariant="lti-tool"
        _testingSecret={testingSecret}
      >
        {(editor) => {
          customizeEditorStrings(editor.i18n)
          return <>{editor.element}</>
        }}
      </MemoSerloEditor>
    </div>
  )
}

function customizeEditorStrings(languageData: BaseEditor['i18n']) {
  languageData.loggedInData.strings.editor.plugins.text.linkOverlay.placeholder =
    'https://example.com/'
  languageData.loggedInData.strings.editor.plugins.text.linkOverlay.inputLabel =
    "Gib eine URL inklusive 'https://' ein"
}
