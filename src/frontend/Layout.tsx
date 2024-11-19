// Centered & max-width content layout
export function Layout({ children }: { children: React.ReactNode }) {
  const maxContentWidth = '56rem'
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
          // Leave some space for editor UI that extends beyond (plugin toolbar, drag handle, ...)
          padding: '3rem',
        }}
      >
        {children}
      </main>
      <aside style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}></aside>
    </div>
  )
}
