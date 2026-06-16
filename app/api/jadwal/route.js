import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Inisialisasi Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET: NodeMCU dan Frontend membaca jadwal + nama obat dari Supabase
export async function GET(request) {
    try {
        const { data, error } = await supabase
            .from("jadwal_obat")
            .select("jam, menit, nama_obat")
            .eq("id", 1)
            .single();

        if (error) throw error;

        return NextResponse.json(data, {
            status: 200,
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Frontend memperbarui jadwal + nama obat di Supabase
export async function POST(request) {
    try {
        const body = await request.json();
        const { jam, menit, nama_obat } = body;

        if (typeof jam === "number" && typeof menit === "number" && typeof nama_obat === "string") {
            const { data, error } = await supabase
                .from("jadwal_obat")
                .update({ jam, menit, nama_obat, updated_at: new Date() })
                .eq("id", 1)
                .select();

            if (error) throw error;

            return NextResponse.json({ success: true, data });
        }
        return NextResponse.json({ success: false, message: "Format data salah" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}