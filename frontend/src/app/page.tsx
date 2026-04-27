"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";

const FEATURES = [
  { icon: "⚙️", title: "Adaptive Pipeline Engine", desc: "Auto-selects between LogisticRegression, RandomForest, and LightGBM based on dataset size and cardinality." },
  { icon: "📊", title: "Real-Time Drift Detection", desc: "Kolmogorov-Smirnov (numerical) + Chi-Square (categorical) testing. Rate-limited alerts on every request." },
  { icon: "⚡", title: "Sub-10ms Inference", desc: "Unified joblib pipelines pre-loaded at boot. Zero cold-start. P95 under 10ms on shared CPU cores." },
  { icon: "🧠", title: "Operationalized SHAP", desc: "MD5-cached SHAP explanations per request. Binary classification multi-dim array support with 50-row OOM guard." },
  { icon: "🔁", title: "Async Feedback Loop", desc: "Delayed ground-truth reconciliation via request IDs. Evaluates live F1 scores without blocking inference." },
  { icon: "🛡️", title: "LLM Structural Planner", desc: "Guardrailed LLM override layer for architecture decisions. Every decision logged with a full rationale." },
];

const ARCH_NODES = [
  { label: "User", color: "#3b82f6", textColor: "#fff" },
  { label: "FastAPI", color: "rgba(255,255,255,0.06)", textColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" },
  { label: "Pipeline", color: "rgba(255,255,255,0.06)", textColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" },
  { label: "Model", color: "rgba(255,255,255,0.06)", textColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" },
  { label: "Drift Monitor", color: "rgba(234,179,8,0.12)", textColor: "#eab308", border: "1px solid rgba(234,179,8,0.2)" },
  { label: "Feedback", color: "rgba(255,255,255,0.06)", textColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" },
  { label: "Alerts", color: "rgba(239,68,68,0.12)", textColor: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
];

const ENDPOINTS = [
  { method: "POST", path: "/predict",  desc: "Batch inference — class predictions + request IDs" },
  { method: "POST", path: "/explain",  desc: "SHAP feature contributions (cached, hard-capped at 50 rows)" },
  { method: "POST", path: "/feedback", desc: "Reconcile delayed ground truth labels by request ID" },
  { method: "GET",  path: "/health",   desc: "Pipeline + explainer readiness check" },
  { method: "GET",  path: "/alerts",   desc: "Drift alert history from Sentinel monitor" },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#fff", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ paddingTop: 160, paddingBottom: 96, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", display: "flex", flexDirection: "column", gap: 36 }}>
          <Badge />
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 700 }}>
            <h1 style={{ fontSize: 60, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#fff", margin: 0 }}>
              Autonomous ML Builder
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.75, color: "rgba(255,255,255,0.5)", margin: 0, maxWidth: 580 }}>
              Production-grade ML lifecycle system with real-time drift detection, SHAP explainability, and auto pipeline design. Built for resource-constrained environments.
            </p>
          </div>
          <HeroCTAs />
          <Stats />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Capabilities</p>
            <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", margin: 0 }}>What this system does</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>System Design</p>
            <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", margin: 0 }}>Architecture</h2>
          </div>

          <div style={{ borderRadius: 16, backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: 28, overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: "max-content" }}>
              {ARCH_NODES.map((n, i) => (
                <div key={n.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ArchNode node={n} />
                  {i < ARCH_NODES.length - 1 && <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 18 }}>→</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px,1fr))", gap: 12 }}>
            {ENDPOINTS.map((ep) => <EndpointRow key={ep.path} {...ep} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto" }}>
          <div style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", background: "linear-gradient(135deg, rgba(59,130,246,0.07), rgba(255,255,255,0.01))", padding: "64px 48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", margin: 0 }}>Ready to test the system?</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.4)", maxWidth: 480, lineHeight: 1.7, margin: 0 }}>
              Run live inference, inspect SHAP explanations, inject drift, and monitor the full ML lifecycle.
            </p>
            <HoverLink href="/app" primary>Launch App <ArrowRight style={{ width: 16, height: 16 }} /></HoverLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "28px 24px" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0 }}>Autonomous ML Builder · v1.0.0 · MIT License · Built by Vedant Jadhav</p>
          <div style={{ display: "flex", gap: 24 }}>
            <HoverA href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank">GitHub</HoverA>
            <HoverLink href="/app">Dashboard</HoverLink>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function Navbar() {
  const [hoverGH, setHoverGH] = useState(false);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 64, borderBottom: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(10,10,10,0.9)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center" }}>
      <div style={{ maxWidth: 1024, width: "100%", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff" }}>ML</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Autonomous ML Builder</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" rel="noopener noreferrer"
            onMouseEnter={() => setHoverGH(true)} onMouseLeave={() => setHoverGH(false)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: hoverGH ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)", transition: "color 0.2s" }}>
            <ExternalLink style={{ width: 14, height: 14 }} /> GitHub
          </a>
          <HoverLink href="/app" primary small>Launch App</HoverLink>
        </div>
      </div>
    </nav>
  );
}

function Badge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, width: "fit-content" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e" }} />
      v1.0.0 — Production Release
    </div>
  );
}

function HeroCTAs() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <HoverLink href="/app" primary>Launch App <ArrowRight style={{ width: 16, height: 16 }} /></HoverLink>
      <HoverA href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" outline>
        <ExternalLink style={{ width: 15, height: 15 }} /> View Source
      </HoverA>
    </div>
  );
}

