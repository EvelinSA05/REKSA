import React, { useState, useEffect, useRef, useMemo } from "react";
import { apiService, ChatMessageItem, ChatChannelItem } from "../../services/api";
import { SharedState, PortalPage, Role } from "../../App";

export interface ChatKoordinasiProps {
  role: Role;
  name?: string;
  state: SharedState;
  notify?: (msg: string) => void;
  onRefresh?: () => Promise<void> | void;
  setPage?: (p: PortalPage) => void;
}

// Clean Monochrome Tag Configuration
const TAG_CONFIG: Record<
  string,
  { label: string; symbol: string; bg: string; text: string; border: string; isDark?: boolean }
> = {
  INFO: {
    label: "Info",
    symbol: "ℹ",
    bg: "#f1f5f9",
    text: "#1e293b",
    border: "#cbd5e1",
  },
  URGENT: {
    label: "Darurat",
    symbol: "●",
    bg: "#0f172a",
    text: "#ffffff",
    border: "#0f172a",
    isDark: true,
  },
  LOGISTIK: {
    label: "Logistik",
    symbol: "▤",
    bg: "#f8fafc",
    text: "#334155",
    border: "#cbd5e1",
  },
  AKSES: {
    label: "Akses Jalan",
    symbol: "▲",
    bg: "#f8fafc",
    text: "#334155",
    border: "#cbd5e1",
  },
  KONFIRMASI: {
    label: "Konfirmasi",
    symbol: "✓",
    bg: "#e2e8f0",
    text: "#0f172a",
    border: "#94a3b8",
  },
};

const DEFAULT_CHANNELS: ChatChannelItem[] = [
  {
    id: "umum",
    name: "Kanal Umum (Siaga Bencana)",
    description: "Koordinasi terbuka trilateral antara Warga, Posko BPBD, dan Mitra Kemanusiaan.",
    icon: "globe",
    badge: "Semua Role",
    allowed_roles: ["citizen", "posko", "responder"],
    message_count: 0,
  },
  {
    id: "posko_mitra",
    name: "Posko BPBD ⇄ Mitra Satgas",
    description: "Sinkronisasi stok gudang, armada lapangan, bursa kebutuhan, dan penjemputan.",
    icon: "shield",
    badge: "BPBD & Mitra",
    allowed_roles: ["posko", "responder"],
    message_count: 0,
  },
  {
    id: "bantuan_warga",
    name: "Layanan Warga & Posko BPBD",
    description: "Klarifikasi kebutuhan darurat warga, update evakuasi, dan konfirmasi penerimaan.",
    icon: "users",
    badge: "Warga & Posko",
    allowed_roles: ["citizen", "posko", "responder"],
    message_count: 0,
  },
];

