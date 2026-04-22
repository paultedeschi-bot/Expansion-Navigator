# Expansion Navigator

A decision tool for Atlan CSMs evaluating which AI use case within a customer account represents the strongest expansion bet for the Context Layer.

## What it does

Walks a CSM through five steps:

1. **Account context** — capture the strategic situation
2. **Candidate use cases** — define 2 expansion paths under consideration
3. **Score** — rate each use case across 5 Atlan-specific dimensions with a written rationale
4. **AI pressure test** — Claude critiques the analysis: inconsistencies, blind spots, skeptical exec rebuttal
5. **Recommendation brief** — Claude generates a one-page expansion brief, downloadable as markdown

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

## Tech

- React + Vite
- Tailwind CSS
- Vercel serverless function calling Claude (Anthropic API)
- API key stored as environment variable on Vercel — never exposed to the browser

## Setup

See `DEPLOYMENT.md` for the full step-by-step guide.

## Why it exists

Atlan CSMs make expansion bets within accounts every day — which team to back, which AI use case to invest in. There's no tooling for it. This tool applies Atlan's own thesis (AI is only as good as the context behind it) to the CSM decision: structured context inputs + AI pressure-testing produce a defensible recommendation a CSM can take into a deal review.
