"use client";

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#0a0800] flex items-center justify-center p-4 text-white font-sans">
      {/* Background Decorative Elements (คงไว้จากดีไซน์เดิม) */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(201,168,76,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 80%, rgba(201,168,76,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div
          className="relative rounded-[28px] p-10 text-center"
          style={{
            background: "#110e00",
            border: "1px solid rgba(201,168,76,0.25)",
            boxShadow:
              "0 0 0 1px rgba(201,168,76,0.08), 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,215,0,0.08)",
          }}
        >
          {/* Corner Accents */}
          <span className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#C9A84C] rounded-tl-sm" />
          <span className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#C9A84C] rounded-tr-sm" />
          <span className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#C9A84C] rounded-bl-sm" />
          <span className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#C9A84C] rounded-br-sm" />

          {/* Icon Section */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-20 h-20 mb-6 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: "rgba(201,168,76,0.1)",
                border: "2px solid #C9A84C",
                boxShadow: "0 0 20px rgba(201,168,76,0.2)",
              }}
            >
              💸
            </div>

            <h1
              className="text-2xl font-black italic tracking-[2px] uppercase mb-2"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                background: "linear-gradient(135deg, #8B6914 0%, #FFD700 40%, #C9A84C 60%, #FFD700 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              โปรดชำระเงิน
            </h1>
            
            <div className="w-16 h-px bg-[#C9A84C] opacity-50 mb-6" />

            <div className="space-y-4 text-[#C9A84C]">
              <p className="text-lg font-bold" style={{ fontFamily: "Sarabun, sans-serif" }}>
                กรุณาติดต่อเจ้าหน้าที่เพื่อดำเนินการ
              </p>
              
              {/* ส่วนข้อมูลติดต่อ - คุณสามารถใส่เบอร์โทรหรือ ID Line ตรงนี้ */}
              <div 
                className="p-6 rounded-2xl bg-[#1a1400] border border-[rgba(201,168,76,0.2)]"
                style={{ fontFamily: "Sarabun, sans-serif" }}
              >
                <p className="text-sm text-gray-400 mb-2">ช่องทางติดต่อ</p>
                <p className="text-xl font-bold tracking-wider">
                  Facebook : Khalifa Suphoti
                </p>
                <p className="text-md mt-2 opacity-80">
                  โทร: 08x-xxx-xxxx
                </p>
              </div>
            </div>
          </div>

          <p className="text-[12px] text-gray-500 mt-8 uppercase tracking-[2px]">
            Thank you for your service
          </p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Sarabun:wght@300;400;600;700&display=swap');
        body { background-color: #0a0800; }
      `}</style>
    </div>
  );
}