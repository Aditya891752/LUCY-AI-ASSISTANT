"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onExecute?: (input: string) => void;
}

export function CommandBar({ onExecute }: CommandBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleSpeech = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please type your command.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (onExecute) {
      onExecute(input.trim());
    }
    setInput("");
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Tactical Trigger Button (Desktop / Mobile) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-surface-2 border border-border hover:border-border-active text-foreground px-4 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform"
        aria-label="Open Command Bar"
      >
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold tracking-wide">LUCY CMD</span>
        <kbd className="hidden sm:inline-block text-[10px] text-muted-foreground bg-surface-1 px-1.5 py-0.5 rounded border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Modal Backdrop & Input Surface */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-1 border border-border rounded-lg shadow-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-b border-border">
              <Sparkles className="w-5 h-5 text-accent shrink-0 ml-1" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Log lunch: 2 rotis & dal, remind me meeting at 5pm..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={toggleSpeech}
                className={cn(
                  "p-2 rounded hover:bg-surface-2 text-muted-foreground transition-colors",
                  isListening && "text-fire animate-pulse"
                )}
                title="Voice Input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              {input.trim() && (
                <button
                  type="submit"
                  className="p-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded hover:bg-surface-2 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            <div className="p-3 bg-surface-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Try: &quot;log 4 eggs and toast&quot;, &quot;remind me gym tomorrow 6am&quot;</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
