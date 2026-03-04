"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

// ---------- Social Icon (คงเดิม) ----------
const SocialIcon = ({ type }: { type: string }) => {
  const t = type?.toLowerCase();
  const s = 40;
  if (t === "facebook") return (
    <svg width={s} height={s} viewBox="0 0 105.78513 105.78513">
      <circle r="47.625" cy="52.89" cx="52.89" fill="#0066ff" />
      <path d="m 60.69,30.33 c -4.44,-0.01 -9.85,0.22 -11.33,1.41 -2.91,2.33 -2.25,6.83 -2.25,6.83 h 0.01 v 8.17 l -8.35,-0.04 2.6,7.95 5.74,0.01 v 22.96 h 9.62 v -22.93 l 6.28,0.01 2.2,-7.88 -8.48,-0.04 v -8.13 l 10.27,0.1 0.02,-8.25 s -2.87,-0.17 -6.33,-0.18 z" fill="#ffffff" />
    </svg>
  );
  if (t === "instagram") return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <defs><linearGradient id="instGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433" /><stop offset="50%" stopColor="#dc2743" /><stop offset="100%" stopColor="#bc1888" /></linearGradient></defs>
      <rect width="100" height="100" rx="20" fill="url(#instGrad)" /><rect x="20" y="20" width="60" height="60" rx="15" stroke="white" strokeWidth="5" fill="none" /><circle cx="50" cy="50" r="15" stroke="white" strokeWidth="5" fill="none" /><circle cx="70" cy="30" r="5" fill="white" />
    </svg>
  );
  if (t === "line") return (
    <svg width={s} height={s} viewBox="0 0 48 48">
      <path fill="#00c300" d="M12.5,42h23c3.59,0,6.5-2.91,6.5-6.5v-23C42,8.91,39.09,6,35.5,6h-23C8.91,6,6,8.91,6,12.5v23C6,39.09,8.91,42,12.5,42z"/><path fill="#fff" d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z"/>
    </svg>
  );
  return <div className="w-[40px] h-[40px] bg-white/20 rounded-full" />;
};

