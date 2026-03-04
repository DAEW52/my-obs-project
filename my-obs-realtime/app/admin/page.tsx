export const dynamic = "force-dynamic"
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 

export default function AdminPage() {
  const [waitingItems, setWaitingItems] = useState<any[]>([]);
  const [displayQueue, setDisplayQueue] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // ──────────────────────────────────────────────
  // logic เดิมทั้งหมด (ไม่มีการเปลี่ยนแปลงเลย)
  // ──────────────────────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: waiting } = await supabase.from("waiting_list").select("*").order("created_at", { ascending: false });
      setWaitingItems(waiting || []);

      const { data: display } = await supabase.from("display_queue").select("*").order("created_at", { ascending: false });
      setDisplayQueue(display || []);
    };

    fetchData();

    const channel = supabase
      .channel("admin-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "waiting_list" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "display_queue" }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) return alert("กรุณากรอกอีเมลและรหัสผ่าน");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleApprove = async (item: any) => {
    if (!item.image_url) {
      return alert("ไม่พบที่อยู่รูปภาพ (image_url) ไม่สามารถอนุมัติได้");
    }

    const { error: insertError } = await supabase.from("display_queue").insert([{
      table_no: item.table_no || "ไม่ระบุ",
      message: item.message || "",
      image_url: item.image_url,
      social_id: item.social_id || "ไม่ระบุ",
      social_type: item.social_type || "ไม่ระบุ"
    }]);

    if (!insertError) {
      const { error: deleteError } = await supabase
        .from("waiting_list")
        .delete()
        .eq("id", item.id);
      
      if (deleteError) {
        console.error("Delete Error:", deleteError);
        alert("ย้ายข้อมูลสำเร็จ แต่ลบรายการเดิมไม่สำเร็จ");
      }
    } else {
      console.error("Insert Error Detail:", insertError);
      alert(`เกิดข้อผิดพลาด: ${insertError.message} (ตรวจสอบคอลัมน์ในตาราง display_queue)`);
    }
  };

  const handleDeleteWaiting = async (id: number) => {
    if (confirm("ลบรายการที่รออนุมัตินี้?")) {
      const { error } = await supabase.from("waiting_list").delete().eq("id", id);
      if (error) alert("ลบไม่สำเร็จ: " + error.message);
    }
  };

  const handleRemoveFromDisplay = async (id: number) => {
    if (confirm("ต้องการเอาออกจากหน้าจอใช่หรือไม่?")) {
      const { error } = await supabase.from("display_queue").delete().eq("id", id);
      if (error) alert("เอาออกไม่สำเร็จ: " + error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-t-transparent border-indigo-500/30 rounded-full animate-spin"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full animate-ping opacity-30"></div>
        <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-indigo-400/80 text-sm font-medium tracking-wider">LOADING ADMIN...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100 selection:bg-indigo-500/30">
      {/* Header - ดูแพงขึ้น */}
      <header className="border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
              Arther Plus+
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Premium Queue Management System</p>
          </div>

          {user && (
            <div className="flex items-center gap-5">
              <span className="text-sm text-slate-400 hidden md:inline-block font-mono">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600/20 to-red-800/10 hover:from-red-600/40 hover:to-red-700/30 border border-red-700/40 text-red-300 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-red-900/20 hover:shadow-lg active:scale-95"
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>
      </header>

      {!user ? (
        /* Login - ดู luxury มากขึ้น */
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/70 p-10 space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Admin Portal</h2>
              <p className="text-slate-400 mt-2 text-sm">Secure Access Required</p>
            </div>

            <div className="space-y-5">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-6 py-4 bg-slate-950/70 border border-slate-700/70 rounded-2xl focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-6 py-4 bg-slate-950/70 border border-slate-700/70 rounded-2xl focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-600 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-900/30 hover:shadow-2xl hover:shadow-indigo-800/40 transition-all duration-300 active:scale-[0.98]"
              >
                SIGN IN
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dashboard - หลัก */
        <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Waiting List – หรูขึ้น */}
          <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl shadow-xl shadow-black/40 overflow-hidden">
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/30"></span>
                Pending Approval
                <span className="text-amber-400/80 text-lg font-bold ml-1">({waitingItems.length})</span>
              </h2>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {waitingItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-slate-950/50 border border-slate-800/70 rounded-2xl p-5 flex gap-6 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all duration-300"
                >
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 shrink-0">
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-amber-400 font-bold tracking-tight">TABLE {item.table_no || '—'}</span>
                        <time className="text-xs text-slate-500 font-mono">
                          {new Date(item.created_at).toLocaleString('th-TH', { timeStyle: 'short', dateStyle: 'medium' })}
                        </time>
                      </div>
                      <p className="text-slate-300 italic line-clamp-2 text-sm leading-relaxed">
                        “{item.message || "No message provided"}”
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-3">
                      <div className="text-xs">
                        <span className="text-slate-500 uppercase font-medium">{item.social_type || '—'}</span>
                        <span className="text-slate-300 font-semibold ml-1.5 truncate max-w-[140px] inline-block align-bottom">
                          {item.social_id || '—'}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDeleteWaiting(item.id)}
                          className="px-4 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors font-medium"
                        >
                          Discard
                        </button>
                        <button
                          onClick={() => handleApprove(item)}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-300 active:scale-95"
                        >
                          APPROVE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {waitingItems.length === 0 && (
                <div className="text-center py-24 text-slate-600 italic border border-dashed border-slate-800/50 rounded-2xl">
                  No pending requests at the moment...
                </div>
              )}
            </div>
          </section>

          {/* Display Queue – ดูพรีเมียม */}
          <section className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl shadow-xl shadow-black/40 overflow-hidden">
            <div className="p-6 border-b border-slate-800/60">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40"></span>
                On Display
                <span className="text-emerald-400/80 text-lg font-bold ml-1">({displayQueue.length})</span>
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {displayQueue.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-slate-950/50 border border-emerald-900/30 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all duration-300 shadow-lg hover:shadow-emerald-950/40"
                >
                  <div className="relative aspect-video">
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <button
                      onClick={() => handleRemoveFromDisplay(item.id)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600/80 active:scale-90 shadow-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                      TABLE {item.table_no || '—'}
                    </p>
                    <p className="text-sm text-slate-300 line-clamp-2 italic">
                      “{item.message || "—"}”
                    </p>
                  </div>
                </div>
              ))}

              {displayQueue.length === 0 && (
                <div className="col-span-full text-center py-24 text-slate-600 italic border border-dashed border-slate-800/50 rounded-2xl">
                  Display queue is empty...
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}