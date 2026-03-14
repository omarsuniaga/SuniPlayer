# 05 — File Access: Audio Files on iOS

## Two categories of files

| Category | Web | iOS |
|---|---|---|
| Catalog tracks | Served by Vite dev server `/audio/*.mp3` | Bundled in `.app/Resources/audio/` |
| User-imported | `blob:` URL from File API | Copied to `Documents/audio/` directory |

## Interface Contract

```typescript
interface IFileAccess {
    checkExists(filePath: string): Promise<boolean>;
    resolveURL(filePath: string): string;
    importFile(source: FileSource): Promise<ImportedFile | null>;
}
```

## iOS Swift Implementation

```swift
import UIKit

class NativeFileAccess: NSObject, UIDocumentPickerDelegate {
    private let fm = FileManager.default

    var documentsURL: URL {
        fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("audio")
    }

    func checkExists(_ filePath: String) async -> Bool {
        // First check app bundle (catalog tracks)
        if Bundle.main.url(forResource: filePath, withExtension: nil) != nil {
            return true
        }
        // Then check Documents/audio/ (user-imported)
        return fm.fileExists(atPath: documentsURL.appendingPathComponent(filePath).path)
    }

    func resolveURL(_ filePath: String) -> URL {
        // Catalog track
        if let bundleURL = Bundle.main.url(forResource: filePath, withExtension: nil) {
            return bundleURL
        }
        // User-imported track
        return documentsURL.appendingPathComponent(filePath)
    }

    func importFile() -> URL? {
        // Present UIDocumentPickerViewController
        // Return file:// URL after copying to Documents/audio/
        // (Implement as async/await with continuation)
    }
}
```

## Catalog Track Packaging

Place MP3 files in the Xcode project under:
```
SuniPlayer.app/
  Resources/
    audio/
      I Just Might in JAZZ style.mp3
      Just The Way You Are.mp3
      ...
```

In Xcode: Add files to target → "Copy Bundle Resources".

## User-Imported File Flow

```
User taps Import
    ↓
UIDocumentPickerViewController (shows Files app)
    ↓
User selects .mp3 file
    ↓
Copy to Documents/audio/<original-filename>
    ↓
Save file_path to useLibraryStore (via AsyncStorage/UserDefaults)
    ↓
resolveURL(file_path) → file:// URI for AVAudioPlayer
```