export function ChatKoordinasi({
  role,
  name,
  state,
  notify,
  onRefresh,
  setPage,
}: ChatKoordinasiProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>("umum");
  const [channels, setChannels] = useState<ChatChannelItem[]>(DEFAULT_CHANNELS);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("INFO");
  const [filterTag, setFilterTag] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = useState<number | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Sender info resolution
  const senderRole: "citizen" | "posko" | "responder" =
    role === "citizen" || role === "posko" || role === "responder"
      ? role
      : "citizen";

  const senderName = useMemo(() => {
    if (name && name.trim()) return name;
    if (senderRole === "citizen") return "Andi Pratama";
    if (senderRole === "posko") return "Siti Rahma";
    return "Arif Nugroho";
  }, [name, senderRole]);

  const senderOrg = useMemo(() => {
    if (state.userProfile?.org && state.userProfile.org.trim()) {
      return state.userProfile.org;
    }
    if (senderRole === "citizen") {
      return state.userProfile?.address
        ? `Warga (${state.userProfile.address.slice(0, 22)})`
        : "Warga Wilayah Terdampak";
    }
    if (senderRole === "posko") {
      return state.poskoName || "Posko BPBD Wilayah Jatim";
    }
    return "Satgas Tagana & Mitra Penyalur";
  }, [senderRole, state.userProfile, state.poskoName]);

  // Filter channels based on role access: citizen can NEVER access posko_mitra
  const visibleChannels = useMemo(() => {
    return channels.filter((c) => {
      if (senderRole === "citizen") {
        return c.id !== "posko_mitra" && (c.allowed_roles.includes("citizen") || c.allowed_roles.includes("all"));
      }
      return true;
    });
  }, [channels, senderRole]);

  // If citizen somehow has posko_mitra active, redirect to umum immediately
  useEffect(() => {
    if (senderRole === "citizen" && selectedChannel === "posko_mitra") {
      setSelectedChannel("umum");
    }
  }, [senderRole, selectedChannel]);

  // Load Channels
  const loadChannels = async () => {
    try {
      const res = await apiService.getChatChannels(senderRole);
      if (res && res.success && res.data) {
        setChannels(res.data);
      }
    } catch {
      // Keep DEFAULT_CHANNELS
    }
  };

  // Load Messages
  const loadMessages = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await apiService.getChatMessages(selectedChannel, undefined, senderRole);
      if (res && res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Gagal memuat pesan:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, [senderRole]);

  useEffect(() => {
    loadMessages(true);
  }, [selectedChannel, senderRole]);

  // 3.5s silent background polling
  useEffect(() => {
    const timer = setInterval(() => {
      loadMessages(false);
      loadChannels();
    }, 3500);
    return () => clearInterval(timer);
  }, [selectedChannel, senderRole]);

  // Auto-scroll on new message inside chat box only (does not scroll window)
  useEffect(() => {
    if (autoScroll && chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setAutoScroll(isAtBottom);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || sending) return;

    setSending(true);
    try {
      const res = await apiService.sendChatMessage({
        channel: selectedChannel,
        sender_name: senderName,
        sender_role: senderRole,
        sender_org: senderOrg,
        message: cleanText,
        tag: selectedTag,
        kebutuhan_id: selectedCaseId,
        posko_id: (state.casesList?.[0] as any)?.posko_id || 1,
      });

      if (res && res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setInputText("");
        setAutoScroll(true);
        if (notify) {
          notify(
            selectedTag === "URGENT"
              ? "Pesan Darurat terkirim & tercatat di log aktivitas."
              : "Pesan koordinasi terkirim."
          );
        }
        if (onRefresh) onRefresh();
        loadChannels();
      }
    } catch (err) {
      console.error("Gagal mengirim pesan chat:", err);
      alert("Gagal mengirim pesan chat. Periksa koneksi internet Anda.");
    } finally {
      setSending(false);
    }
  };

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (filterTag !== "ALL" && m.tag !== filterTag) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = m.message.toLowerCase().includes(q);
        const matchesSender = m.sender_name.toLowerCase().includes(q);
        const matchesOrg = (m.sender_org || "").toLowerCase().includes(q);
        return matchesMsg || matchesSender || matchesOrg;
      }
      return true;
    });
  }, [messages, filterTag, searchQuery]);

  const currentChannelInfo =
    channels.find((c) => c.id === selectedChannel) || DEFAULT_CHANNELS[0];

  return (
    <div className="chat-koordinasi-container mono-theme">
      {/* Top Compact Bar */}
      <div className="chat-top-header mono-header">
        <div className="chat-top-title-area">
          <div className="chat-title-row">
            <h2>Ruang Komunikasi</h2>
            <span className="mono-badge-pill">Sinkron 3 Role</span>
          </div>
        </div>

        {/* Sender Profile Box */}
        <div className="chat-sender-profile-card mono-profile-card">
          <div className="sender-avatar-pill">
            <div className={`mono-avatar-circle role-${senderRole}`}>
              {senderRole === "citizen" ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : senderRole === "posko" ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="17" cy="18" r="2" />
                  <path d="M14 9h4l3 4v4h-2M9 18h6" />
                </svg>
              )}
            </div>
            <div className="sender-meta-info">
              <span className="sender-name-text">{senderName}</span>
              <span className="sender-role-pill">
                {senderRole === "citizen"
                  ? "Masyarakat Terdampak"
                  : senderRole === "posko"
                  ? "Posko BPBD"
                  : "Mitra Satgas"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="chat-main-grid mono-grid">
        {/* Left Sidebar: Channels */}
        <aside className="chat-channels-sidebar mono-channels-sidebar">
          <div className="channels-sidebar-head">
            <span className="section-mini-title">KANAL KOMUNIKASI</span>
            <span className="channels-count-badge">{visibleChannels.length}</span>
          </div>

          <div className="channels-list">
            {visibleChannels.map((chan) => {
              const isSelected = chan.id === selectedChannel;

              return (
                <button
                  key={chan.id}
                  onClick={() => setSelectedChannel(chan.id)}
                  className={`channel-item-btn mono-channel-btn ${isSelected ? "selected" : ""}`}
                  type="button"
                >
                  <div className="mono-channel-card-top">
                    <div className="mono-channel-left-head">
                      <span className="mono-channel-icon">
                        {chan.id === "umum" ? (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        ) : chan.id === "posko_mitra" ? (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        )}
                      </span>
                      <span className="channel-name">{chan.name}</span>
                    </div>
                    <div className="mono-channel-right-meta">
                      <span className="mono-badge-pill">{chan.badge}</span>
                      {chan.message_count > 0 && (
                        <span className="mono-channel-counter">{chan.message_count}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Area: Messages */}
        <main className="chat-stream-panel mono-stream-panel">
          {/* Channel Header Bar */}
          <div className="chat-stream-header mono-stream-header">
            <div className="stream-header-info">
              <div className="stream-title-row">
                <h3>{currentChannelInfo.name}</h3>
                <span className="mono-badge-pill">{currentChannelInfo.badge}</span>
              </div>
            </div>

            <div className="stream-header-actions">
              <div className="sync-status-indicator mono-sync">
                <span className="mono-sync-dot"></span>
                <span className="sync-text">Live</span>
              </div>
              <button
                className="manual-refresh-btn mono-btn-subtle"
                onClick={() => loadMessages(false)}
                title="Muat ulang pesan sekarang"
                type="button"
              >
                Segarkan
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="chat-filter-bar mono-filter-bar">
            <div className="chat-search-box mono-search-box">
              <span className="search-icon">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari pesan, nama, atau instansi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="tag-filter-group mono-filter-group">
              <span className="tag-filter-label">Filter:</span>
              <button
                type="button"
                className={`tag-filter-chip mono-chip ${filterTag === "ALL" ? "active" : ""}`}
                onClick={() => setFilterTag("ALL")}
              >
                Semua ({messages.length})
              </button>
              {Object.keys(TAG_CONFIG).map((k) => {
                const cfg = TAG_CONFIG[k];
                const count = messages.filter((m) => m.tag === k).length;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`tag-filter-chip mono-chip ${filterTag === k ? "active" : ""}`}
                    onClick={() => setFilterTag(k)}
                  >
                    <span>{cfg.symbol}</span> {cfg.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            className="chat-messages-container mono-messages-container"
            ref={chatScrollContainerRef}
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="chat-loading-state mono-loading">
                <div className="mono-spinner-circle"></div>
                <p>Memuat riwayat komunikasi...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="chat-empty-state mono-empty">
                <div className="empty-icon-bubble">💬</div>
                <h4>Belum ada pesan di kanal ini</h4>
                <p>
                  Mulai percakapan koordinasi antara Warga, Posko BPBD, dan Mitra Penyalur.
                </p>
              </div>
            ) : (
              <div className="chat-messages-list">
                {filteredMessages.map((msg, idx) => {
                  const isMine =
                    msg.sender_name === senderName ||
                    (msg.sender_role === senderRole &&
                      msg.sender_name.toLowerCase().includes(senderName.toLowerCase()));

                  const tagCfg = TAG_CONFIG[msg.tag || "INFO"] || TAG_CONFIG.INFO;
                  const dateObj = new Date(msg.created_at);
                  const timeStr = isNaN(dateObj.getTime())
                    ? "Baru saja"
                    : dateObj.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                  const roleStyleClass =
                    msg.sender_role === "citizen"
                      ? "sender-citizen"
                      : msg.sender_role === "posko"
                      ? "sender-posko"
                      : "sender-responder";

                  const roleTitle =
                    msg.sender_role === "citizen"
                      ? "Masyarakat Terdampak"
                      : msg.sender_role === "posko"
                      ? "Posko BPBD Wilayah"
                      : "Mitra Satgas Penyalur";

                  return (
                    <div
                      key={msg.id || idx}
                      className={`chat-bubble-row mono-bubble-row ${isMine ? "my-message-row" : "other-message-row"}`}
                    >
                      <div className={`mono-chat-avatar ${roleStyleClass}`}>
                        {msg.sender_role === "citizen" ? (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        ) : msg.sender_role === "posko" ? (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                            <circle cx="7" cy="18" r="2" />
                            <circle cx="17" cy="18" r="2" />
                            <path d="M14 9h4l3 4v4h-2M9 18h6" />
                          </svg>
                        )}
                      </div>

                      <div className={`chat-bubble-content mono-bubble-card ${isMine ? "is-mine" : ""}`}>
                        {/* Header */}
                        <div className="bubble-header mono-bubble-header">
                          <div className="bubble-sender-meta">
                            <span className="bubble-sender-name">
                              {msg.sender_name} {isMine && <span className="mono-you-pill">(Anda)</span>}
                            </span>
                            <span className={`mono-role-badge ${roleStyleClass}`}>
                              {roleTitle}
                            </span>
                            {msg.sender_org && (
                              <span className="bubble-org-text">
                                • {msg.sender_org}
                              </span>
                            )}
                          </div>

                          <div className="bubble-right-meta">
                            {msg.tag && (
                              <span
                                className={`mono-tag-pill ${tagCfg.isDark ? "tag-dark" : "tag-light"}`}
                              >
                                <span>{tagCfg.symbol}</span> {tagCfg.label}
                              </span>
                            )}
                            <span className="bubble-timestamp">{timeStr}</span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="bubble-body-text">{msg.message}</div>

                        {/* Reference to Case */}
                        {msg.kebutuhan_id && (
                          <div className="bubble-reference-card mono-ref-card">
                            <span className="ref-icon">
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="17" x2="12" y2="22" />
                                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9a2 2 0 0 1-1.11-1.79V7a4 4 0 0 0-8 0v3.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                              </svg>
                            </span>
                            <span className="ref-label">
                              Terkait Laporan: #{msg.kebutuhan_id}
                            </span>
                            {setPage && (
                              <button
                                type="button"
                                className="ref-jump-link mono-ref-link"
                                onClick={() => setPage("cases")}
                              >
                                Lihat Detail →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Streamlined Unified Compose Form */}
          <form className="chat-compose-box mono-compose-box" onSubmit={handleSendMessage}>
            <div className="compose-input-wrapper">
              <textarea
                className="chat-textarea-input mono-textarea"
                placeholder={`Tulis pesan sebagai ${senderName}... (Enter untuk kirim, Shift+Enter untuk baris baru)`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
              />
            </div>

            <div className="compose-bottom-toolbar">
              <div className="compose-toolbar-left">
                {/* Tag Selection Chips */}
                <div className="tag-selector-group mono-tag-select">
                  <span className="toolbar-label">Label:</span>
                  {Object.keys(TAG_CONFIG).map((k) => {
                    const cfg = TAG_CONFIG[k];
                    const isSelected = selectedTag === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        className={`compose-tag-btn mono-compose-tag ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedTag(k)}
                        title={`Label: ${cfg.label}`}
                      >
                        <span>{cfg.symbol}</span> {cfg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Optional Case attachment */}
                {state.casesList && state.casesList.length > 0 && (
                  <div className="compose-case-attach-wrap">
                    <select
                      id="case-select-input"
                      className="compose-case-select mono-select"
                      value={selectedCaseId || ""}
                      onChange={(e) =>
                        setSelectedCaseId(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      title="Tautkan dengan laporan kasus"
                    >
                      <option value="">📎 Tautkan Kasus (Opsional)</option>
                      {state.casesList.slice(0, 10).map((c) => (
                        <option key={c.id} value={c.id}>
                          {(c as any).kode_kasus || `#${c.id}`} - {(c as any).item_bantuan || c.item || "Kebutuhan"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="chat-send-submit-btn mono-send-btn"
                disabled={sending || !inputText.trim()}
              >
                {sending ? (
                  <span>Mengirim...</span>
                ) : (
                  <>
                    <span className="send-btn-text">Kirim</span>
                    <span className="send-arrow-icon">➤</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
