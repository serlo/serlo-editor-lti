import { AppStateError } from './hooks/use-app-state'

interface ErrorProps {
  appState: AppStateError
}

export default function Error({ appState }: ErrorProps) {
  return (
    <div style={{ backgroundColor: 'white', padding: '1rem' }}>
      <div
        style={{
          borderColor: 'red',
          borderWidth: '5px',
          borderRadius: '10px',
          padding: '1rem',
        }}
      >
        {appState.message}
      </div>
      {appState.imageURL ? (
        <img
          style={{ marginTop: '2rem', maxWidth: '350px' }}
          src={appState.imageURL}
        />
      ) : null}
    </div>
  )
}
