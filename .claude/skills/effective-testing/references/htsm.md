# Heuristic Test Strategy Model (HTSM)

The HTSM is a set of guidewords and categories designed to help testers brainstorm a comprehensive test strategy. It serves as a mental map for coverage.

## 1. Project Environment (Resources, Constraints, and Pressures)
- **Customers**: Who are the stakeholders? Whose opinion matters? Who will read the test reports?
- **Information**: What do we know about the product? (Specs, user manuals, code, rumors, legacy behavior).
- **Developer Relations**: How do we communicate with builders? Is there trust or friction?
- **Test Team**: Who is doing the work? What are their skills? What is their availability?
- **Equipment & Tools**: What hardware, software, lab space, and tools are available?
- **Schedule**: When does the work start and end? What are the key milestones?
- **Test Items**: What exactly are we testing? (Version, build, components, third-party libraries).
- **Deliverables**: What must we provide? (Bug reports, status summaries, coverage outlines, test scripts).

## 2. Product Elements (The Product as a System)
- **Structure**: What is it made of? (Code, interfaces, data structures, files, configuration).
- **Function**: What does it do? (Features, calculations, error handling, startup/shutdown).
- **Data**: What does it process? (Inputs, outputs, internal states, large data sets, invalid data).
- **Platform**: What does it run on? (OS, browser, hardware, network, dependencies).
- **Operations**: How is it used? (User profiles, environment, workflows, common vs. rare tasks).
- **Time**: How does time affect it? (Concurrency, timeouts, history, date/time handling, performance over time).

## 3. Quality Criteria Categories (The "Ilities")
### External (User-Focused)
- **Capability**: Can it perform the required functions?
- **Reliability**: Can it perform consistently? (Robustness, Error recovery, Data integrity).
- **Usability**: Is it easy to use? (Learnability, Accessibility, Aesthetics).
- **Security**: Is it protected against unauthorized access? (Authentication, Authorization, Privacy).
- **Scalability**: Can it handle increased load?
- **Performance**: Is it fast enough? (Responsiveness, Throughput, Resource usage).
- **Installability**: Can it be installed and updated? (De-installation, Upgradability).
- **Compatibility**: Does it work with other systems? (Backward compatibility, Hardware/Software combos).

### Internal (Builder-Focused)
- **Supportability**: Can it be maintained and supported? (Serviceability, Documentation).
- **Testability**: How easy is it to test? (Observability, Controllability, Simplicity, Stability).
- **Maintainability**: Can it be modified? (Modularity, Extensibility, Portability).

## 4. General Test Techniques
- **Function Testing**: Testing what it does (features and functions).
- **Domain Testing**: Testing data and parameters (boundaries, equivalence classes).
- **Stress Testing**: Testing under extreme conditions (overload, low resources).
- **Flow Testing**: Testing sequences and transitions (states, workflows).
- **Scenario Testing**: Testing realistic stories and workflows (business processes, user stories).
- **Claims Testing**: Testing against documentation, marketing, and promises.
- **User Testing**: Testing from the user's perspective (alpha/beta, usability).
- **Risk Testing**: Testing specifically for potential failures (bug hunting, regression).
- **Automatic Checking**: Using tools to verify facts (unit checks, API checks, UI checks).
