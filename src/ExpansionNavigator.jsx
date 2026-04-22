import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  Target,
  RotateCcw,
  Download,
  Info,
  Check,
  Loader2,
  Compass,
  Plus,
  X,
  Users,
} from "lucide-react";

// ============================================================
// EXPANSION NAVIGATOR FOR CSMs
// A decision tool for evaluating which AI use case within an
// account represents the strongest expansion bet for a
// context layer platform.
// ============================================================

const DIMENSIONS = [
  {
    id: "data_foundation",
    name: "Data Foundation Readiness",
    group: "feasibility",
    short: "Is the underlying data structured enough for a context layer to act on?",
    guidance: {
      1: "Data is fragmented, ungoverned, lives in shadow tools. Nothing for a context layer to anchor to.",
      3: "Some sources connected and partially documented. Mixed quality across domains.",
      5: "Critical data is in connected sources, well-modeled, with established ownership.",
    },
  },
  {
    id: "context_gap",
    name: "Context Gap Severity",
    group: "feasibility",
    short: "How badly does this AI use case fail without governed context?",
    guidance: {
      1: "AI use case tolerates ambiguity well; bad context isn't catastrophic.",
      3: "Context matters for quality but not for trust. Errors are recoverable.",
      5: "Without governed context, outputs are unreliable, untraceable, or unsafe to act on.",
    },
  },
  {
    id: "governance_trust",
    name: "Governance & Trust Requirements",
    group: "feasibility",
    short: "What's the cost of a wrong AI output, and what auditability is required?",
    guidance: {
      1: "Low-stakes outputs. No regulatory or audit pressure.",
      3: "Moderate stakes. Internal accountability but no external compliance trigger.",
      5: "High-stakes outputs. Auditability, traceability, and policy alignment are non-negotiable.",
    },
  },
  {
    id: "ai_maturity",
    name: "AI Use Case Maturity",
    group: "value",
    short: "How far along is this team's AI adoption — and how fast does a context layer unlock value?",
    guidance: {
      1: "Early exploration. AI value still hypothetical. Long path to measurable outcome.",
      3: "Pilots in motion. Some momentum but unproven at scale.",
      5: "Active production use cases. The platform slots into a live problem with immediate impact.",
    },
  },
  {
    id: "expansion_mechanics",
    name: "Expansion Mechanics",
    group: "value",
    short: "How does winning this team unlock broader platform adoption?",
    guidance: {
      1: "Isolated team. Win stays contained. No pull on other groups or licenses.",
      3: "Some halo potential — adjacent teams may follow, but no clear pull.",
      5: "Strong flywheel. Win activates dormant licenses, creates reference moments, pulls in adjacent teams.",
    },
  },
];

const POSTURE_OPTIONS = [
  { value: "advocate", label: "Advocate" },
  { value: "neutral", label: "Neutral" },
  { value: "skeptical", label: "Skeptical" },
  { value: "unknown", label: "Unknown" },
];

const INFLUENCE_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// ============================================================
// EMPTY STARTING STATE
// ============================================================

const EMPTY_ACCOUNT = {
  name: "",
  arr: "",
  renewal: "",
  context: "",
};

const emptyScores = () =>
  Object.fromEntries(DIMENSIONS.map((d) => [d.id, { score: 0, rationale: "" }]));

const makeEmptyStakeholder = (id) => ({
  id,
  name: "",
  role: "",
  posture: "unknown",
  influence: "medium",
  scope: "",
  notes: "",
});

const EMPTY_STAKEHOLDERS = [
  makeEmptyStakeholder("sh1"),
  makeEmptyStakeholder("sh2"),
];

const EMPTY_USE_CASES = [
  { id: "uc1", team: "", sponsor: "", description: "", state: "pilot", scores: emptyScores() },
  { id: "uc2", team: "", sponsor: "", description: "", state: "pilot", scores: emptyScores() },
];

const MAX_STAKEHOLDERS = 5;
const MIN_STAKEHOLDERS = 1;

