'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // ใช้ supabase ตัวที่เราเซ็ตไว้

export default function DisplayPage() {
  const [data, setData] = useState<any>(null);

  // ฟังก์ชันดึงข้อมูลล่าสุด 1 รายการ
  const fetchLatestData = async () => {
    const { data: latestData, error } = await supabase
      .from('display_queue') // ตรวจสอบชื่อ Table ให้ตรงกับใน Supabase ของคุณ
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && latestData) {
      setData(latestData);
    }
  };

  useEffect(() => {
    // 1. ดึงข้อมูลครั้งแรกตอนเปิดหน้าจอ
    fetchLatestData();

    // 2. ดักฟัง Realtime เมื่อมีการเพิ่มข้อมูลใหม่ใน Table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'display_queue' },
        (payload) => {
          console.log('New data arrived!', payload.new);
          setData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white text-2xl font-bold">
        รอรับรูปภาพจากมือถือ...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black overflow-hidden">
      <div className="relative group">
        <img 
          src={data.image_url}  // เปลี่ยนชื่อ field ให้ตรงกับใน DB (ปกติ Supabase มักใช้ image_url)
          alt="Uploaded"
          className="max-h-[75vh] max-w-[90vw] rounded-[40px] border-[10px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-contain"
        />
      </div>

      <div className="mt-10 bg-black/70 backdrop-blur-md px-10 py-6 rounded-[30px] border border-white/20 text-center">
        <h1 className="text-5xl font-black text-yellow-400 drop-shadow-lg mb-2">
          {data.message} {/* เปลี่ยนเป็นชื่อ field message ของคุณ */}
        </h1>
        <p className="text-2xl text-white/90 font-medium">
          โต๊ะที่: <span className="text-blue-300">{data.table_no}</span>
        </p>
      </div>
    </div>
  );
}