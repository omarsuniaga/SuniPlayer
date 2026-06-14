# Test Oracles

A test oracle is a means by which we recognize a problem. Oracles are heuristics; they are fallible and require human judgment. You don't "run" an oracle; you apply it using your brain.

## FEW HICCUPS Heuristic
Use these guidewords to identify potential problems when the product's behavior deviates from:

- **F - Familiarity**: The way you expect it to work based on your general experience with software and systems.
- **E - Explainability**: If you can't explain why the system is behaving this way, or if the explanation is convoluted, it might be a bug.
- **W - World**: How things work in the real world (e.g., physical laws, logic, common sense).
- **H - History**: How the product used to work in previous versions or builds. (Deviations are "regressions").
- **I - Image**: The brand, style, reputation, and aesthetic of the company. (e.g., a spelling error in a luxury brand app).
- **C - Comparable Products**: How similar products (competitors, internal tools, or even different parts of the same app) work.
- **C - Claims**: What the documentation, marketing materials, UI labels, or developers say it should do.
- **U - User Expectations**: What a reasonable user would want, expect, or find intuitive.
- **P - Purpose**: The stated or implied goals of the feature or the user's intent.
- **S - Standards**: Explicit industry, regulatory, or internal coding/design standards.

## The Blink Oracle
The ability to recognize a problem instantly through "thin-slicing" or pattern matching. 
- **Visual**: Spotting a misaligned pixel or a wrong color in a split second.
- **Behavioral**: Noticing a slight lag or a "weird" transition that just feels wrong.
- **Patterns**: Recognizing a crash pattern or a log error format you've seen before.

## Safety Language
Since oracles are fallible, use safety language in your reports to maintain credibility and avoid unproductive arguments:
- **Avoid**: "This is broken," "The requirement says X," "This is a bug."
- **Prefer**: "I see a potential problem," "The behavior seems inconsistent with my understanding of X," "I'm concerned that a user might find this confusing."
- **Why?**: It invites a conversation about risk rather than a debate about definitions.
