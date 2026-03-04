"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) fetchMessages();
  }, [session]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("display_queue")
      .select("*")
      .order("created_at", { ascending: false });

    setMessages(data || []);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const approveMessage = async (id) => {
    await supabase
      .from("display_queue")
      .update({ approved: true })
      .eq("id", id);

    fetchMessages();
  };

  const deleteMessage = async (id) => {
    await supabase.from("display_queue").delete().eq("id", id);
    fetchMessages();
  };

  // ================= LOGIN UI =================
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-96">
          <h2 className="text-2xl font-bold text-center mb-6">
            Admin Login
          </h2>

          <input
            type="email"
            placeholder="Email"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-white p-6 rounded-xl shadow-md"
          >
            <p className="font-semibold">โต๊ะ: {msg.table_no}</p>
            <p className="mt-2">{msg.message}</p>

            {msg.image_url && (
              <img
                src={msg.image_url}
                alt=""
                className="mt-4 rounded-lg max-h-60"
              />
            )}

            <div className="flex gap-4 mt-4">
              {!msg.approved && (
                <button
                  onClick={() => approveMessage(msg.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Approve
                </button>
              )}

              <button
                onClick={() => deleteMessage(msg.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}