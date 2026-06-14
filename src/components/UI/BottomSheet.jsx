import { useEffect } from 'react'
import { IconX } from '@tabler/icons-react'

/**
 * Panel deslizante desde la parte inferior (mobile-first).
 * @param {boolean} open
 * @param {() => void} onClose - al cerrar (overlay, botón o Escape).
 * @param {string} [title]
 * @param {React.ReactNode} children
 */
export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="bottom-sheet" role="dialog" aria-modal="true">
      <div className="bottom-sheet__overlay" onClick={onClose} />
      <div className="bottom-sheet__panel">
        <div className="bottom-sheet__handle" />
        <header className="bottom-sheet__header">
          {title && <h2 className="bottom-sheet__title">{title}</h2>}
          <button
            type="button"
            className="bottom-sheet__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <IconX size={20} stroke={1.75} />
          </button>
        </header>
        <div className="bottom-sheet__content">{children}</div>
      </div>
    </div>
  )
}
