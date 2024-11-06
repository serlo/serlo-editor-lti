import {
  defaultPlugins,
  EditorPluginType,
  SerloEditor,
  type SerloEditorProps,
} from '@serlo/editor'
import { jwtDecode } from 'jwt-decode'
import React, { useEffect, useRef, useState } from 'react'

interface SerloContentProps {
  initialState: SerloEditorProps['initialState']
  ltik: string
}

interface Ltik {
  platformUrl: string
  clientId: string
  deploymentId: string
  platformCode: string
  contextId: string
  user: string
  s: string
  iat: number
}

// HACK: Skip rerendering SerloEditor. It leads to slate error (not finding DOM node) and resets the cursor position. But, I don't think we need to support rerendering currently. There is probably a better way to do this but the way `initialState` and `onChange` works makes it tricky.
const MemoSerloEditor = React.memo(SerloEditor, () => true)

export default function SerloEditorWrapper(props: SerloContentProps) {
  const { initialState, ltik } = props
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const testingSecret = urlParams.get('testingSecret')
  const accessToken = urlParams.get('accessToken')

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savePending])

  const plugins = getPlugins(ltik)
  function getPlugins(ltik: string) {
    const { platformUrl } = jwtDecode(ltik) as Ltik
    const onEdusharing = platformUrl.includes('edu-sharing')
    if (!onEdusharing) {
      return defaultPlugins
    }

    // Customize available plugins when launched by edu-sharing
    const origin = window.location.origin
    const isDevEnv =
      origin.includes('editor.serlo.dev') || origin.includes('localhost')
    if (isDevEnv) {
      return [
        ...defaultPlugins,
        EditorPluginType.EdusharingAsset,
        EditorPluginType.SerloInjection,
      ]
    } else {
      return [
        ...defaultPlugins.filter(
          (plugin) =>
            plugin !== EditorPluginType.Image &&
            plugin !== EditorPluginType.DropzoneImage &&
            plugin !== EditorPluginType.ImageGallery &&
            plugin !== EditorPluginType.Video
        ),
        EditorPluginType.EdusharingAsset,
        EditorPluginType.SerloInjection,
      ]
    }
  }

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
        plugins={plugins}
        _ltik={ltik}
      >
        {(editor) => {
          return <>{editor.element}</>
        }}
      </MemoSerloEditor>
    </div>
  )
}
