/**
 * Botón circular que envuelve un icono (Tabler).
 * @param {React.ComponentType} icon - componente de icono (p. ej. IconPlus).
 * @param {string} [label] - texto accesible.
 * @param {() => void} onClick
 * @param {'default'|'primary'} [variant]
 * @param {string} [size]
 */
export default function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  size = 20,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`icon-button icon-button--${variant}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      {...rest}
    >
      {Icon && <Icon size={size} stroke={1.75} />}
    </button>
  )
}
