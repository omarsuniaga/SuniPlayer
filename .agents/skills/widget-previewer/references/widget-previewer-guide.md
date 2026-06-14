# Flutter Widget Previewer - Complete Reference

Source: https://docs.flutter.dev/tools/widget-previewer

## Overview

The Flutter Widget Previewer allows you to see widgets render in real-time, separate from a full app, in the Chrome browser.

**Version Requirements:**
- Flutter 3.35+ for basic functionality
- Flutter 3.38+ for IDE support

**Status:** Experimental feature on Flutter stable channel. APIs are not stable and will change.

## Opening the Previewer

### IDEs (Automatic in Flutter 3.38+)

**Android Studio / IntelliJ:**
- Open the "Flutter Widget Preview" tab in the sidebar

**Visual Studio Code:**
- Open the "Flutter Widget Preview" tab in the sidebar

### Command Line

```bash
flutter widget-preview start
```

Launches a local server and opens Chrome with the Widget Preview environment.

## Preview Annotations

### @Preview Annotation

Defined in `package:flutter/widget_previews.dart`

**Valid Targets:**
1. Top-level functions returning `Widget` or `WidgetBuilder`
2. Static methods within a class returning `Widget` or `WidgetBuilder`
3. Public Widget constructors and factories with no required arguments

**Basic Example:**
```dart
import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';

@Preview(name: 'My Sample Text')
Widget mySampleText() {
  return const Text('Hello, World!');
}
```

### Preview Controls

From left to right:
1. **Zoom in** - Magnify widget
2. **Zoom out** - Reduce magnification
3. **Reset zoom** - Return to default
4. **Toggle light/dark mode** - Switch theme
5. **Hot restart** - Restart individual preview

Global hot restart available at bottom right for state changes.

## Preview Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `String` | Descriptive name |
| `group` | `String` | Group for organization |
| `size` | `Size` | Artificial constraints |
| `textScaleFactor` | `double` | Font scale |
| `wrapper` | `Widget Function(Widget)` | Widget tree wrapper |
| `theme` | `PreviewThemeData Function()` | Theming data |
| `brightness` | `Brightness` | Initial brightness |
| `localizations` | `Function` | Localization config |

## Custom Preview Annotations

Extend `Preview` to reduce boilerplate:

```dart
final class MyCustomPreview extends Preview {
  const MyCustomPreview({
    super.name,
    super.group,
    super.size,
    super.textScaleFactor,
    super.wrapper,
    super.brightness,
    super.localizations,
  }) : super(theme: MyCustomPreview.themeBuilder);

  static PreviewThemeData themeBuilder() {
    return PreviewThemeData(
      materialLight: ThemeData.light(),
      materialDark: ThemeData.dark(),
    );
  }
}
```

### Runtime Transformations

Override `transform()` for modifications:

```dart
final class TransformativePreview extends Preview {
  const TransformativePreview({
    super.name,
    super.group,
    super.size,
    super.textScaleFactor,
    super.wrapper,
    super.brightness,
    super.localizations,
  });

  PreviewThemeData _themeBuilder() {
    return PreviewThemeData(
      materialLight: ThemeData.light(),
      materialDark: ThemeData.dark(),
    );
  }

  @override
  Preview transform() {
    final originalPreview = super.transform();
    final builder = originalPreview.toBuilder();
    builder
      ..name = 'Transformed - ${originalPreview.name}'
      ..theme = _themeBuilder;
    return builder.toPreview();
  }
}
```

## Multiple Previews

### Multiple Annotations

```dart
@Preview(
  group: 'Brightness',
  name: 'Example - light',
  brightness: Brightness.light,
)
@Preview(
  group: 'Brightness',
  name: 'Example - dark',
  brightness: Brightness.dark,
)
Widget buttonPreview() => const ButtonShowcase();
```

### MultiPreview Class

```dart
final class MultiBrightnessPreview extends MultiPreview {
  const MultiBrightnessPreview();

  @override
  List<Preview> get previews => const [
    Preview(
      group: 'Brightness',
      name: 'Example - light',
      brightness: Brightness.light,
    ),
    Preview(
      group: 'Brightness',
      name: 'Example - dark',
      brightness: Brightness.dark,
    ),
  ];
}

@MultiBrightnessPreview()
Widget buttonPreview() => const ButtonShowcase();
```

### MultiPreview with Transform

```dart
final class MultiBrightnessPreview extends MultiPreview {
  const MultiBrightnessPreview({required this.name});

  final String name;

  @override
  List<Preview> get previews => const [
    Preview(brightness: Brightness.light),
    Preview(brightness: Brightness.dark),
  ];

  @override
  List<Preview> transform() {
    final previews = super.transform();
    return previews.map((preview) {
      final builder = preview.toBuilder()
        ..group = 'Brightness'
        ..name = '$name - ${preview.brightness!.name}';
      return builder.toPreview();
    }).toList();
  }
}

@MultiBrightnessPreview(name: 'Example')
Widget buttonPreview() => const ButtonShowcase();
```

## IDE Features

### File Filtering

Previewer filters by currently selected file. Toggle at bottom left to disable.

## Restrictions

### Callback Requirements
- Must be **public** and **constant**
- Required for code generation

### Unsupported APIs

| API | Behavior |
|-----|----------|
| Native plugins | Not supported (web-based) |
| `dart:io` | Throws exceptions |
| `dart:ffi` | Widgets fail to load |

**Transitive dependencies:**
- `dart:io` - Widgets load, APIs throw
- `dart:ffi` - Widgets fail completely

**Workaround - Conditional Imports:**
```dart
import 'my_api_stub.dart'
    if (dart.library.io) 'my_api_io.dart'
    if (dart.library.html) 'my_api_web.dart';
```

### Asset Paths

Use package-based paths:
```dart
'packages/my_package_name/assets/my_image.png'
```

### Unconstrained Widgets

Auto-constrained to ~50% of previewer size. Use explicit `size` parameter.

### Multi-Project

Single project/workspace only. Multi-project IDE sessions not supported.

## API Reference

- [Preview class](https://api.flutter.dev/flutter/widget_previews/Preview-class.html)
- [MultiPreview class](https://api.flutter.dev/flutter/widget_previews/MultiPreview-class.html)
- [Preview.transform()](https://api.flutter.dev/flutter/widget_previews/Preview/transform.html)
- [MultiPreview.transform()](https://api.flutter.dev/flutter/widget_previews/MultiPreview/transform.html)

## Related Issues

- dart:ffi support: [#166431](https://github.com/flutter/flutter/issues/166431)
- Multi-project support: [#173550](https://github.com/flutter/flutter/issues/173550)
