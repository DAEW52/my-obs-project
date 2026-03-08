'use client';

import { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase"; // ตรวจสอบ Path นี้ให้ตรงกับโปรเจกต์คุณ
const supabase = getSupabase();
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

// ---------- Social Icon (Black-Gold Theme) ----------
const SocialIcon = ({ type }: { type?: string }) => {
  const t = type?.toLowerCase();
  const size = 48;

  if (t === 'facebook') {
    return (
      <svg width={size} height={size} viewBox="0 0 105.78513 105.78513">
        <circle r="47.625" cy="52.89" cx="52.89" fill="#0066ff" />
        <path d="m 60.69,30.33 c -4.44,-0.01 -9.85,0.22 -11.33,1.41 -2.91,2.33 -2.25,6.83 -2.25,6.83 v 8.17 l -8.35,-0.04 2.6,7.95 5.74,0.01 v 22.96 h 9.62 v -22.93 l 6.28,0.01 2.2,-7.88 -8.48,-0.04 v -8.13 l 10.27,0.1 0.02,-8.25 c 0,0 -2.87,-0.17 -6.33,-0.18 z" fill="#fff"/>
      </svg>
    );
  }

  if (t === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="20" fill="url(#igGrad)" />
        <rect x="20" y="20" width="60" height="60" rx="15" stroke="white" strokeWidth="5" fill="none" />
        <circle cx="50" cy="50" r="15" stroke="white" strokeWidth="5" fill="none" />
        <circle cx="70" cy="30" r="5" fill="white" />
      </svg>
    );
  }

  if (t === 'line') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48">
        <path fill="#00c300" d="M12.5,42h23c3.59,0,6.5-2.91,6.5-6.5v-23C42,8.91,39.09,6,35.5,6h-23C8.91,6,6,8.91,6,12.5v23C6,39.09,8.91,42,12.5,42z"/>
        <path fill="#fff" d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611C36.203,26.879,37.113,24.764,37.113,22.417z"/>
      </svg>
    );
  }

  return <div className="w-12 h-12 bg-white/20 rounded-full" />;
};

