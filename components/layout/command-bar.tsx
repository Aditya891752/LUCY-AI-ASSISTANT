"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Send, Sparkles, X, Check, Utensils, Calendar, Droplets } from "lucide-react";
import { ParsedCommand } from "@/lib/ai/intent";
import { logMeal, logWater } from "@/lib/actions/trackers";
import { cn } from "@/lib/utils";

export function CommandBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ParsedCommand | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hotkey: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setConfirmationData(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !confirmationData) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, confirmationData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();

      if (data.success && data.result) {
        if (data.result.type === "question") {
          // Route directly to Ask page with query parameter
          router.push(`/ask?q=${encodeURIComponent(data.result.query)}`);
          setIsOpen(false);
          setInput("");
        } else {
          // Show Confirmation Card
          setConfirmationData(data.result);
        }
      }
    } catch (err) {
      console.error("Command error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!confirmationData) return;
    setIsSaving(true);

    try {
      if (confirmationData.type === "meal") {
        await logMeal({
          description: confirmationData.description,
          calories: confirmationData.calories,
          protein_g: confirmationData.protein_g,
          carbs_g: confirmationData.carbs_g,
          fat_g: confirmationData.fat_g,
          user_edited: false,
        });
      } else if (confirmationData.type === "health" && confirmationData.metric === "water_ml") {
        await logWater(confirmationData.value);
      }

      setConfirmationData(null);
      setInput("");
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Floating Tactical Trigger Button */}
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-surface-1 border border-border rounded-lg shadow-2xl overflow-hidden">
            {/* Input Form */}
            {!confirmationData ? (
              <>
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
                      disabled={isProcessing}
                      className="p-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
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
                  <span>Try: &quot;log lunch: 2 rotis & dal&quot;, &quot;drank 500ml water&quot;</span>
                  <span>ESC to close</span>
                </div>
              </>
            ) : (
              /* MANDATORY CONFIRMATION CARD */
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Confirm Ground-Truth Entry
                  </span>
                  <button
                    onClick={() => setConfirmationData(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Edit / Cancel
                  </button>
                </div>

                {confirmationData.type === "meal" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Utensils className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {confirmationData.description}
                        </div>
                        <div className="text-xs text-muted-foreground">Estimated nutritional profile</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-surface-2 border border-border p-2 rounded">
                        <span className="text-[10px] text-muted-foreground block">CALORIES</span>
                        <span className="text-xs font-bold text-foreground tabular-nums">
                          {confirmationData.calories} kcal
                        </span>
                      </div>
                      <div className="bg-surface-2 border border-border p-2 rounded">
                        <span className="text-[10px] text-muted-foreground block">PROTEIN</span>
                        <span className="text-xs font-bold text-fire tabular-nums">
                          {confirmationData.protein_g}g
                        </span>
                      </div>
                      <div className="bg-surface-2 border border-border p-2 rounded">
                        <span className="text-[10px] text-muted-foreground block">CARBS</span>
                        <span className="text-xs font-bold text-accent tabular-nums">
                          {confirmationData.carbs_g}g
                        </span>
                      </div>
                      <div className="bg-surface-2 border border-border p-2 rounded">
                        <span className="text-[10px] text-muted-foreground block">FAT</span>
                        <span className="text-xs font-bold text-foreground tabular-nums">
                          {confirmationData.fat_g}g
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {confirmationData.type === "health" && (
                  <div className="flex items-center gap-3 bg-surface-2 p-3 rounded border border-border">
                    <Droplets className="w-5 h-5 text-accent" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Hydration Log: +{confirmationData.value} ml
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Updates your daily water progress ring
                      </div>
                    </div>
                  </div>
                )}

                {confirmationData.type === "event" && (
                  <div className="flex items-center gap-3 bg-surface-2 p-3 rounded border border-border">
                    <Calendar className="w-5 h-5 text-fire" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {confirmationData.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Scheduled for {confirmationData.date_str}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmationData(null)}
                    className="flex-1 py-2 text-xs font-medium text-muted-foreground bg-surface-2 hover:text-foreground rounded border border-border"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleConfirmSave}
                    className="flex-1 py-2 text-xs font-semibold text-accent-foreground bg-accent hover:bg-accent/90 rounded flex items-center justify-center gap-1.5 active:scale-98 transition-transform disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isSaving ? "Saving..." : "Save Record"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
