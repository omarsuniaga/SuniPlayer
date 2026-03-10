# Expressive Color System

The Expressive color system extends standard Material 3 with expanded tonal palettes, container color tiers, and emotional color selection guidelines.


## Table of Contents

- [Color Philosophy](#color-philosophy)
- [Color Roles and Tokens](#color-roles-and-tokens)
  - [Primary Color Roles](#primary-color-roles)
  - [Secondary Color Roles](#secondary-color-roles)
  - [Tertiary Color Roles](#tertiary-color-roles)
  - [Error Color Roles](#error-color-roles)
  - [Surface Color Roles](#surface-color-roles)
  - [Surface Variant Roles](#surface-variant-roles)
  - [Inverse Roles](#inverse-roles)
- [Container Color Tiers](#container-color-tiers)
  - [Primary Container](#primary-container)
  - [Secondary Container](#secondary-container)
  - [Tertiary Container](#tertiary-container)
  - [Error Container](#error-container)
- [Surface Container Hierarchy](#surface-container-hierarchy)
  - [Level Specifications](#level-specifications)
- [Contrast Requirements](#contrast-requirements)
  - [Minimum Standards](#minimum-standards)
  - [Implementation Guidelines](#implementation-guidelines)
- [Expressive Color Selection](#expressive-color-selection)
  - [Emotional Color Guidelines](#emotional-color-guidelines)
  - [Color Application by Context](#color-application-by-context)
- [Dynamic Color Integration](#dynamic-color-integration)
  - [Harmonization and Convergence](#harmonization-and-convergence)
  - [Systematic Application of Brand Parameters](#systematic-application-of-brand-parameters)
  - [Automatic System Adjustments](#automatic-system-adjustments)
- [Platform-Specific Notes](#platform-specific-notes)
  - [Android](#android)
  - [Linux Desktop](#linux-desktop)
- [Color Token Values](#color-token-values)
  - [Light Theme Values (Reference)](#light-theme-values-reference)
  - [Dark Theme Values (Reference)](#dark-theme-values-reference)
- [Testing Checklist](#testing-checklist)

## Color Philosophy

Expressive color goes beyond functional differentiation to evoke emotions and create visually engaging experiences. The color system supports both aesthetic appeal and usability through carefully designed contrast relationships.

## Color Roles and Tokens

### Primary Color Roles

| Role                 | Token                               | Description                                |
| -------------------- | ----------------------------------- | ------------------------------------------ |
| Primary              | `md.sys.color.primary`              | Main brand color, key interactive elements |
| On Primary           | `md.sys.color.on-primary`           | Text/icons on primary color                |
| Primary Container    | `md.sys.color.primary-container`    | Background for elevated primary elements   |
| On Primary Container | `md.sys.color.on-primary-container` | Text/icons on primary container            |

### Secondary Color Roles

| Role                   | Token                                 | Description                       |
| ---------------------- | ------------------------------------- | --------------------------------- |
| Secondary              | `md.sys.color.secondary`              | Secondary accent color            |
| On Secondary           | `md.sys.color.on-secondary`           | Text/icons on secondary color     |
| Secondary Container    | `md.sys.color.secondary-container`    | Background for secondary elements |
| On Secondary Container | `md.sys.color.on-secondary-container` | Text/icons on secondary container |

### Tertiary Color Roles

| Role                  | Token                                | Description                      |
| --------------------- | ------------------------------------ | -------------------------------- |
| Tertiary              | `md.sys.color.tertiary`              | Tertiary accent for variety      |
| On Tertiary           | `md.sys.color.on-tertiary`           | Text/icons on tertiary color     |
| Tertiary Container    | `md.sys.color.tertiary-container`    | Background for tertiary elements |
| On Tertiary Container | `md.sys.color.on-tertiary-container` | Text/icons on tertiary container |

### Error Color Roles

| Role               | Token                             | Description                   |
| ------------------ | --------------------------------- | ----------------------------- |
| Error              | `md.sys.color.error`              | Error states and alerts       |
| On Error           | `md.sys.color.on-error`           | Text/icons on error color     |
| Error Container    | `md.sys.color.error-container`    | Background for error elements |
| On Error Container | `md.sys.color.on-error-container` | Text/icons on error container |

### Surface Color Roles

| Role                      | Token                                    | Description               |
| ------------------------- | ---------------------------------------- | ------------------------- |
| Surface                   | `md.sys.color.surface`                   | Main background surface   |
| Surface Dim               | `md.sys.color.surface-dim`               | Lower contrast surface    |
| Surface Bright            | `md.sys.color.surface-bright`            | Higher contrast surface   |
| Surface Container Lowest  | `md.sys.color.surface-container-lowest`  | Lowest elevation surface  |
| Surface Container Low     | `md.sys.color.surface-container-low`     | Low elevation surface     |
| Surface Container         | `md.sys.color.surface-container`         | Default container surface |
| Surface Container High    | `md.sys.color.surface-container-high`    | High elevation surface    |
| Surface Container Highest | `md.sys.color.surface-container-highest` | Highest elevation surface |

### Surface Variant Roles

| Role               | Token                             | Description                   |
| ------------------ | --------------------------------- | ----------------------------- |
| Surface Variant    | `md.sys.color.surface-variant`    | Secondary surface color       |
| On Surface Variant | `md.sys.color.on-surface-variant` | Text/icons on surface variant |
| Outline            | `md.sys.color.outline`            | Border and divider color      |
| Outline Variant    | `md.sys.color.outline-variant`    | Subtle border color           |

### Inverse Roles

| Role               | Token                             | Description                       |
| ------------------ | --------------------------------- | --------------------------------- |
| Inverse Surface    | `md.sys.color.inverse-surface`    | Surface for inverse theming       |
| Inverse On Surface | `md.sys.color.inverse-on-surface` | Text/icons on inverse surface     |
| Inverse Primary    | `md.sys.color.inverse-primary`    | Primary color for inverse theming |

## Container Color Tiers

M3 Expressive uses container colors to create visual hierarchy and emphasis.

### Primary Container

- **Purpose**: Background for elevated primary elements
- **Usage**: Selected states, emphasized content
- **Token**: `md.sys.color.primary-container`
- **On variant**: `md.sys.color.on-primary-container`

### Secondary Container

- **Purpose**: Background for secondary interactive elements
- **Usage**: Alternative actions, supporting content
- **Token**: `md.sys.color.secondary-container`
- **On variant**: `md.sys.color.on-secondary-container`

### Tertiary Container

- **Purpose**: Background for tertiary content
- **Usage**: Accent sections, variety
- **Token**: `md.sys.color.tertiary-container`
- **On variant**: `md.sys.color.on-tertiary-container`

### Error Container

- **Purpose**: Background for error messages
- **Usage**: Alert backgrounds, form validation
- **Token**: `md.sys.color.error-container`
- **On variant**: `md.sys.color.on-error-container`

## Surface Container Hierarchy

The surface container system provides five levels of elevation through tonal variation:

### Level Specifications

| Level   | Token                       | Usage                                |
| ------- | --------------------------- | ------------------------------------ |
| Lowest  | `surface-container-lowest`  | Deepest background (modals, dialogs) |
| Low     | `surface-container-low`     | Card backgrounds, elevated content   |
| Default | `surface-container`         | Default surface level                |
| High    | `surface-container-high`    | Popups, tooltips                     |
| Highest | `surface-container-highest` | Top-level surfaces, navigation       |

## Contrast Requirements

### Minimum Standards

| Context        | Ratio | Level |
| -------------- | ----- | ----- |
| Normal text    | 4.5:1 | AA    |
| Large text     | 3:1   | AA    |
| UI components  | 3:1   | AA    |
| Preferred text | 7:1   | AAA   |
| Preferred UI   | 4.5:1 | AAA   |

### Implementation Guidelines

- Always ensure primary text meets 4.5:1 minimum
- Large headings (18pt+) can use 3:1 ratio
- Critical interactive elements should exceed minimums
- Test with color blindness simulators

## Expressive Color Selection

### Emotional Color Guidelines

| Emotion      | Recommended Colors                   |
| ------------ | ------------------------------------ |
| Energetic    | Vibrant oranges, yellows, reds       |
| Calming      | Soft blues, greens, lavenders        |
| Playful      | Bright primaries, saturation variety |
| Professional | Subtle neutrals, muted accents       |
| Warm         | Peach, coral, warm browns            |
| Cool         | Blue, teal, silver tones             |

### Color Application by Context

| Context           | Approach                                  |
| ----------------- | ----------------------------------------- |
| Primary actions   | High contrast against surface             |
| Secondary actions | Secondary or tertiary colors              |
| Backgrounds       | Lower saturation, higher lightness        |
| Emphasis          | Container colors with contrast            |
| Status            | Semantic colors (error, warning, success) |

## Dynamic Color Integration

M3 enables brand colors and user preferences to converge in unique, one-of-a-kind experiences. The color system embraces the need for color to reflect an app’s design sensibility, while also honoring the settings that individuals choose for themselves.

By enabling dynamic color, an app can retain the colors that define and differentiate a product, while also giving users more control over the styles that matter most to them.

**Core principles:**

- Customization creates unique branded products with familiar patterns
- Dynamic color makes personal devices feel personal
- Apps retain brand identity while giving users control over styles
- Product differentiation and user preference work together

### Harmonization and Convergence

When using dynamic color, ensure harmonization with M3 Expressive tokens to merge brand identity with user settings:

- **Brand Anchoring**: Identify critical brand colors (e.g., primary logo colors) that remain constant to maintain product differentiation.
- **Dynamic Harmonization**: Map dynamic primary to `md.sys.color.primary` and generate supporting tonal palettes from the dynamic seed.
- **Emotional Convergence**: Adjust the tonal palette of secondary and tertiary elements to match user settings while maintaining the brand's intended emotional temperature.

### Systematic Application of Brand Parameters

Material 3 supports systematic applications of custom parameters to help define and maintain the styles that convey your brand.

- **Theme Extensions**: Use `ThemeExtension` to define brand-specific tokens that aren't in the standard M3 palette.
- **Brand Consistency**: Maintain specific brand signatures (e.g., unique glows or specific border treatments) that adapt systematically across themes.

### Automatic System Adjustments

The color system automatically handles critical adjustments that provide accessible color contrast, legibility, interaction states, and component structure.

- **Accessible Contrast**: Automatically ensures AA/AAA contrast ratios between text and backgrounds regardless of user-selected colors.
- **Legibility & Tonal Shift**: Dynamically adjusts tones to maintain readability across different brightness levels and color palettes.
- **Interaction States**: Automatically generates interaction states (hover, pressed, focused) from the base dynamic seed.
- **Custom Components**: Dynamic color support extends to custom (non-Material) components, allowing them to integrate seamlessly with the user's environment.

## Platform-Specific Notes

### Android

- Dynamic color available on Android 12+
- Material You colors integrate with M3 Expressive tokens
- System wallpaper affects available dynamic colors

### Linux Desktop

- No dynamic color support
- Use seed-based color generation
- Consider desktop theme integration

## Color Token Values

### Light Theme Values (Reference)

| Token                  | Light Value |
| ---------------------- | ----------- |
| Primary                | #006C45     |
| On Primary             | #FFFFFF     |
| Primary Container      | #A0F6B3     |
| On Primary Container   | #002113     |
| Secondary              | #4F6353     |
| On Secondary           | #FFFFFF     |
| Secondary Container    | #D1E8D3     |
| On Secondary Container | #0C1F13     |
| Tertiary               | #3A6374     |
| On Tertiary            | #FFFFFF     |
| Tertiary Container     | #BFE8FB     |
| On Tertiary Container  | #001F29     |
| Error                  | #BA1A1A     |
| On Error               | #FFFFFF     |
| Error Container        | #FFDAD6     |
| On Error Container     | #410002     |
| Surface                | #FDFDF8     |
| Surface Container Low  | #F2F7F0     |
| Surface Container      | #EAF2E9     |
| Surface Container High | #E5EDE4     |
| On Surface             | #1A1C19     |
| On Surface Variant     | #424940     |
| Outline                | #72796F     |

### Dark Theme Values (Reference)

| Token                  | Dark Value |
| ---------------------- | ---------- |
| Primary                | #73D790    |
| On Primary             | #003921    |
| Primary Container      | #005230    |
| On Primary Container   | #A0F6B3    |
| Secondary              | #B6CCB5    |
| On Secondary           | #213526    |
| Secondary Container    | #384B3C    |
| On Secondary Container | #D1E8D3    |
| Tertiary               | #A2CCDE    |
| On Tertiary            | #013545    |
| Tertiary Container     | #194B5C    |
| On Tertiary Container  | #BFE8FB    |
| Error                  | #FFB4AB    |
| On Error               | #690005    |
| Error Container        | #93000A    |
| On Error Container     | #FFDAD6    |
| Surface                | #12140F    |
| Surface Container Low  | #1A1C19    |
| Surface Container      | #151D15    |
| Surface Container High | #202820    |
| On Surface             | #E3E3DF    |
| On Surface Variant     | #C1C9BF    |
| Outline                | #8B9389    |

## Testing Checklist

- [ ] All text meets contrast requirements
- [ ] Interactive elements have sufficient contrast
- [ ] Container colors create proper hierarchy
- [ ] Dynamic color harmonization works correctly
- [ ] Test with color blindness simulators
- [ ] Verify dark theme contrast ratios
- [ ] Test on target platforms (Android, Linux)
