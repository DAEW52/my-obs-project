"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

type Message = {
  id: string;
  table_no: string | number;
  message: string;
  status: string;
  created_at: string;
  social_id?: string;
  social_type?: string;
  image_url?: string;
  display_seconds?: number;
  priority?: number;
};

type AuditLog = {
  id: string;
  action: string;
  message_id: string;
  admin_email: string;
  timestamp: string;
  details?: string;
};

type DailyStats = { date: string; total: number; approved: number };

const DEFAULT_BLACKLIST = ["โง่", "ไอ้", "อีช่อง", "เหี้ย", "สัตว์", "ควาย"];

const saveAuditLog = (logs: AuditLog[], log: AuditLog) => {
  const updated = [log, ...logs].slice(0, 200);
  if (typeof window !== "undefined") localStorage.setItem("audit_logs", JSON.stringify(updated));
  return updated;
};
const loadAuditLogs = (): AuditLog[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("audit_logs") || "[]"); } catch { return []; }
};

const computeStats = (messages: Message[]): DailyStats[] => {
  const map: Record<string, { total: number; approved: number }> = {};
  messages.forEach(m => {
    const d = new Date(m.created_at).toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
    if (!map[d]) map[d] = { total: 0, approved: 0 };
    map[d].total++;
    if (m.status === "approved") map[d].approved++;
  });
  return Object.entries(map).map(([date, v]) => ({ date, ...v })).slice(-7);
};

