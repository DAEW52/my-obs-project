"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function AdminPage() {
  const [waitingItems, setWaitingItems] = useState<any[]>([]);
  const [displayQueue, setDisplayQueue] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // -------------------------
  // ตรวจสอบ Session
  // -------------------------
  useEffect(() => {
    const supabase = getSupabase();

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // -------------------------
  // โหลดข้อมูล + realtime
  // -------------------------
  useEffect(() => {
    if (!user) return;

    const supabase = getSupabase();

    const fetchData = async () => {
      const { data: waiting } = await supabase
        .from("waiting_list")
        .select("*")
        .order("created_at", { ascending: false });

      setWaitingItems(waiting || []);

      const { data: display } = await supabase
        .from("display_queue")
        .select("*")
        .order("created_at", { ascending: false });

      setDisplayQueue(display || []);
    };

    fetchData();

    const channel = supabase
      .channel("admin-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waiting_list" },
        fetchData
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "display_queue" },
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // -------------------------
  // Auth
  // -------------------------
  const handleLogin = async () => {
    const supabase = getSupabase();

    if (!email || !password) {
      alert("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  // -------------------------
  // Actions
  // -------------------------
  const handleApprove = async (item: any) => {
    const supabase = getSupabase();

    const { error } = await supabase.from("display_queue").insert([
      {
        table_no: item.table_no || "ไม่ระบุ",
        message: item.message || "",
        image_url: item.image_url,
        social_id: item.social_id || "ไม่ระบุ",
        social_type: item.social_type || "ไม่ระบุ",
      },
    ]);

    if (!error) {
      await supabase.from("waiting_list").delete().eq("id", item.id);
    } else {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleDeleteWaiting = async (id: number) => {
    const supabase = getSupabase();
    if (confirm("ลบรายการนี้?")) {
      await supabase.from("waiting_list").delete().eq("id", id);
    }
  };

  const handleRemoveFromDisplay = async (id: number) => {
    const supabase = getSupabase();
    if (confirm("เอาออกจากหน้าจอ?")) {
      await supabase.from("display_queue").delete().eq("id", id);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!user) {
    return (
      <div style={{ padding: 40, maxWidth: 400 }}>
        <h1>Admin Login</h1>
        <input
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          style={{ width: "100%", padding: 8, marginBottom: 10 }}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          style={{ width: "100%", padding: 10, cursor: "pointer" }}
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Admin Panel</h1>
      <button onClick={handleLogout} style={{ marginBottom: 20 }}>
        Logout
      </button>

      <h2>Waiting List</h2>
      {waitingItems.length === 0 && <p>ไม่มีรายการรออนุมัติ</p>}
      {waitingItems.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #ccc",
            marginBottom: 10,
            padding: 10,
          }}
        >
          <p><strong>โต๊ะ:</strong> {item.table_no}</p>
          <p>{item.message}</p>
          {item.image_url && (
            <img src={item.image_url} width={150} alt="preview" />
          )}
          <br />
          <button onClick={() => handleApprove(item)}>Approve</button>
          <button
            onClick={() => handleDeleteWaiting(item.id)}
            style={{ marginLeft: 10 }}
          >
            Delete
          </button>
        </div>
      ))}

      <h2>Display Queue</h2>
      {displayQueue.length === 0 && <p>ไม่มีรายการบนหน้าจอ</p>}
      {displayQueue.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #ccc",
            marginBottom: 10,
            padding: 10,
          }}
        >
          <p><strong>โต๊ะ:</strong> {item.table_no}</p>
          <p>{item.message}</p>
          <button onClick={() => handleRemoveFromDisplay(item.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}