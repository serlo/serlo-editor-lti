import Header from './Header'
import { isInIframe } from './utils/is-in-iframe'

// Centered & max-width content layout
export function Layout({ children }: { children: React.ReactNode }) {
  const showHeader = !isInIframe

  const maxContentWidth = '60rem'
  // Leave some space for editor UI that extends beyond (plugin toolbar, drag handle, ...)
  const paddingAroundContent = '3rem'
  return (
    <>
      {showHeader ? <Header /> : null}

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
    </>
  )
}