const exportCSV = (messages: Message[]) => {
  const header = "id,table_no,status,message,social_type,social_id,created_at";
  const rows = messages.map(m =>
    `${m.id},${m.table_no},${m.status},"${m.message.replace(/"/g, '""')}",${m.social_type || ""},${m.social_id || ""},${m.created_at}`
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "queue_export.csv"; a.click();
  URL.revokeObjectURL(url);
};

function MiniBarChart({ data }: { data: DailyStats[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "64px", padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "48px", gap: "2px" }}>
            <div style={{ width: "100%", height: `${(d.approved / max) * 100}%`, background: "linear-gradient(180deg, #FFD700, #8B6914)", borderRadius: "3px 3px 0 0", minHeight: d.approved > 0 ? "4px" : "0" }} />
            <div style={{ width: "100%", height: `${((d.total - d.approved) / max) * 100}%`, background: "rgba(201,168,76,0.2)", borderRadius: d.approved > 0 ? "0" : "3px 3px 0 0", minHeight: (d.total - d.approved) > 0 ? "4px" : "0" }} />
          </div>
          <span style={{ color: "#3d3420", fontSize: "9px", fontFamily: "Sarabun, sans-serif", whiteSpace: "nowrap" }}>{d.date}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"queue" | "stats" | "logs" | "settings">("queue");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>(DEFAULT_BLACKLIST);
  const [blacklistInput, setBlacklistInput] = useState("");
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [editText, setEditText] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [defaultDisplaySec, setDefaultDisplaySec] = useState(10);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const prevCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch { }
  }, [soundEnabled]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession((prev: any) => prev?.user?.id === s?.user?.id ? prev : s);
    });
    setAuditLogs(loadAuditLogs());
    const bl = localStorage.getItem("blacklist");
    if (bl) setBlacklist(JSON.parse(bl));
    return () => subscription.unsubscribe();
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("display_queue").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setMessages(data);
      const pending = data.filter((m: Message) => m.status !== "approved").length;
      if (pending > prevCountRef.current) { playBeep(); setNewMsgCount(n => n + (pending - prevCountRef.current)); }
      prevCountRef.current = pending;
    }
  }, [playBeep]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchMessages();
    const channel = supabase.channel("admin_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "display_queue" }, fetchMessages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, fetchMessages]);

  const addAudit = useCallback((action: string, msgId: string, details?: string) => {
    const log: AuditLog = {
      id: Date.now().toString(), action, message_id: msgId,
      admin_email: session?.user?.email || "unknown",
      timestamp: new Date().toISOString(), details
    };
    setAuditLogs(prev => saveAuditLog(prev, log));
  }, [session]);

  const containsBlacklist = (text: string) => blacklist.some(w => text.includes(w));

  const approveMessage = async (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (msg && containsBlacklist(msg.message)) { showToast("⚠️ มีคำต้องห้าม", "error"); return; }
    const { error } = await supabase.from("display_queue")
      .update({ status: "approved", display_seconds: defaultDisplaySec }).eq("id", id);
    if (!error) { addAudit("APPROVE", id); fetchMessages(); showToast("✅ Approved แล้ว"); }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("ยืนยันการลบ?")) return;
    await supabase.from("display_queue").delete().eq("id", id);
    addAudit("DELETE", id); fetchMessages(); showToast("🗑️ ลบแล้ว", "info");
  };

  const bulkApprove = async () => {
    const ids = [...selectedIds];
    const blocked = ids.filter(id => { const m = messages.find(x => x.id === id); return m && containsBlacklist(m.message); });
    const toApprove = ids.filter(id => !blocked.includes(id));
    if (toApprove.length === 0) { showToast("ไม่มีข้อความที่ Approve ได้", "error"); return; }
    await Promise.all(toApprove.map(id =>
      supabase.from("display_queue").update({ status: "approved", display_seconds: defaultDisplaySec }).eq("id", id)
    ));
    toApprove.forEach(id => addAudit("BULK_APPROVE", id));
    setSelectedIds(new Set()); fetchMessages();
    showToast(`✅ Approved ${toApprove.length} ข้อความ`, "success");
  };

  const bulkDelete = async () => {
    if (!confirm(`ลบ ${selectedIds.size} ข้อความ?`)) return;
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => supabase.from("display_queue").delete().eq("id", id)));
    ids.forEach(id => addAudit("BULK_DELETE", id));
    setSelectedIds(new Set()); fetchMessages();
    showToast(`🗑️ ลบ ${ids.length} ข้อความแล้ว`, "info");
  };

  const saveEdit = async () => {
    if (!editingMsg) return;
    if (containsBlacklist(editText)) { showToast("⚠️ มีคำต้องห้าม", "error"); return; }
    await supabase.from("display_queue").update({ message: editText }).eq("id", editingMsg.id);
    addAudit("EDIT", editingMsg.id, `"${editingMsg.message}" → "${editText}"`);
    setEditingMsg(null); setEditText(""); fetchMessages(); showToast("✏️ แก้ไขแล้ว");
  };

  const setPriority = async (id: string, priority: number) => {
    await supabase.from("display_queue").update({ priority }).eq("id", id);
    addAudit("SET_PRIORITY", id, `priority=${priority}`);
    fetchMessages();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const addBlacklist = () => {
    if (!blacklistInput.trim()) return;
    const updated = [...blacklist, blacklistInput.trim()];
    setBlacklist(updated); localStorage.setItem("blacklist", JSON.stringify(updated));
    setBlacklistInput(""); showToast(`➕ เพิ่ม "${blacklistInput.trim()}"`);
  };

  const removeBlacklist = (word: string) => {
    const updated = blacklist.filter(w => w !== word);
    setBlacklist(updated); localStorage.setItem("blacklist", JSON.stringify(updated));
  };

  const filtered = messages
    .filter(m => filter === "approved" ? m.status === "approved" : filter === "pending" ? m.status !== "approved" : true)
    .filter(m => !search || m.message.toLowerCase().includes(search.toLowerCase()) || String(m.table_no).includes(search) || (m.social_id || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const pa = a.priority ?? 0, pb = b.priority ?? 0;
      if (pa !== pb) return pb - pa;
      const da = new Date(a.created_at).getTime(), db = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? db - da : da - db;
    });

  const pendingCount = messages.filter(m => m.status !== "approved").length;
  const approvedCount = messages.filter(m => m.status === "approved").length;
  const stats = computeStats(messages);
  const approveRate = messages.length > 0 ? Math.round((approvedCount / messages.length) * 100) : 0;

  if (loading) return (
    <div style={{ background: "#0a0800", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#C9A84C", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", letterSpacing: "4px" }}>LOADING...</div>
    </div>
  );

  if (!session) return (
    <div style={{ background: "#0a0800", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "360px" }}>
        <div style={{ position: "relative", borderRadius: "24px", padding: "40px", background: "#110e00", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 40px 80px rgba(0,0,0,0.9)" }}>
          <span style={{ position: "absolute", top: 16, left: 16, width: 16, height: 16, borderTop: "2px solid #C9A84C", borderLeft: "2px solid #C9A84C" }} />
          <span style={{ position: "absolute", top: 16, right: 16, width: 16, height: 16, borderTop: "2px solid #C9A84C", borderRight: "2px solid #C9A84C" }} />
          <span style={{ position: "absolute", bottom: 16, left: 16, width: 16, height: 16, borderBottom: "2px solid #C9A84C", borderLeft: "2px solid #C9A84C" }} />
          <span style={{ position: "absolute", bottom: 16, right: 16, width: 16, height: 16, borderBottom: "2px solid #C9A84C", borderRight: "2px solid #C9A84C" }} />
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 900, fontStyle: "italic", letterSpacing: "3px", background: "linear-gradient(135deg, #8B6914 0%, #FFD700 40%, #C9A84C 60%, #FFD700 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", textTransform: "uppercase", margin: 0 }}>Admin Access</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px", color: "#7a6a40", fontFamily: "Sarabun, sans-serif" }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", background: "#1a1400", border: "1px solid rgba(201,168,76,0.25)", color: "white", fontSize: "14px", outline: "none", fontFamily: "Sarabun, sans-serif", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px", color: "#7a6a40", fontFamily: "Sarabun, sans-serif" }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={async e => { if (e.key === "Enter") { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) showToast("เข้าสู่ระบบไม่สำเร็จ", "error"); } }}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", background: "#1a1400", border: "1px solid rgba(201,168,76,0.25)", color: "white", fontSize: "14px", outline: "none", fontFamily: "Sarabun, sans-serif", boxSizing: "border-box" }} />
            </div>
            <button onClick={async () => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) showToast("เข้าสู่ระบบไม่สำเร็จ", "error"); }}
              style={{ width: "100%", padding: "14px", borderRadius: "14px", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: 900, fontSize: "14px", textTransform: "uppercase", letterSpacing: "3px", background: "linear-gradient(135deg, #8B6914 0%, #FFD700 45%, #C9A84C 70%, #FFD700 100%)", color: "#1a0f00", border: "none", cursor: "pointer" }}>
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sarabun:wght@300;400;600;700&display=swap'); input::placeholder{color:#3d3420;}`}</style>
    </div>
  );

  return (
    <div style={{ background: "#0a0800", minHeight: "100vh", fontFamily: "Sarabun, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sarabun:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;}
        input::placeholder,textarea::placeholder{color:#3d3420;}
        .card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
        .msg-card{border-radius:16px;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;}
        .msg-card:hover{transform:translateY(-2px);}
        .msg-card.pending{background:#140800;border:2px solid rgba(220,38,38,0.5);box-shadow:0 0 12px rgba(220,38,38,0.08);}
        .msg-card.approved{background:#110e00;border:2px solid rgba(201,168,76,0.35);}
        .msg-card.selected{border:2px solid #FFD700 !important;box-shadow:0 0 20px rgba(255,215,0,0.2) !important;}
        .img-thumb{width:100%;height:180px;object-fit:cover;display:block;background:#0d0b00;cursor:zoom-in;}
        .no-img-box{width:100%;height:60px;display:flex;align-items:center;justify-content:center;background:#0d0b00;color:#2a2010;font-size:1.2rem;}
        .tab-btn{padding:10px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;font-family:Sarabun,sans-serif;}
        .act-btn{border:none;padding:7px 10px;border-radius:10px;font-weight:700;cursor:pointer;font-size:12px;font-family:Sarabun,sans-serif;transition:opacity 0.2s;white-space:nowrap;}
        .act-btn:hover{opacity:0.8;}
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(201,168,76,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: "14px", fontSize: "14px", fontWeight: 700, background: toast.type === "error" ? "#2a0000" : toast.type === "info" ? "#0a1a2a" : "#0a1a00", border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.5)" : toast.type === "info" ? "rgba(59,130,246,0.5)" : "rgba(201,168,76,0.5)"}`, color: toast.type === "error" ? "#ef4444" : toast.type === "info" ? "#60a5fa" : "#C9A84C", boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}>
          {toast.text}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: "90%", maxHeight: "90vh", borderRadius: "16px", objectFit: "contain" }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setPreviewUrl(null)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* Edit Modal */}
      {editingMsg && (
        <div onClick={() => setEditingMsg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#110e00", borderRadius: "24px", padding: "32px", maxWidth: "480px", width: "100%", border: "1px solid rgba(201,168,76,0.4)" }}>
            <h3 style={{ color: "#C9A84C", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", marginBottom: "16px", marginTop: 0 }}>✏️ แก้ไขข้อความ — TABLE {editingMsg.table_no}</h3>
            <textarea rows={4} value={editText} onChange={e => setEditText(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", background: "#1a1400", border: "1px solid rgba(201,168,76,0.3)", color: "white", fontSize: "14px", outline: "none", resize: "none", fontFamily: "Sarabun, sans-serif" }} />
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button onClick={saveEdit} style={{ flex: 1, padding: "12px", borderRadius: "14px", fontWeight: 700, fontSize: "14px", background: "linear-gradient(135deg, #8B6914, #FFD700)", color: "#1a0f00", border: "none", cursor: "pointer" }}>บันทึก</button>
              <button onClick={() => { setEditingMsg(null); setEditText(""); }} style={{ flex: 1, padding: "12px", borderRadius: "14px", fontWeight: 700, fontSize: "14px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "#C9A84C", cursor: "pointer" }}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,8,0,0.97)", borderBottom: "1px solid rgba(201,168,76,0.15)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "conic-gradient(from 0deg, #8B6914, #FFD700, #C9A84C, #8B6914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>👑</div>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontStyle: "italic", fontSize: "1.1rem", letterSpacing: "2px", background: "linear-gradient(135deg, #8B6914 0%, #FFD700 50%, #C9A84C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ARTHER PLUS+ Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {newMsgCount > 0 && (
              <button onClick={() => { setNewMsgCount(0); setFilter("pending"); setActiveTab("queue"); }}
                style={{ padding: "4px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: 900, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", cursor: "pointer" }}>
                🔴 {newMsgCount} ใหม่
              </button>
            )}
            <button onClick={() => setSoundEnabled(s => !s)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", cursor: "pointer", fontSize: "16px" }}>{soundEnabled ? "🔔" : "🔕"}</button>
            <button onClick={() => exportCSV(messages)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", cursor: "pointer", fontSize: "16px" }}>📥</button>
            <button onClick={fetchMessages} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", cursor: "pointer", fontSize: "16px" }}>🔄</button>
            <button onClick={() => supabase.auth.signOut()} style={{ padding: "6px 16px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", background: "transparent", cursor: "pointer" }}>ออกจากระบบ</button>
          </div>
        </div>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px", display: "flex", borderTop: "1px solid rgba(201,168,76,0.08)" }}>
          {[{ key: "queue", label: "📋 คิวข้อความ" }, { key: "stats", label: "📊 สถิติ" }, { key: "logs", label: "📝 Audit Log" }, { key: "settings", label: "⚙️ ตั้งค่า" }].map(({ key, label }) => (
            <button key={key} className="tab-btn" onClick={() => setActiveTab(key as any)}
              style={{ borderBottomColor: activeTab === key ? "#C9A84C" : "transparent", color: activeTab === key ? "#C9A84C" : "#3d3420" }}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 10 }}>

        {/* ===== QUEUE ===== */}
        {activeTab === "queue" && (
          <>
            {/* Stats */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              {[{ label: "ทั้งหมด", count: messages.length, key: "all" }, { label: "รออนุมัติ", count: pendingCount, key: "pending" }, { label: "อนุมัติแล้ว", count: approvedCount, key: "approved" }].map(({ label, count, key }) => (
                <button key={key} onClick={() => setFilter(key as any)} style={{ flex: 1, padding: "16px", borderRadius: "16px", cursor: "pointer", background: filter === key ? "linear-gradient(135deg, #8B6914 0%, #FFD700 45%, #C9A84C 70%, #FFD700 100%)" : "#110e00", border: `1px solid ${filter === key ? "transparent" : "rgba(201,168,76,0.2)"}`, boxShadow: filter === key ? "0 4px 20px rgba(201,168,76,0.3)" : "none" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, fontFamily: "'Playfair Display', Georgia, serif", color: filter === key ? "#1a0f00" : "#C9A84C" }}>{count}</div>
                  <div style={{ fontSize: "11px", letterSpacing: "1px", color: filter === key ? "#3a2800" : "#5a4d2a", marginTop: "4px" }}>{label}</div>
                </button>
              ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "180px", position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#5a4d2a" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา ข้อความ, โต๊ะ..."
                  style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)", color: "white", fontSize: "13px", outline: "none" }} />
              </div>
              <button onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")} style={{ padding: "10px 16px", borderRadius: "12px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)", color: "#C9A84C", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {sortOrder === "desc" ? "⬇️ ใหม่สุด" : "⬆️ เก่าสุด"}
              </button>
              <button onClick={() => { if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map(m => m.id))); }}
                style={{ padding: "10px 16px", borderRadius: "12px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)", color: "#C9A84C", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {selectedIds.size === filtered.length && filtered.length > 0 ? "✓ ยกเลิกทั้งหมด" : "☐ เลือกทั้งหมด"}
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px", padding: "16px", borderRadius: "16px", background: "#1a1400", border: "1px solid rgba(201,168,76,0.25)", alignItems: "center" }}>
                <span style={{ color: "#C9A84C", fontSize: "13px" }}>เลือก {selectedIds.size} ข้อความ</span>
                <div style={{ flex: 1 }} />
                <button onClick={bulkApprove} style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 900, background: "linear-gradient(135deg, #8B6914, #FFD700)", color: "#1a0f00", border: "none", cursor: "pointer" }}>Approve ทั้งหมด ✅</button>
                <button onClick={bulkDelete} style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#ef4444", cursor: "pointer" }}>ลบทั้งหมด 🗑️</button>
              </div>
            )}

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)" }} />
              <div style={{ width: 6, height: 6, transform: "rotate(45deg)", border: "1px solid #C9A84C" }} />
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(270deg, rgba(201,168,76,0.3), transparent)" }} />
            </div>

            {/* Grid Cards */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", borderRadius: "20px", background: "#110e00", border: "2px dashed rgba(201,168,76,0.15)", color: "#3d3420" }}>ไม่มีข้อความในหมวดนี้</div>
            ) : (
              <div className="card-grid">
                {filtered.map((msg) => {
                  const hasBlacklisted = containsBlacklist(msg.message);
                  const isSelected = selectedIds.has(msg.id);
                  const isPending = msg.status !== "approved";
                  return (
                    <div key={msg.id} className={`msg-card ${isPending ? "pending" : "approved"} ${isSelected ? "selected" : ""}`}>

                      {/* Image */}
                      <div style={{ position: "relative" }}>
                        {msg.image_url
                          ? <img src={msg.image_url} alt="" className="img-thumb" onClick={() => setPreviewUrl(msg.image_url!)} />
                          : <div className="no-img-box">🖼️</div>
                        }
                        {/* Checkbox */}
                        <button onClick={() => toggleSelect(msg.id)} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: isSelected ? "#FFD700" : "rgba(0,0,0,0.55)", border: `2px solid ${isSelected ? "#FFD700" : "rgba(255,255,255,0.4)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: isSelected ? "#1a0f00" : "white", fontWeight: 900 }}>
                          {isSelected ? "✓" : ""}
                        </button>
                        {/* Status pill */}
                        <div style={{ position: "absolute", top: 8, left: 8 }}>
                          {isPending
                            ? <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: "rgba(220,38,38,0.88)", color: "white" }}>รออนุมัติ</span>
                            : <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: "rgba(201,168,76,0.88)", color: "#1a0f00" }}>✓ Approved</span>
                          }
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "12px" }}>
                        {/* Meta row */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                          <span style={{ padding: "2px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 900, background: "linear-gradient(135deg, #8B6914, #FFD700)", color: "#1a0f00", fontFamily: "'Playfair Display', Georgia, serif" }}>T{msg.table_no}</span>
                          {msg.social_id && <span style={{ fontSize: "11px", color: "#7a6a40" }}>{msg.social_type}: <span style={{ color: "#C9A84C" }}>{msg.social_id}</span></span>}
                          <div style={{ marginLeft: "auto", display: "flex", gap: "1px" }}>
                            {[1, 2, 3].map(p => (
                              <button key={p} onClick={() => setPriority(msg.id, (msg.priority ?? 0) >= p ? p - 1 : p)}
                                style={{ color: (msg.priority ?? 0) >= p ? "#FFD700" : "#2a2010", fontSize: "12px", lineHeight: 1, cursor: "pointer", background: "none", border: "none", padding: "0 1px" }}>★</button>
                            ))}
                          </div>
                        </div>

                        {/* Message bubble */}
                        <div style={{ background: isPending ? "rgba(220,38,38,0.07)" : "rgba(201,168,76,0.06)", borderRadius: "10px", padding: "10px", marginBottom: "10px", borderLeft: `3px solid ${isPending ? "rgba(220,38,38,0.4)" : "rgba(201,168,76,0.4)"}` }}>
                          <p style={{ color: "#e8d5a0", fontSize: "13px", lineHeight: 1.6, margin: 0, fontFamily: "Sarabun, sans-serif" }}>
                            {msg.message || <span style={{ color: "#3d3420" }}>ไม่มีข้อความ</span>}
                          </p>
                        </div>

                        {/* Badges + time */}
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: "10px" }}>
                          {hasBlacklisted && <span style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "10px", fontWeight: 700, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>⚠️ คำต้องห้าม</span>}
                          {(msg.priority ?? 0) > 0 && <span style={{ padding: "2px 7px", borderRadius: "5px", fontSize: "10px", fontWeight: 700, background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700" }}>VIP P{msg.priority}</span>}
                          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#3d3420" }}>{new Date(msg.created_at).toLocaleTimeString("th-TH")}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "grid", gridTemplateColumns: isPending ? "1fr 1fr auto" : "1fr auto", gap: "6px" }}>
                          {isPending && (
                            <button className="act-btn" onClick={() => approveMessage(msg.id)}
                              style={{ background: hasBlacklisted ? "rgba(239,68,68,0.1)" : "linear-gradient(135deg, #8B6914, #FFD700)", color: hasBlacklisted ? "#ef4444" : "#1a0f00", border: hasBlacklisted ? "1px solid rgba(239,68,68,0.3)" : "none", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}>
                              {hasBlacklisted ? "⛔ บล็อก" : "Approve ✅"}
                            </button>
                          )}
                          <button className="act-btn" onClick={() => { setEditingMsg(msg); setEditText(msg.message); }}
                            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                            ✏️ แก้ไข
                          </button>
                          <button className="act-btn" onClick={() => deleteMessage(msg.id)}
                            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#ef4444", padding: "7px 10px" }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== STATS ===== */}
        {activeTab === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: "2px", margin: 0 }}>สถิติรายวัน</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[{ label: "ข้อความทั้งหมด", value: messages.length, unit: "ข้อความ" }, { label: "Approve Rate", value: approveRate, unit: "%" }, { label: "รออนุมัติ", value: pendingCount, unit: "ข้อความ" }, { label: "โต๊ะที่ใช้งาน", value: new Set(messages.map(m => m.table_no)).size, unit: "โต๊ะ" }].map(({ label, value, unit }) => (
                <div key={label} style={{ padding: "20px", borderRadius: "18px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, fontFamily: "'Playfair Display', Georgia, serif", color: "#FFD700" }}>{value}</div>
                  <div style={{ fontSize: "11px", color: "#5a4d2a", marginTop: "4px" }}>{unit} · {label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "24px", borderRadius: "18px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)" }}>
              <span style={{ color: "#C9A84C", fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "16px" }}>7 วันล่าสุด</span>
              {stats.length > 0 ? <MiniBarChart data={stats} /> : <div style={{ color: "#3d3420", textAlign: "center", padding: "20px" }}>ยังไม่มีข้อมูล</div>}
            </div>
            <div style={{ padding: "24px", borderRadius: "18px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)" }}>
              <span style={{ color: "#C9A84C", fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "12px" }}>โต๊ะที่ส่งมากที่สุด</span>
              {Object.entries(messages.reduce((acc: Record<string, number>, m) => { acc[m.table_no] = (acc[m.table_no] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([table, count]) => (
                <div key={table} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <span style={{ color: "#C9A84C", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", width: "70px", fontSize: "13px" }}>TABLE {table}</span>
                  <div style={{ flex: 1, borderRadius: "9999px", overflow: "hidden", background: "rgba(201,168,76,0.1)", height: "8px" }}>
                    <div style={{ width: `${(count / messages.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #8B6914, #FFD700)", borderRadius: "9999px" }} />
                  </div>
                  <span style={{ color: "#5a4d2a", fontSize: "12px", width: "30px", textAlign: "right" }}>{count}</span>
                </div>
              ))}
            </div>
            <button onClick={() => exportCSV(messages)} style={{ width: "100%", padding: "16px", borderRadius: "16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "2px", background: "#110e00", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", cursor: "pointer" }}>
              📥 Export ข้อมูลทั้งหมด เป็น CSV
            </button>
          </div>
        )}

        {/* ===== AUDIT LOGS ===== */}
        {activeTab === "logs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: "2px", margin: 0 }}>Audit Log</h2>
              <button onClick={() => { setAuditLogs([]); localStorage.removeItem("audit_logs"); showToast("🗑️ ล้าง Log แล้ว", "info"); }}
                style={{ padding: "6px 14px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#ef4444", cursor: "pointer" }}>ล้าง Log</button>
            </div>
            {auditLogs.length === 0
              ? <div style={{ textAlign: "center", padding: "80px 0", borderRadius: "20px", background: "#110e00", border: "2px dashed rgba(201,168,76,0.15)", color: "#3d3420" }}>ยังไม่มี Log</div>
              : auditLogs.map(log => (
                <div key={log.id} style={{ padding: "16px", borderRadius: "14px", display: "flex", gap: "16px", alignItems: "flex-start", background: "#110e00", border: "1px solid rgba(201,168,76,0.12)" }}>
                  <span style={{ fontSize: "18px" }}>{log.action.includes("APPROVE") ? "✅" : log.action.includes("DELETE") ? "🗑️" : log.action === "EDIT" ? "✏️" : "⚙️"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}>{log.action}</span>
                      <span style={{ color: "#5a4d2a", fontSize: "11px" }}>{log.admin_email}</span>
                    </div>
                    {log.details && <p style={{ color: "#7a6a40", fontSize: "12px", margin: "4px 0 0 0" }}>{log.details}</p>}
                    <p style={{ color: "#3d3420", fontSize: "11px", margin: "2px 0 0 0" }}>ID: {log.message_id} · {new Date(log.timestamp).toLocaleString("th-TH")}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ===== SETTINGS ===== */}
        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: "2px", margin: 0 }}>ตั้งค่าระบบ</h2>
            <div style={{ padding: "24px", borderRadius: "18px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)" }}>
              <h3 style={{ color: "#C9A84C", fontWeight: 700, fontSize: "14px", marginTop: 0 }}>🖥️ การแสดงผลบนจอ</h3>
              <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "#7a6a40" }}>ระยะเวลาแสดงผล: <span style={{ color: "#C9A84C" }}>{defaultDisplaySec} วินาที</span></label>
              <input type="range" min={3} max={60} value={defaultDisplaySec} onChange={e => setDefaultDisplaySec(Number(e.target.value))} style={{ width: "100%", accentColor: "#C9A84C" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#3d3420", marginTop: "4px" }}><span>3 วิ</span><span>60 วิ</span></div>
            </div>
            <div style={{ padding: "24px", borderRadius: "18px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ color: "#C9A84C", fontWeight: 700, fontSize: "14px", margin: "0 0 4px 0" }}>🔔 เสียงแจ้งเตือน</h3>
                <p style={{ color: "#5a4d2a", fontSize: "12px", margin: 0 }}>แจ้งเตือนเมื่อมีข้อความใหม่</p>
              </div>
              <button onClick={() => setSoundEnabled(s => !s)} style={{ width: 56, height: 28, borderRadius: "9999px", background: soundEnabled ? "#FFD700" : "rgba(201,168,76,0.15)", border: "none", cursor: "pointer", position: "relative" }}>
                <span style={{ position: "absolute", top: 3, width: 22, height: 22, background: "#fff", borderRadius: "50%", transition: "left 0.2s", left: soundEnabled ? "calc(100% - 25px)" : "3px" }} />
              </button>
            </div>
            <div style={{ padding: "24px", borderRadius: "18px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)" }}>
              <h3 style={{ color: "#C9A84C", fontWeight: 700, fontSize: "14px", marginTop: 0 }}>⛔ Blacklist คำต้องห้าม</h3>
              <p style={{ color: "#5a4d2a", fontSize: "12px", marginBottom: "16px" }}>ข้อความที่มีคำเหล่านี้จะถูกบล็อก</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input value={blacklistInput} onChange={e => setBlacklistInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addBlacklist()} placeholder="พิมพ์คำที่ต้องการแบน..."
                  style={{ flex: 1, padding: "10px 16px", borderRadius: "12px", background: "#1a1400", border: "1px solid rgba(201,168,76,0.2)", color: "white", fontSize: "13px", outline: "none" }} />
                <button onClick={addBlacklist} style={{ padding: "10px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, background: "linear-gradient(135deg, #8B6914, #FFD700)", color: "#1a0f00", border: "none", cursor: "pointer" }}>เพิ่ม</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {blacklist.map(word => (
                  <span key={word} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                    {word}
                    <button onClick={() => removeBlacklist(word)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div style={{ padding: "24px", borderRadius: "18px", background: "#110e00", border: "1px solid rgba(201,168,76,0.2)" }}>
              <h3 style={{ color: "#C9A84C", fontWeight: 700, fontSize: "14px", marginTop: 0 }}>👤 บัญชีผู้ใช้</h3>
              <p style={{ color: "#5a4d2a", fontSize: "13px", marginBottom: "16px" }}>{session.user?.email}</p>
              <button onClick={() => supabase.auth.signOut()} style={{ width: "100%", padding: "12px", borderRadius: "14px", fontSize: "13px", fontWeight: 700, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#ef4444", cursor: "pointer" }}>ออกจากระบบ</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}