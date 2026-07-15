export default function GlassCard({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag className={`glass-card ${className}`} {...props}>
      {children}
    </Tag>
  )
}