export default function DisplayPage() {
  const [uploadUrl, setUploadUrl] = useState("");
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [imageSlots, setImageSlots] = useState([
    { src: null as string | null, visible: false },
    { src: null as string | null, visible: false },
  ]);

  const dataRef = useRef({
    approvedList: [] as any[],
    newItemsQueue: [] as any[], // คิวสำหรับรูปที่พึ่ง Approve ใหม่
    currentIndex: -1,
    lastIndexBeforeQueue: null as number | null, // จำลำดับเดิมก่อนโดนแทรกคิว
    ids: new Set(),
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSlotRef = useRef(0);

  const fetchApproved = async () => {
    const { data } = await supabase
      .from("display_queue")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: true });
    return data || [];
  };

  useEffect(() => {
    setUploadUrl(window.location.origin);
    // ดึงข้อมูลครั้งแรก
    fetchApproved().then(data => {
      if (data.length) {
        dataRef.current.approvedList = data;
        dataRef.current.ids = new Set(data.map(i => i.id));
        startLoop();
      }
    });

    const channel = supabase
      .channel("display-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "display_queue" }, (payload) => {
        const data = dataRef.current;
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const newItem = payload.new as any;
          if (newItem.status === "approved" && !data.ids.has(newItem.id)) {
            data.ids.add(newItem.id);
            data.approvedList.push(newItem);
            data.newItemsQueue.push(newItem); // ✨ ใส่คิวด่วน
            
            // ถ้าหน้าจอยังมืดอยู่ (ไม่มีรูปเล่น) ให้เริ่มเลย
            if (!currentContent && data.newItemsQueue.length === 1) startLoop();
          }
        } else if (payload.eventType === "DELETE") {
          const deletedId = payload.old?.id;
          data.ids.delete(deletedId);
          data.approvedList = data.approvedList.filter(q => q.id !== deletedId);
          data.newItemsQueue = data.newItemsQueue.filter(q => q.id !== deletedId);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentContent]);

  const startLoop = () => {
    const data = dataRef.current;
    let nextItem = null;

    // ✨ Logic คิวลัด: ถ้ามีรูปใหม่ในคิวด่วน ให้เอามาเล่นก่อน
    if (data.newItemsQueue.length > 0) {
      if (data.lastIndexBeforeQueue === null) {
        data.lastIndexBeforeQueue = data.currentIndex;
      }
      nextItem = data.newItemsQueue.shift();
    } else if (data.approvedList.length > 0) {
      // ถ้าไม่มีคิวด่วน ให้กลับไปเล่นลำดับปกติ
      let nextIndex;
      if (data.lastIndexBeforeQueue !== null) {
        nextIndex = (data.lastIndexBeforeQueue + 1) % data.approvedList.length;
        data.lastIndexBeforeQueue = null;
      } else {
        nextIndex = (data.currentIndex + 1) % data.approvedList.length;
      }
      data.currentIndex = nextIndex;
      nextItem = data.approvedList[nextIndex];
    }

    if (!nextItem) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(startLoop, 3000);
      return;
    }

    setIsVisible(false);

    setTimeout(() => {
      const nextSlot = (activeSlotRef.current + 1) % 2;
      setImageSlots((prev) => {
        const n = [...prev];
        n[nextSlot] = { src: nextItem.image_url, visible: true };
        n[activeSlotRef.current] = { ...n[activeSlotRef.current], visible: false };
        return n;
      });
      activeSlotRef.current = nextSlot;
      setCurrentContent(nextItem);
      setCountdown(15);
      setIsVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(startLoop, 15000);
    }, 1500);
  };

  useEffect(() => {
    if (!currentContent) return;
    const cd = setInterval(() => setCountdown((p) => (p > 1 ? p - 1 : 15)), 1000);
    return () => clearInterval(cd);
  }, [currentContent]);

  if (!currentContent) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-yellow-500 font-bold tracking-widest uppercase italic" style={{ fontFamily: "'Playfair Display', serif" }}>
        Ready for Warp...
      </div>
    );
  }

  // ---------- UI คงเดิม (สีดำ-ทอง) ----------
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {imageSlots.map((s, i) => (
        <div key={i} className="absolute inset-0 transition-opacity duration-[1500ms]" style={{ opacity: s.visible ? 1 : 0, zIndex: 1 }}>
          {s.src && <img src={s.src} alt="" className="w-full h-full object-cover" />}
        </div>
      ))}

      <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute top-10 right-10">
          <div className="bg-yellow-500/90 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-black border-2 border-white shadow-xl">
            {countdown}
          </div>
        </div>

        <div className="absolute left-1/2 top-[75%] -translate-x-1/2 text-center px-4 w-full">
          <h1 className="text-6xl font-black text-white italic leading-tight drop-shadow-[0_6px_20px_rgba(0,0,0,1)] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
            "{currentContent.message}"
          </h1>
        </div>

        <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
          <div className="bg-slate-900/90 p-4 px-8 rounded-[1.5rem] border-l-[12px] border-yellow-500 shadow-2xl">
            <h2 className="text-yellow-500 text-4xl font-black italic uppercase mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              TABLE: {currentContent.table_no}
            </h2>
            <div className="flex items-center gap-3">
              <div className="scale-75 origin-left">
                <SocialIcon type={currentContent.social_type} />
              </div>
              <span className="text-white text-2xl font-bold -ml-2">{currentContent.social_id}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-[1.2rem] border-2 border-yellow-500 shadow-lg">
            {uploadUrl && <QRCode value={`${uploadUrl}/send`} size={110} />}
            <p className="text-black text-center font-black mt-1 text-[10px]">SCAN TO SEND</p>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&display=swap');
      `}</style>
    </div>
  );
}