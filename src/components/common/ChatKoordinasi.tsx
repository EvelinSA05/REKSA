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

// Clean Tag Configuration
const TAG_CONFIG: Record<
  string,
  { label: string; key: string }
> = {
  INFO: { label: "Info", key: "INFO" },
  URGENT: { label: "Darurat", key: "URGENT" },
  LOGISTIK: { label: "Logistik", key: "LOGISTIK" },
  AKSES: { label: "Akses Jalan", key: "AKSES" },
  KONFIRMASI: { label: "Konfirmasi", key: "KONFIRMASI" },
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

const INITIAL_SEED_MESSAGES_BY_CHANNEL: Record<string, ChatMessageItem[]> = {
  umum: [
    {
      id: 1,
      channel: "umum",
      sender_name: "Siti Rahma",
      sender_role: "posko",
      sender_org: "Posko BPBD Buduran (Posko Induk)",
      message: "Halo semua rekan Posko, Mitra Relawan, dan Warga. Saluran koordinasi terpadu resmi dibuka untuk mempercepat respon distribusi logistik pascabencana di wilayah Buduran & sekitarnya.",
      tag: "INFO",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      status: "sent",
    },
    {
      id: 2,
      channel: "umum",
      sender_name: "Andi Pratama",
      sender_role: "citizen",
      sender_org: "Masyarakat Terdampak (RT 03 Buduran)",
      message: "Selamat siang Bu Siti dan tim BPBD. Kami warga di sekitar jalan utama dekat Balai Desa saat ini air sudah mulai surut, namun persediaan air minum dan paket sembako keluarga kami menipis.",
      tag: "URGENT",
      kebutuhan_id: 317,
      created_at: new Date(Date.now() - 2700000).toISOString(),
      status: "sent",
    },
    {
      id: 3,
      channel: "umum",
      sender_name: "Siti Rahma",
      sender_role: "posko",
      sender_org: "Posko BPBD Buduran",
      message: "Baik Pak Andi Pratama, laporan kebutuhan Anda (Kasus #317) sudah kami validasi prioritas TINGGI dan telah dialokasikan ke armada distribusi cepat.",
      tag: "KONFIRMASI",
      kebutuhan_id: 317,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      status: "sent",
    },
    {
      id: 4,
      channel: "umum",
      sender_name: "Arif Nugroho",
      sender_role: "responder",
      sender_org: "Mitra Satgas Penyalur Cepat",
      message: "Siap Bu Siti & Pak Andi. Armada Distribusi Cepat kami sedang memuat 23 Paket Sandang & Pangan di Posko Induk. GPS ponsel pengemudi aktif dan jalur rute menuju Buduran terpantau lancar.",
      tag: "LOGISTIK",
      kebutuhan_id: 317,
      created_at: new Date(Date.now() - 900000).toISOString(),
      status: "sent",
    },
    {
      id: 5,
      channel: "umum",
      sender_name: "Andi Pratama",
      sender_role: "citizen",
      sender_org: "Masyarakat Terdampak (RT 03 Buduran)",
      message: "Terima kasih banyak atas respon cepatnya Pak Arif & Bu Siti! Kami menunggu di pos titik kumpul warga RT 03.",
      tag: "INFO",
      created_at: new Date(Date.now() - 300000).toISOString(),
      status: "sent",
    },
  ],
  posko_mitra: [
    {
      id: 6,
      channel: "posko_mitra",
      sender_name: "Siti Rahma",
      sender_role: "posko",
      sender_org: "Koordinator BPBD Buduran",
      message: "Panggilan untuk seluruh Mitra Kemanusiaan: Stok selimut dan hygiene kit di Posko Induk tersisa 40 paket. Bagi mitra yang memiliki kesiapan pasokan tambahan, silakan ajukan komitmen melalui Bursa Bantuan.",
      tag: "LOGISTIK",
      created_at: new Date(Date.now() - 21600000).toISOString(),
      status: "sent",
    },
    {
      id: 7,
      channel: "posko_mitra",
      sender_name: "Arif Nugroho",
      sender_role: "responder",
      sender_org: "Satgas Reaksi Cepat BPBD",
      message: "Lapor Posko, penawaran 12 Paket Sandang dari Satgas SRC sudah diverifikasi dan siap digabungkan dengan muatan distribusi sore ini.",
      tag: "KONFIRMASI",
      created_at: new Date(Date.now() - 10800000).toISOString(),
      status: "sent",
    },
    {
      id: 8,
      channel: "posko_mitra",
      sender_name: "Siti Rahma",
      sender_role: "posko",
      sender_org: "Koordinator BPBD Buduran",
      message: "Diterima Pak Arif. Pastikan pengemudi mengaktifkan fitur GPS ponsel di aplikasi agar posisi live armada dapat dipantau oleh Posko dan warga penerima.",
      tag: "INFO",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      status: "sent",
    },
  ],
  bantuan_warga: [
    {
      id: 9,
      channel: "bantuan_warga",
      sender_name: "Andi Pratama",
      sender_role: "citizen",
      sender_org: "Warga Terdampak",
      message: "Izin bertanya kepada petugas, apakah bagi warga lansia yang tidak bisa berjalan jauh sembako bisa diantar langsung ke rumah tinggal?",
      tag: "INFO",
      created_at: new Date(Date.now() - 10000000).toISOString(),
      status: "sent",
    },
    {
      id: 10,
      channel: "bantuan_warga",
      sender_name: "Siti Rahma",
      sender_role: "posko",
      sender_org: "Petugas Layanan Posko",
      message: "Bisa sekali Pak Andi. Sistem REKSA memprioritaskan kelompok rentan (lansia, balita, disabilitas). Tim armada relawan diinstruksikan menyerahkan langsung door-to-door ke titik rumah warga yang bersangkutan.",
      tag: "KONFIRMASI",
      created_at: new Date(Date.now() - 8400000).toISOString(),
      status: "sent",
    },
    {
      id: 11,
      channel: "bantuan_warga",
      sender_name: "Arif Nugroho",
      sender_role: "responder",
      sender_org: "Relawan Lapangan BPBD",
      message: "Betul Pak Andi, kami membawa sepeda motor operasional cadangan jika gang pemukiman sempit tidak bisa dilewati mobil box. Kami pastikan bantuan sampai ke tangan penerima.",
      tag: "AKSES",
      created_at: new Date(Date.now() - 7000000).toISOString(),
      status: "sent",
    },
  ],
};

const getInitialMessagesByChannel = (): Record<string, ChatMessageItem[]> => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("reksa_chat_messages_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.umum)) {
          return {
            ...INITIAL_SEED_MESSAGES_BY_CHANNEL,
            ...parsed,
          };
        }
      }
    } catch {
      // ignore
    }
  }
  return INITIAL_SEED_MESSAGES_BY_CHANNEL;
};

