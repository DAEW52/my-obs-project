"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ตรวจสอบ Environment Variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. ตรวจสอบ Session เมื่อโหลดหน้า
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. ติดตามการเปลี่ยนแปลงสถานะ Login/Logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchMessages();
  }, [session]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("display_queue")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error.message);
    } else {
      setMessages(data || []);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const approveMessage = async (id) => {
    const { error } = await supabase
      .from("display_queue")
      .update({ approved: true })
      .eq("id", id);

    if (!error) fetchMessages();
  };

  const deleteMessage = async (id) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบข้อความนี้?")) {
      const { error } = await supabase.from("display_queue").delete().eq("id", id);
      if (!error) fetchMessages();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // ================= 1. หน้า LOGIN UI =================
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800">
            Admin Access
          </h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="admin@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all active:scale-[0.98]"
            >
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= 2. หน้า DASHBOARD =================
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            Log Out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-8 text-black">
          <div>
            <h2 className="text-2xl font-bold">จัดการคิวข้อความ</h2>
            <p className="text-gray-500 text-sm italic">ล็อคอินโดย: {session.user.email}</p>
          </div>
          <button 
            onClick={fetchMessages}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="รีเฟรชข้อมูล"
          >
            🔄
          </button>
        </div>

        <div className="grid gap-6">
          {messages.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
              ไม่มีข้อความใหม่ในขณะนี้
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${
                  msg.approved ? "border-green-100" : "border-gray-200"
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase">
                      Table {msg.table_no}
                    </span>
                    {msg.approved && (
                      <span className="text-green-500 text-xs font-bold border border-green-500 px-2 py-0.5 rounded italic">
                        Approved ✓
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(msg.created_at).toLocaleTimeString('th-TH')}
                  </span>
                </div>

                <p className="text-gray-800 text-lg leading-relaxed mb-4">{msg.message}</p>

                {msg.image_url && (
                  <div className="relative group mb-4">
                    <img
                      src={msg.image_url}
                      alt="Queue media"
                      className="rounded-xl w-full max-h-96 object-contain bg-gray-100 border border-gray-100"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {!msg.approved && (
                    <button
                      onClick={() => approveMessage(msg.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-green-100"
                    >
                      Approve ✅
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className={`${
                      msg.approved ? "flex-1" : "w-24"
                    } bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold transition-all`}
                  >
                    {msg.approved ? "ลบข้อความ" : "ลบ"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}