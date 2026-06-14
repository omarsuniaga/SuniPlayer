import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Waveform } from './Waveform'

function setRect(element: Element, rect: Partial<DOMRect>) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 200,
    height: 120,
    top: 0,
    right: 200,
    bottom: 120,
    left: 0,
    toJSON: () => ({}),
    ...rect,
  })
}

describe('Waveform', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders an empty flat state when no peaks are available', () => {
    render(<Waveform peaks={[]} position={0} duration={0} onSeek={vi.fn()} />)

    expect(screen.getByRole('img', { name: 'Waveform' })).toBeDefined()
    expect(screen.getByText('Waveform unavailable')).toBeDefined()
  })

  it('renders normalized peak bars and positions the playhead', () => {
    render(<Waveform peaks={[0, 0.5, 1]} position={25} duration={100} onSeek={vi.fn()} />)

    expect(screen.getByTestId('waveform-canvas')).toBeDefined()
    expect(screen.getByTestId('waveform-playhead').style.left).toBe('25%')
  })

  it('converts click position into seek time', () => {
    const onSeek = vi.fn()
    render(<Waveform peaks={[0.2, 0.8]} position={0} duration={120} onSeek={onSeek} />)
    const waveform = screen.getByRole('img', { name: 'Waveform' })
    setRect(waveform, { left: 20, width: 200 })

    fireEvent.click(waveform, { clientX: 70 })

    expect(onSeek).toHaveBeenCalledWith(30)
  })

  it('ignores seek interactions when disabled', () => {
    const onSeek = vi.fn()
    render(<Waveform peaks={[0.2, 0.8]} position={0} duration={120} onSeek={onSeek} disabled />)
    const waveform = screen.getByRole('img', { name: 'Waveform' })
    setRect(waveform, { left: 0, width: 200 })

    fireEvent.click(waveform, { clientX: 100 })

    expect(waveform.getAttribute('aria-disabled')).toBe('true')
    expect(onSeek).not.toHaveBeenCalled()
  })

  it('converts drag position into seek time', () => {
    const onSeek = vi.fn()
    render(<Waveform peaks={[0.2, 0.8]} position={0} duration={120} onSeek={onSeek} />)
    const waveform = screen.getByRole('img', { name: 'Waveform' })
    setRect(waveform, { left: 0, width: 200 })

    const pointerMove = new Event('pointermove', { bubbles: true })
    Object.defineProperty(pointerMove, 'clientX', { value: 150 })
    Object.defineProperty(pointerMove, 'buttons', { value: 1 })
    fireEvent(waveform, pointerMove)

    expect(onSeek).toHaveBeenCalledWith(90)
  })
})
