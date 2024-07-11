import { type SerloEditorProps } from '@serlo/editor'
import { useEffect, useState } from 'react'
import SerloContent from './SerloContent'

type AppState =
  | { type: 'fetching-content' }
  | { type: 'error'; message: string }
  | { type: 'content-fetched'; content: SerloEditorProps['initialState'] }

function App() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const accessToken = urlParams.get('accessToken')
  const ltik = urlParams.get('ltik')
  const resourceLinkIdFromUrl = urlParams.get('resourceLinkId')

  const [appState, setAppState] = useState<AppState>({
    type: 'fetching-content',
  })

  useEffect(() => {
    if (!accessToken) {
      setAppState({
        type: 'error',
        message: 'Error: Missing accessToken in serach query parameters.',
      })
      return
    }
    // TODO: Check if other search query parameters are valid

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
      })
        .then(async (res) => {
          if (res.status === 200) {
            const entity = await res.json()
            console.log('entity: ', entity)
            const resourceLinkIdFromDb = entity.resource_link_id
            if (!resourceLinkIdFromDb || !resourceLinkIdFromUrl) {
              setAppState({
                type: 'error',
                message: 'Error: resource_link_id was missing!',
              })
              return
            }
            if (resourceLinkIdFromDb !== resourceLinkIdFromUrl) {
              setAppState({
                type: 'error',
                message:
                  'Auf der itslearning Platform wurde eine Kopie erstellt. Leider ist dies aus technischen Gründen noch nicht möglich. Du kannst allerdings einen neuen Serlo Editor Inhalt auf itslearning erstellen und die gewünschten Inhalte per "Plugin in die Zwischenablage kopieren" dorthin übernehmen.',
              })
              return
            }
            const content = JSON.parse(entity.content)
            console.log('content: ', content)
            setAppState({ type: 'content-fetched', content })
          } else {
            setAppState({
              type: 'error',
              message: 'Fehler beim Laden des Inhalts.',
            })
          }
        })
        .catch(() => {
          setAppState({
            type: 'error',
            message: 'Fehler beim Laden des Inhalts.',
          })
        })
    }
    fetchContent()
  }, [])

  if (appState.type === 'fetching-content') return null
  if (appState.type === 'error') return <div>{appState.message}</div>

  // appState.type === 'fetched-content'
  return <SerloContent initialState={appState.content} />
}

export default App
