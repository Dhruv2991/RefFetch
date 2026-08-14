"use client";

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase, signInWithGoogle } from "@/lib/supabaseClient";
import Landing from "./Landing";

export default function AuthGate({ children }: { children: (session: Session) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (!showSignIn) {
      return <Landing onGetStarted={() => setShowSignIn(true)} />;
    }

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <h1 className="font-serif text-4xl font-semibold text-text-900 mb-2">
            <span className="highlight-mark">RefFetch</span>
          </h1>
          <p className="text-text-400 text-sm mb-10 font-mono">your research, remembered</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-cream-raised border border-text-900/10 shadow-sm text-text-900 font-medium px-4 py-3 rounded-lg text-sm transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => setShowSignIn(false)}
            className="text-text-400 hover:text-text-600 text-xs mt-6 transition-colors"
          >
            ← Back
          </button>
          <p className="text-text-400 text-xs mt-8">
            By continuing you agree to RefFetch's{" "}
            <a href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
}
