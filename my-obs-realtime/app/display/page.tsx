'use client';

import { useEffect, useState, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const supabase = getSupabase();
const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

const SocialIcon = ({ type }: { type: string }) => {
  const socialType = type?.toLowerCase();
  const iconSize = "44";

  if (socialType === 'facebook') {
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 105.78513 105.78513">
        <g transform="translate(-29.12827,-77.419919)">
          <g transform="matrix(0.98570778,0,0,0.98570778,1.1722601,1.8624552)">
            <circle r="47.625" cy="130.31248" cx="82.020836" fill="#0066ff"/>
            <path d="m 89.822943,107.76035 c -4.444987,-0.0186 -9.850149,0.22118 -11.336776,1.41386 -2.911076,2.33548 -2.258777,6.83421 -2.258777,6.83421 h 0.0098 v 8.17728 l -8.351943,-0.0424 2.606043,7.95146 5.7459,0.0176 v 22.96759 h 9.621637 v -22.93762 l 6.281269,0.0191 2.204516,-7.88427 -8.485785,-0.0429 v -8.13284 l 10.274823,0.0997 0.02274,-8.25583 c 0,0 -2.876251,-0.17051 -6.333464,-0.185 z" fill="#ffffff"/>
          </g>
        </g>
      </svg>
    );
  }
  if (socialType === 'instagram') {
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 105.8851 105.88512">
        <defs>
          <linearGradient id="instagramGradient">
            <stop offset="0" stopColor="#00009f"/>
            <stop offset="0.32" stopColor="#7500cb" stopOpacity="0.53"/>
            <stop offset="0.59" stopColor="#c30077" stopOpacity="0.71"/>
            <stop offset="0.83" stopColor="#ff0000" stopOpacity="0.93"/>
            <stop offset="1" stopColor="#ffff00"/>
          </linearGradient>
        </defs>
        <g transform="translate(-52.572577,-100.74468)">
          <g transform="matrix(0.93003423,0,0,0.93003423,7.3824477,10.752847)">
            <ellipse ry="47.625" rx="46.125" cy="154.125" cx="105.84524" fill="url(#instagramGradient)"/>
            <rect ry="9.4182072" y="132.91701" x="83.404526" height="44.695126" width="44.695126" stroke="#ffffff" strokeWidth="2.41370797" fill="none"/>
            <circle r="2.7381825" cy="139.84071" cx="118.28339" fill="#ffffff"/>
            <circle r="11.584605" cy="155.26457" cx="105.75208" stroke="#ffffff" strokeWidth="3.32993841" fill="none"/>
          </g>
        </g>
      </svg>
    );
  }
  if (socialType === 'line') {
    return (
      <svg height={iconSize} width={iconSize} viewBox="0 0 99 99">
        <g>
          <rect fill="#3ACD01" height="99.4661" rx="10" ry="10" width="99.4661"/>
          <path fill="white" fillRule="nonzero" d="M50 17c19,0 35,12 35,28 0,5 -2,11 -5,15 0,0 -1,0 -1,1l0 0c-1,1 -2,2 -4,3 -10,9 -26,20 -28,19 -2,-2 3,-9 -2,-10 -1,0 -1,0 -1,0l0 0 0 0c-17,-3 -30,-14 -30,-28 0,-16 16,-28 36,-28zm-21 37l0 0 0 0 7 0c1,0 2,-1 2,-2l0 0c0,-1 -1,-2 -2,-2l-5 0 0 -12c0,-1 -1,-1 -2,-1l0 0c-1,0 -2,0 -2,1l0 14c0,1 1,2 2,2zm44 -9l0 0 0 0c0,-1 0,-2 -1,-2l-6 0 0 -2 6 0c1,0 1,-1 1,-2l0 0c0,-1 0,-2 -1,-2l-7 0 0 0 -1 0c-1,0 -1,1 -1,2l0 13c0,1 0,2 1,2l1 0 0 0 7 0c1,0 1,-1 1,-2l0 0c0,-1 0,-2 -1,-2l-6 0 0 -3 6 0c1,0 1,-1 1,-2zm-13 8l0 0 0 0c0,0 0,0 0,-1l0 -14c0,-1 -1,-1 -2,-1l0 0c-1,0 -2,0 -2,1l0 9 -6 -9c-1,-1 -1,-1 -2,-1l0 0c-1,0 -2,0 -2,1l0 14c0,1 1,2 2,2l0 0c1,0 2,-1 2,-2l0 -8 7 9c0,0 0,0 0,0l0 0c0,1 0,1 1,1 0,0 0,0 0,0l0 0c1,0 1,0 1,0 0,0 1,0 1,-1zm-18 1l0 0 0 0c1,0 2,-1 2,-2l0 -14c0,-1 -1,-1 -2,-1l0 0c-1,0 -2,0 -2,1l0 14c0,1 1,2 2,2z"/>
        </g>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white">
      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 22c-5.514 0-10-4.486-10-10s4.486-10 10-10 10 4.486 10 10-4.486 10-10 10zm0-18c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5zm0 11c-3.866 0-7 2.19-7 5v1c0 .552.448 1 1 1h12c.552 0 1-.448 1-1v-1c0-2.81-3.134-5-7-5z"/>
    </svg>
  );
};

