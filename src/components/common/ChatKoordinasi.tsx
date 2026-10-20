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

const TAG_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  INFO: {
    label: "Info",
    icon: "📢",
    bg: "rgba(14, 165, 233, 0.12)",
    text: "#0284c7",
    border: "rgba(14, 165, 233, 0.3)",
  },
  URGENT: {
    label: "Darurat",
    icon: "🚨",
    bg: "rgba(239, 68, 68, 0.15)",
    text: "#dc2626",
    border: "rgba(239, 68, 68, 0.4)",
  },
  LOGISTIK: {
    label: "Logistik",
    icon: "📦",
    bg: "rgba(245, 158, 11, 0.14)",
    text: "#d97706",
    border: "rgba(245, 158, 11, 0.35)",
  },
  AKSES: {
    label: "Akses Jalan",
    icon: "🚧",
    bg: "rgba(139, 92, 246, 0.14)",
    text: "#7c3aed",
    border: "rgba(139, 92, 246, 0.35)",
  },
  KONFIRMASI: {
    label: "Konfirmasi",
    icon: "✅",
    bg: "rgba(16, 185, 129, 0.14)",
    text: "#059669",
    border: "rgba(16, 185, 129, 0.35)",
  },
};

const DEFAULT_CHANNELS: ChatChannelItem[] = [
  {
    id: "umum",
    name: "Kanal Siaga & Tanggap Darurat",
    description: "Ruang koordinasi umum terbuka bagi Warga, Posko BPBD, dan Mitra Relawan.",
    icon: "globe",
    badge: "Lintas Role",
    allowed_roles: ["citizen", "posko", "responder"],
    message_count: 0,
  },
  {
    id: "posko_mitra",
    name: "Posko BPBD ⇄ Mitra Satgas",
    description: "Koordinasi logistik bantuan, ketersediaan stok posko, dan armada pengiriman.",
    icon: "shield",
    badge: "BPBD & Mitra",
    allowed_roles: ["posko", "responder"],
    message_count: 0,
  },
  {
    id: "bantuan_warga",
    name: "Layanan Warga & Posko BPBD",
    description: "Komunikasi langsung antara warga terdampak dan petugas posko wilayah.",
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

  // Determine current sender identity
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
        ? `Warga (${state.userProfile.address.slice(0, 20)}...)`
        : "Warga Terdampak (RT 04)";
    }
    if (senderRole === "posko") {
      return state.poskoName || "Posko BPBD Provinsi Jawa Timur";
    }
    return "Satgas Tagana & Mitra Penyalur";
  }, [senderRole, state.userProfile, state.poskoName]);

  // Load Channels
  const loadChannels = async () => {
    try {
      const res = await apiService.getChatChannels();
      if (res && res.success && res.data) {
        setChannels(res.data);
      }
    } catch {
      // Fallback remains DEFAULT_CHANNELS
    }
  };

  // Load Messages
  const loadMessages = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await apiService.getChatMessages(selectedChannel);
      if (res && res.success && Array.isArray(res.data)) {
        setMessages(res.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Gagal memuat pesan chat:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    loadMessages(true);
  }, [selectedChannel]);

  // Polling every 3.5 seconds for live updates
  useEffect(() => {
    const timer = setInterval(() => {
      loadMessages(false);
      loadChannels();
    }, 3500);

    return () => clearInterval(timer);
  }, [selectedChannel]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Detect manual user scroll to pause autoScroll
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setAutoScroll(isAtBottom);
  };

  // Send message handler
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
        posko_id: state.casesList?.[0]?.posko_id || 1,
      });

      if (res && res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setInputText("");
        setAutoScroll(true);
        if (notify) {
          notify(
            selectedTag === "URGENT"
              ? "🚨 Pesan Darurat terkirim & tercatat di log aktivitas!"
              : "Pesan koordinasi terkirim."
          );
        }
        if (onRefresh) onRefresh();
        loadChannels();
      }
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
      alert("Gagal mengirim pesan chat. Periksa koneksi internet Anda.");
    } finally {
      setSending(false);
    }
  };

  // Filter messages by tag and search query
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

  // Helper template inserts
  const quickTemplates = [
    {
      text: "🚨 Ada kebutuhan mendesak air bersih & obat di lokasi warga.",
      tag: "URGENT",
    },
    {
      text: "📦 Armada penjemputan logistik sedang meluncur ke Posko Wilayah.",
      tag: "LOGISTIK",
    },
    {
      text: "🚧 Jalur alternatif via jalan barat bisa dilalui kendaraan roda 4.",
      tag: "AKSES",
    },
    {
      text: "✅ Bantuan paket sembako sudah diterima warga dengan selamat.",
      tag: "KONFIRMASI",
    },
  ];

  return (
    <div className="chat-koordinasi-container">
      {/* Top Banner / Breadcrumb */}
      <div className="chat-top-header">
        <div className="chat-top-title-area">
          <div className="chat-role-indicator-badge">
            <span className="live-dot-pulse"></span>
            <span>Jalur Koordinasi Multi-Role Real-Time</span>
          </div>
          <h2>Ruang Komunikasi Tanggap Bencana</h2>
          <p>
            Platform komunikasi sinkron terpadu antara <strong>Warga Terdampak</strong>,{" "}
            <strong>Koordinator Posko BPBD</strong>, dan{" "}
            <strong>Mitra Satgas Penyalur</strong>.
          </p>
        </div>

        {/* Sender Profile Quick Bar */}
        <div className="chat-sender-profile-card">
          <div className="sender-avatar-pill">
            <div
              className={`role-avatar-circle ${
                senderRole === "citizen"
                  ? "role-citizen"
                  : senderRole === "posko"
                  ? "role-posko"
                  : "role-responder"
              }`}
            >
              {senderRole === "citizen" ? "👤" : senderRole === "posko" ? "🏢" : "🚚"}
            </div>
            <div className="sender-meta-info">
              <span className="sender-name-text">{senderName}</span>
              <span className="sender-role-pill">
                {senderRole === "citizen"
                  ? "Masyarakat Terdampak"
                  : senderRole === "posko"
                  ? "Posko BPBD Wilayah"
                  : "Mitra Satgas Penyalur"}
              </span>
            </div>
          </div>
          <div className="sender-org-badge">
            <span className="org-label">Instansi/Wilayah:</span>
            <span className="org-value">{senderOrg}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Channels, Right Active Room */}
      <div className="chat-main-grid">
        {/* Left Sidebar: Channels */}
        <aside className="chat-channels-sidebar">
          <div className="channels-sidebar-head">
            <span className="section-mini-title">KANAL KOMUNIKASI</span>
            <span className="channels-count-badge">{channels.length} Kanal</span>
          </div>

          <div className="channels-list">
            {channels.map((chan) => {
              const isSelected = chan.id === selectedChannel;
              const hasAccess =
                chan.allowed_roles.includes("all") ||
                chan.allowed_roles.includes(senderRole);

              return (
                <button
                  key={chan.id}
                  onClick={() => setSelectedChannel(chan.id)}
                  className={`channel-item-btn ${isSelected ? "selected" : ""} ${
                    !hasAccess ? "dimmed-access" : ""
                  }`}
                  type="button"
                >
                  <div className="channel-icon-box">
                    {chan.id === "umum" ? "🌐" : chan.id === "posko_mitra" ? "🏢" : "🤝"}
                  </div>
                  <div className="channel-text-info">
                    <div className="channel-name-row">
                      <span className="channel-name">{chan.name}</span>
                      <span className="channel-badge-tag">{chan.badge}</span>
                    </div>
                    <p className="channel-desc">{chan.description}</p>
                    {chan.latest_message && (
                      <div className="channel-latest-preview">
                        <strong>{chan.latest_message.sender_name}:</strong>{" "}
                        {chan.latest_message.message.slice(0, 32)}...
                      </div>
                    )}
                  </div>
                  {chan.message_count > 0 && (
                    <span className="channel-msg-count">{chan.message_count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Guidance Box */}
          <div className="chat-guidance-card">
            <div className="guidance-title">
              <span>💡 Panduan Komunikasi</span>
            </div>
            <ul className="guidance-list">
              <li>
                <strong>Warga:</strong> Sampaikan kebutuhan genting, lokasi akurat, atau
                konfirmasi paket diterima.
              </li>
              <li>
                <strong>Posko BPBD:</strong> Verifikasi data lapangan, alokasikan posko &
                beri update status darurat.
              </li>
              <li>
                <strong>Mitra:</strong> Laporkan pergerakan armada, estimasi tiba, &
                hambatan akses jalur.
              </li>
            </ul>
          </div>
        </aside>

        {/* Right Area: Messages + Input Bar */}
        <main className="chat-stream-panel">
          {/* Channel Header Bar */}
          <div className="chat-stream-header">
            <div className="stream-header-info">
              <div className="stream-title-row">
                <h3>{currentChannelInfo.name}</h3>
                <span className="stream-badge-pill">{currentChannelInfo.badge}</span>
              </div>
              <p className="stream-description">{currentChannelInfo.description}</p>
            </div>

            <div className="stream-header-actions">
              <div className="sync-status-indicator">
                <span className="sync-pulse-dot"></span>
                <span className="sync-text">
                  Sinkron Otomatis (
                  {lastUpdated.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                  )
                </span>
              </div>
              <button
                className="manual-refresh-btn"
                onClick={() => loadMessages(false)}
                title="Muat ulang pesan sekarang"
                type="button"
              >
                🔄 Segarkan
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="chat-filter-bar">
            <div className="chat-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Cari pesan, nama pengirim, atau instansi..."
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

            <div className="tag-filter-group">
              <span className="tag-filter-label">Filter Tag:</span>
              <button
                type="button"
                className={`tag-filter-chip ${filterTag === "ALL" ? "active" : ""}`}
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
                    className={`tag-filter-chip ${filterTag === k ? "active" : ""}`}
                    onClick={() => setFilterTag(k)}
                  >
                    <span>{cfg.icon}</span> {cfg.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            className="chat-messages-container"
            ref={chatScrollContainerRef}
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="chat-loading-state">
                <div className="loading-spinner-circle"></div>
                <p>Memuat riwayat komunikasi koordinasi...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="chat-empty-state">
                <div className="empty-icon-bubble">💬</div>
                <h4>Belum ada pesan di kanal ini</h4>
                <p>
                  Jadilah yang pertama memulai komunikasi koordinasi tanggap darurat
                  antara Warga, Posko, dan Mitra Bantuan.
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
                      className={`chat-bubble-row ${isMine ? "my-message-row" : "other-message-row"}`}
                    >
                      <div className={`chat-avatar-wrapper ${roleStyleClass}`}>
                        {msg.sender_role === "citizen"
                          ? "👤"
                          : msg.sender_role === "posko"
                          ? "🏢"
                          : "🚚"}
                      </div>

                      <div className={`chat-bubble-content ${roleStyleClass} ${isMine ? "mine" : ""}`}>
                        {/* Bubble Header */}
                        <div className="bubble-header">
                          <div className="bubble-sender-meta">
                            <span className="bubble-sender-name">
                              {msg.sender_name} {isMine && <span className="you-pill">(Anda)</span>}
                            </span>
                            <span className={`bubble-role-badge ${roleStyleClass}`}>
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
                                className="bubble-tag-pill"
                                style={{
                                  backgroundColor: tagCfg.bg,
                                  color: tagCfg.text,
                                  borderColor: tagCfg.border,
                                }}
                              >
                                <span>{tagCfg.icon}</span> {tagCfg.label}
                              </span>
                            )}
                            <span className="bubble-timestamp">{timeStr}</span>
                          </div>
                        </div>

                        {/* Bubble Message Body */}
                        <div className="bubble-body-text">{msg.message}</div>

                        {/* Optional Reference to Case or Need */}
                        {msg.kebutuhan_id && (
                          <div className="bubble-reference-card">
                            <span className="ref-icon">📌</span>
                            <span className="ref-label">
                              Terkait Laporan Kasus: #{msg.kebutuhan_id}
                            </span>
                            {setPage && (
                              <button
                                type="button"
                                className="ref-jump-link"
                                onClick={() => setPage("cases")}
                              >
                                Lihat Laporan →
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

          {/* Quick Response Suggestion Bar */}
          <div className="chat-quick-templates">
            <span className="quick-label">⚡ Template Cepat:</span>
            <div className="template-pills-row">
              {quickTemplates.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className="template-pill-btn"
                  onClick={() => {
                    setInputText(item.text);
                    setSelectedTag(item.tag);
                  }}
                >
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compose Form */}
          <form className="chat-compose-box" onSubmit={handleSendMessage}>
            <div className="compose-top-tools">
              <div className="tag-selector-group">
                <span className="compose-tool-label">Label Tag:</span>
                {Object.keys(TAG_CONFIG).map((k) => {
                  const cfg = TAG_CONFIG[k];
                  const isSelected = selectedTag === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`compose-tag-btn ${isSelected ? "selected" : ""}`}
                      style={{
                        backgroundColor: isSelected ? cfg.bg : "transparent",
                        borderColor: isSelected ? cfg.border : "#e2e8f0",
                        color: isSelected ? cfg.text : "#64748b",
                      }}
                      onClick={() => setSelectedTag(k)}
                    >
                      <span>{cfg.icon}</span> {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Optional Case attachment selector */}
              {state.casesList && state.casesList.length > 0 && (
                <div className="compose-case-select-wrapper">
                  <label htmlFor="case-select-input" className="compose-tool-label">
                    Tautkan Kasus:
                  </label>
                  <select
                    id="case-select-input"
                    className="compose-case-select"
                    value={selectedCaseId || ""}
                    onChange={(e) =>
                      setSelectedCaseId(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  >
                    <option value="">(Tanpa Tautan Kasus)</option>
                    {state.casesList.slice(0, 10).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.kode_kasus || `Kasus #${c.id}`} - {c.item_bantuan || "Kebutuhan"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="compose-input-row">
              <textarea
                className="chat-textarea-input"
                placeholder={`Kirim pesan koordinasi sebagai ${senderName} (${senderOrg})... (Tekan Enter untuk kirim, Shift+Enter untuk baris baru)`}
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

              <button
                type="submit"
                className="chat-send-submit-btn"
                disabled={sending || !inputText.trim()}
              >
                {sending ? (
                  <span className="sending-spinner">Mengirim...</span>
                ) : (
                  <>
                    <span>Kirim Pesan</span>
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
