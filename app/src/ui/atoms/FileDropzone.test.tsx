import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { FileDropzone } from './FileDropzone'

describe('FileDropzone', () => {
  it('renders the dropzone text', () => {
    const { container } = render(<FileDropzone onFilesSelected={vi.fn()} />)
    expect(container.textContent).toContain('Drop audio files here or click to browse')
  })

  it('calls onFilesSelected when files are dropped', () => {
    const spy = vi.fn()
    const { container } = render(<FileDropzone onFilesSelected={spy} />)
    const dz = container.firstChild as HTMLElement

    const file = new File([''], 'song.mp3', { type: 'audio/mpeg' })
    fireEvent.drop(dz, { dataTransfer: { files: [file] } })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith([file])
  })

  it('applies drag-over style while dragging over', () => {
    const { container } = render(<FileDropzone onFilesSelected={vi.fn()} />)
    const dz = container.firstChild as HTMLElement

    fireEvent.dragEnter(dz)
    // Blue border color from dragOverStyle
    const style = dz.style
    expect(style.borderColor).toBe('rgb(45, 108, 223)')

    fireEvent.dragLeave(dz)
    expect(style.borderColor).toBe('rgb(85, 85, 85)') // returns to default #555
  })

  it('does not respond when disabled', () => {
    const spy = vi.fn()
    const { container } = render(<FileDropzone onFilesSelected={spy} disabled />)
    const dz = container.firstChild as HTMLElement

    fireEvent.drop(dz, { dataTransfer: { files: [new File([''], 's.mp3', { type: 'audio/mpeg' })] } })
    expect(spy).not.toHaveBeenCalled()
  })

  it('calls onFilesSelected via file input change', () => {
    const spy = vi.fn()
    const { container } = render(<FileDropzone onFilesSelected={spy} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File([''], 'track.wav', { type: 'audio/wav' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(spy).toHaveBeenCalledWith([file])
  })
})
