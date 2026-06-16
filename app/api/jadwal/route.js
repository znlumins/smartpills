import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Mengambil variabel lingkungan
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Data cadangan (Fallback) jika Supabase belum terkonfigurasi dengan benar
let dataCadangan = { jam: 7, menit: 0, nama_obat: "Obat Cadangan (Supabase Offline)" };

// Inisialisasi Supabase secara aman agar tidak memicu error 500 jika variabel kosong
let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// GET: Membaca jadwal dari Supabase
export async function GET(request) {
    try {
        // Jika Supabase belum siap, kirim data cadangan daripada melempar error 500
        if (!supabase) {
            return NextResponse.json(dataCadangan, { status: 200 });
        }

        const { data, error } = await supabase
            .from("jadwal_obat")
            .select("jam, menit, nama_obat")
            .eq("id", 1)
            .maybeSingle(); // Menggunakan maybeSingle agar tidak crash jika data kosong

        // Jika data di tabel kosong, pakai data default
        if (!data) {
            return NextResponse.json({ jam: 7, menit: 0, nama_obat: "Belum Ada Obat" }, { status: 200 });
        }

        if (error) throw error;

        return NextResponse.json(data, {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache"
            },
        });
    } catch (error) {
        console.error("Supabase GET Error:", error.message);
        // Jika database bermasalah, kembalikan status 200 dengan data cadangan agar NodeMCU aman
        return NextResponse.json(dataCadangan, { status: 200 });
    }
}

// POST: Memperbarui jadwal ke Supabase
export async function POST(request) {
    try {
        const body = await request.json();
        const { jam, menit, nama_obat } = body;

        if (typeof jam !== "number" || typeof menit !== "number" || typeof nama_obat !== "string") {
            return NextResponse.json({ success: false, message: "Format data salah" }, { status: 400 });
        }

        // Update data lokal cadangan
        dataCadangan = { jam, menit, nama_obat };

        if (!supabase) {
            return NextResponse.json({ success: true, message: "Tersimpan di memori lokal (Supabase belum siap)", data: dataCadangan });
        }

        const { data, error } = await supabase
            .from("jadwal_obat")
            .upsert({ id: 1, jam, menit, nama_obat, updated_at: new Date() })
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Supabase POST Error:", error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}