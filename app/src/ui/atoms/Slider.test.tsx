import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Slider } from './Slider'

describe('Slider', () => {
  it('renders with label', () => {
    render(<Slider value={50} min={0} max={100} onChange={() => {}} label="Volume" />)
    expect(screen.getByText('Volume')).toBeDefined()
  })

  it('shows formatted value via formatValue', () => {
    render(<Slider value={0.5} min={0} max={1} step={0.1} onChange={() => {}} formatValue={(v) => `${Math.round(v * 100)}%`} />)
    expect(screen.getByText('50%')).toBeDefined()
  })

  it('renders range input', () => {
    const { container } = render(<Slider value={50} min={0} max={100} onChange={() => {}} />)
    const input = container.querySelector('input[type="range"]')
    expect(input).not.toBeNull()
  })
})
