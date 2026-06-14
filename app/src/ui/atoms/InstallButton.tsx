import { useState, useEffect } from 'react'
import { Button } from './Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

const dialogStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 360,
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 14,
  padding: 22,
  textAlign: 'left',
  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
}

const h3Style: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 15,
  fontWeight: 900,
  color: '#2d6cdf',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const pStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 12,
  color: '#bbb',
  lineHeight: 1.5,
}

const stepStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#ddd',
  lineHeight: 1.4,
  marginBottom: 6,
}

const strongStyle: React.CSSProperties = {
  color: 'white',
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    try { return !window.matchMedia('(display-mode: standalone)').matches } catch { return false }
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      // After install, hide the button
      setIsVisible(false)
    }
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowHelp(true)
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log('[PWA] Install outcome:', outcome)
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleInstallClick} style={{ color: '#4fc3f7' }}>
        + Instalar App
      </Button>

      {showHelp && (
        <div style={overlayStyle} onClick={() => setShowHelp(false)}>
          <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={h3Style}>Instalar SuniPlayer</h3>
            <p style={pStyle}>
              Tu navegador no ofreció el instalador automático. Podés instalarla manualmente:
            </p>
            <div style={stepStyle}>
              <strong style={strongStyle}>Chrome / Edge:</strong> menú ⋮ → "Instalar app".
            </div>
            <div style={stepStyle}>
              <strong style={strongStyle}>iPhone (Safari):</strong> Compartir → "Agregar a inicio".
            </div>
            <div style={stepStyle}>
              <strong style={strongStyle}>Android:</strong> menú ⋮ → "Agregar a pantalla de inicio".
            </div>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                width: '100%',
                marginTop: 18,
                padding: 12,
                borderRadius: 8,
                border: 'none',
                background: '#2d6cdf',
                color: 'white',
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </>
  )
}
