interface PlaceholderProps {
  title: string
}

export default function Placeholder({ title }: PlaceholderProps) {
  return (
    <div className="placeholder-container">
      <h2 className="placeholder-title">{title}</h2>
      <p className="placeholder-subtitle">UI coming soon...</p>
    </div>
  )
}
