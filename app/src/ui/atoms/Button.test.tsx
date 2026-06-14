import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with text', () => {
    const { container } = render(<Button>Play</Button>)
    expect(container.textContent).toBe('Play')
  })

  it('calls onClick when clicked', () => {
    const spy = vi.fn()
    const { container } = render(<Button onClick={spy}>Click</Button>)
    container.querySelector('button')!.click()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const spy = vi.fn()
    const { container } = render(<Button onClick={spy} disabled>Click</Button>)
    container.querySelector('button')!.click()
    expect(spy).not.toHaveBeenCalled()
  })

  it('applies primary variant (blue background)', () => {
    const { container } = render(<Button variant="primary">Primary</Button>)
    const btn = container.firstChild as HTMLElement
    // jsdom serializes hex → rgb() in inline styles
    const bg = btn.style.background
    expect(bg === '#2d6cdf' || bg === 'rgb(45, 108, 223)').toBe(true)
  })
})
