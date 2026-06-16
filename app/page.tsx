"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [jam, setJam] = useState<number>(7);
  const [menit, setMenit] = useState<number>(0);
  const [namaObat, setNamaObat] = useState<string>("");
  const [status, setStatus] = useState<string>("Menghubungkan ke server...");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [lastUpdated, setLastUpdated] = useState<string>("-");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0] + " WIB");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/jadwal")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then((data) => {
        setJam(data.jam);
        setMenit(data.menit);
        setNamaObat(data.nama_obat || "");
        setStatus("Tersambung ke Supabase Cloud");
        setStatusType("success");
        setLastUpdated(new Date().toLocaleTimeString("id-ID") + " WIB");
      })
      .catch((err) => {
        setStatus("Gagal sinkronisasi dengan database cloud");
        setStatusType("error");
      });
  }, []);

  const simpanJadwal = async () => {
    if (jam < 0 || jam > 23 || menit < 0 || menit > 59) {
      setStatus("Waktu tidak valid! (Jam: 0-23, Menit: 0-59)");
      setStatusType("error");
      return;
    }
    if (!namaObat.trim()) {
      setStatus("Nama obat tidak boleh kosong!");
      setStatusType("error");
      return;
    }

    setStatus("Menyimpan perubahan...");
    setStatusType("info");
    try {
      const res = await fetch("/api/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jam, menit, nama_obat: namaObat }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("Berhasil diperbarui & disinkronkan ke NodeMCU");
        setStatusType("success");
        setLastUpdated(new Date().toLocaleTimeString("id-ID") + " WIB");
      } else {
        setStatus("Gagal menyimpan data ke database");
        setStatusType("error");
      }
    } catch (error) {
      setStatus("Kesalahan jaringan. Periksa koneksi Anda.");
      setStatusType("error");
    }
  };

  const playWebBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Mengaktifkan AudioContext yang di-suspend oleh browser (Kebijakan Autoplay)
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      
      const playTone = (timeOffset: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "square";
        osc.frequency.setValueAtTime(2400, audioCtx.currentTime + timeOffset);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime + timeOffset);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + timeOffset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + timeOffset + 0.18);
        
        osc.start(audioCtx.currentTime + timeOffset);
        osc.stop(audioCtx.currentTime + timeOffset + 0.22);
      };

      // Mainkan 2 bip cepat
      playTone(0);
      playTone(0.25);
    } catch (e) {
      console.warn("Gagal memutar suara di web:", e);
    }
  };

  const testKoneksiDanAudio = async () => {
    setStatus("Menguji koneksi server...");
    setStatusType("info");
    
    // Bunyikan beeper di browser web
    playWebBeep();

    try {
      const start = Date.now();
      const res = await fetch("/api/jadwal");
      const elapsed = Date.now() - start;
      
      if (res.ok) {
        setStatus(`Koneksi Supabase OK! Latency: ${elapsed}ms. Audio bip berhasil diputar.`);
        setStatusType("success");
      } else {
        setStatus("Server merespons tetapi data gagal dimuat (HTTP " + res.status + ")");
        setStatusType("error");
      }
    } catch (e) {
      setStatus("Gagal menghubungi server web. Coba periksa koneksi Anda.");
      setStatusType("error");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-neutral-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Smart Pill Dispenser</h1>
              <p className="text-[10px] text-teal-400 font-mono tracking-widest uppercase">IoT Controller</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-neutral-400">Waktu Lokal</p>
              <p className="text-sm font-mono font-bold text-teal-400">{currentTime || "Loading..."}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${
              statusType === "success" ? "border-teal-500/20 bg-teal-500/5 text-teal-400" :
              statusType === "error" ? "border-red-500/20 bg-red-500/5 text-red-400" :
              "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                statusType === "success" ? "bg-teal-400" :
                statusType === "error" ? "bg-red-400" :
                "bg-yellow-400 animate-pulse"
              }`} />
              {statusType === "success" ? "Supabase Online" : statusType === "error" ? "Offline" : "Menghubungkan"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column - Current Status and Info */}
        <section className="md:col-span-5 flex flex-col gap-6">
          
          {/* Active Schedule Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Jadwal Aktif Saat Ini</h2>
              <span className="text-[10px] font-mono text-neutral-500">NodeMCU Ref: 1</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-5xl font-mono font-bold tracking-tight text-white">
                {String(jam).padStart(2, '0')}:{String(menit).padStart(2, '0')}
                <span className="text-lg font-sans font-medium text-neutral-400 ml-2">WIB</span>
              </p>
              <div>
                <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Daftar Obat</p>
                <p className="text-lg font-bold text-teal-400 truncate">{namaObat || "Belum Ada Obat"}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
              <span>Sinkronisasi Terakhir:</span>
              <span className="font-mono text-neutral-200">{lastUpdated}</span>
            </div>
          </div>

          {/* Connection Details Information Card */}
          <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl p-6 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">Panduan Integrasi IoT</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              NodeMCU di kotak obat Anda disinkronkan secara nirkabel dengan halaman web ini. Setiap perubahan jadwal di bawah akan segera dimuat oleh modul IoT dalam interval 10 detik.
            </p>
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[10px] text-neutral-300">
              <p className="text-teal-400">// API Endpoint</p>
              <p className="truncate">GET /api/jadwal</p>
            </div>
          </div>

        </section>

        {/* Right Column - Schedule Control Panel Form */}
        <section className="md:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="text-lg font-bold text-white">Atur Jadwal Baru</h2>
            <p className="text-xs text-neutral-400">Keluarga dapat memperbarui konfigurasi waktu dan jenis obat yang dikeluarkan secara langsung.</p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Hour & Minute Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-300" htmlFor="hour-input">Jam</label>
                <div className="relative">
                  <input
                    id="hour-input"
                    type="number"
                    min="0"
                    max="23"
                    value={jam}
                    onChange={(e) => setJam(Math.max(0, Math.min(23, Number(e.target.value))))}
                    className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-teal-500 focus:outline-none rounded-lg px-4 py-3 text-lg font-mono text-center text-white transition-colors"
                  />
                  <span className="absolute right-3 top-3.5 text-[10px] font-bold text-neutral-600 font-mono">HR</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-300" htmlFor="minute-input">Menit</label>
                <div className="relative">
                  <input
                    id="minute-input"
                    type="number"
                    min="0"
                    max="59"
                    value={menit}
                    onChange={(e) => setMenit(Math.max(0, Math.min(59, Number(e.target.value))))}
                    className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-teal-500 focus:outline-none rounded-lg px-4 py-3 text-lg font-mono text-center text-white transition-colors"
                  />
                  <span className="absolute right-3 top-3.5 text-[10px] font-bold text-neutral-600 font-mono">MIN</span>
                </div>
              </div>
            </div>

            {/* Medicine name input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-neutral-300" htmlFor="medication-input">Daftar / Nama Obat</label>
              <input
                id="medication-input"
                type="text"
                value={namaObat}
                onChange={(e) => setNamaObat(e.target.value)}
                placeholder="Contoh: Vitamin C, Paracetamol, Obat Darah Tinggi"
                className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-teal-500 focus:outline-none rounded-lg px-4 py-3 text-sm text-white transition-colors placeholder:text-neutral-600"
              />
            </div>

            {/* Action buttons grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <button
                onClick={simpanJadwal}
                className="w-full bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-neutral-950 font-bold py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Perbarui Jadwal
              </button>

              <button
                onClick={testKoneksiDanAudio}
                className="w-full bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 border border-neutral-750 text-white font-bold py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                Test Bip Web
              </button>
            </div>

            {/* Status Feedback banner */}
            <div className={`mt-2 p-3.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 transition-all duration-300 ${
              statusType === "success" ? "border-teal-500/20 bg-teal-500/5 text-teal-400" :
              statusType === "error" ? "border-red-500/20 bg-red-500/5 text-red-400" :
              "border-neutral-800 bg-neutral-950 text-neutral-400"
            }`}>
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Informasi Status:</p>
                <p className="text-[11px] mt-0.5 opacity-90">{status}</p>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 text-center py-6 text-xs text-neutral-600">
        <p>Smart Pill Dispenser System © 2026 • Terhubung dengan Database Supabase Cloud</p>
      </footer>
    </div>
  );
}