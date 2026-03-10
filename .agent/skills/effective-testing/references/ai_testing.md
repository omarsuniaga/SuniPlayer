# How to Approach AI and Testing

As detailed in Chapter 7, modern AI presents unique challenges for testing. It is non-deterministic, opaque, and prone to "hallucinations." In RST, we don't treat AI as a magic box, but as a system that requires rigorous supervision.

## Transpection: Thinking about Thinking
Transpection is a basic skill for collaborating with AI. It involves:
- **Metacognition**: Watching your own thinking process as you interact with the AI.
- **Critical Evaluation**: Constantly asking "How do I know this is true?" and "What is the AI missing?"
- **De-biasing**: Recognizing your own tendency to "vibe" with the AI or accept its output because it looks plausible.

## AI Supervision Guidelines
- **Don't outsource responsibility**: You, the human, are the responsible tester. The AI is a tool, not a teammate.
- **Verify the "Magic"**: If an AI says it tested something, ask for the evidence, the coverage, and the oracles it used.
- **Beware the Productivity Paradox**: Just because you can generate 1000 "test cases" in a second doesn't mean you are testing better. You are just creating a larger haystack in which to hide bugs.
- **Red Teaming**: Treat the AI output as a hostile witness. Try to find where it's wrong, shallow, or dangerously overconfident.

## The Role of the "Supervising Tester"
If the industry moves toward AI-generated code (prompts instead of code), the tester's role becomes even more critical:
1. **Satisfy yourself** that the AI actually delivered the goods.
2. **Supervise the development process** to ensure risk is being addressed.
3. **Audit the AI's "Checks"** to ensure they aren't just tautological (checking that it did what it said it did).
