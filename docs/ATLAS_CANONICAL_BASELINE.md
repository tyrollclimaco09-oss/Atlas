# 🛰️ ATLAS — MASTER SYSTEM DESCRIPTION

1. WHAT ATLAS IS

ATLAS is a persistent, modular decision-making operating system and evolving thinking system.

It is designed to transform raw information into disciplined decisions while preserving the evidence, reasoning, uncertainty, outcomes, and lessons behind those decisions.

ATLAS is not merely a betting model, chatbot, database, prediction engine, or collection of APIs.

It is an ecosystem consisting of:

* intelligence gathering
* data infrastructure
* analytical reasoning
* adversarial challenge
* risk management
* execution planning
* evidence preservation
* outcome tracking
* calibration
* persistent memory
* documentation
* external-tool integration
* continuous system improvement

Its central philosophy is:

Data → Intelligence → Reasoning → Challenge → Risk → Decision → Execution → Outcome → Calibration → Improvement

ATLAS should become increasingly capable without becoming increasingly opaque.

---

2. THE CORE PHILOSOPHY

ATLAS exists to help make better decisions under uncertainty.

It should:

* seek evidence rather than confirmation
* distinguish facts from assumptions
* distinguish analysis from external intelligence
* preserve uncertainty
* challenge its own conclusions
* protect against stale or corrupted information
* preserve point-in-time information
* track what it believed before an outcome occurred
* grade itself afterward
* learn from systematic errors
* improve through controlled experiments
* require explicit approval before permanent architectural changes

ATLAS should never confuse:

confidence with certainty

or:

prediction accuracy with decision quality.

A correct outcome does not automatically mean the decision was good, and an incorrect outcome does not automatically mean the decision was bad.

---

3. ATLAS IS MODULAR

The core ATLAS modules have distinct responsibilities.

SCOUT — Intelligence Acquisition

SCOUT finds relevant information.

Responsibilities include:

* schedules
* market information
* injuries
* lineups
* weather
* statistics
* news
* external intelligence
* emerging technologies
* potentially useful datasets/tools

SCOUT gathers.

It does not automatically decide.

---

4. ORACLE — Analytical Reasoning

ORACLE converts evidence into a structured estimate.

It evaluates:

* probabilities
* expected outcomes
* fair prices
* matchup factors
* historical patterns
* player/team context
* statistical relationships
* uncertainty

Oracle answers:

“Given what we currently know, what do we believe?”

Oracle is not infallible.

Its output is a hypothesis that other modules can attack.

---

5. EDGE THIEF — Adversarial Edge Detection

EDGE THIEF exists to steal the edge from ATLAS before the market or reality does.

It attacks proposed decisions by asking:

* Is the line actually mispriced?
* Is the apparent edge already priced in?
* Is the sample misleading?
* Is the information stale?
* Is the market moving against us?
* Are we double-counting correlated evidence?
* Is the price worse than consensus?
* Is the edge large enough after uncertainty?
* What would make this thesis wrong?

Edge Thief is intentionally adversarial.

A strong prediction that survives Edge Thief is more valuable than one that was never challenged.

---

6. FORENSICS — Evidence Reconstruction

FORENSICS investigates what actually happened.

It handles:

* historical reconstruction
* source verification
* timestamp integrity
* line movement
* closing-line comparison
* data discrepancies
* decision audits
* outcome analysis
* hindsight contamination
* provider disagreements

Its key question is:

“What did ATLAS actually know at the time?”

FORENSICS protects ATLAS from rewriting history after the fact.

---

7. SENTINEL — Risk / Integrity Guardian

SENTINEL is the defensive layer.

It checks:

* data integrity
* source reliability
* conflicting information
* stale data
* exposure
* bankroll constraints
* correlation
* system failures
* model drift
* unsafe assumptions

Sentinel can veto a decision.

The desired behavior is:

Bad data → quarantine/no decision

rather than:

Bad data → confident-looking prediction

---

8. TACTICIAN — Execution

TACTICIAN turns an approved decision into an execution plan.

It considers:

* available prices
* books
* execution price
* stake sizing
* market selection
* timing
* alternative lines
* expected value
* risk/reward
* bankroll constraints

TACTICIAN does not manufacture an edge.

It executes an edge that survived the analytical layers.

---

9. FINAL GATE

Before execution, ATLAS should have a final decision gate.

Conceptually:

SCOUT → ORACLE → EDGE THIEF → FORENSICS → SENTINEL → TACTICIAN → FINAL GATE → LEDGER

The Final Gate determines whether the decision is actually permitted to proceed.

---

10. LEDGER — ATLAS’S MEMORY OF ACTION

LEDGER records what ATLAS actually did.

It should preserve:

* event
* sportsbook
* market
* selection
* line
* odds
* stake
* timestamp
* decision ID
* rationale
* status
* result
* profit/loss
* closing price
* CLV
* post-bet grade
* lesson

The Ledger is not merely a bankroll tracker.

It is the empirical memory of ATLAS’s decisions.

---

11. ARCHIVIST — LONG-TERM MEMORY

ARCHIVIST preserves institutional knowledge.

It maintains:

* important decisions
* architecture
* historical experiments
* system changes
* lessons
* prior states
* recovered information
* Codex material
* continuity records

The purpose is to prevent the Void Century problem:

ATLAS should never repeatedly rediscover things it already learned.

---

12. CALIBRATOR — INTERNAL LIVE-SERVICE BALANCING

CALIBRATOR is not a competing analytical engine.

This distinction is important.

