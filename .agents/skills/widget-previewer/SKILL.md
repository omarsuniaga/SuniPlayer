---
name: widget-previewer
description: Use the Flutter Widget Previewer to preview widgets in isolation with real-time rendering in Chrome. Use when working with Flutter widget previews, @Preview annotations, preview configurations, or widget development workflows. Triggers include setting up widget previewer, adding @Preview annotations, customizing previews, creating custom preview annotations, handling multiple preview configurations, or troubleshooting widget preview issues.
---

# Flutter Widget Previewer

Preview Flutter widgets in real-time, separate from a full app, in the Chrome browser.

## Requirements

- Flutter version 3.35 or higher (for basic functionality)
- Flutter version 3.38 or higher (for IDE support)
- Chrome browser

## Starting the Widget Previewer

### From IDEs (Flutter 3.38+)

IDEs automatically start the Widget Previewer on launch:

**Android Studio / IntelliJ:**
Open the "Flutter Widget Preview" tab in the sidebar

**Visual Studio Code:**
Open the "Flutter Widget Preview" tab in the sidebar

### From Command Line

```bash
flutter widget-preview start
```

This launches a local server and opens Chrome with the Widget Preview environment.

## Basic Preview Usage

Import the preview package and use the `@Preview` annotation:

```dart
import 'package:flutter/widget_previews.dart';
import 'package:flutter/material.dart';

@Preview(name: 'My Sample Text')
Widget mySampleText() {
  return const Text('Hello, World!');
}
```

### Valid @Preview Targets

- **Top-level functions** returning `Widget` or `WidgetBuilder`
- **Static methods** within a class returning `Widget` or `WidgetBuilder`
- **Public Widget constructors and factories** with no required arguments

## Preview Controls

Each preview instance provides controls (left to right):

- **Zoom in:** Magnify the widget
- **Zoom out:** Reduce magnification
- **Reset zoom:** Return to default zoom level
- **Toggle light/dark mode:** Switch theme
- **Hot restart:** Restart only this specific preview

For global state changes, use the hot restart button at the bottom right of the environment.

## Customizing Previews

The `@Preview` annotation accepts these parameters:

| Parameter         | Type       | Description                                           |
| ----------------- | ---------- | ----------------------------------------------------- |
| `name`            | String     | Descriptive name for the preview                      |
| `group`           | String     | Group name to organize related previews               |
| `size`            | Size       | Artificial size constraints                           |
| `textScaleFactor` | double     | Custom font scale                                     |
| `wrapper`         | Function   | Widget tree wrapper (e.g., for InheritedWidget state) |
| `theme`           | Function   | Material/Cupertino theming data provider              |
| `brightness`      | Brightness | Initial theme brightness                              |
| `localizations`   | Function   | Localization configuration                            |

Example with multiple parameters:

```dart
@Preview(
  name: 'Button - Large',
  group: 'Buttons',
  size: Size(200, 100),
  textScaleFactor: 1.5,
  brightness: Brightness.dark,
)
Widget largeButton() => ElevatedButton(
  onPressed: () {},
  child: const Text('Large Button'),
);
```

## Creating Custom Preview Annotations

Extend `Preview` to reduce boilerplate for common configurations:

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

Override `transform()` for runtime preview modifications:

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

## Multiple Preview Configurations

Apply multiple `@Preview` annotations for different configurations:

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

### MultiPreview for Batched Configurations

Extend `MultiPreview` to create custom multi-preview annotations:

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

### MultiPreview with Runtime Transformations

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

## IDE Integration

### Filtering by Selected File

The widget previewer filters previews based on the currently selected file in your IDE. Toggle "Filter previews by selected file" at the bottom left to disable this behavior.

## Restrictions and Limitations

### Callback Requirements

All callback arguments must be **public and constant** for code generation to work.

### Unsupported APIs

- **Native plugins** - Not supported (previewer uses Flutter Web)
- **`dart:io`** - APIs will throw exceptions when invoked
- **`dart:ffi`** - Widgets will fail to load completely

Widgets with transitive `dart:io` dependencies load but throw on API calls. Widgets with transitive `dart:ffi` dependencies fail to load entirely.

**Solution:** Use conditional imports for platform-specific code:

```dart
import 'my_api_stub.dart'
    if (dart.library.io) 'my_api_io.dart'
    if (dart.library.html) 'my_api_web.dart';
```

### Asset Paths

Use **package-based paths** for `fromAsset` APIs:

```dart
// Correct
'packages/my_package_name/assets/my_image.png'

// Incorrect
'assets/my_image.png'
```

### Unconstrained Widgets

Automatically constrained to ~50% of previewer dimensions. Apply explicit `size` parameters for consistent behavior.

### Multi-Project Support

Currently supports only single projects or Pub workspaces. Multi-project IDE sessions are not yet supported.

## Troubleshooting

| Issue                     | Solution                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Widget not appearing      | Verify @Preview annotation is on valid target (top-level function, static method, or public constructor with no required args) |
| dart:io errors            | Use conditional imports to provide web-compatible implementations                                                              |
| dart:ffi errors           | Isolate ffi-dependent code and exclude from preview targets                                                                    |
| Assets not loading        | Use package-based asset paths                                                                                                  |
| IDE not showing previewer | Ensure Flutter 3.38+ and check IDE plugin settings                                                                             |
| Previews not updating     | Try hot restart on individual preview or global hot restart                                                                    |

## References

- [API Documentation](https://api.flutter.dev/flutter/widget_previews/Preview-class.html)
- [Flutter Widget Previewer Guide](references/widget-previewer-guide.md) - Complete documentation reference
