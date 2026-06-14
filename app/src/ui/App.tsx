import { useEffect } from 'react'
import { HomeView } from './views/HomeView'
import { Miniplayer } from './miniplayer/Miniplayer'
import { BottomNav } from './nav/BottomNav'
import { PlayerView } from './player/PlayerView'
import { LibraryView } from './views/LibraryView'
import { ShowView } from './show/ShowView'
import { useMediaSession } from './hooks/useMediaSession'
import { usePlayerStore } from '../application/playerStore'
import { useNavigationStore } from '../application/navigationStore'
import { useSessionStore } from '../application/sessionStore'

const placeholderStyle: React.CSSProperties = {
  padding: '24px 16px 160px',
  maxWidth: 480,
  margin: '0 auto',
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <section style={placeholderStyle} aria-label={title}>
      <h1>{title}</h1>
      <p>Ready for the next implementation phase.</p>
    </section>
  )
}

function App() {
  useMediaSession()
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const currentView = useNavigationStore((s) => s.currentView)
  const navigate = useNavigationStore((s) => s.navigate)
  const mode = useSessionStore((s) => s.mode)
  const showActive = useSessionStore((s) => s.showActive)
  const hasTrack = currentTrackId !== null

  useEffect(() => {
    if (hasTrack && mode !== 'show') {
      navigate('reproductor')
    }
  }, [currentTrackId, hasTrack, mode, navigate])

  useEffect(() => {
    if (showActive && mode === 'show' && currentView !== 'show') {
      navigate('show')
    }
  }, [showActive, mode, currentView, navigate])

  const renderView = () => {
    switch (currentView) {
      case 'inicio':
        return <HomeView />
      case 'reproductor':
        return <PlayerView onBack={() => navigate('libreria')} />
      case 'libreria':
        return <LibraryView onTrackSelected={() => navigate('reproductor')} />
      case 'show':
        return <ShowView onClose={() => navigate('libreria')} />
      case 'edit':
        return <PlaceholderView title="Edit" />
      case 'perfil':
        return <PlaceholderView title="Perfil" />
      default:
        return <LibraryView onTrackSelected={() => navigate('reproductor')} />
    }
  }

  return (
    <div
      id="suniplayer-root"
      className={showActive ? 'theme-dark-forced' : ''}
      style={{
        minHeight: '100vh',
        background: '#111',
        color: '#eee',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <main style={{ paddingBottom: 160 }}>{renderView()}</main>
      <Miniplayer />
      <BottomNav />
    </div>
  )
}

export default App
