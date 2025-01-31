import EditorLogoLight from './assets/serlo-editor-logo-light.svg'

export default function Header() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const title = urlParams.get('title') ?? 'Inhalt'

  return (
    <div
      style={{
        display: 'flex',
        padding: '1rem',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0px 0px 10px 0px rgba(0,0,0,.22)',
        marginBottom: '0.5rem',
      }}
    >
      <img
        style={{ width: '3.5rem', height: '3.5rem' }}
        src={EditorLogoLight}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div>
          <a
            onClick={() => history.go(-1)}
            style={{ color: '#007EC1', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            <span style={{ rotate: '180deg', display: 'inline-block' }}>⮕</span>{' '}
            Zurück zu Moodle
          </a>{' '}
          {/* {contextTitle ? (
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              ({contextTitle})
            </span>
          ) : null} */}
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>{title}</h2>
      </div>
    </div>
  )
}

export interface HeaderContent {
  title: string
}
