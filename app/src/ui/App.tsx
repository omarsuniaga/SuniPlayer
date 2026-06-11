import { useEffect, useState } from 'react'
import { Miniplayer } from './miniplayer/Miniplayer'
import { PlayerView } from './player/PlayerView'
import { FileImportView } from './views/FileImportView'
import { useMediaSession } from './hooks/useMediaSession'
import { usePlayerStore } from '../application/playerStore'

type AppView = 'library' | 'player'

function App() {
  useMediaSession()
  const currentTrackId = usePlayerStore((s) => s.currentTrackId)
  const hasTrack = currentTrackId !== null
  const [view, setView] = useState<AppView>('library')

  useEffect(() => {
    if (hasTrack) {
      setView('player')
    }
  }, [currentTrackId, hasTrack])

  return (
    <div
      id="suniplayer-root"
      style={{
        minHeight: '100vh',
        background: '#111',
        color: '#eee',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <main style={{ paddingBottom: 80 }}>
        {hasTrack && view === 'player' ? (
          <PlayerView onBack={() => setView('library')} />
        ) : (
          <FileImportView onTrackSelected={() => setView('player')} />
        )}
      </main>
      <Miniplayer />
    </div>
  )
}

export default App
