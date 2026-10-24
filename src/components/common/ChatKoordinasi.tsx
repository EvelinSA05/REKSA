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
        if (parsed && typeof parsed === "object") {
          const filterClean = (list?: ChatMessageItem[]) =>
            (list || []).filter(
              (m) =>
                m.id <= 11 &&
                !["jgvjh", "bjbjk", "sdtsd", "sdfsdf", "bnb", "gesadsfds", "fgdfg]"].includes(
                  (m.message || "").trim().toLowerCase()
                )
            );
          return {
            umum: filterClean(parsed.umum).length > 0 ? filterClean(parsed.umum) : INITIAL_SEED_MESSAGES_BY_CHANNEL.umum,
            posko_mitra: filterClean(parsed.posko_mitra).length > 0 ? filterClean(parsed.posko_mitra) : INITIAL_SEED_MESSAGES_BY_CHANNEL.posko_mitra,
            bantuan_warga: filterClean(parsed.bantuan_warga).length > 0 ? filterClean(parsed.bantuan_warga) : INITIAL_SEED_MESSAGES_BY_CHANNEL.bantuan_warga,
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

  const [channelDropdownOpen, setChannelDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setChannelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="clean-chat-wrapper">
      {/* 1. TOP HEADER BAR: Channel Dropdown (Left) & Actions (Right) */}
      <div className="clean-chat-header">
        <div className="clean-channel-dropdown-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="clean-channel-select-btn"
            onClick={() => setChannelDropdownOpen((prev) => !prev)}
            title="Pilih Kanal Koordinasi"
          >
            <div className="clean-channel-icon-box">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="clean-channel-meta-col">
              <div className="clean-channel-title-row">
                <strong className="clean-channel-title">{activeChannelMeta.title}</strong>
                <span className="clean-channel-count-badge">{visibleChannels.length} Kanal Aktif</span>
                <svg
                  className={`clean-channel-chevron ${channelDropdownOpen ? "open" : ""}`}
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <span className="clean-channel-subtitle">{activeChannelMeta.subtitle}</span>
            </div>
          </button>

          {channelDropdownOpen && (
            <div className="clean-channel-dropdown-menu">
              {visibleChannels.map((chan) => {
                const isSelected = chan.id === selectedChannel;
                const info = formatChannelInfo(chan);
                return (
                  <button
                    key={chan.id}
                    type="button"
                    className={`clean-dropdown-item ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setSelectedChannel(chan.id);
                      setChannelDropdownOpen(false);
                    }}
                  >
                    <div className="clean-item-icon">
                      {chan.id === "umum" ? "🌐" : chan.id === "posko_mitra" ? "🛡️" : "👥"}
                    </div>
                    <div className="clean-item-text">
                      <span className="clean-item-title">{info.title}</span>
                      <small className="clean-item-sub">{info.subtitle}</small>
                    </div>
                    {isSelected && <span className="clean-item-check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="clean-header-actions">
          <div className="clean-live-pill">
            <span className="clean-live-dot"></span>
            <span>Live</span>
          </div>
          <button
            type="button"
            className="clean-refresh-btn"
            onClick={() => {
              try {
                localStorage.removeItem("reksa_chat_messages_cache");
              } catch {}
              loadMessages(selectedChannel, false);
            }}
            title="Muat ulang pesan sekarang"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span className="clean-refresh-label">Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-HEADER: Search & Filter Chips Bar */}
      <div className="clean-filter-bar">
        <div className="clean-search-box">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Cari pesan atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clean-clear-search-btn"
              onClick={() => setSearchQuery("")}
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        <div className="clean-filter-chips">
          <button
            type="button"
            className={`clean-filter-chip ${filterTag === "ALL" ? "active" : ""}`}
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
                className={`clean-filter-chip ${filterTag === k ? "active" : ""}`}
                onClick={() => setFilterTag(k)}
              >
                {cfg.label} {count > 0 && <span className="clean-chip-count">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MESSAGES STREAM AREA */}
      <div
        className="clean-messages-area"
        ref={chatScrollContainerRef}
        onScroll={handleScroll}
      >
        {loading && currentChannelMessages.length === 0 ? (
          <div className="clean-loading-state">
            <div className="clean-spinner-circle"></div>
            <p>Memuat riwayat komunikasi...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="clean-empty-state">
            <div className="clean-empty-icon">💬</div>
            <h4>Belum ada pesan di kanal ini</h4>
            <p>Mulai percakapan koordinasi antara Warga, Posko BPBD, dan Mitra Penyalur.</p>
          </div>
        ) : (
          <div className="clean-messages-list">
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

              const affiliation = getAffiliationText(msg);

              if (isMine) {
                return (
                  <div key={msg.id || idx} className="clean-msg-row mine">
                    <div className="clean-bubble mine">
                      <div className="clean-bubble-body">{msg.message}</div>
                      {msg.kebutuhan_id && (
                        <div className="clean-ref-box">
                          <span className="clean-ref-icon-text">📌 Terkait Kasus #{msg.kebutuhan_id}</span>
                          {setPage && (
                            <button
                              type="button"
                              className="clean-ref-link"
                              onClick={() => setPage("cases")}
                            >
                              Detail →
                            </button>
                          )}
                        </div>
                      )}
                      <div className="clean-bubble-footer">
                        <span className="clean-timestamp">{timeStr}</span>
                        <span className="clean-check-icon">✓</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id || idx} className="clean-msg-row other">
                  <div className="clean-avatar" title={`${msg.sender_name} (${affiliation})`}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="clean-bubble other">
                    <div className="clean-bubble-header">
                      <span className="clean-sender-name">{msg.sender_name}</span>
                      <span className="clean-sender-org">• {affiliation}</span>
                      {msg.tag && (
                        <span className="clean-tag-badge">{tagCfg.label}</span>
                      )}
                    </div>
                    <div className="clean-bubble-body">{msg.message}</div>
                    {msg.kebutuhan_id && (
                      <div className="clean-ref-box">
                        <span className="clean-ref-icon-text">📌 Terkait Kasus #{msg.kebutuhan_id}</span>
                        {setPage && (
                          <button
                            type="button"
                            className="clean-ref-link"
                            onClick={() => setPage("cases")}
                          >
                            Detail →
                          </button>
                        )}
                      </div>
                    )}
                    <div className="clean-bubble-footer">
                      <span className="clean-timestamp">{timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 4. CLEAN FLOATING COMPOSE BOX */}
      <form className="clean-compose-card" onSubmit={handleSendMessage}>
        <div className="clean-compose-input-wrapper">
          <textarea
            className="clean-compose-textarea"
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

        <div className="clean-compose-bottom-bar">
          <div className="clean-compose-left">
            <span className="clean-label-title">LABEL:</span>
            <div className="clean-compose-tags-row">
              {Object.keys(TAG_CONFIG).map((k) => {
                const cfg = TAG_CONFIG[k];
                const isSelected = selectedTag === k;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`clean-compose-tag-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedTag(k)}
                    title={`Pilih label ${cfg.label}`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="clean-send-btn"
            disabled={!inputText.trim()}
          >
            <span>Kirim</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

