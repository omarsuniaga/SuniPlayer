# Expressive Components

The Expressive component specifications provide detailed guidelines for implementing expressive UI elements in Flutter applications. Components use color, shape, size, motion, and containment to create emotionally engaging experiences.


## Table of Contents

- [Button Components](#button-components)
  - [Filled Button](#filled-button)
  - [Elevated Button](#elevated-button)
  - [Tonal Button](#tonal-button)
  - [Outlined Button](#outlined-button)
  - [Text Button](#text-button)
  - [Floating Action Button (FAB)](#floating-action-button-fab)
- [Navigation Components](#navigation-components)
  - [Navigation Bar](#navigation-bar)
  - [Navigation Rail](#navigation-rail)
  - [Navigation Drawer](#navigation-drawer)
- [Surface Components](#surface-components)
  - [Card](#card)
  - [Dialog](#dialog)
  - [Bottom Sheet](#bottom-sheet)
- [Input Components](#input-components)
  - [Text Field](#text-field)
  - [Checkbox](#checkbox)
  - [Radio Button](#radio-button)
  - [Switch](#switch)
  - [Slider](#slider)
- [Progress Indicators](#progress-indicators)
  - [Linear Progress Indicator](#linear-progress-indicator)
  - [Circular Progress Indicator](#circular-progress-indicator)
  - [Loading Button](#loading-button)
- [Selection Components](#selection-components)
  - [Chips](#chips)
  - [Badge](#badge)
- [Feedback Components](#feedback-components)
  - [Snackbars](#snackbars)
  - [Toast](#toast)
- [Component Motion Guidelines](#component-motion-guidelines)
  - [State Change Durations](#state-change-durations)
  - [Animation Patterns](#animation-patterns)
- [Expressive Component Principles](#expressive-component-principles)
  - [1. Size for Emphasis](#1-size-for-emphasis)
  - [2. Color for Hierarchy](#2-color-for-hierarchy)
  - [3. Shape for Personality](#3-shape-for-personality)
  - [4. Motion for Delight](#4-motion-for-delight)
- [Platform-Specific Notes](#platform-specific-notes)
  - [Android](#android)
  - [Linux Desktop](#linux-desktop)
- [Custom Components and Convergence](#custom-components-and-convergence)
- [Testing Checklist](#testing-checklist)

## Button Components

### Filled Button

**Purpose:** Primary action with highest emphasis

| Property           | Value                   | Token                              |
| ------------------ | ----------------------- | ---------------------------------- |
| Height             | 40dp                    | `md.sys.button.height`             |
| Padding horizontal | 24dp                    | `md.sys.button.padding-horizontal` |
| Padding vertical   | 10dp                    | `md.sys.button.padding-vertical`   |
| Border radius      | 20dp (full height half) | `md.sys.shape.corner-full`         |
| Typography         | Label Large             | `md.sys.typescale.label-large`     |
| Font weight        | Medium                  | 500                                |

**Expressiveness:**

- Larger touch targets (56dp minimum)
- Container color with high contrast
- Energetic press animation
- Expressive shape (rounded)

### Elevated Button

**Purpose:** Secondary emphasis with depth

| Property           | Value                   | Token                              |
| ------------------ | ----------------------- | ---------------------------------- |
| Height             | 40dp                    | `md.sys.button.height`             |
| Padding horizontal | 24dp                    | `md.sys.button.padding-horizontal` |
| Padding vertical   | 10dp                    | `md.sys.button.padding-vertical`   |
| Border radius      | 20dp (full height half) | `md.sys.shape.corner-full`         |
| Typography         | Label Large             | `md.sys.typescale.label-large`     |
| Font weight        | Medium                  | 500                                |
| Elevation          | 2dp default, 8dp hover  | `md.sys.elevation.button`          |

**Expressiveness:**

- Subtle elevation for depth
- Energetic lift on press
- Expressive shadow animation

### Tonal Button

**Purpose:** Secondary action with container color

| Property           | Value                   | Token                                 |
| ------------------ | ----------------------- | ------------------------------------- |
| Height             | 40dp                    | `md.sys.button.height`                |
| Padding horizontal | 24dp                    | `md.sys.button.padding-horizontal`    |
| Padding vertical   | 10dp                    | `md.sys.button.padding-vertical`      |
| Border radius      | 20dp (full height half) | `md.sys.shape.corner-full`            |
| Typography         | Label Large             | `md.sys.typescale.label-large`        |
| Font weight        | Medium                  | 500                                   |
| Background         | Secondary container     | `md.sys.color.secondary-container`    |
| Content color      | On secondary container  | `md.sys.color.on-secondary-container` |

### Outlined Button

**Purpose:** Medium emphasis with border

| Property           | Value                   | Token                              |
| ------------------ | ----------------------- | ---------------------------------- |
| Height             | 40dp                    | `md.sys.button.height`             |
| Padding horizontal | 24dp                    | `md.sys.button.padding-horizontal` |
| Padding vertical   | 10dp                    | `md.sys.button.padding-vertical`   |
| Border radius      | 20dp (full height half) | `md.sys.shape.corner-full`         |
| Typography         | Label Large             | `md.sys.typescale.label-large`     |
| Font weight        | Medium                  | 500                                |
| Border width       | 1dp                     | `md.sys.button.outline-width`      |
| Border color       | Outline                 | `md.sys.color.outline`             |

### Text Button

**Purpose:** Low emphasis action

| Property           | Value       | Token                                   |
| ------------------ | ----------- | --------------------------------------- |
| Height             | 40dp        | `md.sys.button.height`                  |
| Padding horizontal | 16dp        | `md.sys.button.text-padding-horizontal` |
| Padding vertical   | 10dp        | `md.sys.button.text-padding-vertical`   |
| Typography         | Label Large | `md.sys.typescale.label-large`          |
| Font weight        | Medium      | 500                                     |

### Floating Action Button (FAB)

**Purpose:** Prominent primary action

| Property        | Value                   | Token                      |
| --------------- | ----------------------- | -------------------------- |
| Size            | 56dp                    | `md.sys.fab.size`          |
| Icon size       | 24dp                    | `md.sys.fab.icon-size`     |
| Container shape | Full (rounded)          | `md.sys.shape.corner-full` |
| Elevation       | 6dp default, 12dp hover | `md.sys.elevation.fab`     |

**Extended FAB:**

| Property           | Value       | Token                                    |
| ------------------ | ----------- | ---------------------------------------- |
| Height             | 56dp        | `md.sys.fab.extended-height`             |
| Padding horizontal | 20dp        | `md.sys.fab.extended-padding-horizontal` |
| Icon padding       | 12dp        | `md.sys.fab.extended-icon-padding`       |
| Typography         | Label Large | `md.sys.typescale.label-large`           |

**Expressiveness:**

- Largest touch target in app
- Container color emphasis
- Energetic expand animation
- Expressive shape (fully rounded)

## Navigation Components

### Navigation Bar

**Purpose:** Primary navigation for mobile

| Property        | Value        | Token                             |
| --------------- | ------------ | --------------------------------- |
| Height          | 80dp         | `md.sys.navigation-bar.height`    |
| Icon size       | 24dp         | `md.sys.navigation-bar.icon-size` |
| Label size      | Label Medium | `md.sys.typescale.label-medium`   |
| Container color | Surface      | `md.sys.color.surface`            |

**Expressiveness:**

- Generous height for emphasis
- Container color for active states
- Expressive spacing between items

### Navigation Rail

**Purpose:** Primary navigation for tablets and desktop

| Property       | Value        | Token                                   |
| -------------- | ------------ | --------------------------------------- |
| Width          | 80dp         | `md.sys.navigation-rail.width`          |
| Expanded width | 250dp        | `md.sys.navigation-rail.width-expanded` |
| Icon size      | 24dp         | `md.sys.navigation-rail.icon-size`      |
| Label size     | Label Medium | `md.sys.typescale.label-medium`         |

### Navigation Drawer

**Purpose:** Secondary navigation with rich content

| Property          | Value  | Token                                      |
| ----------------- | ------ | ------------------------------------------ |
| Width (modal)     | 360dp  | `md.sys.navigation-drawer.width-modal`     |
| Width (permanent) | 360dp  | `md.sys.navigation-drawer.width-permanent` |
| Container shape   | Medium | `md.sys.shape.corner-medium`               |

**Expressiveness:**

- Expressive container colors for sections
- Generous padding for content
- Clear hierarchy through spacing

## Surface Components

### Card

**Purpose:** Content grouping with visual separation

| Property        | Value         | Token                        |
| --------------- | ------------- | ---------------------------- |
| Padding         | 16dp          | `md.sys.card.padding`        |
| Container shape | Medium (12dp) | `md.sys.shape.corner-medium` |
| Elevation       | 1dp           | `md.sys.elevation.card`      |
| Container color | Surface       | `md.sys.color.surface`       |

**Elevated Card:**

| Property        | Value   | Token                            |
| --------------- | ------- | -------------------------------- |
| Elevation       | 2dp     | `md.sys.elevation.card-elevated` |
| Container color | Surface | `md.sys.color.surface`           |

**Expressiveness:**

- Larger radius for emphasis (16dp)
- Container color for elevated states
- Energetic expand on selection

### Dialog

**Purpose:** Focus attention for important actions

| Property        | Value              | Token                             |
| --------------- | ------------------ | --------------------------------- |
| Padding         | 24dp               | `md.sys.dialog.padding`           |
| Container shape | Extra Large (24dp) | `md.sys.shape.corner-extra-large` |
| Container color | Surface            | `md.sys.color.surface`            |
| Elevation       | 6dp                | `md.sys.elevation.dialog`         |

**Expressiveness:**

- Most rounded shape (24dp+)
- Generous padding
- Energetic appear animation

### Bottom Sheet

**Purpose:** Supplementary content from bottom

| Property        | Value                       | Token                                 |
| --------------- | --------------------------- | ------------------------------------- |
| Padding         | 24dp                        | `md.sys.bottom-sheet.padding`         |
| Container shape | Extra Large (24dp) top-only | `md.sys.shape.corner-extra-large-top` |
| Container color | Surface                     | `md.sys.color.surface`                |
| Elevation       | 8dp                         | `md.sys.elevation.bottom-sheet`       |

**Expressiveness:**

- Dramatic top-heavy shape
- Generous content padding
- Expressive slide-up animation

## Input Components

### Text Field

**Purpose:** Text entry with expressive states

| Property             | Value         | Token                                    |
| -------------------- | ------------- | ---------------------------------------- |
| Height               | 56dp          | `md.sys.text-field.height`               |
| Padding horizontal   | 16dp          | `md.sys.text-field.padding-horizontal`   |
| Container shape      | Small (8dp)   | `md.sys.shape.corner-small`              |
| Border width         | 1dp unfocused | `md.sys.text-field.border-width`         |
| Border width focused | 2dp           | `md.sys.text-field.border-width-focused` |

**States:**
| State | Border Color | Container Color |
|-------|--------------|-----------------|
| Default | Outline | Surface variant |
| Focused | Primary | Surface variant |
| Error | Error | Error container |
| Disabled | Outline variant | Surface variant |

### Checkbox

**Purpose:** Multi-selection input

| Property        | Value       | Token                          |
| --------------- | ----------- | ------------------------------ |
| Size            | 24dp        | `md.sys.checkbox.size`         |
| Border width    | 2dp         | `md.sys.checkbox.border-width` |
| Container shape | Small (4dp) | `md.sys.shape.corner-small`    |

### Radio Button

**Purpose:** Single-selection input

| Property           | Value | Token                             |
| ------------------ | ----- | --------------------------------- |
| Size               | 24dp  | `md.sys.radio-button.size`        |
| Outer circle width | 2dp   | `md.sys.radio-button.outer-width` |

### Switch

**Purpose:** Binary toggle with expressive animation

| Property        | Value            | Token                        |
| --------------- | ---------------- | ---------------------------- |
| Track width     | 52dp             | `md.sys.switch.track-width`  |
| Track height    | 32dp             | `md.sys.switch.track-height` |
| Thumb size      | 24dp             | `md.sys.switch.thumb-size`   |
| Container shape | Full (16dp half) | `md.sys.shape.corner-full`   |

**Expressiveness:**

- Energetic snap animation
- Container color for states
- Expressive thumb movement

### Slider

**Purpose:** Value selection input

| Property     | Value | Token                        |
| ------------ | ----- | ---------------------------- |
| Track height | 4dp   | `md.sys.slider.track-height` |
| Thumb size   | 20dp  | `md.sys.slider.thumb-size`   |
| Touch target | 48dp  | `md.sys.slider.touch-target` |

## Progress Indicators

### Linear Progress Indicator

**Purpose:** Linear progress display

| Property        | Value           | Token                                           |
| --------------- | --------------- | ----------------------------------------------- |
| Track height    | 4dp             | `md.sys.progress-indicator.linear-track-height` |
| Track color     | Surface variant | `md.sys.color.surface-variant`                  |
| Indicator color | Primary         | `md.sys.color.primary`                          |

**Expressiveness:**

- Smooth, energetic animation
- Expressive color transitions

### Circular Progress Indicator

**Purpose:** Circular progress display

| Property     | Value           | Token                                             |
| ------------ | --------------- | ------------------------------------------------- |
| Size         | 48dp            | `md.sys.progress-indicator.circular-size`         |
| Stroke width | 4dp             | `md.sys.progress-indicator.circular-stroke-width` |
| Track color  | Surface variant | `md.sys.color.surface-variant`                    |

### Loading Button

**Purpose:** Action button with built-in loading state

| Property     | Value | Token                                |
| ------------ | ----- | ------------------------------------ |
| Icon size    | 24dp  | `md.sys.loading-button.icon-size`    |
| Spinner size | 24dp  | `md.sys.loading-button.spinner-size` |

**Expressiveness:**

- Expressive loading animation
- Smooth state transitions

## Selection Components

### Chips

**Purpose:** Compact selection elements

| Property           | Value             | Token                             |
| ------------------ | ----------------- | --------------------------------- |
| Height             | 32dp              | `md.sys.chip.height`              |
| Container shape    | Extra Small (4dp) | `md.sys.shape.corner-extra-small` |
| Padding horizontal | 12dp              | `md.sys.chip.padding-horizontal`  |
| Typography         | Label Large       | `md.sys.typescale.label-large`    |

**Chip Types:**
| Type | Background Color | Text Color |
|------|-------------------|-------------|
| Input | Surface variant | On surface variant |
| Filter | Primary container | On primary container |
| Action | Transparent | Primary |
| Suggestion | Surface variant | On surface variant |

### Badge

**Purpose:** Status or count indicator

| Property         | Value           | Token                      |
| ---------------- | --------------- | -------------------------- |
| Size             | 16dp            | `md.sys.badge.size`        |
| Container shape  | Full (8dp half) | `md.sys.shape.corner-full` |
| Background color | Error           | `md.sys.color.error`       |

## Feedback Components

### Snackbars

**Purpose:** Temporary feedback messages

| Property           | Value         | Token                                |
| ------------------ | ------------- | ------------------------------------ |
| Padding horizontal | 16dp          | `md.sys.snackbar.padding-horizontal` |
| Padding vertical   | 14dp          | `md.sys.snackbar.padding-vertical`   |
| Container shape    | Medium (12dp) | `md.sys.shape.corner-medium`         |
| Typography         | Body Medium   | `md.sys.typescale.body-medium`       |

**Expressiveness:**

- Container color emphasis
- Energetic appear animation
- Expressive action button

### Toast

**Purpose:** Non-interactive notification

| Property           | Value            | Token                             |
| ------------------ | ---------------- | --------------------------------- |
| Padding horizontal | 24dp             | `md.sys.toast.padding-horizontal` |
| Padding vertical   | 16dp             | `md.sys.toast.padding-vertical`   |
| Container shape    | Full (12dp half) | `md.sys.shape.corner-full`        |

## Component Motion Guidelines

### State Change Durations

| Change Type | Duration | Easing     |
| ----------- | -------- | ---------- |
| Hover       | 150ms    | Standard   |
| Press       | 100ms    | Decelerate |
| Focus       | 150ms    | Standard   |
| Selection   | 200ms    | Expressive |
| Toggle      | 150ms    | Standard   |

### Animation Patterns

| Pattern  | Duration  | Usage              |
| -------- | --------- | ------------------ |
| Scale up | 200-300ms | Selection emphasis |
| Fade in  | 150-200ms | Appearance         |
| Slide up | 300-400ms | Bottom sheets      |
| Ripple   | 400ms     | Touch feedback     |

## Expressive Component Principles

### 1. Size for Emphasis

- Larger touch targets for primary actions
- Expanded containers for critical information
- Generous padding for key content

### 2. Color for Hierarchy

- Container colors for emphasis
- High contrast for primary actions
- Subtle colors for supporting elements

### 3. Shape for Personality

- Expressive radii for key components
- Shape consistency within component families
- Shape variations for functional distinction

### 4. Motion for Delight

- Energetic transitions for primary interactions
- Expressive animations for achievements
- Smooth, natural-feeling state changes

## Platform-Specific Notes

### Android

- Respects system theme and dynamic color
- Platform gesture navigation compatibility
- Material ripple integration
- Native component behaviors

### Linux Desktop

- Desktop interaction patterns
- Keyboard focus indicators
- Hover state considerations
- Window management integration

## Custom Components and Convergence

For components that do not follow standard Material 3 patterns, ensure they "automatically adapt" to the converged design system:

- **Theme Data Access**: Always pull colors from `Theme.of(context).colorScheme`.
- **Systematic Adaptation**: Use `ThemeExtension` to provide brand-specific styling that adapts to dynamic color shifts (see [COLOR.md](COLOR.md#systematic-application-of-brand-parameters)).
- **State Handling**: Utilize `WidgetStateProperty` to ensure custom components automatically reflect the system's interaction states.

## Testing Checklist

- [ ] Consistent token application
- [ ] Expressive elements properly emphasized
- [ ] Motion feels natural and energetic
- [ ] Accessibility requirements met
- [ ] Platform conventions followed
- [ ] Touch targets adequate
- [ ] Color contrast requirements met
