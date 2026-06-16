"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [jam, setJam] = useState<number>(7);
  const [menit, setMenit] = useState<number>(0);
  const [namaObat, setNamaObat] = useState<string>("");
  const [status, setStatus] = useState<string>("Memuat data dari Supabase...");

  useEffect(() => {
    fetch("/api/jadwal")
      .then((res) => res.json())
      .then((data) => {
        setJam(data.jam);
        setMenit(data.menit);
        setNamaObat(data.nama_obat);
        setStatus(`Aktif: ${String(data.jam).padStart(2, '0')}:${String(data.menit).padStart(2, '0')} WIB (${data.nama_obat})`);
      })
      .catch(() => setStatus("Gagal memuat jadwal"));
  }, []);

  const simpanJadwal = async () => {
    setStatus("Menyimpan ke Supabase...");
    try {
      const res = await fetch("/api/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jam, menit, nama_obat: namaObat }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`Sukses diperbarui! Jam ${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')} WIB - Obat: ${namaObat}`);
      } else {
        setStatus("Gagal menyimpan.");
      }
    } catch (error) {
      setStatus("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <main style={{ fontFamily: "Arial, sans-serif", textAlign: "center", background: "#f0f2f5", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ background: "white", padding: "30px", borderRadius: "12px", maxWidth: "450px", margin: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <h2 style={{ color: "#333", marginBottom: "5px" }}>⏰ Smart Pills × Supabase</h2>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>Data tersimpan aman dan permanen di Database Cloud</p>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ marginRight: "15px", fontSize: "16px" }}>
            Jam: <input type="number" min="0" max="23" value={jam} onChange={(e) => setJam(Number(e.target.value))} style={{ width: "60px", padding: "8px", fontSize: "16px", textAlign: "center", borderRadius: "6px", border: "1px solid #ccc" }} />
          </label>
          <label style={{ fontSize: "16px" }}>
            Menit: <input type="number" min="0" max="59" value={menit} onChange={(e) => setMenit(Number(e.target.value))} style={{ width: "60px", padding: "8px", fontSize: "16px", textAlign: "center", borderRadius: "6px", border: "1px solid #ccc" }} />
          </label>
        </div>

        <div style={{ marginBottom: "20px", textAlign: "left" }}>
          <label style={{ fontSize: "14px", fontWeight: "bold", color: "#444", display: "block", marginBottom: "5px" }}>Daftar / Nama Obat:</label>
          <input type="text" value={namaObat} onChange={(e) => setNamaObat(e.target.value)} placeholder="Contoh: Paracetamol, Amoxicillin" style={{ width: "100%", padding: "10px", boxSizing: "border-box", fontSize: "15px", borderRadius: "6px", border: "1px solid #ccc" }} />
        </div>

        <button onClick={simpanJadwal} style={{ background: "#0070f3", color: "white", border: "none", padding: "12px 20px", fontSize: "16px", borderRadius: "6px", cursor: "pointer", width: "100%", fontWeight: "bold" }}>
          Perbarui Database
        </button>

        <p style={{ marginTop: "20px", fontSize: "14px", color: "#0070f3", fontStyle: "italic", fontWeight: "5px" }}>{status}</p>
      </div>
    </main>
  );
}