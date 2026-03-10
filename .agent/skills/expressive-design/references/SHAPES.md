# Expressive Shapes

The Expressive shape system uses border radius, form, and containment to create visual boundaries, communicate function, and express brand personality. Expressive shapes go beyond decoration to enhance usability through clear visual grouping.


## Table of Contents

- [Shape Philosophy](#shape-philosophy)
- [Shape Tokens](#shape-tokens)
  - [Size-Based Tokens](#size-based-tokens)
  - [Component-Specific Defaults](#component-specific-defaults)
- [Shape Families](#shape-families)
  - [Round Family](#round-family)
  - [Square Family](#square-family)
  - [Mixed Family](#mixed-family)
- [Expressive Containment](#expressive-containment)
  - [Container Hierarchy](#container-hierarchy)
  - [Shape for Function](#shape-for-function)
- [Shape and Emotion](#shape-and-emotion)
  - [Emotional Associations](#emotional-associations)
  - [Shape Application Guidelines](#shape-application-guidelines)
- [Platform-Specific Notes](#platform-specific-notes)
  - [Android](#android)
  - [Linux Desktop](#linux-desktop)
- [Shape and Accessibility](#shape-and-accessibility)
  - [Touch Target Considerations](#touch-target-considerations)
  - [Visual Perception](#visual-perception)
- [Implementation Guidelines](#implementation-guidelines)
- [Shape Token Values](#shape-token-values)
  - [Reference Values](#reference-values)
- [Testing Checklist](#testing-checklist)

## Shape Philosophy

Expressive shapes create emotional resonance through form while maintaining clear visual hierarchy. The shape system balances personality with functionality, using consistent radii across components while allowing for expressive variations.

## Shape Tokens

### Size-Based Tokens

| Size        | Token                             | Radius Value | Usage                        |
| ----------- | --------------------------------- | ------------ | ---------------------------- |
| None        | `md.sys.shape.corner-none`        | 0dp          | Utility components, dividers |
| Extra Small | `md.sys.shape.corner-extra-small` | 4dp          | Chips, small elements        |
| Small       | `md.sys.shape.corner-small`       | 8dp          | Buttons, cards, lists        |
| Medium      | `md.sys.shape.corner-medium`      | 12dp         | Dialogs, sheets              |
| Large       | `md.sys.shape.corner-large`       | 16dp         | Large cards, panels          |
| Extra Large | `md.sys.shape.corner-extra-large` | 24dp         | Bottom sheets, modals        |
| Full        | `md.sys.shape.corner-full`        | 999dp        | Circular elements, pills     |

### Component-Specific Defaults

| Component         | Default Size | Token | Override Options         |
| ----------------- | ------------ | ----- | ------------------------ |
| Button (filled)   | Small        | 8dp   | Medium for emphasis      |
| Button (outlined) | Small        | 8dp   | Medium for emphasis      |
| Elevated Button   | Small        | 8dp   | Medium for emphasis      |
| FAB               | Medium       | 12dp  | Large for emphasis       |
| Extended FAB      | Medium       | 12dp  | Large for emphasis       |
| Card (elevated)   | Medium       | 12dp  | Large for emphasis       |
| Card (outlined)   | Medium       | 12dp  | Large for emphasis       |
| Dialog            | Large        | 16dp  | Extra Large for emphasis |
| Bottom Sheet      | Extra Large  | 24dp  | Full for expressive      |
| Navigation Drawer | Medium       | 12dp  | Large for emphasis       |
| Navigation Rail   | Medium       | 12dp  | Large for emphasis       |
| List Item         | None/Small   | 0-8dp | Medium for cards         |
| Chip              | Extra Small  | 4dp   | Small for emphasis       |
| Text Field        | Small        | 8dp   | Medium for emphasis      |
| Snackbar          | Medium       | 12dp  | Large for emphasis       |
| Banner            | Medium       | 12dp  | Large for emphasis       |
| Toolbar           | Medium       | 12dp  | Large for emphasis       |

## Shape Families

### Round Family

Components with fully rounded corners belong to the round family, conveying friendliness and approachability.

| Shape       | Radius | Token                | Examples                     |
| ----------- | ------ | -------------------- | ---------------------------- |
| Fully round | 999dp  | `corner-full`        | FAB, pills, circular buttons |
| Extra large | 24dp   | `corner-extra-large` | Bottom sheets, modals        |
| Large       | 16dp   | `corner-large`       | Large cards, dialogs         |

### Square Family

Components with minimal rounding belong to the square family, conveying precision and utility.

| Shape       | Radius | Token                | Examples                 |
| ----------- | ------ | -------------------- | ------------------------ |
| None        | 0dp    | `corner-none`        | Dividers, utility panels |
| Extra small | 4dp    | `corner-extra-small` | Technical displays       |
| Small       | 8dp    | `corner-small`       | Utility buttons          |

### Mixed Family

Components can use mixed shapes for expressive effects.

| Pattern      | Description          | Usage                |
| ------------ | -------------------- | -------------------- |
| Top-heavy    | Larger top radius    | Cards with emphasis  |
| Bottom-heavy | Larger bottom radius | Dropdowns, selects   |
| Left-heavy   | Larger left radius   | Navigation elements  |
| Right-heavy  | Larger right radius  | Directional emphasis |

## Expressive Containment

### Container Hierarchy

M3 Expressive uses shapes to reinforce visual hierarchy through containment.

| Level     | Shape        | Token                | Purpose          |
| --------- | ------------ | -------------------- | ---------------- |
| Surface   | Default      | `corner-medium`      | Base layer       |
| Container | Emphasized   | `corner-large`       | Content grouping |
| Elevated  | More rounded | `corner-extra-large` | Emphasis         |
| Modal     | Most rounded | `corner-full`        | Focus attention  |

### Shape for Function

| Function           | Recommended Shape    | Rationale          |
| ------------------ | -------------------- | ------------------ |
| Primary action     | Rounded (8-12dp)     | Draws attention    |
| Secondary action   | Less rounded (4-8dp) | Subtle distinction |
| Destructive action | Square (0-4dp)       | Serious tone       |
| Selection state    | Container shape      | Visual grouping    |
| Disabled state     | Maintain shape       | Consistency        |

## Shape and Emotion

### Emotional Associations

| Shape         | Association           | Use Cases             |
| ------------- | --------------------- | --------------------- |
| Round, large  | Friendly, welcoming   | Consumer apps, social |
| Round, small  | Approachable, modern  | Mainstream apps       |
| Square, small | Precise, reliable     | Tools, utilities      |
| Square, none  | Industrial, technical | Settings, data        |
| Mixed         | Dynamic, creative     | Creative tools        |

### Shape Application Guidelines

| Emotional Goal | Shape Strategy                 |
| -------------- | ------------------------------ |
| Welcoming      | Larger radii (16-24dp)         |
| Energetic      | Dynamic mixed shapes           |
| Professional   | Moderate radii (8-12dp)        |
| Trustworthy    | Consistent, predictable shapes |
| Playful        | Varied, expressive shapes      |

## Platform-Specific Notes

### Android

- Material 3 shape integration
- Dynamic color harmonization
- Platform gesture compatibility
- Accessibility shape feedback

### Linux Desktop

- Desktop mouse interaction
- Hover state considerations
- Window management integration
- Touch vs. pointer differentiation

## Shape and Accessibility

### Touch Target Considerations

- Shapes should not reduce perceived touch area
- Rounded corners maintain full touch area
- Avoid shapes that create visual "gap" perception
- Test with actual touch interactions

### Visual Perception

- Shapes should clearly communicate interactivity
- Consistent shape patterns aid recognition
- Expressive shapes should not confuse function
- Maintain shape-function relationships

## Implementation Guidelines

1. Use consistent radii across components
2. Apply larger radii for emphasis
3. Maintain shape hierarchy
4. Consider emotional impact
5. Test on target platforms
6. Respect accessibility requirements

## Shape Token Values

### Reference Values

| Token                             | Value | CSS Custom Property                 |
| --------------------------------- | ----- | ----------------------------------- |
| `md.sys.shape.corner-none`        | 0dp   | `--md-sys-shape-corner-none`        |
| `md.sys.shape.corner-extra-small` | 4dp   | `--md-sys-shape-corner-extra-small` |
| `md.sys.shape.corner-small`       | 8dp   | `--md-sys-shape-corner-small`       |
| `md.sys.shape.corner-medium`      | 12dp  | `--md-sys-shape-corner-medium`      |
| `md.sys.shape.corner-large`       | 16dp  | `--md-sys-shape-corner-large`       |
| `md.sys.shape.corner-extra-large` | 24dp  | `--md-sys-shape-corner-extra-large` |
| `md.sys.shape.corner-full`        | 999dp | `--md-sys-shape-corner-full`        |

## Testing Checklist

- [ ] Consistent shape application
- [ ] Clear visual hierarchy
- [ ] Emotional resonance appropriate
- [ ] Accessibility requirements met
- [ ] Platform conventions followed
- [ ] Touch targets remain adequate
- [ ] Tested on target platforms
