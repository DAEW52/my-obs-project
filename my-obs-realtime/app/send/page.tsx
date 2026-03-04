"use client";
import { useState } from 'react';
import { supabase } from "@/lib/supabase";

export default function SendPage() {
  const [msg, setMsg] = useState("");
  const [table, setTable] = useState("");
  const [status, setStatus] = useState("");
  const [socialType, setSocialType] = useState("Instagram");
  const [socialId, setSocialId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAndSend = async () => {
    if (!selectedFile || !msg || !table) {
      return alert("กรุณากรอกเบอร์โต๊ะ ข้อความ และเลือกรูปภาพก่อนส่งครับ");
    }

    setStatus("⏳ กำลังส่ง...");

    // 1. อัปโหลดรูปไปยัง Cloudinary
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', 'my_preset'); // เปลี่ยนเป็น preset ของคุณ

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/djdubma5b/image/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");
      const imageData = await res.json();

      // 2. บันทึกข้อมูลเข้า Supabase
      const { error } = await supabase
        .from('waiting_list')
        .insert([
          {
            table_no: table,
            social_type: socialType,
            social_id: socialId,
            message: msg,
            image_url: imageData.secure_url,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setStatus("✅ ส่งสำเร็จ! รอแอดมินอนุมัติ");

      // ล้างข้อมูลฟอร์ม
      setMsg("");
      setTable("");
      setSocialId("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setStatus(""), 4000);

    } catch (err) {
      console.error("Error:", err);
      setStatus("❌ ส่งไม่สำเร็จ! ลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0800] flex items-center justify-center p-4 text-white font-sans">

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 20% 20%, rgba(201,168,76,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 80%, rgba(201,168,76,0.05) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div
          className="relative rounded-[28px] p-10"
          style={{
            background: '#110e00',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 0 0 1px rgba(201,168,76,0.08), 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,215,0,0.08)'
          }}
        >

          {/* Corner ornaments */}
          <span className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#C9A84C] rounded-tl-sm" />
          <span className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#C9A84C] rounded-tr-sm" />
          <span className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#C9A84C] rounded-bl-sm" />
          <span className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#C9A84C] rounded-br-sm" />

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-24 h-24 mb-4 rounded-full p-[3px]"
              style={{
                background: 'conic-gradient(from 0deg, #8B6914, #FFD700, #C9A84C, #8B6914)',
                boxShadow: '0 0 30px rgba(201,168,76,0.35), 0 0 60px rgba(201,168,76,0.1)'
              }}
            >
              <div className="w-full h-full rounded-full bg-[#0a0800] flex items-center justify-center border-2 border-[#0a0800] overflow-hidden">
  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
</div>
            </div>
            <h1
              className="text-2xl font-black italic tracking-[4px] uppercase"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                background: 'linear-gradient(135deg, #8B6914 0%, #FFD700 40%, #C9A84C 60%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              แจกวาร์ปขึ้นจอ
            </h1>
            <div className="w-16 h-px mt-3" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
          </div>

          <div className="space-y-4">

            {/* Image Upload */}
            <div
              className="rounded-[18px] overflow-hidden"
              style={{ border: '2px dashed rgba(201,168,76,0.2)', background: '#1a1400' }}
            >
              {previewUrl ? (
                <div className="relative p-2">
                  <img src={previewUrl} className="w-full aspect-video object-cover rounded-[14px]" alt="preview" />
                  <button
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-[#110e00] hover:scale-110 transition-transform"
                  >✕</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-content-center py-8 cursor-pointer gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.15), transparent)', border: '1px solid rgba(201,168,76,0.3)' }}
                  >📸</div>
                  <span className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: '#7a6a40' }}>
                    แตะเพื่อเลือกรูปภาพ
                  </span>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              )}
            </div>

            {/* Table Number */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[2px] mb-2 ml-1" style={{ color: '#7a6a40' }}>
                เบอร์โต๊ะ
              </label>
              <input
                type="text"
                placeholder="ระบุหมายเลขโต๊ะ..."
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="w-full px-5 py-4 rounded-[14px] text-white text-[15px] outline-none transition-all"
                style={{
                  background: '#1a1400',
                  border: '1px solid rgba(201,168,76,0.25)',
                  fontFamily: 'Sarabun, sans-serif'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#C9A84C'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'}
              />
            </div>

            {/* Social Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[2px] mb-3 text-center" style={{ color: '#7a6a40' }}>
                เลือกช่องทางแจกวาร์ป
              </label>
              <div className="flex justify-center gap-4 mb-3">
                {(['Facebook', 'Line', 'Instagram'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSocialType(type)}
                    className="p-2.5 rounded-[14px] transition-all"
                    style={{
                      background: '#1a1400',
                      border: `2px solid ${socialType === type ? '#C9A84C' : 'rgba(201,168,76,0.2)'}`,
                      opacity: socialType === type ? 1 : 0.45,
                      transform: socialType === type ? 'scale(1.12)' : 'scale(1)',
                      boxShadow: socialType === type ? '0 0 16px rgba(201,168,76,0.3)' : 'none'
                    }}
                  >
                    {type === 'Facebook' && (
                      <svg viewBox="0 0 50 50" className="w-8 h-8">
                        <path fill="#1877F2" d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z"/>
                        <path fill="#fff" d="M37,19h-2c-2.14,0-3,0.5-3,2v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z"/>
                      </svg>
                    )}
                    {type === 'Line' && (
                      <svg viewBox="0 0 48 48" className="w-8 h-8">
                        <path fill="#00c300" d="M12.5,42h23c3.59,0,6.5-2.91,6.5-6.5v-23C42,8.91,39.09,6,35.5,6h-23C8.91,6,6,12.5v23C6,39.09,8.91,42,12.5,42z"/>
                        <path fill="#fff" d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z"/>
                      </svg>
                    )}
                    {type === 'Instagram' && (
                      <svg viewBox="0 0 48 48" className="w-8 h-8">
                        <defs>
                          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f9ce34"/>
                            <stop offset="50%" stopColor="#ee2a7b"/>
                            <stop offset="100%" stopColor="#6228d7"/>
                          </linearGradient>
                        </defs>
                        <circle cx="24" cy="24" r="20" fill="url(#ig-grad)"/>
                        <path fill="none" stroke="#fff" strokeWidth="2" d="M30,11H18c-3.9,0-7,3.1-7,7v12c0,3.9,3.1,7,7,7h12c3.9,0,7-3.1,7-7V18C37,14.1,33.9,11,30,11z"/>
                        <circle cx="31" cy="16" r="1.5" fill="#fff"/>
                        <circle cx="24" cy="24" r="6" fill="none" stroke="#fff" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder={`ใส่ไอดี ${socialType}...`}
                value={socialId}
                onChange={(e) => setSocialId(e.target.value)}
                className="w-full px-5 py-4 rounded-[14px] text-white text-[15px] outline-none transition-all"
                style={{
                  background: '#1a1400',
                  border: '1px solid rgba(201,168,76,0.25)',
                  fontFamily: 'Sarabun, sans-serif'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#C9A84C'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'}
              />
            </div>

            {/* Ornament divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2))' }} />
              <div className="w-1.5 h-1.5 rotate-45 border border-[#C9A84C]" />
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, transparent, rgba(201,168,76,0.2))' }} />
            </div>

            {/* Message */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[2px] mb-2 ml-1" style={{ color: '#7a6a40' }}>
                ข้อความโดนใจ
              </label>
              <textarea
                placeholder="พิมพ์ข้อความที่นี่..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="w-full px-5 py-4 rounded-[14px] text-white text-[15px] outline-none resize-none h-24 transition-all"
                style={{
                  background: '#1a1400',
                  border: '1px solid rgba(201,168,76,0.25)',
                  fontFamily: 'Sarabun, sans-serif'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#C9A84C'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleUploadAndSend}
              disabled={status.includes('⏳')}
              className="relative w-full py-5 rounded-[18px] font-black text-lg uppercase tracking-[3px] text-[#1a0f00] overflow-hidden transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #8B6914 0%, #FFD700 45%, #C9A84C 70%, #FFD700 100%)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: 'italic',
                boxShadow: '0 4px 24px rgba(201,168,76,0.3), 0 0 40px rgba(201,168,76,0.1)'
              }}
            >
              <span className="relative z-10">{status || "ส่งรูปขึ้นจอ 🚀"}</span>
              {/* Shimmer */}
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  animation: 'shimmer 2.5s infinite',
                  transform: 'skewX(-20deg)'
                }}
              />
            </button>

          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sarabun:wght@300;400;600;700&display=swap');
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        input::placeholder, textarea::placeholder { color: #3d3420; }
      `}</style>
    </div>
  );
}