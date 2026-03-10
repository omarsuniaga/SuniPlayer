# Expressive Motion

The motion system uses timing, easing, and transitions to create emotionally engaging experiences. Motion brings interfaces to life with personality while maintaining usability through purposeful animation choices.


## Table of Contents

- [Motion Philosophy](#motion-philosophy)
- [Duration Specifications](#duration-specifications)
  - [Standard Durations](#standard-durations)
  - [Component-Specific Durations](#component-specific-durations)
- [Easing Specifications](#easing-specifications)
  - [Standard Easing Curves](#standard-easing-curves)
  - [Easing Curve Values](#easing-curve-values)
- [Transition Patterns](#transition-patterns)
  - [Container Transform](#container-transform)
  - [Shared Axis](#shared-axis)
  - [Fade Through](#fade-through)
  - [Fade](#fade)
  - [Expansion](#expansion)
- [Motion Attributes](#motion-attributes)
  - [Energy](#energy)
  - [Direction](#direction)
  - [Hierarchy](#hierarchy)
- [Expressive Motion Guidelines](#expressive-motion-guidelines)
  - [When to Use Expressive Motion](#when-to-use-expressive-motion)
  - [When to Use Subtle Motion](#when-to-use-subtle-motion)
- [Platform-Specific Notes](#platform-specific-notes)
  - [Android](#android)
  - [Linux Desktop](#linux-desktop)
- [Performance Guidelines](#performance-guidelines)
  - [Motion Performance](#motion-performance)
  - [Optimization Strategies](#optimization-strategies)
- [Accessibility Considerations](#accessibility-considerations)
  - [Reduced Motion](#reduced-motion)
  - [Motion Duration Ranges](#motion-duration-ranges)
- [Implementation Checklist](#implementation-checklist)
- [Testing Guidelines](#testing-guidelines)
  - [Visual Testing](#visual-testing)
  - [Performance Testing](#performance-testing)

## Motion Philosophy

Expressive motion goes beyond functional state changes to create emotional resonance. The motion system uses energetic transitions, purposeful timing, and carefully designed easing curves to enhance the user's emotional connection with the interface.

## Duration Specifications

### Standard Durations

| Motion Type | Duration  | Usage                                  |
| ----------- | --------- | -------------------------------------- |
| Short       | 100-150ms | Toggle states, quick feedback          |
| Medium      | 200-300ms | Standard transitions                   |
| Long        | 350-500ms | Complex changes, page transitions      |
| Expressive  | 500-700ms | Major interactions, emotional emphasis |

### Component-Specific Durations

| Component              | Enter Duration | Exit Duration | Token                           |
| ---------------------- | -------------- | ------------- | ------------------------------- |
| Button press           | 100ms          | 100ms         | `md.sys.motion.duration-short`  |
| FAB expand             | 300ms          | 250ms         | `md.sys.motion.duration-medium` |
| FAB collapse           | 250ms          | 200ms         | `md.sys.motion.duration-medium` |
| Dialog appear          | 300ms          | 200ms         | `md.sys.motion.duration-medium` |
| Dialog disappear       | 200ms          | 150ms         | `md.sys.motion.duration-short`  |
| Navigation push        | 300ms          | 250ms         | `md.sys.motion.duration-medium` |
| Navigation pop         | 250ms          | 300ms         | `md.sys.motion.duration-medium` |
| Snackbar appear        | 250ms          | 200ms         | `md.sys.motion.duration-short`  |
| Snackbar disappear     | 150ms          | 150ms         | `md.sys.motion.duration-short`  |
| Bottom sheet appear    | 350ms          | 250ms         | `md.sys.motion.duration-long`   |
| Bottom sheet disappear | 250ms          | 200ms         | `md.sys.motion.duration-medium` |
| Card expand            | 400ms          | 300ms         | `md.sys.motion.duration-long`   |
| Card collapse          | 300ms          | 200ms         | `md.sys.motion.duration-medium` |
| List item add          | 250ms          | 200ms         | `md.sys.motion.duration-medium` |
| List item remove       | 200ms          | 150ms         | `md.sys.motion.duration-short`  |

## Easing Specifications

### Standard Easing Curves

| Easing Type | Curve               | Token                             | Usage                  |
| ----------- | ------------------- | --------------------------------- | ---------------------- |
| Standard    | Custom cubic bezier | `md.sys.motion.easing-standard`   | General transitions    |
| Decelerate  | Custom cubic bezier | `md.sys.motion.easing-decelerate` | Entering animations    |
| Accelerate  | Custom cubic bezier | `md.sys.motion.easing-accelerate` | Exiting animations     |
| Expressive  | Custom cubic bezier | `md.sys.motion.easing-expressive` | Emphasized transitions |

### Easing Curve Values

#### Standard Easing

```yaml
# Enter and exit
Enter: [0.0, 0.0, 0.2, 1.0]
Exit: [0.4, 0.0, 0.2, 1.0]
```

#### Decelerate Easing

```yaml
# For elements entering the screen
Enter: [0.0, 0.0, 0.0, 1.0]
```

#### Accelerate Easing

```yaml
# For elements exiting the screen
Exit: [0.4, 0.0, 1.0, 1.0]
```

#### Expressive Easing

```yaml
# For emphasized transitions
Enter: [0.0, 0.0, 0.2, 1.0]
Exit: [0.4, 0.0, 0.2, 1.0]
# More pronounced curves for emphasis
Expressive: [0.0, 0.0, 0.3, 1.0]
```

## Transition Patterns

### Container Transform

Used for transitions between UI elements that share a visual relationship.

```yaml
Duration: 300ms
Easing:
  Enter: Decelerate [0.0, 0.0, 0.0, 1.0]
  Exit: Accelerate [0.4, 0.0, 1.0, 1.0]
Morph: Shape morphing when applicable
Fade: Crossfade with threshold
```

### Shared Axis

Used for transitions between UI elements that have a spatial or navigational relationship.

```yaml
Duration: 250ms
Easing:
  Enter: Standard [0.0, 0.0, 0.2, 1.0]
  Exit: Standard [0.0, 0.0, 0.2, 1.0]
Axis: X or Y based on navigation direction
Fade: Through-container fade
```

### Fade Through

Used for transitions between UI elements without a strong visual relationship.

```yaml
Duration: 200ms
Easing: Standard [0.0, 0.0, 0.2, 1.0]
Pattern:
  - Fade out (50ms)
  - Brief pause (50ms)
  - Fade in (100ms)
```

### Fade

Simple fade transitions for modal and dialog appearances.

```yaml
Duration: 200ms
Easing: Decelerate [0.0, 0.0, 0.0, 1.0]
Fade: Full opacity transition
Scale: Subtle 95% to 100% scale
```

### Expansion

Used for expanding containers, cards, and collapsible elements.

```yaml
Duration: 350ms
Easing: Expressive [0.0, 0.0, 0.3, 1.0]
Scale: 98% to 100% on expand
Elevation: Shadow expansion
Ripple: Material ripple effect
```

## Motion Attributes

### Energy

Motion should convey appropriate energy levels:

| Energy Level | Characteristics      | Use Cases                         |
| ------------ | -------------------- | --------------------------------- |
| Low          | Slow, smooth, subtle | Background changes, notifications |
| Medium       | Balanced, natural    | Standard interactions             |
| High         | Quick, responsive    | Toggles, selections               |
| Expressive   | Bold, energetic      | Major actions, celebrations       |

### Direction

Motion direction should follow platform conventions:

| Direction | Meaning               | Examples               |
| --------- | --------------------- | ---------------------- |
| Up        | Expansion, creation   | FAB expand, new item   |
| Down      | Contraction, deletion | Collapse, remove       |
| Left      | Forward navigation    | Next page, detail view |
| Right     | Back navigation       | Previous page, return  |

### Hierarchy

Motion emphasis should match visual hierarchy:

| Hierarchy | Motion Emphasis   | Duration Modifier |
| --------- | ----------------- | ----------------- |
| Primary   | Strong emphasis   | +50ms             |
| Secondary | Moderate emphasis | Standard          |
| Tertiary  | Subtle emphasis   | -50ms             |

## Expressive Motion Guidelines

### When to Use Expressive Motion

- **Celebratory moments** - Achievements, completions
- **Major actions** - Submit, send, share
- **State changes** - Mode switches, selections
- **Onboarding highlights** - First-use features
- **Achievements** - Unlocks, milestones

### When to Use Subtle Motion

- **Form interactions** - Focus, validation
- **List operations** - Add, remove items
- **Navigation** - Standard transitions
- **Settings** - Toggle changes
- **Loading states** - Progress indicators

## Platform-Specific Notes

### Android

- Respects system animation settings
- Material ripple integration
- Window insets handling
- Gesture navigation compatibility

### Linux Desktop

- Animation preferences may vary
- Desktop accessibility settings
- Window management integration
- Performance considerations for older hardware

## Performance Guidelines

### Motion Performance

| Metric           | Target                      | Measurement          |
| ---------------- | --------------------------- | -------------------- |
| Frame rate       | 60fps minimum               | Frame timing         |
| Frame budget     | 16.67ms per frame           | Animation smoothness |
| Layout thrashing | Avoid during animation      | Frame timing         |
| Overdraw         | Minimize during transitions | GPU rendering        |

### Optimization Strategies

- Use transformed widgets instead of rebuilding
- Prefer opacity changes over rebuilds
- Animate transform properties
- Use ClipRect for performance
- Test on lower-end devices

## Accessibility Considerations

### Reduced Motion

Respect user preferences for reduced motion:

```dart
// Check for reduced motion preference
final bool reduceMotion = MediaQuery.of(context).reduceMotion;

// Apply reduced motion alternatives
if (reduceMotion) {
  // Use instant transitions
} else {
  // Use standard animations
}
```

### Motion Duration Ranges

| Context    | Standard Duration | Reduced Duration |
| ---------- | ----------------- | ---------------- |
| Short      | 100-150ms         | 50-75ms          |
| Medium     | 200-300ms         | 100-150ms        |
| Long       | 350-500ms         | 175-250ms        |
| Expressive | 500-700ms         | 250-350ms        |

## Implementation Checklist

- [ ] Duration appropriate for action type
- [ ] Easing matches motion purpose
- [ ] Direction follows conventions
- [ ] Performance optimized (60fps)
- [ ] Reduced motion supported
- [ ] Accessibility contrast maintained
- [ ] Platform conventions followed
- [ ] Tested on target devices

## Testing Guidelines

### Visual Testing

- [ ] Motion feels natural and appropriate
- [ ] Duration matches action complexity
- [ ] Easing curves are smooth
- [ ] Transitions are predictable
- [ ] Expressive moments feel special

### Performance Testing

- [ ] Animation runs at 60fps
- [ ] No dropped frames during transition
- [ ] Smooth on lower-end devices
- [ ] No jank during rapid interactions
