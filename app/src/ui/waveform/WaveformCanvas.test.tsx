import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { WaveformCanvas } from './WaveformCanvas'

const { mockCanvasContext } = vi.hoisted(() => ({
  mockCanvasContext: {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
  },
}))

describe('WaveformCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCanvasContext as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 120,
      width: 200,
      height: 120,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders without crashing with mock peaks', () => {
    render(<WaveformCanvas peaks={[0.25, 1, 0.5]} position={0} duration={120} />)

    expect(screen.getByLabelText('Waveform')).toBeDefined()
    expect(mockCanvasContext.fillRect).toHaveBeenCalled()
  })

  it('calls onSeek with a proportional position on pointer down', () => {
    const onSeek = vi.fn()
    render(<WaveformCanvas peaks={[1]} position={0} duration={120} onSeek={onSeek} />)

    fireEvent.mouseDown(screen.getByLabelText('Waveform'), { clientX: 50 })

    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('supports drag seeking while the pointer is pressed', () => {
    const onSeek = vi.fn()
    render(<WaveformCanvas peaks={[1]} position={0} duration={120} onSeek={onSeek} />)

    fireEvent.mouseMove(screen.getByLabelText('Waveform'), { clientX: 100, buttons: 1 })

    expect(onSeek).toHaveBeenCalledWith(60)
  })

  it('reflects the current position in the playhead', () => {
    render(<WaveformCanvas peaks={[1]} position={30} duration={120} />)

    expect(screen.getByTestId('waveform-playhead').getAttribute('style')).toContain('left: 25%')
  })
})
