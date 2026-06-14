/**
 * Etiqueta pequeña de color. Útil para mostrar intensidades, feel, etc.
 * @param {string} [color] - color del texto/borde.
 * @param {string} [background] - color de fondo.
 * @param {React.ReactNode} children
 */
export default function Badge({ color, background, children }) {
  return (
    <span
      className="badge"
      style={{
        color: color ?? 'inherit',
        background: background ?? 'transparent',
        borderColor: color ?? 'currentColor',
      }}
    >
      {children}
    </span>
  )
}
