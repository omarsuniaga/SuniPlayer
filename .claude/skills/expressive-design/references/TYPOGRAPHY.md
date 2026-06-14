# Material 3 Expressive Typography

The M3 Expressive typography system provides a comprehensive set of type scales with exact specifications for font size, line height, and letter spacing. Expressive typography emphasizes hierarchy through size, weight, and treatment variations.


## Table of Contents

- [Typography Philosophy](#typography-philosophy)
- [Type Scale Overview](#type-scale-overview)
- [Display Styles](#display-styles)
  - [Display Large](#display-large)
  - [Display Medium](#display-medium)
  - [Display Small](#display-small)
- [Headline Styles](#headline-styles)
  - [Headline Large](#headline-large)
  - [Headline Medium](#headline-medium)
  - [Headline Small](#headline-small)
- [Title Styles](#title-styles)
  - [Title Large](#title-large)
  - [Title Medium](#title-medium)
  - [Title Small](#title-small)
- [Body Styles](#body-styles)
  - [Body Large](#body-large)
  - [Body Medium](#body-medium)
  - [Body Small](#body-small)
- [Label Styles](#label-styles)
  - [Label Large](#label-large)
  - [Label Medium](#label-medium)
  - [Label Small](#label-small)
- [Emphasized Typography](#emphasized-typography)
  - [Weight Variations](#weight-variations)
  - [Usage Guidelines](#usage-guidelines)
- [Expressive Type Treatments](#expressive-type-treatments)
  - [Editorial Treatments](#editorial-treatments)
  - [Size Modifications](#size-modifications)
- [Typography in Components](#typography-in-components)
  - [Button Text](#button-text)
  - [Navigation](#navigation)
  - [Lists and Cards](#lists-and-cards)
- [Platform-Specific Notes](#platform-specific-notes)
  - [Android](#android)
  - [Linux Desktop](#linux-desktop)
- [Accessibility Requirements](#accessibility-requirements)
  - [Minimum Sizes](#minimum-sizes)
  - [Contrast Requirements](#contrast-requirements)
- [Implementation Guidelines](#implementation-guidelines)
- [Testing Checklist](#testing-checklist)

## Typography Philosophy

Expressive typography uses scale, weight, and visual treatments to create emotional resonance while maintaining clear information hierarchy. Type choices should enhance readability and guide users through content.

## Type Scale Overview

| Style | Size (sp) | Line Height | Weight | Letter Spacing |
|-------|-----------|-------------|--------|----------------|
| Display Large | 57 | 64 | Regular | -0.25 |
| Display Medium | 45 | 52 | Regular | 0 |
| Display Small | 36 | 44 | Regular | 0 |
| Headline Large | 32 | 40 | Regular | 0 |
| Headline Medium | 28 | 36 | Regular | 0 |
| Headline Small | 24 | 32 | Regular | 0 |
| Title Large | 22 | 28 | Medium | 0 |
| Title Medium | 16 | 24 | Medium | 0.15 |
| Title Small | 14 | 20 | Medium | 0.1 |
| Body Large | 16 | 24 | Regular | 0.5 |
| Body Medium | 14 | 20 | Regular | 0.25 |
| Body Small | 12 | 16 | Regular | 0.4 |
| Label Large | 14 | 20 | Medium | 0.1 |
| Label Medium | 12 | 16 | Medium | 0.5 |
| Label Small | 11 | 16 | Medium | 0.5 |

## Display Styles

### Display Large

- **Token**: `md.sys.typescale.display-large`
- **Font Size**: 57sp
- **Line Height**: 64sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: -0.25sp
- **Usage**: Hero text, splash screens, major headlines
- **Expressiveness**: Maximum impact, brand statements

### Display Medium

- **Token**: `md.sys.typescale.display-medium`
- **Font Size**: 45sp
- **Line Height**: 52sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: 0sp
- **Usage**: Secondary hero text, onboarding headlines
- **Expressiveness**: High impact with slightly more restraint

### Display Small

- **Token**: `md.sys.typescale.display-small`
- **Font Size**: 36sp
- **Line Height**: 44sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: 0sp
- **Usage**: Section headers, card titles
- **Expressiveness**: Clear hierarchy marker

## Headline Styles

### Headline Large

- **Token**: `md.sys.typescale.headline-large`
- **Font Size**: 32sp
- **Line Height**: 40sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: 0sp
- **Usage**: Major content headers
- **Expressiveness**: Strong visual presence

### Headline Medium

- **Token**: `md.sys.typescale.headline-medium`
- **Font Size**: 28sp
- **Line Height**: 36sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: 0sp
- **Usage**: Subsection headers, article titles
- **Expressiveness**: Moderate emphasis

### Headline Small

- **Token**: `md.sys.typescale.headline-small`
- **Font Size**: 24sp
- **Line Height**: 32sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: 0sp
- **Usage**: Minor headers, card headlines
- **Expressiveness**: Subtle hierarchy marker

## Title Styles

### Title Large

- **Token**: `md.sys.typescale.title-large`
- **Font Size**: 22sp
- **Line Height**: 28sp
- **Font Weight**: Medium (500)
- **Letter Spacing**: 0sp
- **Usage**: Dialog titles, list headers
- **Expressiveness**: Prominent but readable

### Title Medium

- **Token**: `md.sys.typescale.title-medium`
- **Font Size**: 16sp
- **Line Height**: 24sp
- **Font Weight**: Medium (500)
- **Letter Spacing**: 0.15sp
- **Usage**: List item titles, form labels
- **Expressiveness**: Standard emphasis

### Title Small

- **Token**: `md.sys.typescale.title-small`
- **Font Size**: 14sp
- **Line Height**: 20sp
- **Font Weight**: Medium (500)
- **Letter Spacing**: 0.1sp
- **Usage**: Chip labels, section labels
- **Expressiveness**: Compact hierarchy

## Body Styles

### Body Large

- **Token**: `md.sys.typescale.body-large`
- **Font Size**: 16sp
- **Line Height**: 24sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: 0.5sp
- **Usage**: Primary content text, paragraphs
- **Expressiveness**: Readable, comfortable long-form

### Body Medium

- **Token**: `md.sys.typescale.body-medium`
- **Font Size**: 14sp
- **Line Height**: 20sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: 0.25sp
- **Usage**: Secondary content, captions
- **Expressiveness**: Compact readability

### Body Small

- **Token**: `md.sys.typescale.body-small`
- **Font Size**: 12sp
- **Line Height**: 16sp
- **Font Weight**: Regular (400)
- **Letter Spacing**: 0.4sp
- **Usage**: Helper text, timestamps, metadata
- **Expressiveness**: Minimal visual weight

## Label Styles

### Label Large

- **Token**: `md.sys.typescale.label-large`
- **Font Size**: 14sp
- **Line Height**: 20sp
- **Font Weight**: Medium (500)
- **Letter Spacing**: 0.1sp
- **Usage**: Button text, tabs, navigation
- **Expressiveness**: Clear action identification

### Label Medium

- **Token**: `md.sys.typescale.label-medium`
- **Font Size**: 12sp
- **Line Height**: 16sp
- **Font Weight**: Medium (500)
- **Letter Spacing**: 0.5sp
- **Usage**: Small labels, badges, tags
- **Expressiveness**: Compact legibility

### Label Small

- **Token**: `md.sys.typescale.label-small`
- **Font Size**: 11sp
- **Line Height**: 16sp
- **Font Weight**: Medium (500)
- **Letter Spacing**: 0.5sp
- **Usage**: Dense labels, compact UI
- **Expressiveness**: Maximum density

## Emphasized Typography

M3 Expressive includes emphasized variants for additional hierarchy emphasis.

### Weight Variations

| Style | Regular Weight | Medium Weight | Semibold Weight |
|-------|----------------|---------------|-----------------|
| Display | 400 | 500 | 600 |
| Headline | 400 | 500 | 600 |
| Title | 400 | 500 | 600 |
| Body | 400 | 500 | - |
| Label | 400 | 500 | - |

### Usage Guidelines

- Use medium weight for emphasis within the same style
- Use semibold sparingly for critical actions
- Avoid multiple weights within the same hierarchy level

## Expressive Type Treatments

### Editorial Treatments

| Treatment | Usage | Example |
|-----------|-------|---------|
| All caps | Labels, categories | "SECTION HEADER" |
| Italic | Emphasis, titles | _Book Title_ |
| Strikethrough | Deleted content | ~~$99~~ |
| Underline | Links, emphasis | [Link text] |

### Size Modifications

- Use one size larger for emphasis
- Use one size smaller for secondary hierarchy
- Maintain consistent scale steps

## Typography in Components

### Button Text

| Button Type | Style | Size | Weight |
|-------------|-------|------|--------|
| Elevated | Label Large | 14sp | Medium |
| Filled | Label Large | 14sp | Medium |
| Tonal | Label Large | 14sp | Medium |
| Outlined | Label Large | 14sp | Medium |
| Text | Label Large | 14sp | Medium |

### Navigation

| Element | Style | Size | Weight |
|---------|-------|------|--------|
| Navigation Bar Label | Label Medium | 12sp | Medium |
| Navigation Rail Label | Label Medium | 12sp | Medium |
| Tab Label | Label Large | 14sp | Medium |

### Lists and Cards

| Element | Style | Size | Weight |
|---------|-------|------|--------|
| List Title | Title Medium | 16sp | Medium |
| List Subtitle | Body Medium | 14sp | Regular |
| Card Title | Title Medium | 16sp | Medium |
| Card Body | Body Medium | 14sp | Regular |

## Platform-Specific Notes

### Android

- Default font: Roboto
- Dynamic scaling available
- System font settings respected

### Linux Desktop

- Default font: Roboto or system default
- Desktop font settings may apply
- Consider font rendering differences

## Accessibility Requirements

### Minimum Sizes

| Context | Minimum Size |
|---------|--------------|
| Body text | 14sp (16px) |
| Large text | 18sp |
| Labels | 12sp |
| Touch target text | 14sp |

### Contrast Requirements

- Text color must meet 4.5:1 contrast ratio
- Large text (18sp+) meets 3:1 ratio
- Interactive text has clear visual distinction

## Implementation Guidelines

1. Use the type scale consistently
2. Apply size increases for emphasis
3. Maintain readable line heights
4. Use letter spacing appropriately
5. Consider platform conventions
6. Test across font rendering environments

## Testing Checklist

- [ ] Type scale applied consistently
- [ ] Hierarchy is clear and logical
- [ ] All text meets accessibility contrast
- [ ] Interactive elements are legible
- [ ] Test across platforms (Android, Linux)
- [ ] Verify font rendering quality
