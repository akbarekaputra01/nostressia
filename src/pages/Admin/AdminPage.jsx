import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Sparkles, Lightbulb, LogOut, 
  Plus, Trash2, X, UserCircle, Tag, FolderPlus, User 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// 1. Terima props skipAuth (default false)
export default function AdminPage({ skipAuth = false }) {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  // --- STATE USER ---
  const [currentUser, setCurrentUser] = useState({
      id: 0,
      name: "",
      role: ""
  });

  // 2. USE EFFECT UNTUK CEK LOGIN / BYPASS
  useEffect(() => {
    // A. Cek apakah Mode Developer (Bypass) aktif?
    if (skipAuth) {
      setCurrentUser({
        id: 999,
        name: "Developer Mode",
        role: "admin"
      });
      return; // Stop di sini, jangan cek localStorage
    }

    // B. Logika Login Normal
    const storedUser = localStorage.getItem("adminData");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // Jika tidak ada data user, tendang ke login
      navigate("/admin/login");
    }
  }, [navigate, skipAuth]);

  // --- FUNGSI LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    localStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  // ==========================================
  // DATA & LOGIC
  // ==========================================

  // 1. MOTIVATION
  const [quotes, setQuotes] = useState([]);
  
  // Fetch data motivasi dari API
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/motivations")
      .then(res => {
        if (!res.ok) throw new Error("Gagal fetch");
        return res.json();
      })
      .then(data => {
        const formatted = data.map(item => ({
          id: item.motivationID,
          text: item.quote,
          author: item.authorName || "Unknown",
          uploaderName: "Admin", // Bisa disesuaikan jika API mengirim data uploader
          uploaderId: "ADM" + String(item.uploaderID || 0).padStart(3, "0"),
        }));
        setQuotes(formatted);
      })
      .catch(err => console.log("Mode offline atau API error:", err));
  }, []);

  const [quoteForm, setQuoteForm] = useState({ text: "", author: "" });

  const handleAddQuote = async (e) => {
    e.preventDefault();

    const payload = {
      quote: quoteForm.text,
      authorName: quoteForm.author,
      uploaderID: currentUser.id
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/motivations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if(res.ok) {
        const data = await res.json();
        setQuotes([{ 
          id: data.motivationID,
          text: data.quote,
          author: data.authorName, 
          uploaderName: currentUser.name,
          uploaderId: "ADM" + String(currentUser.id).padStart(3, "0")
        }, ...quotes]);
        setQuoteForm({ text: "", author: "" });
      }
    } catch (err) {
      alert("Gagal menyimpan ke server (API Error)");
    }
  };

  const handleDeleteQuote = async (id) => {
    if (!confirm("Hapus quote ini?")) return;

    try {
      await fetch(`http://127.0.0.1:8000/api/motivations/${id}`, {
        method: "DELETE",
      });
      setQuotes(quotes.filter(q => q.id !== id));
    } catch (err) {
      console.error("Gagal hapus:", err);
    }
  };


  // 2. TIPS
  const [tipCategories, setTipCategories] = useState([
    {
      id: 'reading', name: 'Reading & Learning', icon: '📚', uploaderName: 'System Admin', uploaderId: 'SYS001',
      tips: [{ id: 101, text: 'Read for 20-30 minutes before bed', uploaderName: 'System Admin', uploaderId: 'SYS001' }]
    },
    {
      id: 'sleep', name: 'Quality Sleep', icon: '💤', uploaderName: 'System Admin', uploaderId: 'SYS001',
      tips: [{ id: 201, text: 'Avoid screens 1 hour before bedtime', uploaderName: 'System Admin', uploaderId: 'SYS001' }]
    }
  ]);
  const [newCatForm, setNewCatForm] = useState({ name: "", icon: "" });
  const [newTipInputs, setNewTipInputs] = useState({});

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatForm.name || !newCatForm.icon) return alert("Isi Nama dan Ikon!");
    const newCat = { id: Date.now().toString(), name: newCatForm.name, icon: newCatForm.icon, uploaderName: currentUser.name, uploaderId: currentUser.id, tips: [] };
    setTipCategories([newCat, ...tipCategories]);
    setNewCatForm({ name: "", icon: "" });
  };
  const handleDeleteCategory = (catId) => { if(confirm("Hapus kategori?")) setTipCategories(tipCategories.filter(c => c.id !== catId)); };

  const handleAddTipToCategory = (catId) => {
    const tipText = newTipInputs[catId];
    if (!tipText) return;
    const updatedCategories = tipCategories.map(cat => {
      if (cat.id === catId) {
        return { ...cat, tips: [...cat.tips, { id: Date.now(), text: tipText, uploaderName: currentUser.name, uploaderId: currentUser.id }] };
      } 
      return cat;
    });
    setTipCategories(updatedCategories);
    setNewTipInputs({ ...newTipInputs, [catId]: "" });
  };
  const handleDeleteTipFromCategory = (catId, tipId) => {
    if(!confirm("Hapus tips?")) return;
    setTipCategories(tipCategories.map(cat => cat.id === catId ? { ...cat, tips: cat.tips.filter(t => t.id !== tipId) } : cat));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg"><LayoutDashboard size={20} /></div>
          <h1 className="text-xl font-bold text-gray-800">Admin Panel <span className="text-blue-600">Nostressia</span></h1>
        </div>
        <div className="flex items-center gap-6">
            {/* Tampilkan User Profile */}
            <div className="hidden md:flex items-center gap-3 text-sm font-medium bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                <UserCircle size={20} className="text-blue-500"/>
                <div className="flex flex-col leading-tight">
                    <span className="text-gray-700 font-bold">{currentUser.name}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {/* Tampilkan ID, handle jika ID developer (999) */}
                      {currentUser.id === 999 ? "DEV-MODE" : `adm${String(currentUser.id).padStart(3, "0")}`}
                    </span>
                </div>
            </div>
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer">
                <LogOut size={18} /> Logout
            </button>
        </div>
      </nav>

      {/* DASHBOARD CONTENT */}
      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500">Kelola konten Motivasi dan Tips Kesehatan.</p>
          {/* Info tambahan jika mode bypass */}
          {skipAuth && (
            <p className="mt-2 text-xs font-bold text-orange-600 bg-orange-100 inline-block px-2 py-1 rounded">
              * Anda sedang dalam Mode Developer (Login Bypassed)
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Motivasi */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={80} className="text-orange-500" /></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Sparkles size={24} /></div>
              <span className="text-3xl font-bold text-gray-800">{quotes.length} <span className="text-sm font-normal text-gray-500">Motivasi</span></span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 relative z-10">Daily Motivation</h3>
            <p className="text-sm text-gray-500 mb-6 relative z-10">Kelola quote & author.</p>
            <button onClick={() => setActiveModal('motivation')} className="relative z-10 w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 cursor-pointer">Kelola Motivasi</button>
          </div>

          {/* Card Tips */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Lightbulb size={80} className="text-blue-500" /></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Lightbulb size={24} /></div>
              <span className="text-3xl font-bold text-gray-800">{tipCategories.length} <span className="text-sm font-normal text-gray-500">Kategori</span></span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 relative z-10">Health Tips</h3>
            <p className="text-sm text-gray-500 mb-6 relative z-10">Kelola kategori tips & isi tips.</p>
            <button onClick={() => setActiveModal('tips')} className="relative z-10 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 cursor-pointer">Kelola Tips</button>
          </div>
        </div>
      </main>

      {/* MODAL MOTIVATION */}
      {activeModal === 'motivation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Sparkles className="text-orange-600" /> Manage Motivation</h3>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 bg-gray-50">
              <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm sticky top-0">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm text-orange-800 uppercase tracking-wide flex items-center gap-2"><Plus size={16}/> Tambah Quote</h4>
                    <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">ADM{String(currentUser.id).padStart(3, "0")}</span>
                  </div>
                  <form onSubmit={handleAddQuote} className="space-y-3">
                    <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">QUOTE TEXT</label><textarea placeholder="Tulis quote motivasi..." className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none" rows="3" value={quoteForm.text} onChange={e => setQuoteForm({...quoteForm, text: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">AUTHOR</label><input type="text" placeholder="Nama penulis" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none" value={quoteForm.author} onChange={e => setQuoteForm({...quoteForm, author: e.target.value})} /></div>
                    <button type="submit" className="w-full bg-orange-600 text-white font-bold rounded-lg py-3 hover:bg-orange-700 transition-colors shadow-md mt-2">Tambah Quote</button>
                  </form>
                </div>
              </div>
              <div className="w-full md:w-2/3 space-y-4">
                {quotes.map((quote) => (
                  <div key={quote.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-gray-800 text-base leading-relaxed mb-3 italic">"{quote.text}"</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-700">— {quote.author}</p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><User size={10} />({quote.uploaderId})</p>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteQuote(quote.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-all border border-red-100"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                {quotes.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Belum ada quote motivasi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TIPS */}
      {activeModal === 'tips' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Lightbulb className="text-blue-600" /> Manage Tips</h3>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 bg-gray-50">
              <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm sticky top-0">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-sm text-blue-800 uppercase tracking-wide flex items-center gap-2"><FolderPlus size={16}/> Buat Kategori</h4>
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">ADM{String(currentUser.id).padStart(3, "0")}</span>
                    </div>
                    <form onSubmit={handleAddCategory} className="space-y-3">
                        <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">NAMA KATEGORI</label><input type="text" placeholder="Contoh: Healthy Food" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" value={newCatForm.name} onChange={e => setNewCatForm({...newCatForm, name: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">IKON</label><input type="text" placeholder="🍎" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" value={newCatForm.icon} onChange={e => setNewCatForm({...newCatForm, icon: e.target.value})} /></div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold rounded-lg py-3 hover:bg-blue-700 transition-colors shadow-md mt-2">Buat Kategori</button>
                    </form>
                </div>
              </div>
              <div className="w-full md:w-2/3 space-y-6">
                 {tipCategories.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-blue-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3"><span className="text-2xl bg-white p-2 rounded-lg shadow-sm border border-gray-100">{cat.icon}</span><div><h4 className="font-bold text-gray-800 text-lg">{cat.name}</h4><p className="text-[10px] text-gray-500 mt-0.5"><span className="font-semibold">{cat.tips.length} Tips</span> • {cat.uploaderName}</p></div></div>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 bg-white hover:bg-red-50 p-2 rounded-lg transition-all border border-gray-100 shadow-sm"><Trash2 size={18} /></button>
                        </div>
                        <div className="p-4 bg-white">
                            <ul className="space-y-2 mb-4">
                                {cat.tips.map((tip, idx) => (
                                    <li key={tip.id} className="flex justify-between items-start gap-3 p-3 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 group">
                                        <div className="flex items-start gap-2 w-full"><span className="min-w-[20px] h-[20px] rounded-full bg-blue-200 text-blue-700 text-xs flex items-center justify-center mt-0.5 font-bold">{idx + 1}</span><div className="w-full"><p className="text-sm text-gray-700 leading-relaxed">{tip.text}</p><p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><User size={10} /> {tip.uploaderName} ({tip.uploaderId})</p></div></div>
                                        <button onClick={() => handleDeleteTipFromCategory(cat.id, tip.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2 mt-2">
                                <input type="text" placeholder="Tulis tips baru..." className="flex-1 p-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" value={newTipInputs[cat.id] || ""} onChange={(e) => setNewTipInputs({ ...newTipInputs, [cat.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleAddTipToCategory(cat.id)} />
                                <button onClick={() => handleAddTipToCategory(cat.id)} className="bg-gray-800 text-white px-4 rounded-lg text-sm font-bold hover:bg-black transition-colors">Add</button>
                            </div>
                        </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }`}</style>
    </div>
  );
}