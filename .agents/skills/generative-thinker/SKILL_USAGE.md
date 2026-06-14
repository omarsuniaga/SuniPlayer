# Using the Generative Thinker Skill

This skill is designed to force AI agents to think beyond narrow "fixes" and instead build high-leverage "platforms." It is based on the principles in *The Generativity Advantage* by Dr. Abdelwahab.

## How to Trigger
Invoke this skill when you need:
- **Platform Strategies**: Turning a tool into an ecosystem.
- **High-Leverage Solutions**: Solving a class of problems rather than a single instance.
- **Out-of-the-Box Thinking**: When the standard approach is too rigid or limited.

## The Generative Shift: A Case Study

### The User Request
> "I need a CLI tool to rename image files based on their EXIF date."

### Standard Thinking (Narrow)
The agent writes a Python script using `os.rename` and `piexif`. It works perfectly for images but does nothing else.
- **Leverage**: Low (only images).
- **Adaptability**: Low (hardcoded logic).
- **Surprise**: Zero.

### Generative Thinking (Out-of-the-Box)
The agent proposes **`Nomos`**, a metadata-driven orchestration engine.
- **The Solution**: A system that maps *any* file trait (EXIF, ID3, MD5, OCR text) to a template.
- **Leverage**: High (renames images, organizes music, archives logs).
- **Adaptability**: High (users can add new "Extractors" for new file types).
- **The "Laundry Buddy" Moment**: The user starts by renaming photos (mundane) but discovers they can use it to deduplicate their entire hard drive using `{hash.md5}`.

## Core Dimensions to Apply
1.  **Leverage**: Can it do 10+ things?
2.  **Adaptability**: Can the user change its behavior easily?
3.  **Ease of Mastery**: Is there a "5-minute win"?
4.  **Accessibility**: Is it easy to get and use?
5.  **Transferability**: Can users share their "recipes"?
6.  **Profitability**: Does it help the user/innovator capture value?