function Stats() {
  const items = [{ val: "< 10ms", label: "P95 Latency" }, { val: "< 1 GB", label: "RAM Footprint" }, { val: "50,000", label: "Max Dataset Rows" }, { val: "KS + χ²", label: "Drift Detection Tests" }];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      {items.map(s => (
        <div key={s.label}>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{s.val}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 16, backgroundColor: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", border: hov ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.07)", padding: 24, display: "flex", flexDirection: "column", gap: 14, transition: "all 0.25s", transform: hov ? "translateY(-2px)" : "translateY(0)", cursor: "default" }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.4 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

function ArchNode({ node }: { node: any }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", backgroundColor: node.color, color: node.textColor, border: node.border || "none", transition: "opacity 0.2s, transform 0.2s", opacity: hov ? 1 : 0.85, transform: hov ? "scale(1.05)" : "scale(1)", cursor: "default" }}>
      {node.label}
    </div>
  );
}

function EndpointRow({ method, path, desc }: { method: string; path: string; desc: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", borderRadius: 12, backgroundColor: hov ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", transition: "background 0.2s" }}>
      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 6, ...(method === "POST" ? { backgroundColor: "rgba(59,130,246,0.15)", color: "#60a5fa" } : { backgroundColor: "rgba(16,185,129,0.15)", color: "#34d399" }) }}>
        {method}
      </span>
      <div>
        <code style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{path}</code>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

function HoverLink({ href, children, primary, small, outline }: { href: string; children: React.ReactNode; primary?: boolean; small?: boolean; outline?: boolean }) {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: small ? "8px 16px" : "14px 28px",
    borderRadius: small ? 10 : 14,
    fontSize: small ? 13 : 14,
    fontWeight: 700,
    textDecoration: "none",
    transition: "all 0.2s",
    cursor: "pointer",
    transform: hov ? "translateY(-1px)" : "translateY(0)",
  };
  const style: React.CSSProperties = primary
    ? { ...base, backgroundColor: hov ? "#60a5fa" : "#3b82f6", color: "#fff", boxShadow: hov ? "0 8px 24px rgba(59,130,246,0.35)" : "0 4px 12px rgba(59,130,246,0.2)" }
    : outline
    ? { ...base, border: "1px solid rgba(255,255,255,0.12)", color: hov ? "#fff" : "rgba(255,255,255,0.55)", backgroundColor: hov ? "rgba(255,255,255,0.06)" : "transparent" }
    : { ...base, color: hov ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" };
  return <Link href={href} style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</Link>;
}

function HoverA({ href, children, target, outline }: { href: string; children: React.ReactNode; target?: string; outline?: boolean }) {
  const [hov, setHov] = useState(false);
  const style: React.CSSProperties = outline
    ? { display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, fontSize: 14, fontWeight: 700, textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)", color: hov ? "#fff" : "rgba(255,255,255,0.55)", backgroundColor: hov ? "rgba(255,255,255,0.06)" : "transparent", transition: "all 0.2s", transform: hov ? "translateY(-1px)" : "translateY(0)" }
    : { fontSize: 13, color: hov ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s" };
  return <a href={href} target={target} rel="noopener noreferrer" style={style} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{children}</a>;
}
