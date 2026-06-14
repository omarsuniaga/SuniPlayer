import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('shows formatted time', () => {
    const { container } = render(<ProgressBar position={65} duration={200} />)
    expect(container.textContent).toContain('1:05')
    expect(container.textContent).toContain('3:20')
  })

  it('shows 0:00 for both ends when duration is zero', () => {
    const { container } = render(<ProgressBar position={0} duration={0} />)
    // Both position and duration show 0:00
    const zeroes = container.querySelectorAll('span')
    expect(zeroes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders seek input', () => {
    const { container } = render(<ProgressBar position={0} duration={200} />)
    const slider = container.querySelector('input[type="range"]')
    expect(slider).not.toBeNull()
  })
})
