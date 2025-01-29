export default function Header({ content }: { content: HeaderContent }) {
  const { title } = content
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        padding: '1rem',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <img
        style={{ width: '2rem', height: '2rem' }}
        src="https://editor.serlo.dev/media/serlo-org/skkwa1vksa3v2yc7bj9z0bni/image.png"
      />
      <h2 style={{ fontSize: '1.2rem' }}>{title}</h2>
    </div>
  )
}

export interface HeaderContent {
  title: string
}
