# Platform-Specific Guidance: Android & Linux Desktop

This guide provides platform-specific implementation details for Material 3 Expressive on Android and Linux Desktop platforms.


## Table of Contents

- [Android Platform Integration](#android-platform-integration)
  - [Dynamic Color](#dynamic-color)
  - [Android 16 Integration](#android-16-integration)
  - [System UI Integration](#system-ui-integration)
  - [Platform Behaviors](#platform-behaviors)
  - [Performance Considerations](#performance-considerations)
- [Linux Desktop Integration](#linux-desktop-integration)
  - [Overview](#overview)
  - [Keyboard Navigation](#keyboard-navigation)
  - [Mouse Interactions](#mouse-interactions)
  - [Window Management](#window-management)
  - [Desktop Theming](#desktop-theming)
  - [Desktop-Specific Components](#desktop-specific-components)
  - [Platform Conventions](#platform-conventions)
  - [Performance on Linux](#performance-on-linux)
- [Shared Platform Considerations](#shared-platform-considerations)
  - [Cross-Platform Design](#cross-platform-design)
  - [Adaptive Layouts](#adaptive-layouts)
  - [Testing Matrix](#testing-matrix)
- [Implementation Checklist](#implementation-checklist)
  - [Android](#android)
  - [Linux Desktop](#linux-desktop)
  - [Cross-Platform](#cross-platform)

## Android Platform Integration

### Dynamic Color

#### Overview

Dynamic color is a core feature of Material You (Android 12+) that extracts color palettes from the user's wallpaper and applies them to the app interface.

#### Requirements

| Requirement             | Specification           | Notes                  |
| ----------------------- | ----------------------- | ---------------------- |
| Minimum Android version | Android 12 (API 31)     | For dynamic color      |
| Flutter SDK             | 3.0+                    | For Material 3 support |
| Dependencies            | `dynamic_color` package | For color extraction   |

#### Implementation

```dart
import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';

class MyApp extends StatelessWidget {
  // Define brand seed
  static const _brandSeedColor = Color(0xFF006C45);

  @override
  Widget build(BuildContext context) {
    return DynamicColorBuilder(
      builder: (ColorScheme? lightDynamic, ColorScheme? darkDynamic) {
        // Converge brand sensibility with user settings
        final ColorScheme lightScheme = _harmonize(lightDynamic, Brightness.light);
        final ColorScheme darkScheme = _harmonize(darkDynamic, Brightness.dark);

        return MaterialApp(
          theme: ThemeData(
            colorScheme: lightScheme,
            useMaterial3: true,
            extensions: [
              BrandStyles.setup(lightScheme),
            ],
          ),
          darkTheme: ThemeData(
            colorScheme: darkScheme,
            useMaterial3: true,
            extensions: [
              BrandStyles.setup(darkScheme),
            ],
          ),
          home: MyHomePage(),
        );
      },
    );
  }

  ColorScheme _harmonize(ColorScheme? dynamic, Brightness brightness) {
    if (dynamic != null) {
      // Automatic harmonization: Blends brand seed with dynamic wallpaper color
      return dynamic.harmonized(); 
    }
    // Fallback to brand seed
    return ColorScheme.fromSeed(
      seedColor: _brandSeedColor,
      brightness: brightness,
    );
  }
}

/// Custom Brand Parameters via ThemeExtension
class BrandStyles extends ThemeExtension<BrandStyles> {
  final Color brandGlow;
  final double surfaceOpacity;

  const BrandStyles({
    required this.brandGlow,
    required this.surfaceOpacity,
  });

  // Factory to adapt brand styles to the current color scheme
  factory BrandStyles.setup(ColorScheme scheme) {
    return BrandStyles(
      // Harmonize custom brand glow with dynamic primary
      brandGlow: scheme.primary.withOpacity(0.12),
      surfaceOpacity: 0.8,
    );
  }

  @override
  BrandStyles copyWith({Color? brandGlow, double? surfaceOpacity}) {
    return BrandStyles(
      brandGlow: brandGlow ?? this.brandGlow,
      surfaceOpacity: surfaceOpacity ?? this.surfaceOpacity,
    );
  }

  @override
  BrandStyles lerp(ThemeExtension<BrandStyles>? other, double t) {
    if (other is! BrandStyles) return this;
    return BrandStyles(
      brandGlow: Color.lerp(brandGlow, other.brandGlow, t)!,
      surfaceOpacity: lerpDouble(surfaceOpacity, other.surfaceOpacity, t)!,
    );
  }
}
```

#### Color Harmonization and Automatic Adjustments

When dynamic color is enabled, the system automatically handles contrast and legibility. For custom brand colors that must persist, use `harmonizeWith`:

```dart
// Harmonize a specific brand accent color with the dynamic primary
final brandAccent = Color(0xFFE91E63).harmonizeWith(dynamicScheme.primary);
```

### Android 16 Integration

#### Overview

Android 16 introduces enhanced M3 Expressive integration with the system UI.

#### Material You Expressive Features

| Feature       | Android 16          | M3 Expressive          |
| ------------- | ------------------- | ---------------------- |
| Dynamic color | Enhanced extraction | Full integration       |
| System UI     | Expressive theming  | Component alignment    |
| Gestures      | Native support      | M3 Expressive patterns |

#### Implementation Notes

```dart
// Check Android version
final int sdkVersion = Platform.operatingSystemVersion;

// Apply version-specific adaptations
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
  // Android 16+ specific M3 Expressive features
}
```

### System UI Integration

#### Status Bar

| Property       | Standard M3   | M3 Expressive                |
| -------------- | ------------- | ---------------------------- |
| Color          | Surface color | Surface color with elevation |
| Icon theme     | Automatic     | Follows color scheme         |
| Navigation bar | Transparent   | Transparent with safe areas  |

#### Navigation Gestures

| Feature             | Implementation       | Consideration       |
| ------------------- | -------------------- | ------------------- |
| Gesture navigation  | Full screen          | Respect safe areas  |
| 3-button navigation | Bottom area reserved | Adapt layouts       |
| Edge-to-edge        | Immersive mode       | Apply system insets |

### Platform Behaviors

#### Material Ripple

The standard Material ripple is available across all Android versions:

```dart
// Automatic ripple with Material
ElevatedButton(
  onPressed: () {},
  child: Text('Button'),
)
```

#### Elevation Shadows

| Elevation | Shadow           | Usage         |
| --------- | ---------------- | ------------- |
| 1dp       | Subtle shadow    | Cards         |
| 2dp       | Light shadow     | Raised cards  |
| 4dp       | Medium shadow    | FABs          |
| 8dp       | Prominent shadow | Dialogs       |
| 12dp      | Heavy shadow     | Bottom sheets |

### Performance Considerations

| Metric       | Target | Optimization        |
| ------------ | ------ | ------------------- |
| Frame rate   | 60fps  | Optimize animations |
| Startup time | <2s    | Lazy loading        |
| Memory       | <100MB | Resource management |

## Linux Desktop Integration

### Overview

Linux desktop support requires platform-specific adaptations for keyboard navigation, mouse interactions, and window management.

### Keyboard Navigation

#### Focus Management

| Element     | Focus Behavior                   | Implementation            |
| ----------- | -------------------------------- | ------------------------- |
| Buttons     | Tab to reach, Enter to activate  | `FocusableActionDetector` |
| Text fields | Tab to reach, full editing       | `TextField` with focus    |
| Cards       | Tab to focus container           | Custom semantics          |
| Lists       | Tab to reach, arrows to navigate | `ListView` with focus     |

#### Keyboard Shortcuts

| Action           | Shortcut      | Implementation          |
| ---------------- | ------------- | ----------------------- |
| Activate         | Enter / Space | Default button behavior |
| Cancel           | Escape        | Dialog dismissal        |
| Navigate back    | Alt+Left      | Navigation              |
| Navigate forward | Alt+Right     | Navigation              |
| Menu             | Alt / F10     | Menu activation         |

### Mouse Interactions

#### Hover States

| Component       | Hover Effect         | Implementation           |
| --------------- | -------------------- | ------------------------ |
| Button          | Slight elevation     | `InkWell` with highlight |
| Card            | Border highlight     | Custom decoration        |
| FAB             | Scale up             | Animated container       |
| Navigation item | Background highlight | `InkResponse`            |

#### Scroll Behavior

| Context           | Behavior      | Implementation     |
| ----------------- | ------------- | ------------------ |
| Vertical scroll   | Standard      | `ScrollController` |
| Horizontal scroll | Standard      | `ScrollController` |
| Nested scroll     | Coordinated   | `NestedScrollView` |
| Custom scroll     | Physics-based | `ScrollPhysics`    |

### Window Management

#### Window Size Classes

| Class    | Width     | Token                   | Usage           |
| -------- | --------- | ----------------------- | --------------- |
| Compact  | 0-599dp   | `window-class-compact`  | Mobile layouts  |
| Medium   | 600-839dp | `window-class-medium`   | Tablet layouts  |
| Expanded | 840dp+    | `window-class-expanded` | Desktop layouts |

#### Window Controls

| Control  | Behavior          | Position  |
| -------- | ----------------- | --------- |
| Minimize | Hide window       | Title bar |
| Maximize | Expand to full    | Title bar |
| Close    | Close application | Title bar |

### Desktop Theming

#### System Theme Integration

| Theme         | Consideration        | Implementation                              |
| ------------- | -------------------- | ------------------------------------------- |
| Dark mode     | Follow system        | `MediaQuery.of(context).platformBrightness` |
| High contrast | Adapt colors         | Theme data override                         |
| Custom GTK    | May affect rendering | Test with themes                            |

#### DPI Scaling

| DPI Range | Scale Factor | Consideration |
| --------- | ------------ | ------------- |
| 96-120    | 1.0-1.25     | Standard      |
| 120-144   | 1.25-1.5     | Tablet        |
| 144-192   | 1.5-2.0      | High DPI      |
| 192+      | 2.0+         | Very high DPI |

### Desktop-Specific Components

#### Menu Bar

| Component     | Usage            | Implementation   |
| ------------- | ---------------- | ---------------- |
| Menu bar      | Application menu | `MenuBar` widget |
| Context menu  | Right-click menu | `RawMenu`        |
| Dropdown menu | Selection menu   | `DropdownButton` |

#### Dialogs

| Type          | Behavior     | Modal |
| ------------- | ------------ | ----- |
| Alert dialog  | Blocking     | Yes   |
| Simple dialog | Blocking     | Yes   |
| Bottom sheet  | Non-blocking | No    |
| Toast         | Non-blocking | No    |

### Platform Conventions

#### Linux Desktop Standards

| Convention      | Implementation   | Notes                 |
| --------------- | ---------------- | --------------------- |
| Alt+ mnemonic   | Menu access      | Standard GTK behavior |
| Tab traversal   | Focus order      | Logical navigation    |
| Right-click     | Context menu     | Standard behavior     |
| Middle-click    | Paste selection  | X11 behavior          |
| Window snapping | Grid positioning | Optional feature      |

### Performance on Linux

| Metric        | Target | Optimization        |
| ------------- | ------ | ------------------- |
| Startup time  | <2s    | Lazy initialization |
| Memory        | <200MB | Resource management |
| Frame rate    | 60fps  | GPU rendering       |
| Window resize | Smooth | Responsive layouts  |

## Shared Platform Considerations

### Cross-Platform Design

| Aspect      | Android            | Linux Desktop   | Solution            |
| ----------- | ------------------ | --------------- | ------------------- |
| Navigation  | Gestures           | Keyboard/mouse  | Adaptive patterns   |
| Sizing      | DP-based           | DPI-scaled      | Responsive layouts  |
| Orientation | Portrait/landscape | Fixed landscape | Adaptive layouts    |
| Input       | Touch              | Keyboard/mouse  | Multi-input support |

### Adaptive Layouts

#### Breakpoints

| Breakpoint | Width     | Layout        | Token             |
| ---------- | --------- | ------------- | ----------------- |
| Compact    | <600dp    | Single column | `layout-compact`  |
| Medium     | 600-839dp | Two column    | `layout-medium`   |
| Expanded   | 840dp+    | Multi column  | `layout-expanded` |

#### Responsive Patterns

| Pattern    | Compact       | Medium     | Expanded      |
| ---------- | ------------- | ---------- | ------------- |
| Navigation | Bottom nav    | Rail + nav | Drawer + rail |
| Lists      | Single column | Two column | Three column  |
| Cards      | Stacked       | Grid       | Masonry       |

### Testing Matrix

#### Android Testing

| Test Case     | Phone          | Tablet         | Foldable       |
| ------------- | -------------- | -------------- | -------------- |
| Portrait      | Required       | Recommended    | Required       |
| Landscape     | Required       | Required       | Required       |
| Dark mode     | Required       | Required       | Required       |
| Dynamic color | Required (12+) | Required (12+) | Required (12+) |
| Gestures      | Required       | Required       | Required       |

#### Linux Desktop Testing

| Test Case    | Laptop      | Desktop     | HiDPI    |
| ------------ | ----------- | ----------- | -------- |
| 100% scale   | Required    | Required    | N/A      |
| 125% scale   | Recommended | Recommended | N/A      |
| 150% scale   | N/A         | Recommended | Required |
| 200% scale   | N/A         | N/A         | Required |
| Keyboard nav | Required    | Required    | Required |
| Mouse hover  | Required    | Required    | Required |

## Implementation Checklist

### Android

- [ ] Dynamic color integration
- [ ] Android 16 compatibility
- [ ] System UI integration
- [ ] Gesture navigation support
- [ ] Status bar theming
- [ ] Safe area handling
- [ ] Performance optimized
- [ ] Dark mode support

### Linux Desktop

- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Mouse hover states
- [ ] Window size classes
- [ ] DPI scaling
- [ ] Menu bar integration
- [ ] Dialog patterns
- [ ] Desktop conventions
- [ ] Performance optimized

### Cross-Platform

- [ ] Adaptive layouts
- [ ] Breakpoint handling
- [ ] Input adaptability
- [ ] Theme consistency
- [ ] Testing on all platforms
