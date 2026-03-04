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

  useEffect(() => {
    const supabase = getSupabase();

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

  const handleLogin = async () => {
    const supabase = getSupabase();

    if (!email || !password) return alert("กรุณากรอกอีเมลและรหัสผ่าน");

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

  if (loading) return <div>Loading...</div>;

  return <div>Admin Loaded</div>;
}