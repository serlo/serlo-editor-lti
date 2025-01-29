import Header, { type HeaderContent } from './Header'

// Centered & max-width content layout
export function Layout({ children }: { children: React.ReactNode }) {
  const showHeader = !inIframe()
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const headerContent: HeaderContent = {
    title: urlParams.get('title') ?? 'Inhalt',
  }

  const maxContentWidth = '60rem'
  // Leave some space for editor UI that extends beyond (plugin toolbar, drag handle, ...)
  const paddingAroundContent = '3rem'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'white',
        // Make horizontal scroll bar appear on small width. Plugin menu, plugin toolbar, ... need some space.
        minWidth: '40rem',
        overflowX: 'auto',
      }}
    >
      <aside style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}></aside>
      <main
        style={{
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: maxContentWidth,
          maxWidth: `min(100%, ${maxContentWidth})`,
          paddingLeft: paddingAroundContent,
          paddingRight: paddingAroundContent,
        }}
      >
        {showHeader ? <Header content={headerContent} /> : null}
        <div
          style={{
            paddingTop: paddingAroundContent,
            paddingBottom: paddingAroundContent,
          }}
        >
          {children}
        </div>
      </main>
      <aside style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}></aside>
    </div>
  )
}

// https://stackoverflow.com/a/326076
function inIframe() {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}