CALIBRATOR evaluates ATLAS itself.

It asks:

* Which modules are performing well?
* Which are drifting?
* Where are false positives increasing?
* Where are false negatives increasing?
* Which assumptions are failing?
* Which data sources are unreliable?
* Which modules need adjustment?
* What experiments should be run?
* Should a component be buffed, nerfed, replaced, or retired?

CALIBRATOR proposes changes.

It does not silently rewrite ATLAS.

Permanent integration requires explicit approval.

---

13. SHADOW — EXTERNAL INTELLIGENCE FILTER

SHADOW handles external ideas and intelligence.

External tools, models, datasets, frameworks, research, and technologies should not automatically become ATLAS truth.

They enter through an intelligence pipeline.

Conceptually:

External Intelligence → SHADOW → Evaluation → Experiment → CALIBRATOR → Approval → Integration

This prevents outside systems from silently becoming ATLAS’s brain.

---

14. THE ECOSYSTEM PRINCIPLE

This is one of the most important architectural decisions.

ATLAS is an ecosystem, not a collection of plugins.

Tools are not automatically ATLAS modules.

A tool must have:

INPUTS → ROLE → OUTPUTS → CONSUMERS → FEEDBACK LOOP → FAILURE MODE

Tools integrate into the information flow.

For example:

Hot100 discovers a technology
→ SHADOW evaluates it
→ research/tests investigate it
→ CALIBRATOR measures it
→ GitHub implements it if approved
→ Supabase records relevant operational state
→ Codex documents it
→ ARCHIVIST preserves the decision.

Therefore:

NO TOOL IS AN ISLAND.

---

15. CURRENT TOOL ECOSYSTEM

GitHub — BUILD / VERSION CONTROL

GitHub is intended to become the ATLAS workshop.

It should contain:

* source code
* architecture
* migrations
* tests
* configuration
* integration adapters
* version history
* branches
* pull requests
* controlled implementation changes

The ATLAS repository is:

tyrollclimaco09-oss/Atlas

The repository is accessible, but its current GitHub integration has a write-path 403 despite repository metadata reporting push permission.

---

16. SUPABASE — OPERATIONAL MEMORY / DATA BACKBONE

Supabase is ATLAS’s persistent operational database.

We successfully deployed:

atlas_data_foundation_v01

with:

* providers
* events
* provider_events
* market_snapshots
* evidence_snapshots
* decisions
* bets
* outcomes
* calibration_runs
* architecture_changes

The database is designed around:

EVENT → PROVIDER → MARKET → EVIDENCE → DECISION → BET → OUTCOME → CALIBRATION

We subsequently deployed:

atlas_security_baseline_v01

to establish the initial security boundary and supporting indexes.

---

17. POINT-IN-TIME INTEGRITY

This is a foundational ATLAS principle.

Every meaningful piece of information should preserve:

* source
* source reference
* observed time
* effective time
* decision cutoff
* retrieval time where applicable

ATLAS must distinguish:

What happened later

from:

What was knowable when the decision was made.

This prevents hindsight leakage during historical analysis.

---

18. RAW DATA PRESERVATION

ATLAS should preserve raw provider information before normalization.

Conceptually:

RAW SOURCE → NORMALIZATION → ANALYSIS

not:

RAW SOURCE → overwrite → analysis

The raw snapshot allows FORENSICS to reconstruct what the system actually received.

---

19. EVENT RECONCILIATION

Before market data is joined to an event, providers must be reconciled.

Canonical identity includes concepts such as:

* date
* away team
* home team
* game number
* start time
* venue
* provider IDs

If providers disagree materially:

QUARANTINE

ATLAS must not blindly merge potentially different events.

---

20. MARKET DATA ARCHITECTURE

The current preferred production architecture uses multiple sources rather than trusting one vendor.

Primary candidate

The Odds API

Independent verification candidate

OddsPapi

Premium benchmark

SportsDataIO

Enterprise benchmark

Sportradar

ATLAS should eventually compare:

* price
* timestamp
* bookmaker
* market
* availability
* movement
* historical snapshots
* data freshness
* provider reliability

The goal is not:

“Which API is best?”

The goal is:

MARKET CONSENSUS

For example:

Provider A: -110
Provider B: -108
Provider C: -110
Available execution: -115

ATLAS understands that the execution price is worse than consensus.

That becomes evidence for Edge Thief—not an automatic bet.

---

21. MLB DATA

ATLAS separates:

Baseball truth

MLB ecosystem / Statcast / baseball data

from:

Betting truth

Sportsbook/odds providers

from:

Weather truth

Weather providers

from:

Decision interpretation

ATLAS.

MLB’s own data ecosystem can provide foundational baseball information, while Statcast/related tools provide advanced analytics.

---

22. WEATHER

Open-Meteo is currently a strong candidate for the weather layer because historical forecast archives allow ATLAS to reconstruct what the weather forecast looked like at the time, rather than accidentally using revised hindsight.

Weather becomes evidence, not an unquestioned prediction.

---

23. RESEARCH ECOSYSTEM

Consensus

Academic/research evidence.

Wolfram

Mathematical/statistical verification and computational sanity checks.

GitBook

Human-readable Codex/documentation layer.

Mermaid

Living architecture/data-flow diagrams.

Hot100.ai

Technology/tool scouting.

Create State

Persistent project-state/memory layer.

OpenAI Platform

Potential future AI-engineering/application layer.

Each tool remains subordinate to ATLAS’s governance.

---

24. DATA FLOW

The mature ecosystem should look approximately like: