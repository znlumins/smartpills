import { NextResponse } from "next/server";

// Memaksa Vercel/Next.js agar tidak mengubah rute ini menjadi static cache (Solusi Utama Error 405)
export const dynamic = "force-dynamic";
export const revalidate = 0;

if (!global.dataJadwal) {
    global.dataJadwal = { jam: 7, menit: 0 };
}

// GET: Membaca jadwal (Ditambahkan parameter 'request' agar dideteksi sebagai API dinamis)
export async function GET(request) {
    return NextResponse.json(global.dataJadwal, {
        status: 200,
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    });
}

// POST: Mengubah jadwal dari web frontend
export async function POST(request) {
    try {
        const body = await request.json();
        const { jam, menit } = body;

        if (typeof jam === "number" && typeof menit === "number") {
            global.dataJadwal = { jam, menit };
            return NextResponse.json({ success: true, data: global.dataJadwal });
        }
        return NextResponse.json({ success: false, message: "Format data salah" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Error Server" }, { status: 500 });
    }
}