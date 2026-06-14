import { type DragEvent, type ChangeEvent, useRef, useState } from 'react'

export const DEFAULT_AUDIO_ACCEPT = '.mp3,.wav,.flac,.m4a,.ogg,audio/mpeg,audio/wav,audio/flac,audio/mp4,audio/x-m4a,audio/ogg'

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  accept?: string
  multiple?: boolean
}

const dropzoneBase: React.CSSProperties = {
  borderWidth: 2,
  borderStyle: 'dashed',
  borderColor: '#555',
  borderRadius: 12,
  padding: '48px 24px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background 0.2s',
  background: '#1a1a1a',
  color: '#888',
  fontSize: 14,
}

const dragOverStyle: React.CSSProperties = {
  borderColor: '#2d6cdf',
  background: '#1a2a3f',
  color: '#aac8ff',
}

const disabledStyle: React.CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
}

const iconStyle: React.CSSProperties = {
  fontSize: 36,
  marginBottom: 8,
  display: 'block',
}

export function FileDropzone({
  onFilesSelected,
  disabled = false,
  accept = DEFAULT_AUDIO_ACCEPT,
  multiple = true,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDragEnter(e: DragEvent) {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  function handleDragOver(e: DragEvent) {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDragLeave(e: DragEvent) {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  function handleDrop(e: DragEvent) {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)

    const files = Array.from(e.dataTransfer?.files ?? [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  function handleClick() {
    if (disabled) return
    inputRef.current?.click()
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    // Reset so selecting the same file again triggers onChange
    e.target.value = ''
  }

  const style: React.CSSProperties = {
    ...dropzoneBase,
    ...(dragging ? dragOverStyle : {}),
    ...(disabled ? disabledStyle : {}),
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop audio files here or click to browse"
      aria-disabled={disabled}
      style={style}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick()
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-hidden="true"
      />
      <span style={iconStyle} aria-hidden="true">↑</span>
      <div>Drop audio files here or click to browse</div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        MP3, WAV, FLAC, M4A, OGG
      </div>
    </div>
  )
}
