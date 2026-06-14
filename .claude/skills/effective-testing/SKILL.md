---
name: effective-testing
description: "A comprehensive methodology for highly effective, human-centered software testing, based on 'Taking Testing Seriously' (Bach & Bolton, 2026). Use this skill whenever testing, quality assurance, bug hunting, test strategy, automation traps, or risk analysis are mentioned. MANDATORY for: (1) Designing test strategies for complex products, (2) Performing exploratory testing using Session-Based Test Management (SBTM), (3) Identifying bugs with advanced oracle heuristics (FEW HICCUPS), (4) Reporting bugs with high business significance, (5) Prospective testing on requirements/designs, or (6) Supervizing AI and signals-based testing. If the user asks 'Is this code good?', 'How should I test this?', or 'Help me find bugs', YOU MUST use this skill to provide a professional, context-driven investigation rather than shallow checks."
---

# Rapid Software Testing (RST)

## Overview

Rapid Software Testing (RST) is a human-centered, context-driven methodology that treats the product as a mystery to be investigated. It focuses on people, heuristics, skills, and ethics to find the "bugs that matter" as efficiently as possible.

## Part I: Introduction & Core Mindset

- **The Product is a Mystery**: Do not assume it works; probe it to discover its true nature.
- **Testing is Learning**: Every test is an episode of learning about the product's status.
- **Testing vs. Checking**: Testing is a human process of exploration; checking is algorithmic verification. See [RST Workflows](references/workflows.md).
- **The Responsible Tester**: You are an independent agent accountable for the quality of your investigation.
- **Vital Qualities**: Empirical, Skilled, Different, Motivated, Available. See [Tester Qualities](references/tester_qualities.md).

## Part II: Methodology & Process

1. **Model the Product**: Use the [HTSM](references/htsm.md) to brainstorm coverage.
2. **Define Strategy**: Use the [Test Strategy Guide](references/strategy.md) to prioritize risks.
3. **Execute Sessions**: Use Session-Based Test Management (SBTM). Use the [Session Template](assets/sbtm_session_template.txt).
4. **Apply Oracles**: Use [Oracle Heuristics](references/oracles.md) (FEW HICCUPS) to recognize problematic behavior.
5. **Apply Tools**: Use tools for _checking_, but avoid the [13 Automation Traps](references/automation_traps.md).
6. **Report & Storytell**: Use the [Reporting Guide](references/reporting.md) and [Bug Template](assets/bug_report_template.txt) (PROOF heuristic).

## Part III: Application & Special Topics

- **[Prospective Testing](references/prospective_testing.md)**: Testing ideas and requirements _before_ code exists. Use the [Prospective Checklist](assets/prospective_testing_checklist.txt).
- **[Signals-Based Testing](references/signals_based_testing.md)**: Leveraging AI and system signals for deep coverage.
- **[AI and Testing](references/ai_testing.md)**: Supervizing AI output, transpection, and the productivity paradox.
- **[Usability Testing](references/usability.md)**: Rapidly assessing user experience and accessibility.
- **[Adventures in Testability](references/testability.md)**: Advocating for systems that are easier to test.

## Part IV: Context & Culture

- **[Context & Culture](references/context_and_culture.md)**: Understanding management, sociology, and how testing looks from the business side.
- **[The Horizon Scandal](references/horizon_scandal.md)**: Lessons from a massive systemic failure.

## Resources (Assets)

- **[SBTM Session Template](assets/sbtm_session_template.txt)**: For focused exploratory sessions.
- **[Bug Report Template](assets/bug_report_template.txt)**: For professional and actionable bug reporting.
- **[Prospective Checklist](assets/prospective_testing_checklist.txt)**: For meetings and requirements analysis.

## Key Examples

### Prospective Testing in a Meeting
_User: "We're planning a new feature for multi-currency support. Any thoughts?"_
1. Refer to [Prospective Testing](references/prospective_testing.md).
2. Use the **Cheat Sheet**: Ask _"What other features will be affected?"_ or _"How will it recover from currency API failures?"_
3. Use the [Checklist](assets/prospective_testing_checklist.txt) to capture risks.

### Supervizing AI Output
_User: "The AI generated these 50 test cases for me. Are they good?"_
1. Refer to [AI and Testing](references/ai_testing.md).
2. Perform **Transpection**: Ask _"How do I know these are valid?"_ and _"Are they shallow?"_
3. Identify where the AI might be "hallucinating" or providing tautological checks.
