# Classic Traps of Automation in Testing

In RST, we don't call it "test automation" because testing cannot be automated—only checking can. When using tools, beware of these 13 classic traps identified in Chapter 6.

## Traps of Ignorance
1. **Scripting Trap**: Believing that testing is mostly about writing scripts. This distracts from thinking, exploring, and actually finding bugs.
2. **Trusting Trap**: Assuming the tool is doing exactly what you think it is, without verifying its own behavior. Tools can have bugs too.
3. **Atrophy Trap**: Losing the manual skills and product knowledge because you rely too much on the tool. If the tool breaks, can you still test?
4. **Obscurity Trap**: Creating tools or scripts that are so complex that no one understands how they work or what they are actually checking.

## Traps of Economy
5. **Shallowness Trap**: Focusing on "happy path" checks because they are easier to automate, missing deep, complex, and high-risk bugs.
6. **Testability Trap**: Blaming the product for being "hard to automate" instead of advocating for better testability or changing your approach.
7. **Maintenance Trap**: Spending more time fixing and updating scripts than actually finding bugs in the product.
8. **Sunk Cost Trap**: Continuing to use a bad tool or approach just because you've already invested heavily in it.
9. **Learning Curve Trap**: Spending months learning a complex tool while the product goes untested in the meantime.

## Traps of Alignment
10. **Rathole Trap**: Getting obsessed with the technical "coolness" or perfection of the automation rather than the value of the testing.
11. **Legibility Trap**: Creating reports that look impressive with charts and percentages but don't actually tell the story of product quality.
12. **Harmony Trap**: Automating to please management or "check a box" rather than to support the actual testing mission.
13. **Classic GUI Trap**: Trying to automate everything through the GUI, which is often slow, fragile, and expensive compared to lower-level checks.

## The Golden Rule of Tool Adoption
**A tool should be adopted if, and only if, its value to the testing mission exceeds the total cost of its adoption and maintenance.**
- **Value** = (Increased Coverage + Faster Feedback + Human Effort Saved + New Capabilities)
- **Cost** = (Learning Time + Scripting Time + Maintenance Time + Opportunity Cost)
