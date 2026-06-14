import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from './playerStore'

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset()
  })

  it('starts in idle state', () => {
    const s = usePlayerStore.getState()
    expect(s.currentTrackId).toBeNull()
    expect(s.playing).toBe(false)
    expect(s.position).toBe(0)
    expect(s.pitch).toBe(0)
    expect(s.tempo).toBe(1)
    expect(s.volume).toBe(1)
    expect(s.repeat).toBe('none')
  })

  it('loadTrack sets track and resets position', () => {
    usePlayerStore.getState().loadTrack('track-1', 240)
    const s = usePlayerStore.getState()
    expect(s.currentTrackId).toBe('track-1')
    expect(s.duration).toBe(240)
    expect(s.position).toBe(0)
    expect(s.playing).toBe(false)
  })

  it('play sets playing=true', () => {
    usePlayerStore.getState().loadTrack('t1', 100)
    usePlayerStore.getState().play()
    expect(usePlayerStore.getState().playing).toBe(true)
  })

  it('pause sets playing=false', () => {
    usePlayerStore.getState().loadTrack('t1', 100)
    usePlayerStore.getState().play()
    usePlayerStore.getState().pause()
    expect(usePlayerStore.getState().playing).toBe(false)
  })

  it('stop resets position to 0', () => {
    usePlayerStore.getState().loadTrack('t1', 100)
    usePlayerStore.getState().seek(60)
    usePlayerStore.getState().stop()
    expect(usePlayerStore.getState().position).toBe(0)
    expect(usePlayerStore.getState().playing).toBe(false)
  })

  it('seek sets position', () => {
    usePlayerStore.getState().loadTrack('t1', 100)
    usePlayerStore.getState().seek(45)
    expect(usePlayerStore.getState().position).toBe(45)
  })

  it('setPitch clamps to ±12', () => {
    usePlayerStore.getState().setPitch(15)
    expect(usePlayerStore.getState().pitch).toBe(12)
    usePlayerStore.getState().setPitch(-15)
    expect(usePlayerStore.getState().pitch).toBe(-12)
  })

  it('setTempo clamps to 0.5-2.0', () => {
    usePlayerStore.getState().setTempo(3)
    expect(usePlayerStore.getState().tempo).toBe(2)
    usePlayerStore.getState().setTempo(0.1)
    expect(usePlayerStore.getState().tempo).toBe(0.5)
  })

  it('setVolume clamps to 0-1', () => {
    usePlayerStore.getState().setVolume(2)
    expect(usePlayerStore.getState().volume).toBe(1)
    usePlayerStore.getState().setVolume(-1)
    expect(usePlayerStore.getState().volume).toBe(0)
  })

  it('setRepeat changes repeat mode', () => {
    usePlayerStore.getState().setRepeat('one')
    expect(usePlayerStore.getState().repeat).toBe('one')
    usePlayerStore.getState().setRepeat('playlist')
    expect(usePlayerStore.getState().repeat).toBe('playlist')
  })

  it('updatePosition updates playback position', () => {
    usePlayerStore.getState().updatePosition(30)
    expect(usePlayerStore.getState().position).toBe(30)
  })

  it('reset returns to initial state', () => {
    usePlayerStore.getState().loadTrack('t1', 100)
    usePlayerStore.getState().play()
    usePlayerStore.getState().setPitch(5)
    usePlayerStore.getState().reset()
    const s = usePlayerStore.getState()
    expect(s.currentTrackId).toBeNull()
    expect(s.playing).toBe(false)
    expect(s.pitch).toBe(0)
  })
})
