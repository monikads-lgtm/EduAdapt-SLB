/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  FileText, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---

interface FormData {
  namaSatuanPendidikan: string;
  namaGuru: string;
  nipGuru: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  kelasFase: string;
  hambatan: string;
  mapel: string;
  cp: string;
  tujuan: string;
  materi: string;
  jumlahPertemuan: string;
  durasi: string;
  praktikPedagogis: string;
  praktikPedagogisLainnya: string;
  kemampuanAwal: string;
  dimensiLulusan: string[];
}

interface GeneratedRPM {
  identifikasi: {
    siswa: string;
    materi: string;
    dimensi: string;
  };
  desain: {
    lintasDisiplin: string;
    topik: string;
    kemitraan: string;
    lingkungan: string;
    digital: string;
  };
  pengalaman: {
    memahami: { langkah: string; durasi: string; adaptasi: string }[];
    mengaplikasi: { langkah: string; durasi: string; adaptasi: string }[];
    refleksi: { langkah: string; durasi: string; adaptasi: string }[];
  };
  asesmen: {
    awal: string;
    proses: string;
    akhir: string;
  };
}

// --- Constants ---

const KELAS_FASE_OPTIONS = [
  "Fase A (Kelas 1-2)",
  "Fase B (Kelas 3-4)",
  "Fase C (Kelas 5-6)",
  "Fase D (Kelas 7-9)",
  "Fase E (Kelas 10)",
  "Fase F (Kelas 11-12)"
];

const HAMBATAN_OPTIONS = [
  "Tunanetra",
  "Tunarungu",
  "Tunagrahita",
  "Tunadaksa",
  "Autis",
  "ADHD",
  "Hambatan Majemuk",
  "Lain-lain"
];

const PEDAGOGIS_OPTIONS = [
  "Direct Instruction (Instruksi Langsung)",
  "Project Based Learning (PjBL)",
  "Inquiry Learning",
  "Discovery Learning",
  "Problem Based Learning (PBL)",
  "Scaffolding",
  "Peer Tutoring (Tutor Sebaya)",
  "Lainnya"
];

const DIMENSI_OPTIONS = [
  "Keimanan & Ketakwaan",
  "Kewargaan",
  "Penalaran Kritis",
  "Kreativitas",
  "Kolaborasi",
  "Kemandirian",
  "Kesehatan",
  "Komunikasi"
];

