# 03 — Audio Engine: Pitch + Tempo on iOS

## What SuniPlayer requires

- Play MP3/AAC audio files
- Change pitch in real-time (semitones: -12 to +12) WITHOUT changing tempo
- Change tempo in real-time (rate: 0.8 to 1.2) WITHOUT changing pitch
- Position tracking every ~250ms
- Fade in / fade out (volume ramp)
- Crossfade between tracks
- Works in background (iOS background audio mode)

## Interface Contract

```typescript
// src/platform/interfaces/IAudioEngine.ts
interface IAudioEngine {
    load(url: string, options?: AudioLoadOptions): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    seek(positionMs: number): void;
    setPitch(semitones: number): void;   // semitones: -12 to +12
    setTempo(rate: number): void;        // rate: 0.8 to 1.2
    setVolume(volume: number): void;     // 0.0 to 1.0
    onPositionUpdate(cb: (posMs: number) => void): void;
    onEnded(cb: () => void): void;
    onError(cb: (err: Error) => void): void;
    dispose(): void;
}
```

---

## Option A: AVAudioEngine + AVAudioUnitTimePitch (Recommended Start)

### Key Conversion: Semitones → Cents

```
AVAudioUnitTimePitch.pitch uses CENTS, not semitones.
1 semitone = 100 cents

To raise by 2 semitones:  pitchNode.pitch = 200
To lower by 3 semitones:  pitchNode.pitch = -300
To raise 1 tone (2 semitones): pitchNode.pitch = 200
```

### Swift Implementation Skeleton

```swift
import AVFoundation

class NativeAudioEngine {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let pitchNode = AVAudioUnitTimePitch()
    private var audioFile: AVAudioFile?

    init() {
        engine.attach(player)
        engine.attach(pitchNode)
        engine.connect(player, to: pitchNode, format: nil)
        engine.connect(pitchNode, to: engine.mainMixerNode, format: nil)

        // Enable background audio
        try? AVAudioSession.sharedInstance().setCategory(
            .playback, mode: .default
        )
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    func load(url: URL) throws {
        audioFile = try AVAudioFile(forReading: url)
        try engine.start()
    }

    func play() {
        guard let file = audioFile else { return }
        player.scheduleFile(file, at: nil)
        player.play()
    }

    func pause() { player.pause() }

    /// semitones: -12 to +12
    func setPitch(_ semitones: Float) {
        pitchNode.pitch = semitones * 100  // Convert to cents
    }

    /// rate: 0.8 to 1.2
    func setTempo(_ rate: Float) {
        pitchNode.rate = rate
    }

    func setVolume(_ volume: Float) {
        engine.mainMixerNode.outputVolume = volume
    }
}
```

### Quality Profile

| Characteristic | Rating |
|---|---|
| Pitch accuracy | Good (Apple algorithm) |
| Tempo accuracy | Good |
| Latency | Low (native DSP) |
| CPU usage | Low |
| Dependencies | None (built-in iOS) |
| Min iOS version | iOS 8+ |

---

## Option B: SoundTouch C++ (Professional Quality — Same as Web)

SoundTouch is the **exact same library** used in SuniPlayer's web version (via SoundTouchJS).
The C++ core produces identical WSOLA output on iOS.

### Integration Steps

1. Add SoundTouch via Swift Package Manager or CocoaPods:
```
// Package.swift
.package(url: "https://github.com/breakfastquay/rubberband", ...)
// OR use SoundTouch directly:
// https://www.surina.net/soundtouch/
```

2. Create an Objective-C++ wrapper (`SoundTouchBridge.mm`):
```objc
#import "SoundTouchBridge.h"
#import "SoundTouch.h"

@implementation SoundTouchBridge {
    soundtouch::SoundTouch _st;
}

- (void)setPitch:(float)semitones {
    _st.setPitchSemiTones(semitones);
}

- (void)setTempo:(float)rate {
    _st.setTempo(rate);
}

- (void)processBuffer:(float*)input output:(float*)output samples:(int)n {
    _st.putSamples(input, n);
    _st.receiveSamples(output, n);
}
@end
```

3. Feed audio samples through the SoundTouch processor before sending to AVAudioEngine output node.

### Quality Profile

| Characteristic | Rating |
|---|---|
| Pitch accuracy | Excellent (WSOLA — identical to web) |
| Tempo accuracy | Excellent |
| Latency | Low |
| CPU usage | Medium |
| Dependencies | SoundTouch C++ library (~200KB) |
| Min iOS version | iOS 12+ recommended |

---

## Option C: AudioKit (High-Level Framework)

```swift
import AudioKit

let player = AudioPlayer(file: audioFile)
let shifter = TimePitch(player)
shifter.pitch = semitones * 100  // cents
shifter.rate = tempoRate
AudioManager.output = shifter
try AudioManager.start()
```

GitHub: https://github.com/AudioKit/AudioKit
Quality: Very good. Easier than AVAudioEngine. Large community.

---

## Background Audio (Required for Stage Use)

Add to `Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

Configure `AVAudioSession`:
```swift
try AVAudioSession.sharedInstance().setCategory(
    .playback,
    mode: .default,
    options: [.mixWithOthers]  // remove if exclusive audio needed
)
```

---

## Unit Conversion Reference

| Web (SoundTouchJS) | iOS AVAudioEngine | iOS SoundTouch C++ |
|---|---|---|
| `semitones = 2` | `pitchNode.pitch = 200` | `_st.setPitchSemiTones(2)` |
| `tempo = 1.1` | `pitchNode.rate = 1.1` | `_st.setTempo(1.1)` |
| `volume = 0.85` | `mixerNode.outputVolume = 0.85` | N/A (handle in AVAudioEngine) |
