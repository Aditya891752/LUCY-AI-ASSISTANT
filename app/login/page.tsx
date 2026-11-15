"use client";

import { useState } from "react";
import { Sparkles, Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Supabase auth handler in Phase 1
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-surface-2 border border-border px-3 py-1 rounded-full text-xs font-semibold text-accent">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Winter Arc Assistant</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Welcome to Lucy
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Your ground-truth personal assistant. Permanent memory, double-checked answers, extreme discipline.
        </p>
      </div>

      <div className="bg-surface-1 border border-border rounded-lg p-6 space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@domain.com"
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent text-accent-foreground text-xs font-semibold py-2.5 rounded-md hover:bg-accent/90 active:scale-98 transition-transform disabled:opacity-50"
          >
            {isSubmitting ? "Authenticating..." : "Enter Protocol"}
          </button>
        </form>

        <div className="pt-2 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-success" />
          <span>PostgreSQL Row Level Security Active</span>
        </div>
      </div>
    </div>
  );
}
