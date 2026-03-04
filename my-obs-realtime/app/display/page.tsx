"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

const QRCode = dynamic(() => import("react-qr-code"), { ssr: false });

// ---------- Social Icon ----------
const SocialIcon = ({ type }: { type: string }) => {
  const t = type?.toLowerCase();
  const s = 40;

  if (t === "facebook") {
    return (
      <svg width={s} height={s} viewBox="0 0 105.78513 105.78513">
        <circle r="47.625" cy="52.89" cx="52.89" fill="#0066ff" />
        <path
          d="m 60.69,30.33 c -4.44,-0.01 -9.85,0.22 -11.33,1.41 -2.91,2.33 -2.25,6.83 -2.25,6.83 h 0.01 v 8.17 l -8.35,-0.04 2.6,7.95 5.74,0.01 v 22.96 h 9.62 v -22.93 l 6.28,0.01 2.2,-7.88 -8.48,-0.04 v -8.13 l 10.27,0.1 0.02,-8.25 s -2.87,-0.17 -6.33,-0.18 z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  if (t === "instagram") {
    return (
      <svg width={s} height={s} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="instGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="20" fill="url(#instGrad)" />
        <rect x="20" y="20" width="60" height="60" rx="15" stroke="white" strokeWidth="5" fill="none" />
        <circle cx="50" cy="50" r="15" stroke="white" strokeWidth="5" fill="none" />
        <circle cx="70" cy="30" r="5" fill="white" />
      </svg>
    );
  }

  return <div className="w-[40px] h-[40px] bg-white/20 rounded-full" />;
};

// ---------- Page ----------
export default function DisplayPage() {
  const [uploadUrl, setUploadUrl] = useState("");
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [imageSlots, setImageSlots] = useState([
    { src: null as string | null, visible: false },
    { src: null as string | null, visible: false },
  ]);
  const [activeSlot, setActiveSlot] = useState(0);

  const dataRef = useRef<{ queue: any[]; currentIndex: number }>({
    queue: [],
    currentIndex: -1,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ---------- init + realtime ----------
  useEffect(() => {
    setUploadUrl(window.location.origin);

    (async () => {
      const { data } = await supabase
        .from("display_queue")
        .select("*")
        .order("created_at", { ascending: true });

      if (data && data.length) {
        dataRef.current.queue = data;
        startLoop();
      }
    })();

    const channel = supabase
      .channel("display-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "display_queue" },
        (payload) => {
          const newItem = payload.new;
          const { queue, currentIndex } = dataRef.current;
          queue.splice(currentIndex + 1, 0, newItem);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ---------- loop ----------
  const startLoop = () => {
    const q = dataRef.current.queue;
    if (!q.length) return;

    dataRef.current.currentIndex =
      (dataRef.current.currentIndex + 1) % q.length;

    const item = q[dataRef.current.currentIndex];

    setIsVisible(false);

    setTimeout(() => {
      const nextSlot = (activeSlot + 1) % 2;

      setImageSlots((prev) => {
        const n = [...prev];
        n[nextSlot] = { src: item.image_url, visible: true };
        n[activeSlot] = { ...n[activeSlot], visible: false };
        return n;
      });

      setActiveSlot(nextSlot);
      setCurrentContent(item);
      setCountdown(15);
      setIsVisible(true);

      timerRef.current = setTimeout(startLoop, 15000);
    }, 1500);
  };

  // ---------- countdown ----------
  useEffect(() => {
    if (!currentContent) return;
    const cd = setInterval(
      () => setCountdown((p) => (p > 1 ? p - 1 : 15)),
      1000
    );
    return () => clearInterval(cd);
  }, [currentContent]);

  if (!currentContent) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-yellow-500 font-bold tracking-widest">
        READY FOR WARP...
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <style>{`
        .slot {
          position:absolute;
          inset:0;
          transition:opacity 1.5s ease-in-out;
          z-index:1;
        }
      `}</style>

      {/* ---------- IMAGE (ไม่สูงต่ำ / ไม่บังข้อความ) ---------- */}
      {/* ---------- IMAGE FULLSCREEN ---------- */}
{imageSlots.map((s, i) => (
  <div
    key={i}
    className="absolute inset-0 transition-opacity duration-[1500ms]"
    style={{ opacity: s.visible ? 1 : 0, zIndex: 1 }}
  >
    {s.src && (
      <img
        src={s.src}
        alt=""
        className="w-full h-full object-cover"
      />
    )}
  </div>
))}

      {/* ---------- OVERLAY (อยู่บนรูป) ---------- */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* countdown */}
        <div className="absolute top-10 right-10">
          <div className="bg-yellow-500/90 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-black border-2 border-white shadow-xl">
            {countdown}
          </div>
        </div>

        {/* message */}
        <div className="absolute left-1/2 top-[75%] -translate-x-1/2 text-center px-4">
          <h1 className="text-6xl font-black text-white italic leading-tight drop-shadow-[0_6px_20px_rgba(0,0,0,1)]">
            "{currentContent.message}"
          </h1>
        </div>

        {/* bottom info */}
        <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
          <div className="bg-slate-900/90 p-4 px-8 rounded-[1.5rem] border-l-[12px] border-yellow-500 shadow-2xl">
            <h2 className="text-yellow-500 text-4xl font-black italic uppercase mb-1">
              TABLE: {currentContent.table_no}
            </h2>
            <div className="flex items-center gap-3">
              <div className="scale-75 origin-left">
                <SocialIcon type={currentContent.social_type} />
              </div>
              <span className="text-white text-2xl font-bold -ml-2">
                {currentContent.social_id}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-[1.2rem] border-2 border-yellow-500 shadow-lg">
            {uploadUrl && <QRCode value={uploadUrl} size={110} />}
            <p className="text-black text-center font-black mt-1 text-[10px]">
              SCAN TO ME
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}