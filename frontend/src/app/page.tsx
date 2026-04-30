"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Activity, Cpu, Shield, Zap, Database, BarChart3, ChevronRight, Globe, Code, Box } from "lucide-react";

// Dynamically import Lottie to prevent SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

// Import animations (Paths to public folder)
const heroAnim = "/animations/hero-dashboard.json";
const uploadAnim = "/animations/data-upload.json";
const analysisAnim = "/animations/analysis.json";
const aiAnim = "/animations/ai-assistant.json";

export default function LandingPage() {
  const [heroData, setHeroData] = React.useState(null);
  const [uploadData, setUploadData] = React.useState(null);
  const [analysisData, setAnalysisData] = React.useState(null);
  const [aiData, setAiData] = React.useState(null);

  React.useEffect(() => {
    fetch(heroAnim).then(res => res.json()).then(setHeroData);
    fetch(uploadAnim).then(res => res.json()).then(setUploadData);
    fetch(analysisAnim).then(res => res.json()).then(setAnalysisData);
    fetch(aiAnim).then(res => res.json()).then(setAiData);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.15 } },
    viewport: { once: true }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-white/5 bg-[#0a0a0a]/60 backdrop-blur-2xl flex items-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="AutoStack Logo" 
              className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500" 
            />
            <span className="text-xl font-black italic tracking-tighter group-hover:text-blue-400 transition-colors">AutoStack</span>
          </Link>
          
          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
              <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" className="flex items-center gap-2 hover:text-white transition-colors">
                <Code className="w-3 h-3 text-blue-500" /> Source
              </a>
            </div>
            <Link 
              href="/login" 
              className="px-6 h-12 bg-blue-600 text-white rounded-2xl text-sm font-black italic flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 active:scale-95 group"
            >
              Get Started <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden min-h-screen flex items-center">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-10 relative z-10 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/5 border border-blue-600/20 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mx-auto lg:mx-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_#3b82f6]" />
              Enterprise AI Intelligence v2.0
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.85] text-white">
              Scale ML <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 animate-gradient">
                Without the Mess.
              </span>
            </h1>
            
            <p className="max-w-xl mx-auto lg:mx-0 text-lg text-zinc-500 font-medium leading-relaxed italic">
              The world's first autonomous ML stack that takes you from raw CSV to production-ready API in under 60 seconds. Zero devops. Zero config. Pure intelligence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-10 h-16 bg-blue-600 text-white rounded-[24px] text-lg font-black italic flex items-center justify-center gap-3 hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 group"
              >
                Launch Console <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="https://calendly.com/vedantjadhav1414/30min" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-10 h-16 bg-white/[0.03] border border-white/10 text-white rounded-[24px] text-lg font-black italic flex items-center justify-center gap-3 hover:bg-white/[0.06] transition-all hover:-translate-y-1"
              >
                Book a Demo
              </a>
            </div>
          </motion.div>

          {/* Hero Animation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
             <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full animate-pulse" />
             <div className="relative p-6 rounded-[48px] border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-2xl">
                {heroData && (
                  <Lottie 
                    animationData={heroData} 
                    loop={true} 
                    className="w-full h-auto max-w-[600px] drop-shadow-2xl" 
                  />
                )}
             </div>
             {/* Floating Badges */}
             <div className="absolute -top-10 -right-10 p-4 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl animate-bounce">
                <Zap className="w-6 h-6 text-amber-500" />
             </div>
             <div className="absolute -bottom-10 -left-10 p-4 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl animate-pulse">
                <Activity className="w-6 h-6 text-blue-500" />
             </div>
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-32 px-6 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-24">
          <motion.div {...fadeIn} className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">The Guided Pipeline</h2>
            <p className="text-zinc-500 font-medium max-w-2xl mx-auto italic uppercase text-xs tracking-widest">From raw ingestion to production inference in three tactical stages.</p>
          </motion.div>

          <div className="space-y-40">
            {/* Step 1 */}
            <motion.div {...fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 order-2 lg:order-1">
                 <div className="w-16 h-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-500 font-black italic text-2xl border border-blue-600/20">01</div>
                 <h3 className="text-4xl font-black italic tracking-tight">Smart Data Ingestion</h3>
                 <p className="text-zinc-500 text-lg leading-relaxed italic">Drag and drop your raw CSV. AutoStack profiles your features, handles missing values, and optimizes memory usage automatically.</p>
                 <ul className="space-y-4">
                    {["Auto-Imputation", "Encoding Detection", "Memory Optimization"].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" /> {f}
                      </li>
                    ))}
                 </ul>
              </div>
              <div className="p-10 rounded-[40px] bg-white/[0.01] border border-white/5 order-1 lg:order-2 hover:bg-white/[0.02] transition-colors">
                 {uploadData && <Lottie animationData={uploadData} loop={true} className="w-full h-auto max-h-[350px]" />}
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div {...fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="p-10 rounded-[40px] bg-white/[0.01] border border-white/5 hover:bg-white/[0.02] transition-colors">
                 {analysisData && <Lottie animationData={analysisData} loop={true} className="w-full h-auto max-h-[350px]" />}
              </div>
              <div className="space-y-8">
                 <div className="w-16 h-16 rounded-3xl bg-purple-600/10 flex items-center justify-center text-purple-500 font-black italic text-2xl border border-purple-600/20">02</div>
                 <h3 className="text-4xl font-black italic tracking-tight">Neural Ensemble Synthesis</h3>
                 <p className="text-zinc-500 text-lg leading-relaxed italic">Our engine runs parallel hyperparameter tuning on a curated ensemble of Gradient Boosted Trees and Stacking Regressors.</p>
                 <ul className="space-y-4">
                    {["Bayesian Tuning", "Stacking Ensembles", "Cross-Validation"].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                        <CheckCircle2 className="w-4 h-4 text-purple-500" /> {f}
                      </li>
                    ))}
                 </ul>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div {...fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 order-2 lg:order-1">
                 <div className="w-16 h-16 rounded-3xl bg-amber-600/10 flex items-center justify-center text-amber-500 font-black italic text-2xl border border-amber-600/20">03</div>
                 <h3 className="text-4xl font-black italic tracking-tight">Instant Production API</h3>
                 <p className="text-zinc-500 text-lg leading-relaxed italic">Deploy with one click. Get a low-latency REST endpoint with built-in SHAP explainability and drift monitoring.</p>
                 <ul className="space-y-4">
                    {["REST API Endpoint", "SHAP Explanations", "Drift Detection"].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                        <CheckCircle2 className="w-4 h-4 text-amber-500" /> {f}
                      </li>
                    ))}
                 </ul>
              </div>
              <div className="p-10 rounded-[40px] bg-white/[0.01] border border-white/5 order-1 lg:order-2 hover:bg-white/[0.02] transition-colors">
                 {aiData && <Lottie animationData={aiData} loop={true} className="w-full h-auto max-h-[350px]" />}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scale Section */}
      <motion.section {...fadeIn} className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5 blur-[120px] rounded-full -z-10" />
        <div className="max-w-5xl mx-auto p-12 md:p-20 rounded-[48px] border border-white/5 bg-white/[0.01] backdrop-blur-3xl text-center space-y-8 relative shadow-2xl">
           <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter">Hit a wall with standard models? <br /><span className="text-blue-500">Let's build something bespoke.</span></h2>
           <p className="max-w-2xl mx-auto text-zinc-500 font-medium italic">For organizations with massive datasets, strict privacy requirements, or complex forecasting needs, our engineering team builds custom pipelines directly into your infrastructure.</p>
           <a 
             href="https://calendly.com/vedantjadhav1414/30min" 
             target="_blank"
             className="inline-flex items-center gap-3 px-10 h-16 bg-blue-600 text-white rounded-2xl text-lg font-black italic hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95 group"
           >
             Talk to an AI Architect <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
           </a>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-20">
          <motion.div {...fadeIn} className="text-center space-y-4">
             <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">Engineered for Every Scale</h2>
             <p className="text-zinc-500 font-medium italic uppercase text-xs tracking-widest">Simple, transparent tiers for researchers and enterprises.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
             {/* Community Tier */}
             <motion.div variants={fadeIn} className="p-12 rounded-[40px] border border-white/5 bg-white/[0.01] space-y-8 hover:border-white/10 transition-colors group">
                <div className="space-y-2">
                   <h3 className="text-2xl font-black italic tracking-tight">Community</h3>
                   <p className="text-sm text-zinc-500 font-medium italic">For rapid prototyping and research.</p>
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-5xl font-black italic tracking-tighter">$0</span>
                   <span className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">/ month</span>
                </div>
                <ul className="space-y-4 pt-4 border-t border-white/5">
                   {[
                     "Max 10,000 Rows / Job",
                     "5MB File Upload Limit",
                     "Standard Gradient Boosting",
                     "Community Support",
                     "Local In-Memory Persistence"
                   ].map(f => (
                     <li key={f} className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" /> {f}
                     </li>
                   ))}
                </ul>
                <Link href="/login" className="flex items-center justify-center w-full h-14 bg-white/5 border border-white/5 rounded-2xl text-sm font-black italic text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all">Launch Console</Link>
             </motion.div>

             {/* Enterprise Tier */}
             <motion.div variants={fadeIn} className="p-12 rounded-[40px] border border-blue-500/20 bg-blue-600/[0.02] space-y-8 relative overflow-hidden group shadow-2xl shadow-blue-500/5">
                <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest animate-pulse">Production Ready</div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black italic tracking-tight">Enterprise</h3>
                   <p className="text-sm text-zinc-500 font-medium italic">For high-performance production scale.</p>
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-5xl font-black italic tracking-tighter">Custom</span>
                </div>
                <ul className="space-y-4 pt-4 border-t border-white/5">
                   {[
                     "Unlimited Data Processing",
                     "No File Size Constraints",
                     "Custom Deep Learning / XGBoost",
                     "Dedicated Cloud Engine",
                     "Full Database Integration"
                   ].map(f => (
                     <li key={f} className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" /> {f}
                     </li>
                   ))}
                </ul>
                <a href="https://calendly.com/vedantjadhav1414/30min" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full h-14 bg-blue-600 rounded-2xl text-sm font-black italic text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all">Book a Demo</a>
             </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento */}
      <section id="features" className="py-32 px-6 bg-[#0c0c0c] border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-16">
          <motion.div {...fadeIn} className="text-center space-y-4">
             <h2 className="text-4xl font-black italic tracking-tight">Built for Production</h2>
             <p className="text-zinc-500 font-medium">Enterprise-grade features for mission critical machine learning.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            <BentoCard icon={Zap} title="Sub-10ms Latency" desc="Engineered for high-frequency trading and real-time bidding." color="text-amber-500" />
            <BentoCard icon={Shield} title="Data Guardrails" desc="Structural validation prevents garbage-in-garbage-out scenarios." color="text-emerald-500" />
            <BentoCard icon={Globe} title="Cloud Agnostic" desc="Deploy on Vercel, AWS, or your private air-gapped server." color="text-blue-500" />
            <BentoCard icon={BarChart3} title="SHAP Audit" desc="Transparent decision making for regulated industries." color="text-purple-500" />
            <BentoCard icon={Activity} title="Auto-Drift" desc="Detect performance decay before it affects users." color="text-red-500" />
            <BentoCard icon={Database} title="Smart Impute" desc="Probabilistic handling of missing categorical and numerical data." color="text-blue-400" />
            <BentoCard icon={Cpu} title="Hybrid Engine" desc="Switch between XGBoost, LightGBM, and Deep Learning." color="text-zinc-200" />
            <BentoCard icon={Box} title="Versioned APIs" desc="Immutable model deployments with rollback capabilities." color="text-zinc-400" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="space-y-6 md:col-span-2">
            <Link href="/" className="flex items-center gap-3">
               <img src="/logo.png" alt="AutoStack" className="w-10 h-10 object-contain" />
               <span className="text-2xl font-black italic tracking-tighter">AutoStack</span>
            </Link>
            <p className="text-zinc-500 text-sm max-w-sm italic">The world's most advanced autonomous ML builder. Helping teams ship intelligent products faster than ever before.</p>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Platform</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-600 uppercase tracking-widest">
               <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
               <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
               <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>

          <div className="space-y-6 text-right">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Social</h4>
            <ul className="space-y-3 text-xs font-bold text-zinc-600 uppercase tracking-widest">
               <li><a href="https://linkedin.com/in/vedantjadhav-ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
               <li><a href="https://github.com/VedantJadhav701/Autonomous_ML_Builder" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
               <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-24 border-t border-white/5 mt-24 flex items-center justify-between">
           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">© 2026 AutoStack Technologies · All Rights Reserved</p>
           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800 italic">Built by Vedant Jadhav</p>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({ icon: Icon, title, desc, color }: any) {
  return (
    <motion.div 
      variants={{
        initial: { opacity: 0, scale: 0.9 },
        whileInView: { opacity: 1, scale: 1 }
      }}
      className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 group"
    >
      <Icon className={`w-8 h-8 ${color} mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6`} />
      <h3 className="text-lg font-black italic tracking-tight mb-2 uppercase">{title}</h3>
      <p className="text-zinc-600 text-[11px] font-bold leading-relaxed uppercase tracking-widest">{desc}</p>
    </motion.div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
