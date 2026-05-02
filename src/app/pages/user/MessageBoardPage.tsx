import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../supabaseClient";

type Message = {
  id: number;
  content: string;
  created_at: string;
};

export function MessageBoardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [tableReady, setTableReady] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check if table exists & fetch messages on mount
  useEffect(() => {
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      if (error.code === "42P01") {
        setTableReady(false); // table doesn't exist
      }
    } else {
      setTableReady(true);
      setMessages(data || []);
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setStatus("sending");
    setErrorMsg("");

    const { error } = await supabase.from("messages").insert([{ content: trimmed }]);

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("success");
      setInput("");
      setTimeout(() => setStatus("idle"), 2000);
      fetchMessages();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .msg-bubble {
          animation: fadeSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(234,179,8,0.45);
        }
        .send-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        textarea:focus { outline: none; }
      `}</style>

      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Message Board</h1>
            <p style={styles.subtitle}>Type anything · It saves to Supabase</p>
          </div>
          <div style={styles.badge}>
            <span style={{ ...styles.dot, background: tableReady === false ? "#ef4444" : "#22c55e" }} />
            {tableReady === false ? "Table missing" : tableReady ? "Live" : "Connecting…"}
          </div>
        </div>

        {/* Table setup warning */}
        {tableReady === false && (
          <div style={styles.warning}>
            <strong>⚠️ Table not found.</strong> Run this in your Supabase SQL Editor:
            <pre style={styles.sql}>{`CREATE TABLE messages (\n  id bigint generated always as identity primary key,\n  content text not null,\n  created_at timestamptz default now()\n);`}</pre>
          </div>
        )}

        {/* Messages list */}
        <div style={styles.feed}>
          {messages.length === 0 && tableReady !== false && (
            <div style={styles.empty}>
              <span style={{ fontSize: 40 }}>💬</span>
              <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>No messages yet. Send the first one!</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id} className="msg-bubble" style={{ ...styles.bubble, animationDelay: `${i * 0.04}s` }}>
              <p style={styles.bubbleText}>{msg.content}</p>
              <span style={styles.bubbleTime}>{formatTime(msg.created_at)}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={styles.inputArea}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message… (Enter to send)"
            disabled={status === "sending" || tableReady === false}
            rows={2}
            style={styles.textarea}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || status === "sending" || tableReady === false}
            style={{
              ...styles.sendBtn,
              opacity: !input.trim() || status === "sending" || tableReady === false ? 0.5 : 1,
              cursor: !input.trim() || status === "sending" || tableReady === false ? "not-allowed" : "pointer",
            }}
          >
            {status === "sending" ? (
              <span style={{ animation: "pulse 1s infinite" }}>⏳</span>
            ) : status === "success" ? "✅" : "➤"}
          </button>
        </div>

        {/* Status bar */}
        <div style={styles.statusBar}>
          {status === "error" && (
            <span style={{ color: "#f87171", fontSize: 13 }}>❌ {errorMsg}</span>
          )}
          {status === "success" && (
            <span style={{ color: "#4ade80", fontSize: 13 }}>✓ Saved to Supabase!</span>
          )}
          {status === "idle" && messages.length > 0 && (
            <span style={{ color: "#64748b", fontSize: 12 }}>{messages.length} message{messages.length !== 1 ? "s" : ""} in database</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0d1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'Syne', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 70%)",
    top: -100,
    right: -100,
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
    bottom: -80,
    left: -80,
    pointerEvents: "none",
  },
  card: {
    background: "#161b22",
    borderRadius: 24,
    border: "1px solid #30363d",
    width: "100%",
    maxWidth: 560,
    overflow: "hidden",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
    position: "relative",
    zIndex: 1,
  },
  header: {
    padding: "28px 28px 20px",
    borderBottom: "1px solid #21262d",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "#f0f6fc",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#8b949e",
    fontFamily: "'DM Mono', monospace",
    fontWeight: 400,
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 12,
    color: "#8b949e",
    fontFamily: "'DM Mono', monospace",
    whiteSpace: "nowrap",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    display: "inline-block",
  },
  warning: {
    margin: "0 28px 0",
    marginTop: 16,
    background: "#1c1209",
    border: "1px solid #854d0e",
    borderRadius: 12,
    padding: "14px 16px",
    color: "#fbbf24",
    fontSize: 13,
  },
  sql: {
    marginTop: 10,
    background: "#0d1117",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 11,
    color: "#7ee787",
    fontFamily: "'DM Mono', monospace",
    overflowX: "auto",
    lineHeight: 1.7,
  },
  feed: {
    minHeight: 280,
    maxHeight: 380,
    overflowY: "auto",
    padding: "20px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    scrollbarWidth: "thin",
    scrollbarColor: "#30363d transparent",
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 0",
    textAlign: "center",
  },
  bubble: {
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: 14,
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  bubbleText: {
    margin: 0,
    fontSize: 14,
    color: "#e6edf3",
    lineHeight: 1.6,
    wordBreak: "break-word",
    flex: 1,
  },
  bubbleTime: {
    fontSize: 11,
    color: "#484f58",
    fontFamily: "'DM Mono', monospace",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  inputArea: {
    padding: "16px 28px",
    borderTop: "1px solid #21262d",
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 12,
    padding: "12px 14px",
    color: "#e6edf3",
    fontSize: 14,
    fontFamily: "'Syne', sans-serif",
    resize: "none",
    lineHeight: 1.5,
    transition: "border-color 0.2s",
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #eab308, #ca8a04)",
    color: "white",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },
  statusBar: {
    padding: "8px 28px 16px",
    minHeight: 32,
    display: "flex",
    alignItems: "center",
  },
};
