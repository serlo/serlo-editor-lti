import Header from './Header'

// Centered & max-width content layout
export function Layout({ children }: { children: React.ReactNode }) {
  const showHeader = !inIframe()

  return (
    <div className="eaas:flex eaas:min-w-[40rem] eaas:overflow-x-auto eaas:bg-white">
      <main className="eaas:mx-auto eaas:w-full eaas:max-w-[60rem] eaas:pr-12 eaas:pl-12">
        {showHeader ? <Header /> : null}
        <div className="eaas:pt-12 eaas:pb-12">{children}</div>
      </main>
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
