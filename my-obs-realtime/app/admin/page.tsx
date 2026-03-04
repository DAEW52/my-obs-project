"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase(); // ✅ เพิ่มบรรทัดนี้

export default function AdminPage() {
  const [waitingItems, setWaitingItems] = useState<any[]>([]);
  const [displayQueue, setDisplayQueue] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

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

  const handleLogin = async () => {
    if (!email || !password) return alert("กรุณากรอกอีเมลและรหัสผ่าน");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleApprove = async (item: any) => {
    if (!item.image_url) {
      return alert("ไม่พบที่อยู่รูปภาพ (image_url)");
    }

    const { error: insertError } = await supabase
      .from("display_queue")
      .insert([
        {
          table_no: item.table_no || "ไม่ระบุ",
          message: item.message || "",
          image_url: item.image_url,
          social_id: item.social_id || "ไม่ระบุ",
          social_type: item.social_type || "ไม่ระบุ",
        },
      ]);

    if (!insertError) {
      await supabase.from("waiting_list").delete().eq("id", item.id);
    } else {
      alert("เกิดข้อผิดพลาด: " + insertError.message);
    }
  };

  const handleDeleteWaiting = async (id: number) => {
    if (confirm("ลบรายการนี้?")) {
      await supabase.from("waiting_list").delete().eq("id", id);
    }
  };

  const handleRemoveFromDisplay = async (id: number) => {
    if (confirm("เอาออกจากหน้าจอ?")) {
      await supabase.from("display_queue").delete().eq("id", id);
    }
  };

  if (loading) return <div>Loading...</div>;

  return <div>Admin Loaded</div>;
}