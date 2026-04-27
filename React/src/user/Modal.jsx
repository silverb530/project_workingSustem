import { useEffect } from 'react'
import Icons from './Icons'

function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerAccent} />
            <h3 style={S.title}>{title}</h3>
          </div>
          <button style={S.closeBtn} onClick={onClose}>
            <Icons.X className="sm" />
          </button>
        </div>

        <div style={S.divider} />

        <div style={S.body}>{children}</div>

      </div>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 18px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerAccent: {
    width: '4px',
    height: '20px',
    borderRadius: '2px',
    background: 'linear-gradient(180deg, #3b82f6, #2563eb)',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a1d23',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    background: '#f9fafb',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
  },
  divider: {
    height: '1px',
    background: '#f1f3f7',
    margin: '0',
  },
  body: {
    padding: '24px 24px 20px',
  },
}

export default Modal
