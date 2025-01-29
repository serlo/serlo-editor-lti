export default function Header() {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)
  const title = urlParams.get('title') ?? 'Inhalt'
  const contextTitle = urlParams.get('contextTitle')
  return (
    <div className="eaas:flex eaas:items-center eaas:gap-4 eaas:pt-4">
      <img
        className="eaas:h-[2.8rem] eaas:w-[2.8rem]"
        src="/assets/serlo-editor-file-logo.png"
      />
      <div>
        {contextTitle ? (
          <div className="eaas:text-sm eaas:text-gray-500">{contextTitle}</div>
        ) : null}
        <h2 className="eaas:!text-xl">{title}</h2>
      </div>
    </div>
  )
}

export interface HeaderContent {
  title: string
}
