# Expressive Design Review Checklist

Use this checklist to perform a high-density verification of your design against Expressive standards.

## Visual Foundations

- [ ] **Color**: Are tonal palettes expanded and container tiers used for hierarchy?
- [ ] **Shape**: Are expressive radii (e.g., 20dp+ for buttons) applied to primary elements?
- [ ] **Size**: Are primary tap targets 56dp+?
- [ ] **Motion**: Are energetic transitions applied to key interactions?
- [ ] **Containment**: Is tonal separation used instead of elevation lines where possible?
- [ ] **Hierarchy**: Are multiple cues (color, shape, text, motion) used to emphasize importance?

## Communication

- [ ] **Scannability**: Are key terms front-loaded? Are generic headings ("Details") avoided?
- [ ] **Punctuation**: Are periods omitted from labels, tooltips, and buttons?
- [ ] **Pronouns**: Is consistent second-person ("you/your") used?
- [ ] **Consistency**: Is there a single form of address? (No mixing "my" and "your" on one screen).
- [ ] **Clarity**: Are Latin abbreviations (e.g., etc.) replaced with plain English phrases?
- [ ] **Contractions**: Are natural contractions used unless emphasis is required?

## Usability

- [ ] **Emphasis**: Is there a single clear focal point per screen?
- [ ] **Placement**: Are important actions placed at the top or bottom of the screen?
- [ ] **Grouping**: Are related items of similar hierarchy grouped together?
- [ ] **Simplification**: Is key information discernable at a glance with minimal complexity?

## Accessibility & Platform

- [ ] **Contrast**: Does all text meet 4.5:1 minimum? (3:1 for large text)?
- [ ] **Targets**: Are all interactive elements at least 48dp?
- [ ] **Feedback**: Is both visual and touch feedback provided for interactions?
- [ ] **Focus**: Is focus control implemented for frequent tasks?
- [ ] **Landmarks**: Are high-level structural landmarks correctly identified to aid linear navigation?
- [ ] **Unique Labels**: Are landmark roles that appear multiple times (Regions, Navigation) uniquely and descriptively labeled?
- [ ] **Label Redundancy**: Do landmark labels avoid repeating the name of the role itself?
- [ ] **Heading Sequence**: Do headings follow a sequential, non-skipping order (H1-H6)?
- [ ] **Single H1**: Does each page have exactly one H1 for the primary title?
- [ ] **Semantic Headings**: Are headings assigned based on structural hierarchy rather than visual prominence?
- [ ] **Android**: Is dynamic color implemented and tested?
- [ ] **Linux**: Are hover states and keyboard focus indicators present?
