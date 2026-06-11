import { Miniplayer } from './miniplayer/Miniplayer'
import { PlayerView } from './player/PlayerView'
import { FileImportView } from './views/FileImportView'
import { useMediaSession } from './hooks/useMediaSession'
import { usePlayerStore } from '../application/playerStore'

function App() {
  useMediaSession()
  const hasTrack = usePlayerStore((s) => s.currentTrackId !== null)

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
        {hasTrack ? <PlayerView /> : <FileImportView />}
      </main>
      <Miniplayer />
    </div>
  )
}

export default App
