import { useState, useRef, useEffect } from "react";
import { SharedState, RouterProps, Role } from "../../App";
import { generateReksaAiResponse } from "../../utils/reksaAiEngine";
import { AppIcon } from "./Icons";

interface ReksaAiChatbotProps {
  state: SharedState;
  update: RouterProps["update"];
  setPage: (p: any) => void;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  actionSuggestion?: {
    label: string;
    page: string;
  };
  quickFollowUps?: string[];
}

export function ReksaAiChatbot({ state, update, setPage }: ReksaAiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active role detection
  const currentRole: Role = state.role || "citizen";
  const userName = state.userProfile?.name || (currentRole === "citizen" ? "Warga" : currentRole === "posko" ? "Koordinator Posko" : "Mitra Responder");

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome-1",
        sender: "ai",
        text: `Halo ${userName}! Saya **REKSA AI Co-Pilot**, asisten cerdas kebencanaan terpadu.\n\nSaya dapat menganalisis data kedaruratan, mengecek status SLA verifikasi, memberikan panduan logistik, serta navigasi cepat ke fitur yang Anda butuhkan. Ada yang bisa saya bantu?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickFollowUps: [
          currentRole === "citizen" ? "Cek status laporan saya" : currentRole === "posko" ? "Ringkas antrean verifikasi hari ini" : "Kebutuhan prioritas bursa",
          "Aturan batas waktu SLA verifikasi",
          "Panduan pertolongan pertama bencana",
        ],
      },
    ];
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    // Context stats
    const allCases = state.casesList || [];
    const kritisCount = allCases.filter((c) => c.urgency === "Kritis").length;
    const pendingCount = allCases.filter((c) => (c.status || "").toLowerCase().includes("verifikasi") || c.status === "Diajukan").length;

    // Simulate natural AI thinking delay
    setTimeout(() => {
      const response = generateReksaAiResponse(query, {
        role: currentRole,
        userName,
        totalCases: allCases.length,
        kritisCount,
        pendingCount,
        casesList: allCases,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionSuggestion: response.actionSuggestion,
        quickFollowUps: response.quickFollowUps,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: "ai",
        text: `Riwayat percakapan telah dibersihkan. Silakan ajukan pertanyaan baru mengenai operasional penanggulangan bencana atau status bantuan.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickFollowUps: [
          currentRole === "citizen" ? "Cek status laporan saya" : currentRole === "posko" ? "Ringkas antrean verifikasi" : "Kebutuhan prioritas bursa",
          "Aturan batas waktu SLA verifikasi",
        ],
      },
    ]);
  };

  // Render markdown-like bold and lists simply
  const renderFormattedText = (raw: string) => {
    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      // Bold replacer
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} style={{ color: "inherit", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={pIdx} style={{ color: "inherit", fontStyle: "italic" }}>{part.slice(1, -1)}</em>;
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <li key={idx} style={{ marginLeft: "18px", marginBottom: "4px", listStyleType: "disc" }}>
            {formattedParts}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li key={idx} style={{ marginLeft: "20px", marginBottom: "4px", listStyleType: "decimal" }}>
            {formattedParts}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: "6px" }} />;
      }
      return <p key={idx} style={{ margin: "0 0 4px 0", lineHeight: 1.55 }}>{formattedParts}</p>;
    });
  };

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* Pulsing Helper Pill */}
          <div
            onClick={() => setIsOpen(true)}
            style={{
              background: "#ffffff",
              color: "#013220",
              border: "1.5px solid rgba(1, 50, 32, 0.15)",
              padding: "8px 14px",
              borderRadius: "999px",
              boxShadow: "0 8px 24px rgba(1, 50, 32, 0.16)",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px #10b981",
              }}
            />
            <span>Tanya REKSA AI</span>
          </div>

          {/* Main Floating Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #013220 0%, #064e3b 50%, #047857 100%)",
              color: "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              boxShadow: "0 10px 28px rgba(1, 50, 32, 0.35), 0 0 15px rgba(16, 185, 129, 0.3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08) rotate(5deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1) rotate(0deg)";
            }}
            title="Buka Asisten Cerdas REKSA AI"
          >
            <span style={{ fontSize: "1.4rem", filter: "grayscale(100%)" }}>✨</span>
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                background: "#10b981",
                color: "#ffffff",
                fontSize: "0.62rem",
                fontWeight: 800,
                padding: "2px 5px",
                borderRadius: "999px",
                border: "1.5px solid #ffffff",
                letterSpacing: "0.02em",
                boxShadow: "0 2px 5px rgba(1, 50, 32, 0.25)",
              }}
            >
              AI
            </span>
          </button>
        </div>
      )}

      {/* 2. CHATBOT WINDOW */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "410px",
            maxWidth: "calc(100vw - 32px)",
            height: "620px",
            maxHeight: "calc(100vh - 48px)",
            background: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(1, 50, 32, 0.22), 0 4px 16px rgba(0,0,0,0.06)",
            border: "1px solid rgba(1, 50, 32, 0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 10000,
            animation: "reksaAiPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #013220 0%, #064e3b 60%, #047857 100%)",
              color: "#ffffff",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(4px)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.2rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                ✨
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "#ffffff" }}>
                    REKSA AI Co-Pilot
                  </h3>
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    PRO
                  </span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.8)", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
                  <span>Siaga 24/7 · Mode: {currentRole === "citizen" ? "Warga" : currentRole === "posko" ? "Posko BPBD" : "Mitra"}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={handleClearChat}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "none",
                  color: "#ffffff",
                  padding: "5px 8px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
                title="Bersihkan riwayat percakapan"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "none",
                  color: "#ffffff",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
                title="Tutup AI Chatbot"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {messages.map((m) => {
              const isAi = m.sender === "ai";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isAi ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "88%",
                      padding: "12px 15px",
                      borderRadius: isAi ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                      background: isAi ? "#ffffff" : "#013220",
                      color: isAi ? "#1e293b" : "#ffffff",
                      fontSize: "0.85rem",
                      boxShadow: isAi ? "0 2px 8px rgba(0,0,0,0.05)" : "0 3px 10px rgba(1,50,32,0.2)",
                      border: isAi ? "1px solid #e2e8f0" : "none",
                      wordBreak: "break-word",
                    }}
                  >
                    {isAi && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "#047857", fontWeight: 700, fontSize: "0.74rem" }}>
                        <span>✨ REKSA AI Engine</span>
                      </div>
                    )}
                    <div>{renderFormattedText(m.text)}</div>

                    {/* Action Suggestion button if available */}
                    {m.actionSuggestion && (
                      <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (m.actionSuggestion?.page) {
                              setPage(m.actionSuggestion.page as any);
                              setIsOpen(false);
                            }
                          }}
                          style={{
                            background: "#ecfdf5",
                            color: "#065f46",
                            border: "1px solid #a7f3d0",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <span>{m.actionSuggestion.label}</span>
                          <AppIcon name="arrow-right" size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "4px", padding: "0 4px" }}>
                    {m.timestamp}
                  </span>

                  {/* Quick Follow-up Prompt Chips */}
                  {isAi && m.quickFollowUps && m.quickFollowUps.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px", maxWidth: "90%" }}>
                      {m.quickFollowUps.map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleSendMessage(promptText)}
                          style={{
                            background: "#ffffff",
                            color: "#0f766e",
                            border: "1px solid #ccfbf1",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            transition: "all 0.15s ease",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f0fdfa";
                            e.currentTarget.style.borderColor = "#0d9488";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.borderColor = "#ccfbf1";
                          }}
                        >
                          💬 {promptText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", background: "#ffffff", borderRadius: "12px", width: "fit-content", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 600 }}>REKSA AI sedang menganalisis...</span>
                <span className="dot-typing" style={{ display: "inline-flex", gap: "3px" }}>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#047857" }} />
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#047857" }} />
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#047857" }} />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Context Pill Toolbar */}
          <div
            style={{
              padding: "6px 14px",
              background: "#ffffff",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflowX: "auto",
            }}
          >
            <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, flexShrink: 0 }}>Rekomendasi Cepat:</span>
            {[
              currentRole === "citizen" ? "Cek Laporan Saya" : currentRole === "posko" ? "Prioritas Kritis" : "Bursa Kebutuhan",
              "SLA Timeout",
              "SOP Posko",
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  color: "#334155",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: "12px 14px",
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Ketik pertanyaan atau minta panduan..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "0.85rem",
                outline: "none",
                background: "#f8fafc",
                color: "#1e293b",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#047857")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              style={{
                background: inputMessage.trim() ? "#013220" : "#94a3b8",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 16px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: inputMessage.trim() ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.2s ease",
              }}
            >
              <AppIcon name="send" size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
