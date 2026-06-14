# Prospective Testing (Testing Before Code)

Prospective testing is the practice of investigating requirements, designs, and ideas before they are implemented. As outlined in Chapter 8 of "Taking Testing Seriously," it's about "looking where you are going" to prevent trouble.

## Why Do Prospective Testing?
- To identify gaps in understanding early.
- To challenge assumptions that would be expensive to fix later.
- To improve the testability of the final product.

## The 9-Question Cheat Sheet for Prospective Testing
Use these questions in meetings with BAs, developers, or product owners:

1. **What exactly are we talking about?** (Define terms, scope, and specific scenarios).
2. **Is this worth discussing here and now?** (Ensure the right people are present and the topic is relevant).
3. **What exactly are we trying to achieve?** (Focus on the value proposition and the problem being solved).
4. **What influences must we consider?** (Constraints, users, environment, history, and dependencies).
5. **What other features or requirements will be affected?** (Identify side effects and unintended consequences).
6. **What specific data or conditions must this feature be able to process?** (Edge cases, data types, limits, and "weird" inputs).
7. **What are the merits of different ways of designing or implementing this?** (Explore trade-offs and alternatives).
8. **How will the new feature handle errors or recover from failure?** (Focus on resilience, logs, and user feedback).
9. **How will we test the new feature once it exists?** (Advocate for observability, controllability, and test hooks).

## Handling Resistance
If people resist these questions (e.g., "we don't have time for this"), use **Safety Language**:
- "I'm asking this to ensure I can design an effective test strategy once the code is ready."
- "I want to make sure we don't have any surprises that slow us down later."
- "My goal is to help us move along at the fastest safe speed."
- "It's much cheaper to find this gap in a conversation than in the code."
