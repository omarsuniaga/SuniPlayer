export type PeakAudioBuffer = Pick<AudioBuffer, 'length' | 'numberOfChannels' | 'getChannelData'>

function assertValidBuckets(buckets: number): void {
  if (!Number.isInteger(buckets) || buckets <= 0) {
    throw new Error('buckets must be a positive integer')
  }
}

export function extractPeaks(audioBuffer: PeakAudioBuffer, buckets: number): number[] {
  assertValidBuckets(buckets)

  if (audioBuffer.length <= 0 || audioBuffer.numberOfChannels <= 0) {
    return []
  }

  const bucketCount = Math.min(buckets, audioBuffer.length)
  const peaks = Array.from({ length: bucketCount }, (_, bucketIndex) => {
    const start = Math.floor((bucketIndex * audioBuffer.length) / bucketCount)
    const end = Math.max(start + 1, Math.floor(((bucketIndex + 1) * audioBuffer.length) / bucketCount))
    let peak = 0

    for (let sampleIndex = start; sampleIndex < end && sampleIndex < audioBuffer.length; sampleIndex += 1) {
      let frameAmplitude = 0

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
        const channelData = audioBuffer.getChannelData(channel)
        frameAmplitude += Math.abs(channelData[sampleIndex] ?? 0)
      }

      peak = Math.max(peak, frameAmplitude / audioBuffer.numberOfChannels)
    }

    return peak
  })

  const maxPeak = Math.max(...peaks)
  if (maxPeak <= 0) return peaks

  return peaks.map((peak) => peak / maxPeak)
}