// --- App Component ---

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    namaSatuanPendidikan: '',
    namaGuru: '',
    nipGuru: '',
    namaKepalaSekolah: '',
    nipKepalaSekolah: '',
    kelasFase: '',
    hambatan: '',
    mapel: '',
    cp: '',
    tujuan: '',
    materi: '',
    jumlahPertemuan: '',
    durasi: '',
    praktikPedagogis: '',
    praktikPedagogisLainnya: '',
    kemampuanAwal: '',
    dimensiLulusan: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedRPM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (dimensi: string) => {
    setFormData(prev => {
      const current = prev.dimensiLulusan;
      if (current.includes(dimensi)) {
        return { ...prev, dimensiLulusan: current.filter(d => d !== dimensi) };
      } else {
        return { ...prev, dimensiLulusan: [...current, dimensi] };
      }
    });
  };

  const generateRPM = async () => {
    // Basic Validation
    const requiredFields: (keyof FormData)[] = [
      'namaSatuanPendidikan', 'namaGuru', 'nipGuru', 'namaKepalaSekolah', 
      'nipKepalaSekolah', 'kelasFase', 'hambatan', 'mapel', 'cp', 'tujuan', 'materi'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Mohon lengkapi field: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    if (formData.dimensiLulusan.length === 0) {
      setError("Mohon pilih minimal satu Dimensi Lulusan");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.includes('YOUR_')) {
        setError("API Key Gemini belum dikonfigurasi dengan benar di Vercel. Pastikan Anda telah menambahkan GEMINI_API_KEY di Environment Variables Vercel dan melakukan redeploy.");
        setIsGenerating(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview"; // Menggunakan flash untuk latensi lebih rendah dan ketersediaan lebih luas
      
      const prompt = `
        Anda adalah Spesialis Pendidikan Khusus (SLB) dan Pengembang Kurikulum Adaptif.
        Bantu saya membuat Rencana Pembelajaran Mendalam (RPM) untuk siswa SLB dengan data berikut:
        
        - Satuan Pendidikan: ${formData.namaSatuanPendidikan}
        - Guru: ${formData.namaGuru}
        - Hambatan: ${formData.hambatan}
        - Mata Pelajaran: ${formData.mapel}
        - Capaian Pembelajaran (CP): ${formData.cp}
        - Tujuan Pembelajaran: ${formData.tujuan}
        - Materi: ${formData.materi}
        - Kemampuan Awal Siswa: ${formData.kemampuanAwal}
        - Praktik Pedagogis: ${formData.praktikPedagogis === 'Lainnya' ? formData.praktikPedagogisLainnya : formData.praktikPedagogis}
        - Dimensi Lulusan: ${formData.dimensiLulusan.join(', ')}
        
        Hasilkan output dalam format JSON yang valid sesuai struktur berikut:
        {
          "identifikasi": {
            "siswa": "Deskripsi profil siswa secara empatik berdasarkan hambatan dan kemampuan awal",
            "materi": "Deskripsi materi yang disesuaikan",
            "dimensi": "Penjelasan bagaimana dimensi lulusan diintegrasikan"
          },
          "desain": {
            "lintasDisiplin": "Kaitan dengan disiplin ilmu lain",
            "topik": "Topik spesifik yang menarik",
            "kemitraan": "Saran kemitraan (orang tua, terapis, dll)",
            "lingkungan": "Pengaturan lingkungan belajar yang aksesibel",
            "digital": "Alat bantu digital atau referensi tools online (seperti Canva, Quizizz, atau alat bantu aksesibilitas)"
          },
          "pengalaman": {
            "memahami": [{"langkah": "...", "durasi": "...", "adaptasi": "..."}],
            "mengaplikasi": [{"langkah": "...", "durasi": "...", "adaptasi": "..."}],
            "refleksi": [{"langkah": "...", "durasi": "...", "adaptasi": "..."}]
          },
          "asesmen": {
            "awal": "Bentuk asesmen diagnostik",
            "proses": "Bentuk observasi/rubrik selama proses",
            "akhir": "Bentuk produk/tugas akhir"
          }
        }
        
        Gunakan bahasa Indonesia yang baik, benar, empatik, dan instruksi yang sederhana. Fokus pada kemandirian dan life skills.
        Pastikan bagian "pengalaman" memiliki langkah-langkah yang rinci dan logis sesuai durasi pertemuan (${formData.durasi}).
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
      
      // Scroll to result after a short delay
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Terjadi kesalahan tidak dikenal.";
      setError(`Gagal menghasilkan RPM: ${errorMessage}. Pastikan API Key Anda benar dan kuota masih tersedia.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboardAndOpenDocs = async () => {
    if (!docRef.current) return;

    try {
      // Basic styles to preserve table borders and alignment in Google Docs
      const style = `
        <style>
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; font-family: sans-serif; }
          th, td { border: 1px solid #1a1a1a; padding: 10px; text-align: left; vertical-align: top; }
          th { background-color: #f5f5f0; font-weight: bold; }
          .font-bold { font-weight: bold; }
          .font-serif { font-family: serif; }
          .text-center { text-align: center; }
          .text-justify { text-align: justify; }
          .uppercase { text-transform: uppercase; }
          .underline { text-decoration: underline; }
          h1 { font-size: 24pt; text-align: center; margin-bottom: 10px; font-family: serif; font-weight: bold; }
          .text-3xl { font-size: 24pt; }
          .text-2xl { font-size: 18pt; }
          .text-xl { font-size: 14pt; }
          .italic { font-style: italic; }
          .border-b-2 { border-bottom: 2px solid #1a1a1a; }
          .pb-6 { padding-bottom: 24px; }
          .mb-20 { margin-bottom: 80px; }
        </style>
      `;
      
      const htmlContent = style + docRef.current.innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const text = new Blob([docRef.current.innerText], { type: 'text/plain' });
      
      // Use ClipboardItem to copy both HTML and plain text
      const data = [new ClipboardItem({ 
        'text/html': blob,
        'text/plain': text
      })];
      
      await navigator.clipboard.write(data);
      window.open('https://docs.google.com/document/create', '_blank');
    } catch (err) {
      console.error('Failed to copy rich text: ', err);
      // Fallback to plain text if rich text copy fails
      try {
        await navigator.clipboard.writeText(docRef.current.innerText);
        window.open('https://docs.google.com/document/create', '_blank');
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#1a1a1a] font-sans selection:bg-olive-200">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e5df] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#5A5A40] p-2 rounded-xl">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[#5A5A40]">EduAdapt SLB</h1>
          </div>
          <p className="text-sm text-[#8a8a7a] italic hidden sm:block">Spesialis Pendidikan Khusus & Kurikulum Adaptif</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Input Section */}
        <section className="bg-white rounded-[32px] shadow-sm border border-[#e5e5df] overflow-hidden mb-12">
          <div className="p-8 border-b border-[#f5f5f0] bg-[#fafaf7]">
            <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5A5A40]" />
              Formulir Perencanaan Pembelajaran
            </h2>
            <p className="text-sm text-[#8a8a7a] mt-1">Lengkapi data di bawah ini untuk menghasilkan rencana pembelajaran yang dipersonalisasi.</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Identitas Satuan & Guru */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a8a7a]">Identitas Satuan</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nama Satuan Pendidikan *</label>
                    <input 
                      type="text" name="namaSatuanPendidikan" value={formData.namaSatuanPendidikan} onChange={handleInputChange}
                      placeholder="Contoh: SLB Negeri 1 Jakarta"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Nama Kepala Sekolah *</label>
                      <input 
                        type="text" name="namaKepalaSekolah" value={formData.namaKepalaSekolah} onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">NIP Kepala Sekolah *</label>
                      <input 
                        type="text" name="nipKepalaSekolah" value={formData.nipKepalaSekolah} onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a8a7a]">Identitas Guru</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nama Guru *</label>
                    <input 
                      type="text" name="namaGuru" value={formData.namaGuru} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">NIP Guru *</label>
                    <input 
                      type="text" name="nipGuru" value={formData.nipGuru} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#f5f5f0]" />

            {/* Detail Pembelajaran */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a8a7a]">Detail Pembelajaran & Siswa</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Kelas dan Fase *</label>
                  <select 
                    name="kelasFase" value={formData.kelasFase} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none bg-white"
                  >
                    <option value="">Pilih Fase</option>
                    {KELAS_FASE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Jenis Hambatan *</label>
                  <select 
                    name="hambatan" value={formData.hambatan} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none bg-white"
                  >
                    <option value="">Pilih Hambatan</option>
                    {HAMBATAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Mata Pelajaran *</label>
                  <input 
                    type="text" name="mapel" value={formData.mapel} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Capaian Pembelajaran (CP) *</label>
                  <textarea 
                    name="cp" value={formData.cp} onChange={handleInputChange} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tujuan Pembelajaran *</label>
                  <textarea 
                    name="tujuan" value={formData.tujuan} onChange={handleInputChange} rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Materi Pelajaran *</label>
                  <input 
                    type="text" name="materi" value={formData.materi} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Jml Pertemuan</label>
                    <input 
                      type="number" name="jumlahPertemuan" value={formData.jumlahPertemuan} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Durasi (Contoh: 2x35m)</label>
                    <input 
                      type="text" name="durasi" value={formData.durasi} onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Praktik Pedagogis *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    name="praktikPedagogis" value={formData.praktikPedagogis} onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none bg-white"
                  >
                    <option value="">Pilih Praktik</option>
                    {PEDAGOGIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {formData.praktikPedagogis === 'Lainnya' && (
                    <input 
                      type="text" name="praktikPedagogisLainnya" value={formData.praktikPedagogisLainnya} onChange={handleInputChange}
                      placeholder="Sebutkan praktik lainnya..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Kemampuan Awal Siswa</label>
                <textarea 
                  name="kemampuanAwal" value={formData.kemampuanAwal} onChange={handleInputChange} rows={3}
                  placeholder="Deskripsikan apa yang sudah dikuasai siswa saat ini..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5df] focus:ring-2 focus:ring-[#5A5A40] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Dimensi Lulusan (Pilih yang sesuai) *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DIMENSI_OPTIONS.map(dimensi => (
                    <button
                      key={dimensi}
                      onClick={() => handleCheckboxChange(dimensi)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                        formData.dimensiLulusan.includes(dimensi)
                          ? 'bg-[#5A5A40] text-white border-[#5A5A40]'
                          : 'bg-white text-[#8a8a7a] border-[#e5e5df] hover:border-[#5A5A40]'
                      }`}
                    >
                      {dimensi}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={generateRPM}
                disabled={isGenerating}
                className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#4a4a35] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5A5A40]/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sedang Merancang RPM...
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-5 h-5" />
                    Hasilkan Rencana Pembelajaran Mendalam
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Result Section */}
        <AnimatePresence>
          {result && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
              ref={resultRef}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-[#5A5A40]">Hasil Rancangan RPM</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={copyToClipboardAndOpenDocs}
                    className="px-4 py-2 bg-[#5A5A40] text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-[#4a4a35] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buka di Google Dokumen
                  </button>
                </div>
              </div>

              {/* The Document Output */}
              <div 
                ref={docRef}
                className="bg-white p-12 rounded-[32px] shadow-xl border border-[#e5e5df] space-y-10 print:shadow-none print:border-none print:p-0"
              >
                <div className="text-center space-y-2 border-b-2 border-[#1a1a1a] pb-6">
                  <h1 className="text-3xl font-serif font-bold uppercase tracking-tight">Rencana Pembelajaran Mendalam</h1>
                  <p className="text-xl font-medium uppercase">{formData.mapel}</p>
                </div>

                {/* 1. Identitas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#5A5A40] pl-3">1. Identitas</h3>
                  <table className="w-full border-collapse border border-[#1a1a1a]">
                    <tbody>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold w-1/3">Nama Satuan Pendidikan</td>
                        <td className="border border-[#1a1a1a] p-3">{formData.namaSatuanPendidikan}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Mata Pelajaran</td>
                        <td className="border border-[#1a1a1a] p-3">{formData.mapel}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Kelas/Semester</td>
                        <td className="border border-[#1a1a1a] p-3">{formData.kelasFase}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Durasi Pertemuan</td>
                        <td className="border border-[#1a1a1a] p-3">{formData.durasi} ({formData.jumlahPertemuan} Pertemuan)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Identifikasi */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#5A5A40] pl-3">2. Identifikasi</h3>
                  <table className="w-full border-collapse border border-[#1a1a1a]">
                    <tbody>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold w-1/3">Siswa</td>
                        <td className="border border-[#1a1a1a] p-3 text-justify leading-relaxed">{result.identifikasi.siswa}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Materi Pelajaran</td>
                        <td className="border border-[#1a1a1a] p-3 text-justify leading-relaxed">{result.identifikasi.materi}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Capaian Dimensi Lulusan</td>
                        <td className="border border-[#1a1a1a] p-3 text-justify leading-relaxed">{result.identifikasi.dimensi}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. Desain Pembelajaran */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#5A5A40] pl-3">3. Desain Pembelajaran</h3>
                  <table className="w-full border-collapse border border-[#1a1a1a]">
                    <tbody>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold w-1/3">Capaian Pembelajaran</td>
                        <td className="border border-[#1a1a1a] p-3 text-justify">{formData.cp}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Lintas Disiplin Ilmu</td>
                        <td className="border border-[#1a1a1a] p-3">{result.desain.lintasDisiplin}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Tujuan Pembelajaran</td>
                        <td className="border border-[#1a1a1a] p-3">{formData.tujuan}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Topik Pembelajaran</td>
                        <td className="border border-[#1a1a1a] p-3">{result.desain.topik}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Praktik Pedagogis</td>
                        <td className="border border-[#1a1a1a] p-3">{formData.praktikPedagogis === 'Lainnya' ? formData.praktikPedagogisLainnya : formData.praktikPedagogis}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Kemitraan Pembelajaran</td>
                        <td className="border border-[#1a1a1a] p-3">{result.desain.kemitraan}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Lingkungan Pembelajaran</td>
                        <td className="border border-[#1a1a1a] p-3">{result.desain.lingkungan}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Pemanfaatan Digital</td>
                        <td className="border border-[#1a1a1a] p-3">{result.desain.digital}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Pengalaman Belajar */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#5A5A40] pl-3">4. Pengalaman Belajar</h3>
                  <table className="w-full border-collapse border border-[#1a1a1a]">
                    <thead>
                      <tr className="bg-[#f5f5f0]">
                        <th className="border border-[#1a1a1a] p-3 text-left w-1/2">Langkah Kegiatan</th>
                        <th className="border border-[#1a1a1a] p-3 text-center w-1/6">Durasi</th>
                        <th className="border border-[#1a1a1a] p-3 text-left w-1/3">Adaptasi/Media Khusus</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#fafaf7]">
                        <td colSpan={3} className="border border-[#1a1a1a] p-2 font-bold italic">Kegiatan Awal (Memahami)</td>
                      </tr>
                      {result.pengalaman.memahami.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-[#1a1a1a] p-3 text-justify">{idx + 1}. {item.langkah}</td>
                          <td className="border border-[#1a1a1a] p-3 text-center">{item.durasi}</td>
                          <td className="border border-[#1a1a1a] p-3">{item.adaptasi}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#fafaf7]">
                        <td colSpan={3} className="border border-[#1a1a1a] p-2 font-bold italic">Kegiatan Inti (Mengaplikasi)</td>
                      </tr>
                      {result.pengalaman.mengaplikasi.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-[#1a1a1a] p-3 text-justify">{idx + 1}. {item.langkah}</td>
                          <td className="border border-[#1a1a1a] p-3 text-center">{item.durasi}</td>
                          <td className="border border-[#1a1a1a] p-3">{item.adaptasi}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#fafaf7]">
                        <td colSpan={3} className="border border-[#1a1a1a] p-2 font-bold italic">Kegiatan Penutup (Refleksi)</td>
                      </tr>
                      {result.pengalaman.refleksi.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-[#1a1a1a] p-3 text-justify">{idx + 1}. {item.langkah}</td>
                          <td className="border border-[#1a1a1a] p-3 text-center">{item.durasi}</td>
                          <td className="border border-[#1a1a1a] p-3">{item.adaptasi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 5. Asesmen Pembelajaran */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold border-l-4 border-[#5A5A40] pl-3">5. Asesmen Pembelajaran</h3>
                  <table className="w-full border-collapse border border-[#1a1a1a]">
                    <tbody>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold w-1/3">Asesmen Awal (Diagnostik)</td>
                        <td className="border border-[#1a1a1a] p-3 text-justify">{result.asesmen.awal}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Asesmen Proses</td>
                        <td className="border border-[#1a1a1a] p-3 text-justify">{result.asesmen.proses}</td>
                      </tr>
                      <tr>
                        <td className="border border-[#1a1a1a] p-3 font-semibold">Asesmen Akhir</td>
                        <td className="border border-[#1a1a1a] p-3 text-justify">{result.asesmen.akhir}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Signatures */}
                <div className="pt-16 flex justify-between items-start px-4">
                  <div className="text-center">
                    <p className="mb-20">Mengetahui,<br />Kepala Sekolah</p>
                    <p className="font-bold underline uppercase">{formData.namaKepalaSekolah}</p>
                    <p>NIP. {formData.nipKepalaSekolah}</p>
                  </div>
                  <div className="text-center">
                    <p className="mb-20">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />Guru Mata Pelajaran</p>
                    <p className="font-bold underline uppercase">{formData.namaGuru}</p>
                    <p>NIP. {formData.nipGuru}</p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e5e5df] py-8 mt-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-[#8a8a7a]">© 2026 EduAdapt SLB - Solusi Cerdas untuk Guru Hebat</p>
        </div>
      </footer>
    </div>
  );
}
