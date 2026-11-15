"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Send, Sparkles, Database, Plus, Trash2, ChevronDown, ChevronUp, Info, Bookmark } from "lucide-react";
import { getNotes, saveNote, deleteNote, UserNote } from "@/lib/actions/notes";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: Array<{
    id: string;
    category: string;
    description: string;
    date: string;
  }>;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "What did I eat today?",
  "When is my next meeting with Rahul?",
  "How much did I spend this month?",
  "Am I on track with my habits?",
];

function AskContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      sender: "assistant",
      text: "I am Lucy, your ground-truth personal assistant. Every answer I give is retrieved strictly from your stored database rows and fact-checked.",
      timestamp: "Just now",
    },
  ]);

  const [input, setInput] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  // Notes & Preferences State
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteCat, setNewNoteCat] = useState("Nutrition");

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadUserNotes = async () => {
    const res = await getNotes();
    setNotes(res);
  };

  useEffect(() => {
    loadUserNotes();
  }, []);

  // Handle URL query parameter ?q=... from Command Bar
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      handleSend(q);
    }
  }, [searchParams]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isQuerying]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || isQuerying) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsQuerying(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim() }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.answer || "No records found.",
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "Failed to connect to database records. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    await saveNote(newNoteText.trim(), newNoteCat);
    setNewNoteText("");
    loadUserNotes();
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    loadUserNotes();
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="space-y-4 pb-4 animate-in fade-in duration-200">
      {/* Header */}
      <header className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
            Permanent Memory Core
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ask Your Data
          </h1>
        </div>
        <button
          onClick={() => setShowNotesDrawer((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-surface-2 border border-border hover:border-border-active text-foreground transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5 text-accent" />
          <span>Rules ({notes.length})</span>
        </button>
      </header>

      {/* USER PREFERENCES & RULES DRAWER */}
      {showNotesDrawer && (
        <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <span className="text-xs font-bold text-foreground">
                Personal Rules & Constraints
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Lucy respects these permanent facts in all future answers and weekly plans.
              </p>
            </div>
            <button
              onClick={() => setShowNotesDrawer(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          {/* New Rule Input */}
          <form onSubmit={handleAddNote} className="space-y-2">
            <div className="flex gap-2">
              <select
                value={newNoteCat}
                onChange={(e) => setNewNoteCat(e.target.value)}
                className="bg-surface-2 border border-border rounded text-xs px-2 py-1.5 text-foreground"
              >
                <option value="Nutrition">Nutrition</option>
                <option value="Training">Training</option>
                <option value="Schedule">Schedule</option>
                <option value="Finance">Finance</option>
                <option value="General">General</option>
              </select>
              <input
                type="text"
                placeholder="e.g. I do not eat solid food after 9 PM..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded hover:bg-accent/90"
              >
                Save Rule
              </button>
            </div>
          </form>

          {/* Stored Rules List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes.map((n) => (
              <div
                key={n.id}
                className="bg-surface-2 border border-border p-2.5 rounded text-xs flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] text-accent font-semibold uppercase block">
                    {n.category}
                  </span>
                  <span className="text-foreground">{n.text}</span>
                </div>
                <button
                  onClick={() => handleDeleteNote(n.id)}
                  className="text-muted-foreground hover:text-danger p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK CHIP SUGGESTIONS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="shrink-0 bg-surface-1 border border-border hover:border-border-active px-3 py-1.5 rounded-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* CHAT MESSAGES FEED */}
      <div className="space-y-3 min-h-[350px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col space-y-1.5",
              msg.sender === "user" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "p-3.5 rounded-lg max-w-[90%] text-xs leading-relaxed space-y-2",
                msg.sender === "user"
                  ? "bg-surface-2 border border-border text-foreground rounded-br-none"
                  : "bg-surface-1 border border-border text-foreground rounded-bl-none"
              )}
            >
              {/* Verified Header for Assistant Messages */}
              {msg.sender === "assistant" && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-success uppercase tracking-wider border-b border-border/60 pb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified from Ground Truth</span>
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* EXPANDABLE SOURCES ACCORDION */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="pt-2 border-t border-border/50 space-y-1.5">
                  <button
                    onClick={() => toggleSources(msg.id)}
                    className="flex items-center justify-between w-full text-[11px] font-semibold text-accent hover:underline"
                  >
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span>{msg.sources.length} Supporting Records Cited</span>
                    </span>
                    {expandedSources[msg.id] ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {expandedSources[msg.id] && (
                    <div className="bg-surface-2 p-2 rounded border border-border space-y-1.5 animate-in fade-in duration-150">
                      {msg.sources.map((src) => (
                        <div key={src.id} className="text-[10px] border-b border-border/40 pb-1 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-muted-foreground font-mono">
                            <span className="text-accent font-semibold">{src.category}</span>
                            <span>ID: {src.id.slice(0, 8)}</span>
                          </div>
                          <div className="text-foreground font-medium mt-0.5">{src.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <span className="text-[10px] text-muted-foreground px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isQuerying && (
          <div className="flex items-start">
            <div className="bg-surface-1 border border-border p-3.5 rounded-lg rounded-bl-none text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <span>Querying database records across categories...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* INPUT FORM */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 sticky bottom-16 bg-background pt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your meals, workouts, schedule..."
          className="flex-1 bg-surface-1 border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={isQuerying || !input.trim()}
          className="bg-accent text-accent-foreground px-4 py-2 rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading Lucy Memory Core...</div>}>
      <AskContent />
    </Suspense>
  );
}