export default function DisplayPage() {
  const [uploadUrl, setUploadUrl] = useState('');
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isIdle, setIsIdle] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [imageSlots, setImageSlots] = useState([
    { src: null as string | null, visible: false },
    { src: null as string | null, visible: false }
  ]);
  const [activeSlot, setActiveSlot] = useState(0);

  const dataRef = useRef({
    approvedList: [] as any[],
    newItemsQueue: [] as any[], // คิวสำหรับรูปที่อนุมัติใหม่พึ่งเข้ามา
    currentIndex: -1,
    ids: new Set<string>(),
    lastIndexBeforeQueue: null as number | null,
  });

  const activeSlotRef = useRef(activeSlot);
  useEffect(() => { activeSlotRef.current = activeSlot; }, [activeSlot]);

  // ฟังก์ชันดึงข้อมูลแบบ Realtime ที่ปรับปรุงใหม่
  const fetchApproved = async () => {
    const { data } = await supabase
      .from('display_queue') // ตรวจสอบชื่อตารางให้ตรงกับรูป 243
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    return data || [];
  };

  useEffect(() => {
    setUploadUrl(window.location.origin);

    fetchApproved().then(data => {
      if (data && data.length > 0) {
        dataRef.current.approvedList = data;
        dataRef.current.ids = new Set(data.map(i => i.id));
        // ไม่เรียก tick ตรงๆ เพื่อให้ตัว Interval จัดการ
      }
    });

    const channel = supabase
      .channel('realtime-display')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'display_queue' },
        (payload) => {
          const d = dataRef.current;
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')) {
            const newItem = payload.new as any;
            if (newItem.status === 'approved' && !d.ids.has(newItem.id)) {
              d.ids.add(newItem.id);
              d.approvedList.push(newItem);
              d.newItemsQueue.push(newItem); // ✨ ใส่คิวด่วนให้เล่นรูปนี้ทันทีในรอบถัดไป
            }
          }

          if (payload.eventType === 'DELETE') {
            const id = payload.old.id;
            d.ids.delete(id);
            d.approvedList = d.approvedList.filter(i => i.id !== id);
            d.newItemsQueue = d.newItemsQueue.filter(i => i.id !== id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const DELAY = 15000;

    const tick = () => {
      const d = dataRef.current;
      let nextItem: any = null;

      // ✨ Logic คิวลัด: ถ้ามีรูปใหม่พึ่ง Approve มา ให้แซงคิวทันที
      if (d.newItemsQueue.length > 0) {
        if (d.lastIndexBeforeQueue === null) d.lastIndexBeforeQueue = d.currentIndex;
        nextItem = d.newItemsQueue.shift();
        const idx = d.approvedList.findIndex(i => i.id === nextItem.id);
        if (idx !== -1) d.currentIndex = idx;
      } else if (d.approvedList.length > 0) {
        // ✨ Logic Infinite Loop: วนรูปเดิมเรื่อยๆ
        let nextIndex;
        if (d.lastIndexBeforeQueue !== null) {
          nextIndex = (d.lastIndexBeforeQueue + 1) % d.approvedList.length;
          d.lastIndexBeforeQueue = null;
        } else {
          nextIndex = (d.currentIndex + 1) % d.approvedList.length;
        }
        d.currentIndex = nextIndex;
        nextItem = d.approvedList[nextIndex];
      }

      if (nextItem) {
        const currentSlot = activeSlotRef.current;
        const nextSlot = (currentSlot + 1) % 2;

        setImageSlots(prev => {
          const copy = [...prev];
          copy[nextSlot] = { src: nextItem.image_url, visible: true }; // ใช้ image_url ตามรูป 243
          copy[currentSlot] = { ...copy[currentSlot], visible: false };
          return copy;
        });

        setActiveSlot(nextSlot);
        setCurrentContent(nextItem);
        setIsIdle(false);
      } else {
        setIsIdle(true);
        setCurrentContent(null);
      }
    };

    // เรียกครั้งแรกทันที
    tick();
    const timer = setInterval(tick, DELAY);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentContent) return;
    setCountdown(15);
    const cd = setInterval(() => {
      setCountdown(p => p > 1 ? p - 1 : 15);
    }, 1000);
    return () => clearInterval(cd);
  }, [currentContent]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* ---------- IMAGE SLOTS ---------- */}
      {imageSlots.map((slot, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-[1500ms]"
          style={{ opacity: slot.visible ? 1 : 0 }}
        >
          {slot.src && (
            <img src={slot.src} className="w-full h-full object-cover" alt="display" />
          )}
        </div>
      ))}

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />

      {/* Idle State (เมื่อไม่มีรูป) */}
      {isIdle && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <h1 className="text-white text-6xl font-black tracking-widest italic" style={{ fontFamily: 'Sarabun, sans-serif' }}>
            READY FOR WARP...
          </h1>
        </div>
      )}

      {/* Content Display */}
      {currentContent && (
        <div className="absolute inset-0 z-20">
          {/* Countdown Circle */}
          <div className="absolute top-10 right-10">
            <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-black border-2 border-white shadow-xl">
              {countdown}
            </div>
          </div>

          {/* Message (Black-Gold Style) */}
          <div className="absolute left-1/2 top-2/3 -translate-x-1/2 text-center max-w-[80%] w-full">
            <h1 className="text-[7vw] font-black italic text-white leading-tight
              drop-shadow-[0_6px_20px_rgba(0,0,0,1)]
              drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]"
              style={{ fontFamily: 'Sarabun, sans-serif' }}>
              "{currentContent.message}"
            </h1>
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-30 left-10 right-10 flex items-end justify-between">
            <div className="bg-slate-900/90 p-6 px-10 rounded-[1.5rem] border-l-[12px] border-yellow-500 shadow-2xl">
              <div className="flex items-center gap-5">
                <SocialIcon type={currentContent.social_type} />
                <span className="text-white text-3xl font-bold">
                  {currentContent.social_id}
                </span>
              </div>
              <h2 className="text-yellow-500 text-3xl font-black mt-2 uppercase italic">
                TABLE: {currentContent.table_no}
              </h2>
            </div>

            {/* QR Code Section */}
            <div className="bg-white p-4 rounded-[2.5rem] border-4 border-yellow-500 shadow-lg">
              {uploadUrl && <QRCode value={`${uploadUrl}/send`} size={140} />}
              <p className="text-black text-center font-black mt-1 text-xs">
                SCAN TO SEND
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}