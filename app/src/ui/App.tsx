import { Miniplayer } from './miniplayer/Miniplayer'
import { PlayerView } from './player/PlayerView'
import { useMediaSession } from './hooks/useMediaSession'

function App() {
  useMediaSession()

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
      <PlayerView />
      <Miniplayer />
    </div>
  )
}

export default App
