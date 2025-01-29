export default function Header() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const title = urlParams.get('title') ?? 'Inhalt'
  const contextTitle = urlParams.get('contextTitle')
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        paddingTop: '1rem',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <img
        style={{ width: '2.8rem', height: '2.8rem' }}
        src="https://editor.serlo.dev/media/serlo-org/skkwa1vksa3v2yc7bj9z0bni/image.png"
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {contextTitle ? (
          <div style={{ color: '#666666', fontSize: '0.9rem' }}>
            {contextTitle}
          </div>
        ) : null}
        <h2 style={{ fontSize: '1.25rem' }}>{title}</h2>
      </div>
    </div>
  )
}

export interface HeaderContent {
  title: string
}
