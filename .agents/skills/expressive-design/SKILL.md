---
name: expressive-design
description: Material Expressive. Comprehensive guidance on expressive design system for Flutter with platform support for Android and Linux desktop. Covers color tokens, typography scales, motion specifications, shape tokens, spacing ramps, and component enhancements for creating emotionally engaging UIs. Includes migration guidance from standard M3 and platform-specific integration notes. Use when Claude needs to apply expressive design to a specific Flutter widget (passed as a parameter) or UI component, or when answering questions about Material 3 Expressive guidelines. Use for media, communication, and consumer apps; avoid for banking, healthcare, and safety-critical apps.
---

# Material Expressive Design System

Material Expressive is Google's most researched design system update, based on 46 studies with 18,000+ participants. It creates emotionally engaging user experiences through strategic use of color, shape, size, motion, and containment.

## Core Expressive Elements

1. **Color** - Expanded tonal palettes, container tiers, emotional selection, and dynamic convergence.
2. **Shape** - Expressive radii, containment, visual boundaries.
3. **Size** - Larger touch targets, visual hierarchy.
4. **Motion** - Energetic transitions, emotional timing.
5. **Containment** - Surface elevation, tonal separation.

## Workflows

### Apply Expressive Design

**Arguments:**
- `widget`: The Flutter widget code or description to be transformed.

**Steps:**

1.  **Identify Component Category**: Match the `widget` to a category in [COMPONENTS.md](references/COMPONENTS.md) (e.g., Button, Navigation, Surface, Input).
2.  **Apply Color System**: 
    - Read [COLOR.md](references/COLOR.md) to select tonal palettes and apply container tiers for hierarchy.
    - **Apply Color Convergence**: Merge brand identity with user settings using harmonization and `ThemeExtension` (see [PLATFORMS.md](references/PLATFORMS.md)).
3.  **Apply Shape System**: 
    - Read [SHAPES.md](references/SHAPES.md) to use expressive radii (e.g., Full, Extra Large). Ensure consistent rounding for component families.
4.  **Optimize Size and Spacing**:
    - Read [SPACING.md](references/SPACING.md) to increase touch targets to 48dp-56dp and apply generous internal padding.
5.  **Inject Motion**:
    - Read [MOTION.md](references/MOTION.md) to add energetic state transitions and use expressive easing and durations.
6.  **Verify**: Cross-reference with [CHECKLIST.md](references/CHECKLIST.md).

## Topic References

Load these references only when working on a specific aspect of the design system:

- **Foundations & Principles**: Core principles, communication, and when to use. See [FOUNDATIONS.md](references/FOUNDATIONS.md).
- **Usability**: Design tactics, best practices, and testing. See [USABILITY.md](references/USABILITY.md).
- **Typography**: Scales, values, and type treatments. See [TYPOGRAPHY.md](references/TYPOGRAPHY.md).
- **Accessibility**: Compliance, screen reader compatibility, and testing. See [ACCESSIBILITY.md](references/ACCESSIBILITY.md).
- **Platform Specifics**: Android (Dynamic Color, Android 16) and Linux Desktop integration. See [PLATFORMS.md](references/PLATFORMS.md).
