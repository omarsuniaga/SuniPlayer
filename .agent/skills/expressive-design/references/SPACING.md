# Material 3 Expressive Spacing

The M3 Expressive spacing system provides consistent spacing values for layouts, components, and touch targets. Expressive spacing emphasizes hierarchy through generous whitespace while maintaining usability through clear visual organization.


## Table of Contents

- [Spacing Philosophy](#spacing-philosophy)
- [Spacing Tokens](#spacing-tokens)
  - [Spacing Scale](#spacing-scale)
  - [Touch Target Sizes](#touch-target-sizes)
- [Component Spacing](#component-spacing)
  - [Button Spacing](#button-spacing)
  - [List and Card Spacing](#list-and-card-spacing)
  - [Text Spacing](#text-spacing)
  - [Icon Spacing](#icon-spacing)
- [Layout Spacing](#layout-spacing)
  - [Grid Spacing](#grid-spacing)
  - [Screen Margins](#screen-margins)
  - [Section Spacing](#section-spacing)
- [Expressive Spacing](#expressive-spacing)
  - [Generous Spacing for Emphasis](#generous-spacing-for-emphasis)
  - [Spacing for Hierarchy](#spacing-for-hierarchy)
- [Platform-Specific Notes](#platform-specific-notes)
  - [Android](#android)
  - [Linux Desktop](#linux-desktop)
- [Accessibility Requirements](#accessibility-requirements)
  - [Touch Target Spacing](#touch-target-spacing)
  - [Readable Spacing](#readable-spacing)
- [Implementation Guidelines](#implementation-guidelines)
- [Spacing Token Values](#spacing-token-values)
  - [Reference Values](#reference-values)
- [Testing Checklist](#testing-checklist)

## Spacing Philosophy

Expressive spacing uses generous whitespace to create visual breathing room, enhance readability, and communicate hierarchy. The spacing system balances aesthetic appeal with functional requirements for touch targets and component relationships.

## Spacing Tokens

### Spacing Scale

| Level | Token | Value | Usage |
|-------|-------|-------|-------|
| 4xs | `md.sys.spacing.4xs` | 2dp | Tight spacing, inline elements |
| 3xs | `md.sys.spacing.3xs` | 4dp | Compact spacing, chips |
| 2xs | `md.sys.spacing.2xs` | 6dp | Tight component spacing |
| xs | `md.sys.spacing.xs` | 8dp | Small gaps, icon padding |
| sm | `md.sys.spacing.sm` | 12dp | Standard small spacing |
| md | `md.sys.spacing.md` | 16dp | Default spacing |
| lg | `md.sys.spacing.lg` | 24dp | Section spacing |
| xl | `md.sys.spacing.xl` | 32dp | Large section spacing |
| 2xl | `md.sys.spacing.2xl` | 40dp | Major section spacing |
| 3xl | `md.sys.spacing.3xl` | 48dp | Page margins |
| 4xl | `md.sys.spacing.4xl` | 64dp | Large page margins |

### Touch Target Sizes

| Target Type | Minimum Size | Recommended Size | Token |
|-------------|--------------|-------------------|-------|
| Standard touch | 48dp | 56dp | `md.sys.touch-target.standard` |
| Minimum touch | 40dp | 48dp | `md.sys.touch-target.minimum` |
| Emphasized touch | 56dp | 64dp+ | `md.sys.touch-target.emphasized` |
| Critical action | 64dp | 72dp+ | `md.sys.touch-target.critical` |

## Component Spacing

### Button Spacing

| Element | Padding (Vertical) | Padding (Horizontal) | Token |
|---------|-------------------|----------------------|-------|
| Filled button | 10dp | 24dp | `md.sys.button.padding` |
| Elevated button | 10dp | 24dp | `md.sys.button.padding` |
| Outlined button | 10dp | 24dp | `md.sys.button.padding` |
| Text button | 10dp | 16dp | `md.sys.button.padding-text` |
| FAB | 16dp | 16dp | `md.sys.fab.padding` |
| Extended FAB | 16dp | 20dp | `md.sys.fab.padding-extended` |

### List and Card Spacing

| Element | Padding | Gap | Token |
|---------|---------|-----|-------|
| List item | 16dp vertical, 12dp horizontal | 16dp | `md.sys.list.padding` |
| List item (one line) | 12dp vertical, 16dp horizontal | - | `md.sys.list.padding-one-line` |
| Card padding | 16dp | 16dp | `md.sys.card.padding` |
| Card (outlined) | 16dp | 16dp | `md.sys.card.padding-outlined` |
| List divider | - | 8dp above/below | `md.sys.divider.spacing` |

### Text Spacing

| Element | Line Height | Paragraph Spacing | Token |
|---------|-------------|-------------------|-------|
| Body text | 24dp (16sp) | 8dp | `md.sys.typescale.body-line-height` |
| Body text (large) | 28dp (18sp) | 12dp | `md.sys.typescale.body-large-line-height` |
| Heading text | Variable | 16dp | `md.sys.typescale.heading-spacing` |
| Label text | 20dp (14sp) | 4dp | `md.sys.typescale.label-line-height` |

### Icon Spacing

| Context | Size | Padding | Token |
|---------|------|---------|-------|
| Icon button | 24dp | 12dp | `md.sys.icon-button.padding` |
| Icon-only button | 48dp | 12dp | `md.sys.icon-button.padding-icon-only` |
| Leading icon | 24dp | 16dp to text | `md.sys.icon.leading-spacing` |
| Trailing icon | 24dp | 8dp from text | `md.sys.icon.trailing-spacing` |

## Layout Spacing

### Grid Spacing

| Grid Type | Gutter | Margin | Container Padding | Token |
|-----------|--------|--------|-------------------|-------|
| Compact grid | 8dp | 16dp | 16dp | `md.sys.grid.gutter-compact` |
| Medium grid | 16dp | 24dp | 16dp | `md.sys.grid.gutter-medium` |
| Expanded grid | 24dp | 24dp | 24dp | `md.sys.grid.gutter-expanded` |
| Large grid | 32dp | 32dp | 24dp | `md.sys.grid.gutter-large` |

### Screen Margins

| Window Class | Margin | Token |
|--------------|--------|-------|
| Compact (phone) | 16dp | `md.sys.margin-compact` |
| Medium (tablet) | 24dp | `md.sys.margin-medium` |
| Expanded (desktop) | 32dp | `md.sys.margin-expanded` |

### Section Spacing

| Context | Vertical Spacing | Horizontal Spacing | Token |
|---------|------------------|--------------------|-------|
| Between sections | 48dp | - | `md.sys.section-spacing` |
| Within section | 24dp | - | `md.sys.subsection-spacing` |
| Component groups | 16dp | - | `md.sys.component-group-spacing` |

## Expressive Spacing

### Generous Spacing for Emphasis

| Technique | Spacing Increase | Effect |
|-----------|-----------------|--------|
| Increased component gap | +8dp from baseline | Visual breathing room |
| Increased section space | +16dp from baseline | Clearer separation |
| Touch target expansion | +8-16dp from minimum | Emphasis on key actions |
| Container padding | +4-8dp from baseline | Relaxed, comfortable feel |

### Spacing for Hierarchy

| Hierarchy Level | Spacing Multiplier | Example |
|----------------|--------------------|---------|
| Primary | 1.0x baseline | Standard spacing |
| Secondary | 0.75x baseline | Condensed but clear |
| Tertiary | 0.5x baseline | Dense but functional |

## Platform-Specific Notes

### Android

- DP-based spacing for consistency
- Dynamic scaling support
- Platform gesture area awareness
- Status bar and navigation bar considerations

### Linux Desktop

- Window management spacing
- Desktop widget considerations
- Multi-monitor support
- DPI scaling awareness

## Accessibility Requirements

### Touch Target Spacing

| Requirement | Specification | Token |
|-------------|---------------|-------|
| Minimum touch target | 48dp | `md.sys.touch-target.minimum` |
| Spacing between targets | 8dp minimum | `md.sys.touch-target.spacing` |
| Emphasis target | 56dp+ | `md.sys.touch-target.emphasized` |
| Critical action target | 64dp+ | `md.sys.touch-target.critical` |

### Readable Spacing

| Context | Minimum Spacing | Rationale |
|---------|-----------------|-----------|
| Between lines | 4dp (line height spacing) | Readability |
| Between paragraphs | 16dp | Clear separation |
| Text and icon | 8dp | Visual grouping |
| Label and field | 8dp | Association |

## Implementation Guidelines

1. Use consistent spacing scale
2. Apply minimum touch targets (48dp)
3. Increase spacing for emphasis
4. Maintain spacing hierarchy
5. Consider platform conventions
6. Test accessibility compliance

## Spacing Token Values

### Reference Values

| Token | Value | CSS Custom Property |
|-------|-------|---------------------|
| `md.sys.spacing.4xs` | 2dp | `--md-sys-spacing-4xs` |
| `md.sys.spacing.3xs` | 4dp | `--md-sys-spacing-3xs` |
| `md.sys.spacing.2xs` | 6dp | `--md-sys-spacing-2xs` |
| `md.sys.spacing.xs` | 8dp | `--md-sys-spacing-xs` |
| `md.sys.spacing.sm` | 12dp | `--md-sys-spacing-sm` |
| `md.sys.spacing.md` | 16dp | `--md-sys-spacing-md` |
| `md.sys.spacing.lg` | 24dp | `--md-sys-spacing-lg` |
| `md.sys.spacing.xl` | 32dp | `--md-sys-spacing-xl` |
| `md.sys.spacing.2xl` | 40dp | `--md-sys-spacing-2xl` |
| `md.sys.spacing.3xl` | 48dp | `--md-sys-spacing-3xl` |
| `md.sys.spacing.4xl` | 64dp | `--md-sys-spacing-4xl` |

## Testing Checklist

- [ ] Consistent spacing scale application
- [ ] Touch targets meet minimums
- [ ] Hierarchy through spacing is clear
- [ ] Accessibility requirements met
- [ ] Platform conventions followed
- [ ] Tested on target platforms
- [ ] Readability requirements met