// ============================================================
// COMPONENT
// ============================================================

export default function ExpansionNavigator() {
  const [step, setStep] = useState(-1); // -1 = welcome screen
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  const [stakeholders, setStakeholders] = useState(EMPTY_STAKEHOLDERS);
  const [useCases, setUseCases] = useState(EMPTY_USE_CASES);
  const [pressureTest, setPressureTest] = useState(null);
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState({ pressure: false, brief: false });
  const [error, setError] = useState(null);

  const steps = ["Account", "Stakeholders", "Use Cases", "Score", "Pressure Test", "Recommendation"];

  // ---------- Scoring math ----------
  const scoredCases = useMemo(() => {
    return useCases.map((uc) => {
      const scores = Object.values(uc.scores).map((s) => s.score || 0);
      const total = scores.reduce((a, b) => a + b, 0);
      const max = DIMENSIONS.length * 5;
      const pct = Math.round((total / max) * 100);
      const feasibilityDims = DIMENSIONS.filter((d) => d.group === "feasibility");
      const valueDims = DIMENSIONS.filter((d) => d.group === "value");
      const feasibility =
        feasibilityDims.reduce((sum, d) => sum + (uc.scores[d.id]?.score || 0), 0) /
        feasibilityDims.length;
      const value =
        valueDims.reduce((sum, d) => sum + (uc.scores[d.id]?.score || 0), 0) / valueDims.length;
      return { ...uc, total, max, pct, feasibility, value };
    });
  }, [useCases]);

  const winner = useMemo(() => {
    if (scoredCases.length === 0) return null;
    const sorted = [...scoredCases].sort((a, b) => b.total - a.total);
    if (sorted[0].total === 0) return null;
    return sorted[0];
  }, [scoredCases]);

  // ---------- Stakeholder management ----------
  const addStakeholder = () => {
    if (stakeholders.length >= MAX_STAKEHOLDERS) return;
    const newId = `sh${Date.now()}`;
    setStakeholders([...stakeholders, makeEmptyStakeholder(newId)]);
  };

  const removeStakeholder = (id) => {
    if (stakeholders.length <= MIN_STAKEHOLDERS) return;
    setStakeholders(stakeholders.filter((s) => s.id !== id));
  };

  const updateStakeholder = (id, field, value) => {
    setStakeholders(
      stakeholders.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // ---------- AI calls (via Vercel serverless function) ----------
  const callClaude = async (prompt) => {
    const response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    const data = await response.json();
    return data.text;
  };

  const buildContextBlock = () => {
    const stakeholderBlock = stakeholders
      .filter((s) => s.name || s.role)
      .map((s) => {
        const postureLabel = POSTURE_OPTIONS.find((p) => p.value === s.posture)?.label || s.posture;
        const influenceLabel = INFLUENCE_OPTIONS.find((i) => i.value === s.influence)?.label || s.influence;
        return `  - ${s.name || "(unnamed)"} — ${s.role || "(no role)"} | Posture: ${postureLabel} | Influence: ${influenceLabel} | Scope: ${s.scope || "(not specified)"} | Notes: ${s.notes || "(none)"}`;
      })
      .join("\n");

    const usecaseBlock = scoredCases
      .map((uc) => {
        const scoreLines = DIMENSIONS.map(
          (d) =>
            `  - ${d.name}: ${uc.scores[d.id]?.score}/5 — "${uc.scores[d.id]?.rationale || "(no rationale provided)"}"`
        ).join("\n");
        return `USE CASE: ${uc.team || "(unnamed)"}
Sponsor: ${uc.sponsor || "(none specified)"}
Description: ${uc.description || "(none)"}
State: ${uc.state}
Scores:
${scoreLines}`;
      })
      .join("\n\n");

    return `ACCOUNT: ${account.name || "(unnamed)"}
ARR: ${account.arr || "(not specified)"}
Renewal: ${account.renewal || "(not specified)"}
Strategic context: ${account.context || "(none provided)"}

KEY STAKEHOLDERS:
${stakeholderBlock || "  (none provided)"}

${usecaseBlock}`;
  };

  const runPressureTest = async () => {
    setError(null);
    setLoading((l) => ({ ...l, pressure: true }));
    try {
      const prompt = `You are a senior Customer Success leader at a context layer platform company, pressure-testing a CSM's expansion analysis. Be sharp, specific, and constructive — not generic.

${buildContextBlock()}

Provide your critique in four sections using markdown:

## Inconsistencies in your scoring
Identify any place where the score doesn't match the rationale, or where two scores feel inconsistent with each other. Be specific — quote the rationale text directly.

## Stakeholder blind spots
Look at the stakeholder landscape alongside the use case scoring. Surface issues like: missing sponsors, account-wide stakeholders whose posture isn't reflected in the analysis, influence gaps, or skeptical stakeholders whose concerns must be addressed before expansion can proceed. Call out specific people by name.

## Blind spots in the analysis
Surface 2-3 things the CSM may not have considered. Focus on context-layer-specific risks (governance, data foundation, AI use case viability, renewal dynamics).

## The skeptical exec rebuttal
Write the pushback this recommendation would face from a skeptical CFO or CRO. Then add one line on how the CSM should answer it.

Be direct. Avoid hedging language. This is a working tool, not a polite memo.`;
      const result = await callClaude(prompt);
      setPressureTest(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((l) => ({ ...l, pressure: false }));
    }
  };

  const generateBrief = async () => {
    setError(null);
    setLoading((l) => ({ ...l, brief: true }));
    try {
      const winnerName = winner?.team || "the leading use case";
      const otherName =
        scoredCases.find((c) => c.id !== winner?.id)?.team || "the other use case";
      const prompt = `You are a Customer Success Manager writing a one-page expansion recommendation brief for an internal account review.

${buildContextBlock()}

The leading use case by score is: ${winnerName} (${winner?.total}/${winner?.max}).

Write the brief in markdown with these sections:

# Recommendation: [your recommendation in one line]

## The Bet
One paragraph: which use case to lead with and why.

## Why ${winnerName} Wins on the Scorecard
3-4 bullets calling out the highest-scoring dimensions and what they signal.

## Why Not ${otherName} First
One paragraph framing the other use case as a follow-on, not a competing path.

## Stakeholder Engagement Plan
For each key stakeholder named in the input, 1-2 sentences on how to engage them specifically to unlock this expansion. Call out account-wide stakeholders (like AI governance owners) who don't own either use case but whose posture matters.

## Top 3 Risks
Numbered list. Be specific to this account, not generic.

## What to Validate Before Committing
Bulleted list of 3-4 things the CSM still needs to confirm.

## 30 / 60 / 90 Motion
Three short paragraphs (Days 0-30, Days 31-60, Days 61-90) with concrete actions.

Write with conviction. This is a recommendation, not a discussion.`;
      const result = await callClaude(prompt);
      setBrief(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((l) => ({ ...l, brief: false }));
    }
  };

  const reset = () => {
    setAccount(EMPTY_ACCOUNT);
    setStakeholders([makeEmptyStakeholder("sh1"), makeEmptyStakeholder("sh2")]);
    setUseCases([
      { id: "uc1", team: "", sponsor: "", description: "", state: "pilot", scores: emptyScores() },
      { id: "uc2", team: "", sponsor: "", description: "", state: "pilot", scores: emptyScores() },
    ]);
    setPressureTest(null);
    setBrief(null);
    setError(null);
    setStep(-1);
  };

  const downloadBrief = () => {
    if (!brief) return;
    const blob = new Blob([brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${account.name || "account"}-expansion-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Markdown renderer ----------
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("# "))
        return (
          <h1 key={i} className="text-2xl font-serif mt-6 mb-3 text-stone-900">
            {line.slice(2)}
          </h1>
        );
      if (line.startsWith("## "))
        return (
          <h2
            key={i}
            className="text-lg font-serif mt-5 mb-2 text-stone-900 border-b border-stone-200 pb-1"
          >
            {line.slice(3)}
          </h2>
        );
      if (line.startsWith("### "))
        return (
          <h3 key={i} className="text-base font-semibold mt-4 mb-2 text-stone-800">
            {line.slice(4)}
          </h3>
        );
      if (line.startsWith("- "))
        return (
          <li key={i} className="ml-5 list-disc text-stone-700 my-1">
            {renderInline(line.slice(2))}
          </li>
        );
      if (/^\d+\./.test(line))
        return (
          <li key={i} className="ml-5 list-decimal text-stone-700 my-1">
            {renderInline(line.replace(/^\d+\.\s*/, ""))}
          </li>
        );
      if (line.trim() === "") return <div key={i} className="h-2"></div>;
      return (
        <p key={i} className="text-stone-700 my-2 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    });
  };

  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**"))
        return (
          <strong key={i} className="font-semibold text-stone-900">
            {p.slice(2, -2)}
          </strong>
        );
      if (p.startsWith("*") && p.endsWith("*"))
        return (
          <em key={i} className="italic">
            {p.slice(1, -1)}
          </em>
        );
      return p;
    });
  };

  // ============================================================
  // WELCOME SCREEN (step === -1)
  // ============================================================
  if (step === -1) {
    return (
      <div
        className="min-h-screen bg-stone-50 flex items-center justify-center px-6"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        <FontStyles />
        <div className="max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] font-mono text-stone-500">
              For Customer Success Managers
            </div>
          </div>

          <h1 className="font-serif text-5xl text-stone-900 leading-tight mb-6">
            Expansion Navigator
          </h1>

          <p className="text-lg text-stone-600 leading-relaxed mb-10 max-w-xl">
            A decision tool for CSMs evaluating which AI use case within an account represents the
            strongest expansion bet for a context layer platform.
          </p>

          <div className="grid grid-cols-3 gap-6 mb-12">
            <Step number="01" label="Account & stakeholders" />
            <Step number="02" label="Score 5 dimensions" />
            <Step number="03" label="AI critique & brief" />
          </div>

          <div className="border-t border-stone-200 pt-8 mb-10">
            <p className="text-sm text-stone-500 leading-relaxed">
              The thesis: AI is only as good as the context behind it. This tool applies that same
              logic to expansion decisions. Five dimensions — three measuring whether the bet is
              winnable, two measuring whether it's worth winning. Score each, write your rationale,
              and let the tool pressure-test the analysis against the stakeholder landscape.
            </p>
          </div>

          <button
            onClick={() => setStep(0)}
            className="px-7 py-3.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 inline-flex items-center gap-2 group"
          >
            Start
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================
  return (
    <div
      className="min-h-screen bg-stone-50"
      style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
    >
      <FontStyles />

      {/* Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <button
            onClick={() => setStep(-1)}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="text-left">
              <h1 className="font-serif text-xl text-stone-900 leading-none">
                Expansion Navigator
              </h1>
              <p className="text-xs text-stone-500 mt-1 tracking-wide uppercase">
                For CSMs
              </p>
            </div>
          </button>
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded border border-stone-300 hover:border-stone-900 text-stone-700 hover:text-stone-900 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Start over
          </button>
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-6xl mx-auto px-8 pt-8">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => setStep(i)}
                className={`px-3 py-1.5 rounded-full transition ${
                  i === step
                    ? "bg-stone-900 text-white"
                    : i < step
                    ? "text-stone-900 hover:bg-stone-200"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <span className="font-mono opacity-60 mr-1.5">0{i + 1}</span>
                {s}
              </button>
              {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-stone-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-8 py-8 pb-24">
        {/* STEP 0 — ACCOUNT */}
        {step === 0 && (
          <div>
            <SectionHeader
              eyebrow="Step 01"
              title="Account context"
              description="The shared context that grounds every downstream judgment. AI is only as good as the context behind it — that thesis applies to CSM decisions too."
            />
            <div className="grid grid-cols-2 gap-6 mt-8">
              <Field label="Account name">
                <input
                  value={account.name}
                  onChange={(e) => setAccount({ ...account, name: e.target.value })}
                  className="input"
                  placeholder="e.g. Acme Cloud"
                />
              </Field>
              <Field label="ARR">
                <input
                  value={account.arr}
                  onChange={(e) => setAccount({ ...account, arr: e.target.value })}
                  className="input"
                  placeholder="e.g. $325K"
                />
              </Field>
              <Field label="Renewal window">
                <input
                  value={account.renewal}
                  onChange={(e) => setAccount({ ...account, renewal: e.target.value })}
                  className="input"
                  placeholder="e.g. < 6 months"
                />
              </Field>
              <div></div>
              <div className="col-span-2">
                <Field label="Strategic context — what's actually going on in this account">
                  <textarea
                    value={account.context}
                    onChange={(e) => setAccount({ ...account, context: e.target.value })}
                    rows={6}
                    className="input"
                    placeholder="Customer maturity, adoption health, current escalations, AI initiatives in flight, license utilization, anything that shapes the expansion judgment..."
                  />
                </Field>
              </div>
            </div>
            <NextBack onNext={() => setStep(1)} />
          </div>
        )}

        {/* STEP 1 — STAKEHOLDERS */}
        {step === 1 && (
          <div>
            <SectionHeader
              eyebrow="Step 02"
              title="Stakeholder landscape"
              description="Who are the key people across this account whose posture affects the expansion decision? Include stakeholders who don't own a specific use case but influence the broader motion — AI governance owners, executive sponsors, skeptics."
            />
            <div className="mt-8 space-y-4">
              {stakeholders.map((s, idx) => (
                <div
                  key={s.id}
                  className="border border-stone-200 bg-white rounded-lg p-6 relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-stone-600" />
                      </div>
                      <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                        Stakeholder {idx + 1}
                      </span>
                    </div>
                    {stakeholders.length > MIN_STAKEHOLDERS && (
                      <button
                        onClick={() => removeStakeholder(s.id)}
                        className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Name">
                      <input
                        value={s.name}
                        onChange={(e) => updateStakeholder(s.id, "name", e.target.value)}
                        className="input"
                        placeholder="e.g. Jordan Chen"
                      />
                    </Field>
                    <Field label="Role / title">
                      <input
                        value={s.role}
                        onChange={(e) => updateStakeholder(s.id, "role", e.target.value)}
                        className="input"
                        placeholder="e.g. VP, AI & Data Products"
                      />
                    </Field>
                    <Field label="Posture toward the platform">
                      <select
                        value={s.posture}
                        onChange={(e) => updateStakeholder(s.id, "posture", e.target.value)}
                        className="input"
                      >
                        {POSTURE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Influence">
                      <select
                        value={s.influence}
                        onChange={(e) => updateStakeholder(s.id, "influence", e.target.value)}
                        className="input"
                      >
                        {INFLUENCE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="col-span-2">
                      <Field label="Scope of ownership">
                        <input
                          value={s.scope}
                          onChange={(e) => updateStakeholder(s.id, "scope", e.target.value)}
                          className="input"
                          placeholder="e.g. Account-wide AI governance, Finance use case, etc."
                        />
                      </Field>
                    </div>
                    <div className="col-span-2">
                      <Field label="Notes — concerns, history, what matters to them">
                        <textarea
                          value={s.notes}
                          onChange={(e) => updateStakeholder(s.id, "notes", e.target.value)}
                          rows={2}
                          className="input"
                          placeholder="Their worldview, hot buttons, prior engagement, what they need to see to move..."
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ))}

              {stakeholders.length < MAX_STAKEHOLDERS && (
                <button
                  onClick={addStakeholder}
                  className="w-full border border-dashed border-stone-300 rounded-lg py-4 text-sm text-stone-500 hover:text-stone-900 hover:border-stone-900 flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add stakeholder
                </button>
              )}
            </div>
            <NextBack onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </div>
        )}

        {/* STEP 2 — USE CASES */}
        {step === 2 && (
          <div>
            <SectionHeader
              eyebrow="Step 03"
              title="Candidate AI use cases"
              description="The expansion paths under consideration. Each will be scored against the same five context-layer dimensions."
            />
            <div className="grid grid-cols-2 gap-6 mt-8">
              {useCases.map((uc, idx) => (
                <div key={uc.id} className="border border-stone-200 bg-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                      Use case {idx + 1}
                    </span>
                  </div>
                  <Field label="Team">
                    <input
                      value={uc.team}
                      onChange={(e) => {
                        const next = [...useCases];
                        next[idx] = { ...uc, team: e.target.value };
                        setUseCases(next);
                      }}
                      className="input"
                      placeholder="e.g. Marketing"
                    />
                  </Field>
                  <Field label="Sponsor / champion">
                    <input
                      value={uc.sponsor}
                      onChange={(e) => {
                        const next = [...useCases];
                        next[idx] = { ...uc, sponsor: e.target.value };
                        setUseCases(next);
                      }}
                      className="input"
                      placeholder="Named stakeholder, role, level of engagement"
                    />
                  </Field>
                  <Field label="Use case description">
                    <textarea
                      value={uc.description}
                      onChange={(e) => {
                        const next = [...useCases];
                        next[idx] = { ...uc, description: e.target.value };
                        setUseCases(next);
                      }}
                      rows={3}
                      className="input"
                      placeholder="What is this team trying to do with AI, and where does the platform fit?"
                    />
                  </Field>
                  <Field label="Current state">
                    <select
                      value={uc.state}
                      onChange={(e) => {
                        const next = [...useCases];
                        next[idx] = { ...uc, state: e.target.value };
                        setUseCases(next);
                      }}
                      className="input"
                    >
                      <option value="exploration">Exploration</option>
                      <option value="pilot">Pilot</option>
                      <option value="in_development">In development</option>
                      <option value="production">Production</option>
                    </select>
                  </Field>
                </div>
              ))}
            </div>
            <NextBack onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        )}

        {/* STEP 3 — SCORE */}
        {step === 3 && (
          <div>
            <SectionHeader
              eyebrow="Step 04"
              title="Score each use case"
              description="Five context-layer dimensions, grouped by feasibility (can we win it?) and value (is it worth winning?). Score 1-5 with a one-line rationale."
            />
            <div className="mt-8 space-y-8">
              {DIMENSIONS.map((dim) => (
                <div
                  key={dim.id}
                  className="border border-stone-200 bg-white rounded-lg overflow-hidden"
                >
                  <div className="bg-stone-50 px-6 py-4 border-b border-stone-200">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded ${
                              dim.group === "feasibility"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {dim.group}
                          </span>
                          <h3 className="font-serif text-lg text-stone-900">{dim.name}</h3>
                        </div>
                        <p className="text-sm text-stone-600 mt-1">{dim.short}</p>
                      </div>
                      <Tooltip
                        content={
                          <div className="text-xs space-y-1.5">
                            <div>
                              <strong className="text-emerald-300">5:</strong> {dim.guidance[5]}
                            </div>
                            <div>
                              <strong className="text-amber-300">3:</strong> {dim.guidance[3]}
                            </div>
                            <div>
                              <strong className="text-rose-300">1:</strong> {dim.guidance[1]}
                            </div>
                          </div>
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-stone-200">
                    {useCases.map((uc, idx) => (
                      <div key={uc.id} className="p-6">
                        <div className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-3">
                          {uc.team || `Use case ${idx + 1}`}
                        </div>
                        <div className="flex items-center gap-1.5 mb-3">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => {
                                const next = [...useCases];
                                next[idx] = {
                                  ...uc,
                                  scores: {
                                    ...uc.scores,
                                    [dim.id]: { ...uc.scores[dim.id], score: n },
                                  },
                                };
                                setUseCases(next);
                              }}
                              className={`w-9 h-9 rounded-md text-sm font-medium transition ${
                                uc.scores[dim.id]?.score === n
                                  ? "bg-stone-900 text-white"
                                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="One-line rationale..."
                          value={uc.scores[dim.id]?.rationale || ""}
                          onChange={(e) => {
                            const next = [...useCases];
                            next[idx] = {
                              ...uc,
                              scores: {
                                ...uc.scores,
                                [dim.id]: { ...uc.scores[dim.id], rationale: e.target.value },
                              },
                            };
                            setUseCases(next);
                          }}
                          rows={2}
                          className="input text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Score summary */}
            <div className="mt-10 grid grid-cols-2 gap-6">
              {scoredCases.map((uc) => (
                <div key={uc.id} className="border border-stone-200 bg-white rounded-lg p-6">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-serif text-xl text-stone-900">
                      {uc.team || "Use case"}
                    </h3>
                    <div className="text-3xl font-serif text-stone-900">
                      {uc.total}
                      <span className="text-stone-400 text-lg">/{uc.max}</span>
                    </div>
                  </div>
                  <div className="text-xs text-stone-500 mb-4">
                    {uc.pct}% — feasibility {uc.feasibility.toFixed(1)} • value{" "}
                    {uc.value.toFixed(1)}
                  </div>
                  <div className="space-y-1.5">
                    {DIMENSIONS.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 text-xs">
                        <div className="flex-1 text-stone-600">{d.name}</div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div
                              key={n}
                              className={`w-2 h-2 rounded-sm ${
                                n <= (uc.scores[d.id]?.score || 0)
                                  ? "bg-stone-900"
                                  : "bg-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <NextBack onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </div>
        )}

        {/* STEP 4 — PRESSURE TEST */}
        {step === 4 && (
          <div>
            <SectionHeader
              eyebrow="Step 05"
              title="AI pressure test"
              description="Claude reviews your scoring, rationale, and stakeholder landscape. Looks for inconsistencies, stakeholder blind spots, and writes the skeptical exec rebuttal you'd face."
            />

            {!pressureTest && !loading.pressure && (
              <div className="mt-8 bg-white border border-stone-200 rounded-lg p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-5 h-5 text-stone-700" />
                </div>
                <h3 className="font-serif text-lg text-stone-900 mb-2">
                  Pressure-test your analysis
                </h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto mb-6">
                  Claude will review your scoring, the stakeholder landscape, flag
                  inconsistencies, surface blind spots, and write the skeptical exec rebuttal.
                </p>
                <button
                  onClick={runPressureTest}
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Run pressure test
                </button>
              </div>
            )}

            {loading.pressure && (
              <div className="mt-8 bg-white border border-stone-200 rounded-lg p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-stone-700 mx-auto mb-3" />
                <p className="text-sm text-stone-600">Pressure-testing your analysis...</p>
              </div>
            )}

            {error && (
              <div className="mt-8 bg-rose-50 border border-rose-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-rose-900 mb-1">Something went wrong</h4>
                    <p className="text-sm text-rose-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {pressureTest && (
              <div className="mt-8 bg-white border border-stone-200 rounded-lg p-8">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-stone-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs uppercase tracking-wider font-mono text-stone-500">
                    Critique
                  </span>
                </div>
                <div className="prose prose-stone max-w-none">{renderMarkdown(pressureTest)}</div>
                <button
                  onClick={() => {
                    setPressureTest(null);
                    runPressureTest();
                  }}
                  className="mt-6 text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Re-run pressure test
                </button>
              </div>
            )}

            <NextBack
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
              nextLabel="Generate recommendation"
            />
          </div>
        )}

        {/* STEP 5 — RECOMMENDATION */}
        {step === 5 && (
          <div>
            <SectionHeader
              eyebrow="Step 06"
              title="Recommendation brief"
              description="A one-page expansion brief — the kind of thing a CSM walks into a deal review with."
            />

            {!brief && !loading.brief && (
              <div className="mt-8 bg-white border border-stone-200 rounded-lg p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-5 h-5 text-stone-700" />
                </div>
                <h3 className="font-serif text-lg text-stone-900 mb-2">Generate the brief</h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto mb-6">
                  Based on your scoring, rationale, stakeholder landscape, and the pressure test —
                  Claude writes the recommendation brief.
                </p>
                {winner && (
                  <p className="text-xs text-stone-500 mb-6">
                    Leading by score:{" "}
                    <strong className="text-stone-900">{winner.team || "Use case 1"}</strong> (
                    {winner.total}/{winner.max})
                  </p>
                )}
                <button
                  onClick={generateBrief}
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate brief
                </button>
              </div>
            )}

            {loading.brief && (
              <div className="mt-8 bg-white border border-stone-200 rounded-lg p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-stone-700 mx-auto mb-3" />
                <p className="text-sm text-stone-600">Writing the brief...</p>
              </div>
            )}

            {error && (
              <div className="mt-8 bg-rose-50 border border-rose-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-rose-900 mb-1">Something went wrong</h4>
                    <p className="text-sm text-rose-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {brief && (
              <div className="mt-8 bg-white border border-stone-200 rounded-lg p-10">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs uppercase tracking-wider font-mono text-stone-500">
                      Internal expansion brief — {account.name || "account"}
                    </span>
                  </div>
                  <button
                    onClick={downloadBrief}
                    className="text-xs px-3 py-1.5 rounded border border-stone-300 hover:border-stone-900 text-stone-700 hover:text-stone-900 flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
                <div className="prose prose-stone max-w-none">{renderMarkdown(brief)}</div>
              </div>
            )}

            <NextBack onBack={() => setStep(4)} hideNext />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-6 text-xs text-stone-500 flex items-center justify-between">
          <div>
            <span className="font-serif text-stone-700">Expansion Navigator</span> · Built as a CSM
            thinking partner, not a decision-maker
          </div>
          <div className="font-mono">v1.1</div>
        </div>
      </footer>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid rgb(214, 211, 209);
          border-radius: 0.375rem;
          background: white;
          font-size: 0.875rem;
          color: rgb(28, 25, 23);
          outline: none;
          transition: border-color 0.15s;
        }
        .input::placeholder {
          color: rgb(168, 162, 158);
        }
        .input:focus {
          border-color: rgb(28, 25, 23);
        }
      `}</style>
    </div>
  );
}

// ============================================================
// SUBCOMPONENTS
// ============================================================

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
      .font-serif { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
      .font-sans { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
      body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
    `}</style>
  );
}

function Step({ number, label }) {
  return (
    <div>
      <div className="text-[10px] font-mono text-stone-400 mb-2">{number}</div>
      <div className="text-sm text-stone-700 font-medium">{label}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="border-l-2 border-stone-900 pl-6">
      <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-stone-500 mb-2">
        {eyebrow}
      </div>
      <h2 className="font-serif text-3xl text-stone-900 mb-2 leading-tight">{title}</h2>
      <p className="text-stone-600 text-sm max-w-2xl leading-relaxed">{description}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wider font-mono text-stone-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function NextBack({ onBack, onNext, nextLabel = "Continue", hideNext }) {
  return (
    <div className="mt-12 pt-6 border-t border-stone-200 flex items-center justify-between">
      {onBack ? (
        <button
          onClick={onBack}
          className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      ) : (
        <div />
      )}
      {!hideNext && onNext && (
        <button
          onClick={onNext}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 flex items-center gap-1.5"
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function Tooltip({ content }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center"
      >
        <Info className="w-3.5 h-3.5 text-stone-600" />
      </button>
      {show && (
        <div className="absolute right-0 top-9 w-80 bg-stone-900 text-stone-100 p-4 rounded-lg shadow-xl z-10">
          {content}
        </div>
      )}
    </div>
  );
}
