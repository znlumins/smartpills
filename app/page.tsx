"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [jam, setJam] = useState<number>(7);
  const [menit, setMenit] = useState<number>(0);
  const [status, setStatus] = useState<string>("Memuat data...");

  // Ambil data jadwal saat pertama kali web dibuka
  useEffect(() => {
    fetch("/api/jadwal")
      .then((res) => res.json())
      .then((data) => {
        setJam(data.jam);
        setMenit(data.menit);
        setStatus(`Jadwal saat ini: ${String(data.jam).padStart(2, '0')}:${String(data.menit).padStart(2, '0')} WIB`);
      })
      .catch(() => setStatus("Gagal memuat jadwal"));
  }, []);

  // Fungsi saat tombol "Simpan" diklik
  const simpanJadwal = async () => {
    setStatus("Menyimpan...");
    try {
      const res = await fetch("/api/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jam: jam, menit: menit }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`Sukses! Jadwal diubah ke ${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')} WIB`);
      } else {
        setStatus("Gagal menyimpan.");
      }
    } catch (error) {
      setStatus("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <main style={{ fontFamily: "Arial, sans-serif", textAlign: "center", background: "#f0f2f5", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ background: "white", padding: "30px", borderRadius: "12px", maxWidth: "400px", margin: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <h2 style={{ color: "#333", marginBottom: "5px" }}>⏰ Alarm Obat Next.js</h2>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>Kontrol jadwal dari mana saja melalui Cloud</p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "15px", fontSize: "16px" }}>
            Jam: <input type="number" min="0" max="23" value={jam} onChange={(e) => setJam(Number(e.target.value))} style={{ width: "60px", padding: "8px", fontSize: "16px", textAlign: "center", borderRadius: "6px", border: "1px solid #ccc" }} />
          </label>
          <label style={{ fontSize: "16px" }}>
            Menit: <input type="number" min="0" max="59" value={menit} onChange={(e) => setMenit(Number(e.target.value))} style={{ width: "60px", padding: "8px", fontSize: "16px", textAlign: "center", borderRadius: "6px", border: "1px solid #ccc" }} />
          </label>
        </div>

        <button onClick={simpanJadwal} style={{ background: "#0070f3", color: "white", border: "none", padding: "10px 20px", fontSize: "16px", borderRadius: "6px", cursor: "pointer", width: "100%" }}>
          Simpan Jadwal Baru
        </button>

        <p style={{ marginTop: "20px", fontSize: "14px", color: "#555", fontStyle: "italic" }}>{status}</p>
      </div>
    </main>
  );
}