export default function DisplayPage() {
  const [uploadUrl, setUploadUrl] = useState('');
  const [currentContent, setCurrentContent] = useState(null);
  const [isIdle, setIsIdle] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [imageSlots, setImageSlots] = useState([
    { src: null, visible: false },
    { src: null, visible: false },
  ]);
  const [activeSlot, setActiveSlot] = useState(0);

  const dataRef = useRef({
    approvedList: [],
    newItemsQueue: [],
    currentIndex: -1,
    ids: new Set(),
    lastIndexBeforeQueue: null,
  });

  const activeSlotRef = useRef(activeSlot);
  useEffect(() => { activeSlotRef.current = activeSlot; }, [activeSlot]);

  useEffect(() => {
    setUploadUrl(window.location.origin + '/send');

    const fetchInitialData = async () => {
      const { data } = await supabase
        .from('display_queue')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      if (data && data.length > 0) {
        const slideData = dataRef.current;
        slideData.approvedList = data;
        slideData.ids = new Set(data.map(item => item.id));
      }
    };
    fetchInitialData();

    const channel = supabase
      .channel('realtime display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'display_queue' }, (payload) => {
        const data = dataRef.current;
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new.status === 'approved' && !data.ids.has(payload.new.id)) {
            data.ids.add(payload.new.id);
            data.approvedList.push(payload.new);
            data.newItemsQueue.push(payload.new);
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          if (data.ids.has(deletedId)) {
            data.ids.delete(deletedId);
            data.approvedList = data.approvedList.filter(item => item.id !== deletedId);
            data.newItemsQueue = data.newItemsQueue.filter(item => item.id !== deletedId);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const DELAY = 15000;
    const tick = () => {
      const data = dataRef.current;
      let nextItem = null;

      if (data.newItemsQueue.length > 0) {
        data.lastIndexBeforeQueue = data.currentIndex;
        nextItem = data.newItemsQueue.shift();
        const itemIndex = data.approvedList.findIndex(item => item.id === nextItem.id);
        if (itemIndex !== -1) data.currentIndex = itemIndex;
      } else if (data.approvedList.length > 0) {
        let nextIndex;
        if (data.lastIndexBeforeQueue !== null) {
          nextIndex = (data.lastIndexBeforeQueue + 1) % data.approvedList.length;
          data.lastIndexBeforeQueue = null;
        } else {
          nextIndex = (data.currentIndex + 1) % data.approvedList.length;
        }
        data.currentIndex = nextIndex;
        nextItem = data.approvedList[data.currentIndex];
      }

      if (nextItem) {
        const currentActiveSlot = activeSlotRef.current;
        const nextSlot = (currentActiveSlot + 1) % 2;
        setImageSlots(prev => {
          const newSlots = [...prev];
          newSlots[nextSlot] = { src: nextItem.image_url, visible: true };
          newSlots[currentActiveSlot] = { ...newSlots[currentActiveSlot], visible: false };
          return newSlots;
        });
        setActiveSlot(nextSlot);
        setCurrentContent(nextItem);
        setIsIdle(false);
      } else {
        setIsIdle(true);
        setCurrentContent(null);
      }
    };

    const timerId = setInterval(tick, DELAY);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!currentContent) return;
    setCountdown(15);
    const countdownTimer = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 15));
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, [currentContent]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#0a0800' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700;1,900&family=Sarabun:wght@300;400;600&display=swap');

        .image-slot {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          transition: opacity 1.8s ease-in-out;
        }
        .image-slot img {
          width: 100%; height: 100%; object-fit: cover;
        }

        /* gradient overlay เบาๆ บนรูป */
        .image-slot::after {
          content: '';
          position: absolute; inset: 0;
          background:
            linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.3) 100%);
        }

        .content-overlay {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.8s ease-out 0.5s;
        }
        .content-overlay.visible { opacity: 1; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 30px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(201,168,76,0.4), 0 0 40px rgba(201,168,76,0.1); }
          50%       { box-shadow: 0 0 30px rgba(201,168,76,0.7), 0 0 60px rgba(201,168,76,0.2); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes idlePulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }

        .message-animate {
          animation: fadeSlideUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .info-animate {
          animation: fadeSlideLeft 0.7s ease-out 0.3s both;
        }
        .gold-ring {
          animation: goldPulse 3s ease-in-out infinite;
        }
        .logo-shimmer::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.25) 50%, transparent 100%);
          animation: shimmer 3s infinite;
          border-radius: inherit;
        }
      `}</style>

      {/* ── รูปภาพ slots ── */}
      {imageSlots.map((slot, index) => (
        <div key={index} className="image-slot" style={{ opacity: slot.visible ? 1 : 0 }}>
          {slot.src && <img src={slot.src} alt={`display-slot-${index}`} />}
        </div>
      ))}

      {/* ── Content overlay ── */}
      <div key={currentContent?.id} className={`content-overlay ${currentContent ? 'visible' : ''}`}>

        {/* ── IDLE screen ── */}
        {isIdle && (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', gap: '1.5rem',
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 70%)',
            animation: 'idlePulse 4s ease-in-out infinite',
          }}>
            {/* Logo วง */}
            <div style={{
              width: '140px', height: '140px', borderRadius: '50%',
              padding: '4px', overflow: 'hidden', flexShrink: 0,
              background: 'conic-gradient(from 0deg, #8B6914, #FFD700, #C9A84C, #8B6914)',
              boxShadow: '0 0 50px rgba(201,168,76,0.5), 0 0 100px rgba(201,168,76,0.15)',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: '#0a0800', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img src="/logo.png" alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }}
                  onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement.innerHTML='<span style="font-size:3.5rem">👑</span>'; }}
                />
              </div>
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic', fontWeight: 900,
              fontSize: '5rem', margin: 0, letterSpacing: '6px',
              background: 'linear-gradient(135deg, #8B6914 0%, #FFD700 40%, #C9A84C 60%, #FFD700 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              ARTHER Phuket
            </h1>

            <div style={{
              width: '200px', height: '1px',
              background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
            }} />

            <p style={{
              fontFamily: 'Sarabun, sans-serif', color: '#7a6a40',
              fontSize: '1.1rem', letterSpacing: '4px', textTransform: 'uppercase', margin: 0,
            }}>
              แจกวาร์ปขึ้นจอ
            </p>
          </div>
        )}

        {/* ── Logo มุมบนซ้าย (แสดงตลอดเวลาที่มี content) ── */}
        {currentContent && (
          <div className="logo-shimmer" style={{
            position: 'absolute', top: '1.5rem', left: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '14px',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(201,168,76,0.35)',
            borderRadius: '50px',
            padding: '8px 20px 8px 8px',
            overflow: 'hidden',
          }}>
            <div className="gold-ring" style={{
              width: '48px', height: '48px', borderRadius: '50%',
              padding: '2px', flexShrink: 0,
              background: 'conic-gradient(from 0deg, #8B6914, #FFD700, #C9A84C, #8B6914)',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: '#0a0800', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/logo.png" alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                  onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement.innerHTML='<span style="font-size:1.2rem">👑</span>'; }}
                />
              </div>
            </div>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic', fontWeight: 700,
              fontSize: '1.3rem', letterSpacing: '2px',
              background: 'linear-gradient(135deg, #FFD700, #C9A84C)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              ARTHER Phuket
            </span>
          </div>
        )}

        {/* ── Countdown วงกลม มุมบนขวา ── */}
        {currentContent && (
          <div style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(201,168,76,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFD700', fontSize: '1.4rem', fontWeight: 'bold',
            fontFamily: 'Sarabun, sans-serif',
            boxShadow: '0 0 20px rgba(201,168,76,0.2)',
          }}>
            {countdown}
          </div>
        )}

        {/* ── ข้อความกลางจอ ── */}
        {currentContent && (
          <div className="message-animate" style={{
            position: 'absolute', top: '70%', left: '50%',
            transform: 'translate(-50%, -50%)', width: '85%',
            textAlign: 'center',
          }}>
            {/* เส้นทองด้านบน */}
            <div style={{
              width: '80px', height: '2px', margin: '0 auto 1rem',
              background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
            }} />
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic', fontWeight: 700,
              color: 'white', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              lineHeight: 1.3, margin: 0,
              textShadow: '0 2px 20px rgba(0,0,0,0.8), -3px -3px 0 rgba(0,0,0,0.5), 3px 3px 0 rgba(0,0,0,0.5)',
            }}>
              "{currentContent.message}"
            </h1>
            {/* เส้นทองด้านล่าง */}
            <div style={{
              width: '80px', height: '2px', margin: '1rem auto 0',
              background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
            }} />
          </div>
        )}

        {/* ── Bottom bar ── */}
        <div style={{
          position: 'absolute', bottom: '5.5rem', left: '2rem', right: '2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        }}>

          {/* ซ้าย: social + โต๊ะ */}
          <div>
            {currentContent && (
              <div className="info-animate" style={{
                display: 'flex', flexDirection: 'column', gap: '10px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(201,168,76,0.3)',
                padding: '18px 24px', borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                {/* เส้นทองบน */}
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, #C9A84C, transparent)',
                  marginBottom: '4px',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <SocialIcon type={currentContent.social_type} />
                  <p style={{
                    fontFamily: 'Sarabun, sans-serif',
                    fontSize: '2rem', margin: 0, color: 'white', fontWeight: 600,
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}>
                    {currentContent.social_id}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFD700, #C9A84C)',
                    flexShrink: 0,
                  }} />
                  <p style={{
                    fontFamily: 'Sarabun, sans-serif',
                    fontSize: '1.8rem', margin: 0, color: '#C9A84C', fontWeight: 600,
                  }}>
                    โต๊ะ {currentContent.table_no}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ขวา: QR Code */}
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(201,168,76,0.35)',
            padding: '12px', borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              background: 'white', padding: '8px', borderRadius: '8px',
            }}>
              {uploadUrl && <QRCode value={uploadUrl} size={140} />}
            </div>
            <p style={{
              fontFamily: 'Sarabun, sans-serif',
              color: '#C9A84C', fontSize: '0.75rem',
              textAlign: 'center', margin: '8px 0 0', letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              แจกวาร์ปขึ้นจอ
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}