export function ChatKoordinasi({
  role,
  name,
  state,
  notify,
  onRefresh,
  setPage,
}: ChatKoordinasiProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reksa_chat_selected_channel");
      if (saved && (saved === "umum" || saved === "posko_mitra" || saved === "bantuan_warga")) {
        if (role === "citizen" && saved === "posko_mitra") return "umum";
        return saved;
      }
    }
    return "umum";
  });
  const [channels, setChannels] = useState<ChatChannelItem[]>(DEFAULT_CHANNELS);
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessageItem[]>>(getInitialMessagesByChannel);
  const [loading, setLoading] = useState<boolean>(false);
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
  const activeReqRef = useRef<string>("");

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

  // Load Messages for a specific channel
  const loadMessages = async (targetChannel?: string, isInitial = false) => {
    const channelToLoad = typeof targetChannel === "string" && targetChannel ? targetChannel : selectedChannel;
    if (isInitial && (!messagesByChannel[channelToLoad] || messagesByChannel[channelToLoad].length === 0)) {
      setLoading(true);
    }
    try {
      const res = await apiService.getChatMessages(channelToLoad, undefined, senderRole);
      if (res && res.success && Array.isArray(res.data)) {
        setMessagesByChannel((prev) => {
          const currentList = prev[channelToLoad] || [];
          const pending = currentList.filter(
            (m) => m.status === "sending" && (m.channel || channelToLoad) === channelToLoad
          );

          const serverList: ChatMessageItem[] = res.data.map((m) => ({
            ...m,
            channel: m.channel || channelToLoad,
            status: "sent",
          }));

          const merged = [...serverList];
          for (const p of pending) {
            const exists = merged.some(
              (m) => m.id === p.id || (m.message === p.message && m.sender_name === p.sender_name)
            );
            if (!exists) {
              merged.push(p);
            }
          }

          return {
            ...prev,
            [channelToLoad]: merged,
          };
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn("Gagal memuat pesan live untuk channel", channelToLoad, err);
    } finally {
      setLoading(false);
    }
  };

  // Persist messages cache to localStorage for instant reload on refresh
  useEffect(() => {
    try {
      localStorage.setItem("reksa_chat_messages_cache", JSON.stringify(messagesByChannel));
    } catch {
      // ignore quota limits
    }
  }, [messagesByChannel]);

  // Persist selected channel across page refreshes
  useEffect(() => {
    try {
      localStorage.setItem("reksa_chat_selected_channel", selectedChannel);
    } catch {
      // ignore
    }
  }, [selectedChannel]);

  useEffect(() => {
    loadChannels();
  }, [senderRole]);

  useEffect(() => {
    loadMessages(selectedChannel, false);
  }, [selectedChannel, senderRole]);

  // Silent background polling (active channel only, 8s interval)
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadMessages(selectedChannel, false);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [selectedChannel, senderRole]);

  // Messages of the active channel
  const currentChannelMessages = useMemo(() => {
    return messagesByChannel[selectedChannel] || [];
  }, [messagesByChannel, selectedChannel]);

  // Filter messages for currently selected channel
  const filteredMessages = useMemo(() => {
    return currentChannelMessages.filter((m) => {
      // Hard guarantee: message channel MUST match selected channel
      if ((m.channel || "umum") !== selectedChannel) return false;
      if (filterTag !== "ALL" && m.tag !== filterTag) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = (m.message || "").toLowerCase().includes(q);
        const matchesSender = (m.sender_name || "").toLowerCase().includes(q);
        const matchesOrg = (m.sender_org || "").toLowerCase().includes(q);
        return matchesMsg || matchesSender || matchesOrg;
      }
      return true;
    });
  }, [currentChannelMessages, selectedChannel, filterTag, searchQuery]);

  // Auto-scroll on new message inside chat box only (does not scroll window)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatScrollContainerRef.current) {
        chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [filteredMessages.length, selectedChannel]);

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setAutoScroll(isAtBottom);
  };

  // Send message with Optimistic UI (instant WhatsApp-style UX)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText) return;

    const currentChan = selectedChannel;
    const tempId = Date.now();
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      channel: currentChan,
      sender_name: senderName,
      sender_role: senderRole,
      sender_org: senderOrg,
      message: cleanText,
      tag: selectedTag,
      kebutuhan_id: selectedCaseId,
      posko_id: (state.casesList?.[0] as any)?.posko_id || 1,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    // Immediately clear input & display bubble with sending checkmark in the active channel
    setInputText("");
    setMessagesByChannel((prev) => ({
      ...prev,
      [currentChan]: [...(prev[currentChan] || []), optimisticMsg],
    }));
    setAutoScroll(true);

    try {
      const res = await apiService.sendChatMessage({
        channel: currentChan,
        sender_name: senderName,
        sender_role: senderRole,
        sender_org: senderOrg,
        message: cleanText,
        tag: selectedTag,
        kebutuhan_id: selectedCaseId,
        posko_id: (state.casesList?.[0] as any)?.posko_id || 1,
      });

      if (res && res.success && res.data) {
        const serverMsg: ChatMessageItem = {
          ...res.data,
          channel: res.data.channel || currentChan,
          status: "sent",
        };

        // Upgrade optimistic message to confirmed server message with double checkmark
        setMessagesByChannel((prev) => ({
          ...prev,
          [currentChan]: (prev[currentChan] || []).map((m) =>
            m.id === tempId ? serverMsg : m
          ),
        }));

        // Refresh channel badge counts
        loadChannels();

        if (notify) {
          notify(
            selectedTag === "URGENT"
              ? "Pesan Darurat terkirim & tercatat di log aktivitas."
              : "Pesan koordinasi terkirim."
          );
        }
        if (selectedCaseId && onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error("Gagal menerima konfirmasi dari server");
      }
    } catch (err) {
      console.error("Gagal mengirim pesan chat:", err);
      // Mark bubble as failed
      setMessagesByChannel((prev) => ({
        ...prev,
        [currentChan]: (prev[currentChan] || []).map((m) =>
          m.id === tempId ? { ...m, status: "error" } : m
        ),
      }));
      if (notify) {
        notify("Pesan belum tersinkronisasi ke server. Silakan coba kembali.");
      }
    }
  };

  const currentChannelInfo =
    channels.find((c) => c.id === selectedChannel) || DEFAULT_CHANNELS[0];

  const formatChannelInfo = (chan: ChatChannelItem) => {
    if (chan.id === "umum") {
      return {
        title: "Kanal Umum",
        subtitle: "Siaga Bencana • Semua Role",
      };
    }
    if (chan.id === "posko_mitra") {
      return {
        title: "Posko ⇄ Mitra",
        subtitle: "BPBD & Satgas Logistik",
      };
    }
    if (chan.id === "bantuan_warga") {
      return {
        title: "Layanan Warga",
        subtitle: "Warga & Posko BPBD",
      };
    }
    return {
      title: chan.name.replace(/\s*\([^)]*\)/g, "").trim() || chan.name,
      subtitle: chan.badge || chan.description,
    };
  };

  const getAffiliationText = (m: ChatMessageItem) => {
    if (m.sender_org && m.sender_org.trim()) {
      return m.sender_org;
    }
    if (m.sender_role === "posko") return "Posko BPBD";
    if (m.sender_role === "responder") return "Mitra Satgas Penyalur";
    return "Masyarakat Terdampak";
  };

  const activeChannelMeta = formatChannelInfo(currentChannelInfo);

  return (
    <div className="chat-koordinasi-container mono-theme">
      {/* Top Channel Selector: Placed above the chat stream panel */}
      <div className="chat-channels-top-bar">
        <div className="channels-top-head">
          <span className="section-mini-title">KANAL KOMUNIKASI</span>
          <span className="channels-count-badge">{visibleChannels.length} Kanal Aktif</span>
        </div>

        <div className="channels-horizontal-pills">
          {visibleChannels.map((chan) => {
            const isSelected = chan.id === selectedChannel;
            const info = formatChannelInfo(chan);

            return (
              <button
                key={chan.id}
                onClick={() => setSelectedChannel(chan.id)}
                className={`channel-pill-btn ${isSelected ? "selected" : ""}`}
                type="button"
              >
                <span className="channel-pill-icon">
                  {chan.id === "umum" ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  ) : chan.id === "posko_mitra" ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  )}
                </span>
                <div className="channel-pill-content">
                  <span className="channel-pill-title">{info.title}</span>
                  <span className="channel-pill-desc">{info.subtitle}</span>
                </div>
                {chan.message_count > 0 && (
                  <span className="channel-pill-count">{chan.message_count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="chat-main-grid mono-grid">
        {/* Chat Stream Panel */}
        <main className="chat-stream-panel mono-stream-panel">
          {/* Channel Header Bar */}
          <div className="chat-stream-header mono-stream-header">
            <div className="stream-header-info">
              <div className="stream-title-row">
                <h3>{activeChannelMeta.title}</h3>
                <span className="mono-badge-pill">{activeChannelMeta.subtitle}</span>
              </div>
            </div>

            <div className="stream-header-actions">
              <div className="sync-status-indicator mono-sync">
                <span className="mono-sync-dot"></span>
                <span className="sync-text">Live</span>
              </div>
              <button
                className="manual-refresh-btn mono-btn-subtle"
                onClick={() => loadMessages(selectedChannel, false)}
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
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari pesan atau nama..."
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
              <button
                type="button"
                className={`tag-filter-chip mono-chip ${filterTag === "ALL" ? "active" : ""}`}
                onClick={() => setFilterTag("ALL")}
              >
                Semua ({currentChannelMessages.length})
              </button>
              {Object.keys(TAG_CONFIG).map((k) => {
                const cfg = TAG_CONFIG[k];
                const count = currentChannelMessages.filter((m) => m.tag === k).length;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`tag-filter-chip mono-chip ${filterTag === k ? "active" : ""}`}
                    onClick={() => setFilterTag(k)}
                  >
                    {cfg.label} {count > 0 && <span className="chip-count">({count})</span>}
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
            {loading && currentChannelMessages.length === 0 ? (
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

                  const affiliation = getAffiliationText(msg);

                  return (
                    <div
                      key={msg.id || idx}
                      className={`wa-message-row ${isMine ? "wa-row-mine" : "wa-row-other"}`}
                    >
                      {!isMine && (
                        <div className={`wa-avatar ${roleStyleClass}`} title={`${msg.sender_name} (${affiliation})`}>
                          {msg.sender_role === "citizen" ? (
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          ) : msg.sender_role === "posko" ? (
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                              <circle cx="7" cy="18" r="2" />
                              <circle cx="17" cy="18" r="2" />
                              <path d="M14 9h4l3 4v4h-2M9 18h6" />
                            </svg>
                          )}
                        </div>
                      )}

                      <div className={`wa-bubble-card ${isMine ? "wa-bubble-mine" : "wa-bubble-other"}`}>
                        {/* Header for other people's messages */}
                        {!isMine ? (
                          <div className="wa-bubble-header">
                            <span className={`wa-sender-name ${roleStyleClass}`}>
                              {msg.sender_name}
                            </span>
                            <span className="wa-sender-role">• {affiliation}</span>
                            {msg.tag && (
                              <span className={`mono-tag-pill tag-${msg.tag.toLowerCase()}`}>
                                {tagCfg.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          msg.tag && msg.tag !== "INFO" && (
                            <div className="wa-bubble-header wa-mine-tag">
                              <span className={`mono-tag-pill tag-${msg.tag.toLowerCase()}`}>
                                {tagCfg.label}
                              </span>
                            </div>
                          )
                        )}

                        {/* Body Text */}
                        <div className="wa-bubble-body">{msg.message}</div>

                        {/* Reference to Case */}
                        {msg.kebutuhan_id && (
                          <div className="wa-ref-box">
                            <span className="wa-ref-icon">📌</span>
                            <span className="wa-ref-text">Terkait Kasus #{msg.kebutuhan_id}</span>
                            {setPage && (
                              <button
                                type="button"
                                className="wa-ref-link"
                                onClick={() => setPage("cases")}
                              >
                                Detail →
                              </button>
                            )}
                          </div>
                        )}

                        {/* WhatsApp Bubble Footer with time & status check for own message */}
                        <div className="wa-bubble-footer">
                          <span className="wa-timestamp">{timeStr}</span>
                          {isMine && (
                            <span
                              className="wa-check-marks"
                              title={
                                msg.status === "sending"
                                  ? "Sedang mengirim..."
                                  : msg.status === "error"
                                  ? "Gagal terkirim"
                                  : "Terkirim & Terbaca"
                              }
                            >
                              {msg.status === "sending" ? (
                                <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
                                  <path
                                    d="M3.5 9.5l3.5 3.5 8-8"
                                    stroke="#94a3b8"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : msg.status === "error" ? (
                                <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: "bold" }}>⚠️</span>
                              ) : (
                                <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
                                  <path
                                    d="M1.5 9.5l3.5 3.5 8-8"
                                    stroke="#53bdeb"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M5.5 9.5l3.5 3.5 8-8"
                                    stroke="#53bdeb"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Clean Streamlined Compose Form */}
          <form className="chat-compose-box mono-compose-box" onSubmit={handleSendMessage}>
            <div className="compose-input-wrapper">
              <textarea
                className="chat-textarea-input mono-textarea"
                placeholder={`Tulis pesan koordinasi sebagai ${senderName}... (Enter untuk kirim)`}
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
                        {cfg.label}
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
                disabled={!inputText.trim()}
              >
                <span className="send-btn-text">Kirim</span>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
