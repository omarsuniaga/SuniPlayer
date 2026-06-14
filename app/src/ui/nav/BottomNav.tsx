import { useState } from 'react'
import { AppView, useNavigationStore } from '../../application/navigationStore'
import { useSessionStore } from '../../application/sessionStore'
import { InstallButton } from '../atoms/InstallButton'

const DOUBLE_TAP_MS = 650

const navItems: Array<{ view: AppView; label: string }> = [
  { view: 'inicio', label: 'Inicio' },
  { view: 'reproductor', label: 'Reproductor' },
  { view: 'libreria', label: 'Librer�a' },
  { view: 'show', label: 'Show' },
  { view: 'edit', label: 'Edit' },
  { view: 'perfil', label: 'Perfil' },
]

const navStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'space-around',
  gap: 4,
  padding: '8px 8px 10px',
  background: '#111',
  borderTop: '1px solid #333',
  zIndex: 110,
}

const buttonStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#333',
  borderRadius: 8,
  background: '#1f1f1f',
  color: '#eee',
  padding: '8px 4px',
  fontSize: 12,
}

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  borderColor: '#2d6cdf',
  color: '#fff',
  background: '#19345f',
}

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.82)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 24,
}

const modalStyle: React.CSSProperties = {
  maxWidth: 360,
  border: '2px solid #f44336',
  borderRadius: 12,
  background: '#1b1010',
  color: '#fff',
  padding: 20,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

export function BottomNav() {
  const currentView = useNavigationStore((s) => s.currentView)
  const navigate = useNavigationStore((s) => s.navigate)
  const mode = useSessionStore((s) => s.mode)
  const setMode = useSessionStore((s) => s.setMode)
  const [pendingView, setPendingView] = useState<AppView | null>(null)
  const [lastConfirmTap, setLastConfirmTap] = useState(0)
  const isLocked = mode === 'show'

  const requestNavigation = (view: AppView) => {
    if (isLocked && view !== currentView) {
      setPendingView(view)
      setLastConfirmTap(0)
      return
    }

    navigate(view)
  }

  const confirmExit = () => {
    const now = Date.now()
    if (now - lastConfirmTap <= DOUBLE_TAP_MS) {
      setMode('listen')
      navigate(pendingView ?? 'reproductor')
      setPendingView(null)
      setLastConfirmTap(0)
      return
    }

    setLastConfirmTap(now)
  }

  return (
    <>
      <nav className={isLocked ? 'bottom-nav nav-locked' : 'bottom-nav'} style={navStyle} aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            key={item.view}
            type="button"
            style={item.view === currentView ? activeButtonStyle : buttonStyle}
            aria-current={item.view === currentView ? 'page' : undefined}
            onClick={() => requestNavigation(item.view)}
          >
            {item.label}
          </button>
        ))}
        <InstallButton />
      </nav>

      {pendingView && (
        <div className="panic-modal-confirm" role="dialog" aria-modal="true" aria-label="Confirm show mode exit" style={modalBackdropStyle}>
          <div style={modalStyle}>
            <strong>�CONFIRMAS SALIR DEL MODO SHOW? (Presiona dos veces r�pido)</strong>
            <button type="button" onClick={confirmExit} style={activeButtonStyle}>
              Confirm exit
            </button>
          </div>
        </div>
      )}
    </>
  )
}
