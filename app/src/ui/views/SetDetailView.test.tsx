import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { SetDetailView } from './SetDetailView'
import { useCollectionStore } from '../../application/collectionStore'
import { addTrackToSet, removeTrackFromSet } from '../../application/collectionActions'

// Mock actions
vi.mock('../../application/collectionActions', () => ({
  addTrackToSet: vi.fn(),
  removeTrackFromSet: vi.fn(),
}))

describe('SetDetailView', () => {
  const mockTracks = [
    { id: 't1', title: 'Song 1', durationSeconds: 120, filePath: '/f1.mp3', artist: 'A1', createdAt: new Date() },
    { id: 't2', title: 'Song 2', durationSeconds: 180, filePath: '/f2.mp3', artist: 'A2', createdAt: new Date() },
    { id: 't3', title: 'Song 3', durationSeconds: 60, filePath: '/f3.mp3', artist: 'A3', createdAt: new Date() },
  ]

  const mockSet = {
    id: 's1',
    name: 'My Test Set',
    trackIds: ['t1'],
    targetDurationMinutes: 5,
  }

  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    useCollectionStore.setState({
      tracks: mockTracks as any,
      sets: [mockSet],
    })
  })

  it('renders set info and duration progress', () => {
    render(<SetDetailView setId="s1" onBack={() => {}} />)
    
    expect(screen.getByText('My Test Set')).toBeDefined()
    
    const stats = screen.getByTestId('set-stats')
    expect(stats.textContent).toContain('Current: 2:00')
    expect(stats.textContent).toContain('Goal: 5:00')
    
    const missing = screen.getByTestId('set-missing')
    expect(missing.textContent).toContain('Missing: 3:00')
  })

  it('shows suggestions based on remaining time', () => {
    render(<SetDetailView setId="s1" onBack={() => {}} />)
    
    // Remaining time is 3:00 (180s). t2 is exactly 180s.
    expect(screen.getByText('💡 Suggestions')).toBeDefined()
    expect(screen.getByText('Song 2')).toBeDefined()
  })

  it('calls addTrackToSet when a suggestion is clicked', () => {
    render(<SetDetailView setId="s1" onBack={() => {}} />)
    
    const addButton = screen.getByRole('button', { name: /Add/i })
    fireEvent.click(addButton)
    
    expect(addTrackToSet).toHaveBeenCalledWith('s1', 't2')
  })

  it('calls removeTrackFromSet when a track remove button is clicked', () => {
    render(<SetDetailView setId="s1" onBack={() => {}} />)
    
    const removeButton = screen.getByRole('button', { name: /Remove Song 1 from set/i })
    fireEvent.click(removeButton)
    
    expect(removeTrackFromSet).toHaveBeenCalledWith('s1', 't1')
  })

  it('shows no-fit message when no suggestions work', () => {
    // Set library to empty so no suggestions are found
    useCollectionStore.setState({ tracks: [mockTracks[0]!] as any })
    
    render(<SetDetailView setId="s1" onBack={() => {}} />)
    
    expect(screen.getByText(/No candidates found to fit the remaining time/i)).toBeDefined()
  })

  it('hides suggestions when goal is met or exceeded', () => {
    useCollectionStore.setState({
      sets: [{ ...mockSet, trackIds: ['t1', 't2'] }], // 120 + 180 = 300s (5min)
    })
    
    render(<SetDetailView setId="s1" onBack={() => {}} />)
    
    expect(screen.queryByText('💡 Suggestions')).toBeNull()
    expect(screen.getByTestId('set-missing').textContent).toContain('0:00')
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    render(<SetDetailView setId="s1" onBack={onBack} />)
    
    fireEvent.click(screen.getByText('← Back'))
    expect(onBack).toHaveBeenCalled()
  })

  it('renders "not found" state correctly', () => {
    render(<SetDetailView setId="non-existent" onBack={() => {}} />)
    expect(screen.getByText('Set not found')).toBeDefined()
  })
})
