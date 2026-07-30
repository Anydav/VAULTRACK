import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, TrendingUp, TrendingDown } from "lucide-react";
import { getMe } from "../../services/profile.service";
import {
  askPortfolioAI,
  PortfolioAIError,
  type PortfolioSummary,
} from "../../services/analysis.service";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  summary?: PortfolioSummary;
  status: "pending" | "done" | "error";
}

export default function PortfolioAI() {
  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isSending || !profile?.id) return;

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: question, status: "done" },
      { id: assistantMessageId, role: "assistant", content: "", status: "pending" },
    ]);
    setInput("");
    setIsSending(true);

    try {
      const result = await askPortfolioAI(profile.id, question);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: result.answer, summary: result.summary, status: "done" }
            : m
        )
      );
    } catch (err) {
      const message =
        err instanceof PortfolioAIError
          ? err.message
          : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId ? { ...m, content: message, status: "error" } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <style>{`
        @keyframes vt-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vt-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes vt-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes vt-bar-grow {
          from { width: 0%; }
        }
        .vt-fade-up { animation: vt-fade-up 0.35s ease both; }
        .vt-dot { animation: vt-dot-bounce 1.2s ease-in-out infinite; }
        .vt-shimmer {
          background: linear-gradient(90deg, var(--color-text-muted) 40%, var(--color-primary) 50%, var(--color-text-muted) 60%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: vt-shimmer 1.6s linear infinite;
        }
        .vt-bar { animation: vt-bar-grow 0.6s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .vt-fade-up, .vt-dot, .vt-shimmer, .vt-bar { animation: none !important; }
        }
      `}</style>

      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-text">Ask about your portfolio</h1>
        <p className="text-xs text-text-muted">
          Each question is independent — I won't remember earlier ones in this session yet.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <EmptyState onPick={(q) => setInput(q)} />
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-sm focus-within:border-accent-secondary">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something like 'Am I too concentrated in one asset?'"
            rows={1}
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-sm text-text outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            aria-label="Send question"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform duration-150 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const prompts = [
    "Am I too concentrated in one asset?",
    "How is my portfolio split between crypto and stocks?",
    "What's my best and worst performing holding?",
  ];

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center">
      <h2 className="text-base font-medium text-text">
        What do you want to know about your portfolio?
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        I'll look at your current holdings and prices before answering.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-left text-sm text-text-muted transition-colors hover:border-accent-secondary hover:text-text"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="vt-fade-up flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="vt-fade-up flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3">
        {message.status === "pending" ? (
          <div className="flex items-center gap-2">
            <span className="vt-shimmer text-sm font-medium">Analyzing your portfolio…</span>
            <span className="flex gap-1">
              <span
                className="vt-dot h-1.5 w-1.5 rounded-full bg-text-muted"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="vt-dot h-1.5 w-1.5 rounded-full bg-text-muted"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="vt-dot h-1.5 w-1.5 rounded-full bg-text-muted"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          </div>
        ) : message.status === "error" ? (
          <p className="text-sm text-danger">{message.content}</p>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-sm text-text">{message.content}</p>
            {message.summary && <PortfolioStatCard summary={message.summary} />}
          </>
        )}
      </div>
    </div>
  );
}

function PortfolioStatCard({ summary }: { summary: PortfolioSummary }) {
  const isEmptyPortfolio = summary.holdings.length === 0 && summary.total_value_usd === 0;

  if (isEmptyPortfolio) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-border bg-highlight-bg px-3 py-3 text-xs text-text-muted">
        No holdings yet — add an asset to see live portfolio stats here.
      </div>
    );
  }

  const allocationEntries = Object.entries(summary.type_allocation_pct);

  return (
    <div className="mt-3 rounded-xl border border-border bg-highlight-bg p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">Portfolio value</span>
        <span className="text-sm font-semibold text-text">
          ${summary.total_value_usd.toLocaleString()}
        </span>
      </div>

      {summary.top_holding && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-text-muted">Top holding</span>
          <span className="font-medium text-text">
            {summary.top_holding.symbol} · {summary.top_holding.pct_of_portfolio.toFixed(1)}%
          </span>
        </div>
      )}

      {allocationEntries.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {allocationEntries.map(([type, pct]) => (
            <div key={type}>
              <div className="mb-0.5 flex justify-between text-[11px] text-text-muted">
                <span className="capitalize">{type}</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="vt-bar h-full rounded-full bg-accent-secondary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {summary.holdings.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {summary.holdings.map((holding) => {
            const isPositive = holding.gain_loss_pct >= 0;
            return (
              <span
                key={holding.symbol}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                  isPositive ? "bg-highlight-bg text-success" : "bg-danger-bg text-danger"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {holding.symbol} {isPositive ? "+" : ""}
                {holding.gain_loss_pct.toFixed(1)}%
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}