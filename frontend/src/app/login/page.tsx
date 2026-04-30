"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/studio`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Auth error:", error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="h-16 border-b border-white/5 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Back to Landing</span>
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-black shadow-2xl shadow-blue-500/20">
              A
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight italic">AutoStack</h1>
              <p className="text-zinc-500 font-medium">The Zero-Config ML Engine</p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold">Welcome back</h2>
              <p className="text-sm text-zinc-500">Sign in to access your ML studio</p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Globe className="w-5 h-5" />
              )}
              {loading ? "Connecting..." : "Sign in with Google"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-zinc-600 font-bold">
                <span className="bg-[#0f0f0f] px-4">Trusted by developers</span>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-zinc-600 leading-relaxed uppercase tracking-wider font-bold">
              By continuing, you agree to AutoStack's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </main>

      <footer className="h-16 flex items-center justify-center text-[10px] text-zinc-700 uppercase tracking-widest font-black">
        AutoStack © 2026 · Hardened AI Architecture
      </footer>
    </div>
  );
}
