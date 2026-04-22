# Expansion Navigator

A decision tool for Customer Success Managers evaluating which AI use case within a customer account represents the strongest expansion bet for a context layer platform.

## What it does

Walks a CSM through six steps:

1. **Account context** — capture the strategic situation
2. **Stakeholder landscape** — map the key people across the account and their posture toward the platform
3. **Candidate use cases** — define 2 expansion paths under consideration
4. **Score** — rate each use case across 5 dimensions with a written rationale
5. **AI pressure test** — Claude critiques the analysis: inconsistencies, stakeholder blind spots, skeptical exec rebuttal
6. **Recommendation brief** — Claude generates a one-page expansion brief including a stakeholder engagement plan, downloadable as markdown

## The five dimensions

Grouped by feasibility (can we win it?) and value (is it worth winning?):

**Feasibility**
- Data Foundation Readiness
- Context Gap Severity
- Governance & Trust Requirements

**Value**
- AI Use Case Maturity
- Expansion Mechanics

Each is scored 1-5 with a one-line rationale. The rationale is what makes the AI critique meaningful — a score without reasoning is just a guess.

## The stakeholder landscape

Stakeholders are modeled separately from use cases because in enterprise accounts, the key people influencing an expansion decision often aren't bound to a single use case. AI governance owners, executive sponsors, and skeptics all shape the motion from above. Each stakeholder is captured with name, role, posture (advocate / neutral / skeptical / unknown), influence, scope of ownership, and notes. Both the pressure test and the final brief reason about the stakeholder landscape alongside the use case scoring.

## Tech

- React + Vite
- Tailwind CSS
- Vercel serverless function calling Claude (Anthropic API)
- API key stored as environment variable on Vercel — never exposed to the browser

## Setup

See `DEPLOYMENT.md` for the full step-by-step guide.

## Why it exists

CSMs make expansion bets within accounts every day — which team to back, which AI use case to invest in. There's no tooling for it. This tool structures the decision across dimensions that reflect how AI use cases actually succeed or fail when grounded in governed context, combined with the stakeholder dynamics that determine whether the expansion actually lands.
