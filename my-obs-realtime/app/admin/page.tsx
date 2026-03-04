"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // ✅ ป้องกัน re-render loop — เปรียบเทียบ id ก่อน set
      setSession((prev: any) => {
        if (prev?.user?.id === newSession?.user?.id) return prev;
        return newSession;
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchMessages();

    // ✅ Realtime — รับข้อมูลใหม่อัตโนมัติโดยไม่ต้อง polling
    const channel = supabase
      .channel("display_queue_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "display_queue" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("display_queue")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setMessages(data || []);
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const approveMessage = async (id: any) => {
    const { error } = await supabase.from("display_queue").update({ status: "approved" }).eq("id", id);
    if (!error) fetchMessages();
  };

  const deleteMessage = async (id: any) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบข้อความนี้?")) {
      // ✅ ลบจริงออกจาก DB — display page จะรับ DELETE event ผ่าน realtime แล้วเอาออกจาก queue ทันที
      const { error } = await supabase.from("display_queue").delete().eq("id", id);
      if (!error) fetchMessages();
    }
  };

  const filtered = messages.filter(m =>
    filter === "all" ? true : filter === "approved" ? m.status === "approved" : m.status !== "approved"
  );
  const pendingCount = messages.filter(m => m.status !== "approved").length;
  const approvedCount = messages.filter(m => m.status === "approved").length;

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0800" }}>
        <div style={{ color: "#C9A84C", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", letterSpacing: "4px" }}>
          LOADING...
        </div>
      </div>
    );
  }

  // ================= LOGIN =================
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0a0800" }}>
        {/* Grid bg */}
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className="fixed inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)"
        }} />

        <div className="relative w-full max-w-sm">
          <div className="relative rounded-[24px] p-10" style={{
            background: "#110e00",
            border: "1px solid rgba(201,168,76,0.3)",
            boxShadow: "0 0 0 1px rgba(201,168,76,0.08), 0 40px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,215,0,0.08)"
          }}>
            {/* Corner ornaments */}
            <span className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#C9A84C]" />
            <span className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#C9A84C]" />
            <span className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#C9A84C]" />
            <span className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#C9A84C]" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{
                background: "conic-gradient(from 0deg, #8B6914, #FFD700, #C9A84C, #8B6914)",
                padding: "2px"
              }}>
                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "#110e00" }}>
                  <span style={{ fontSize: "1.4rem" }}>🔐</span>
                </div>
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.5rem",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "3px",
                background: "linear-gradient(135deg, #8B6914 0%, #FFD700 40%, #C9A84C 60%, #FFD700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textTransform: "uppercase"
              }}>Admin Access</h2>
              <div className="w-12 h-px mx-auto mt-2" style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }} />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[2px] mb-2 ml-1" style={{ color: "#7a6a40" }}>
                  Email
                </label>
                <input
                  type="email" required placeholder="admin@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] text-white text-sm outline-none transition-all"
                  style={{ background: "#1a1400", border: "1px solid rgba(201,168,76,0.25)", fontFamily: "Sarabun, sans-serif" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#C9A84C"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[2px] mb-2 ml-1" style={{ color: "#7a6a40" }}>
                  Password
                </label>
                <input
                  type="password" required placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] text-white text-sm outline-none transition-all"
                  style={{ background: "#1a1400", border: "1px solid rgba(201,168,76,0.25)", fontFamily: "Sarabun, sans-serif" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#C9A84C"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"}
                />
              </div>
              <button
                type="submit"
                className="relative w-full py-4 rounded-[14px] font-black text-sm uppercase tracking-[3px] overflow-hidden transition-all active:scale-95 mt-2"
                style={{
                  background: "linear-gradient(135deg, #8B6914 0%, #FFD700 45%, #C9A84C 70%, #FFD700 100%)",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  color: "#1a0f00",
                  boxShadow: "0 4px 24px rgba(201,168,76,0.3)"
                }}
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sarabun:wght@300;400;600;700&display=swap');
          input::placeholder { color: #3d3420; }
        `}</style>
      </div>
    );
  }

  // ================= DASHBOARD =================
  return (
    <div className="min-h-screen" style={{ background: "#0a0800" }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(201,168,76,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b" style={{
        background: "rgba(10,8,0,0.95)",
        borderColor: "rgba(201,168,76,0.15)",
        backdropFilter: "blur(20px)"
      }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
              background: "conic-gradient(from 0deg, #8B6914, #FFD700, #C9A84C, #8B6914)"
            }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "#0a0800" }}>
                👑
              </div>
            </div>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "1.1rem",
              letterSpacing: "2px",
              background: "linear-gradient(135deg, #8B6914 0%, #FFD700 50%, #C9A84C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>PLUS+ Admin</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={fetchMessages}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}
              title="รีเฟรช"
            >
              <span style={{ fontSize: "0.9rem" }}>🔄</span>
            </button>
            <button onClick={handleLogout}
              className="px-4 py-1.5 rounded-[10px] text-xs font-bold uppercase tracking-[1px] transition-all hover:scale-105"
              style={{ border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", fontFamily: "Sarabun, sans-serif" }}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">

        {/* Header + Stats */}
        <div className="mb-8">
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.8rem",
            fontWeight: 900,
            fontStyle: "italic",
            color: "#fff",
            letterSpacing: "2px",
            marginBottom: "4px"
          }}>จัดการคิวข้อความ</h2>
          <p style={{ color: "#5a4d2a", fontSize: "0.8rem", fontFamily: "Sarabun, sans-serif", letterSpacing: "1px" }}>
            {session.user?.email}
          </p>

          {/* Stats */}
          <div className="flex gap-4 mt-6">
            {[
              { label: "ทั้งหมด", count: messages.length, key: "all" },
              { label: "รออนุมัติ", count: pendingCount, key: "pending" },
              { label: "อนุมัติแล้ว", count: approvedCount, key: "approved" },
            ].map(({ label, count, key }) => (
              <button key={key} onClick={() => setFilter(key as any)}
                className="flex-1 py-4 rounded-[16px] transition-all hover:scale-105"
                style={{
                  background: filter === key ? "linear-gradient(135deg, #8B6914 0%, #FFD700 45%, #C9A84C 70%, #FFD700 100%)" : "#110e00",
                  border: `1px solid ${filter === key ? "transparent" : "rgba(201,168,76,0.2)"}`,
                  boxShadow: filter === key ? "0 4px 20px rgba(201,168,76,0.3)" : "none"
                }}
              >
                <div style={{
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: filter === key ? "#1a0f00" : "#C9A84C"
                }}>{count}</div>
                <div style={{
                  fontSize: "0.7rem",
                  fontFamily: "Sarabun, sans-serif",
                  letterSpacing: "1px",
                  color: filter === key ? "#3a2800" : "#5a4d2a",
                  marginTop: "2px"
                }}>{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(201,168,76,0.3), transparent)" }} />
          <div className="w-1.5 h-1.5 rotate-45 border border-[#C9A84C]" />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, rgba(201,168,76,0.3), transparent)" }} />
        </div>

        {/* Cards */}
        <div className="space-y-5">
          {filtered.length === 0 ? (
            <div className="text-center py-20 rounded-[20px]" style={{
              background: "#110e00",
              border: "2px dashed rgba(201,168,76,0.15)",
              color: "#3d3420",
              fontFamily: "Sarabun, sans-serif"
            }}>
              ไม่มีข้อความในหมวดนี้
            </div>
          ) : (
            filtered.map((msg: any) => (
              <div key={msg.id}
                className="rounded-[20px] overflow-hidden transition-all hover:scale-[1.005]"
                style={{
                  background: "#110e00",
                  border: `1px solid ${msg.status === "approved" ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.15)"}`,
                  boxShadow: msg.status === "approved" ? "0 0 30px rgba(201,168,76,0.08)" : "none"
                }}
              >
                {/* Card header */}
                <div className="px-6 pt-5 pb-4 flex justify-between items-center" style={{
                  borderBottom: "1px solid rgba(201,168,76,0.1)"
                }}>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-[1px]" style={{
                      background: "linear-gradient(135deg, #8B6914, #FFD700)",
                      color: "#1a0f00",
                      fontFamily: "'Playfair Display', Georgia, serif"
                    }}>
                      TABLE {msg.table_no}
                    </span>
                    {msg.status === "approved" && (
                      <span className="text-[10px] font-bold uppercase tracking-[1px] px-2 py-0.5 rounded-full" style={{
                        color: "#C9A84C",
                        border: "1px solid rgba(201,168,76,0.4)",
                        background: "rgba(201,168,76,0.08)"
                      }}>
                        ✓ Approved
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#3d3420", fontSize: "0.75rem", fontFamily: "Sarabun, sans-serif" }}>
                    {new Date(msg.created_at).toLocaleTimeString("th-TH")}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-6 py-4">
                  {/* Social info */}
                  {msg.social_id && (
                    <p className="text-xs mb-3" style={{ color: "#5a4d2a", fontFamily: "Sarabun, sans-serif" }}>
                      {msg.social_type}: <span style={{ color: "#C9A84C" }}>{msg.social_id}</span>
                    </p>
                  )}

                  {/* Message */}
                  <p className="text-base leading-relaxed mb-4" style={{
                    color: "#e8d5a0",
                    fontFamily: "Sarabun, sans-serif"
                  }}>{msg.message}</p>

                  {/* Image */}
                  {msg.image_url && (
                    <div className="mb-4 rounded-[14px] overflow-hidden" style={{
                      border: "1px solid rgba(201,168,76,0.15)"
                    }}>
                      <img
                        src={msg.image_url}
                        alt="Queue media"
                        className="w-full max-h-80 object-contain"
                        style={{ background: "#0d0b00" }}
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-1">
                    {msg.status !== "approved" && (
                      <button
                        onClick={() => approveMessage(msg.id)}
                        className="flex-1 py-3 rounded-[14px] font-black text-sm uppercase tracking-[2px] transition-all active:scale-95 hover:scale-[1.02]"
                        style={{
                          background: "linear-gradient(135deg, #8B6914 0%, #FFD700 45%, #C9A84C 70%, #FFD700 100%)",
                          color: "#1a0f00",
                          fontFamily: "'Playfair Display', Georgia, serif",
                          fontStyle: "italic",
                          boxShadow: "0 4px 16px rgba(201,168,76,0.25)"
                        }}
                      >
                        Approve ✅
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className={`${msg.status === "approved" ? "flex-1" : "w-24"} py-3 rounded-[14px] font-bold text-sm uppercase tracking-[1px] transition-all active:scale-95`}
                      style={{
                        background: "rgba(220,38,38,0.08)",
                        border: "1px solid rgba(220,38,38,0.2)",
                        color: "#ef4444",
                        fontFamily: "Sarabun, sans-serif"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(220,38,38,0.15)";
                        e.currentTarget.style.borderColor = "rgba(220,38,38,0.4)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(220,38,38,0.08)";
                        e.currentTarget.style.borderColor = "rgba(220,38,38,0.2)";
                      }}
                    >
                      {msg.status === "approved" ? "ลบข้อความ" : "ลบ"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sarabun:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #3d3420; }
      `}</style>
    </div>
  );
}