// /src/pages/AdminPage.jsx
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Sparkles, Lightbulb, LogOut, 
  Trash2, X, UserCircle, User, ArrowLeft 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../api/config";

export default function AdminPage({ skipAuth = false }) {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTipCategory, setSelectedTipCategory] = useState(null);
  const [currentUser, setCurrentUser] = useState({ id: 0, name: "", role: "" });

  useEffect(() => {
    if (skipAuth) {
      setCurrentUser({ id: 999, name: "Developer Mode", role: "admin" });
      return; 
    }
    const storedUser = localStorage.getItem("adminData");
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    else navigate("/admin/login");
  }, [navigate, skipAuth]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    localStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  // ==============================
  // MOTIVATION STATE & LOGIC
  // ==============================
  const [quotes, setQuotes] = useState([]);
  const [quoteForm, setQuoteForm] = useState({ text: "", author: "" });

  useEffect(() => {
    fetch(`${BASE_URL}/motivations`)
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch motivations"))
      .then(data => {
        const formatted = data.map(item => ({
          id: item.motivationID,
          text: item.quote,
          author: item.authorName || "Unknown",
          uploaderName: "Admin",
          uploaderId: "ADM" + String(item.uploaderID || 0).padStart(3, "0"),
        }));
        setQuotes(formatted);
      })
      .catch(err => console.log("Offline mode or API error:", err));
  }, []);

  const handleAddQuote = async (e) => {
    e.preventDefault();
    const payload = { quote: quoteForm.text, authorName: quoteForm.author, uploaderID: currentUser.id };

    try {
      const res = await fetch(`${BASE_URL}/motivations`, {
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
    } catch {
      alert("Failed to save to server (API Error)");
    }
  };

  const handleDeleteQuote = async (id) => {
    if (!confirm("Delete this quote?")) return;
    try {
      await fetch(`${BASE_URL}/motivations/${id}`, { method: "DELETE" });
      setQuotes(quotes.filter(q => q.id !== id));
    } catch (err) { console.error("Failed to delete:", err); }
  };

  // ==============================
  // TIPS STATE & LOGIC
  // ==============================
  const [tipCategories, setTipCategories] = useState([]);
  const [tipsByCategory, setTipsByCategory] = useState({});
  const [tipCountByCategory, setTipCountByCategory] = useState({});
  const [currentTipInput, setCurrentTipInput] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTips, setLoadingTips] = useState(false);

  const iconForCategoryId = (id) => {
    const map = {1:"📚",2:"🥗",3:"😴",4:"🧘",5:"🗣️",6:"🧠"};
    return map[id] || "💡";
  };

  const loadTipCounts = async (categories) => {
    const counts = {};
    for (const cat of categories) {
      try {
        const res = await fetch(`${BASE_URL}/tips/by-category/${cat.id}`);
        const data = await res.json();
        counts[cat.id] = data.length;
      } catch { counts[cat.id] = 0; }
    }
    setTipCountByCategory(counts);
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${BASE_URL}/tips/categories`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mapped = data.map(item => ({
          id: item.tipCategoryID,
          name: item.categoryName || item.name || `Category ${item.tipCategoryID}`,
          icon: item.icon || iconForCategoryId(item.tipCategoryID),
          uploaderName: item.uploaderName || "System",
        }));
        setTipCategories(mapped);
        loadTipCounts(mapped);
      } catch (err) {
        console.error("Failed loading categories:", err);
        setTipCategories([]);
      } finally { setLoadingCategories(false); }
    };
    loadCategories();
  }, []);

  const openCategory = async (catId) => {
    setSelectedTipCategory(catId);
    if (!tipsByCategory[catId]) {
      setLoadingTips(true);
      try {
        const res = await fetch(`${BASE_URL}/tips/by-category/${catId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mappedTips = (data || []).map(item => ({
          id: item.tipID || item.id,
          tip_text: item.detail || item.tip_text || item.tipText,
          tipCategoryID: item.tipCategoryID || item.tipCategoryId || item.category_id,
          uploader_id: item.uploaderID || item.uploader_id || item.uploaderId,
        }));
        setTipsByCategory(prev => ({ ...prev, [catId]: mappedTips }));
      } catch {
        setTipsByCategory(prev => ({ ...prev, [catId]: [] }));
      } finally { setLoadingTips(false); }
    }
  };

  const handleAddTipToCategory = async (catId) => {
    if (!currentTipInput.trim()) return;
    const payload = { detail: currentTipInput, tipCategoryID: catId, uploaderID: currentUser.id };
    try {
      const res = await fetch(`${BASE_URL}/tips/`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawNewTip = await res.json();
      const newTip = {
        id: rawNewTip.tipID || rawNewTip.id,
        tip_text: rawNewTip.detail || rawNewTip.tip_text || rawNewTip.tipText || currentTipInput,
        tipCategoryID: rawNewTip.tipCategoryID || rawNewTip.tipCategoryId || catId,
        uploader_id: rawNewTip.uploaderID || rawNewTip.uploader_id || currentUser.id,
        uploader_name: rawNewTip.uploaderName || rawNewTip.uploader_name || currentUser.name || "Admin"
      };
      setTipsByCategory(prev => ({ ...prev, [catId]: [...(prev[catId] || []), newTip] }));
      setCurrentTipInput("");
    } catch { alert("Failed to add tip. Please try again."); }
  };

  const handleDeleteTipFromCategory = async (catId, tipId) => {
    if (!confirm("Delete this tip?")) return;
    try {
      const res = await fetch(`${BASE_URL}/tips/${tipId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTipsByCategory(prev => ({ ...prev, [catId]: (prev[catId] || []).filter(t => (t.id || t.tipID) !== tipId) }));
    } catch { alert("Failed to delete tip. Please try again."); }
  };

  const closeModal = () => { setActiveModal(null); setSelectedTipCategory(null); setCurrentTipInput(""); };
  const activeCategoryData = tipCategories.find(c => c.id === selectedTipCategory);
  const currentCategoryTips = tipsByCategory[selectedTipCategory] || [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg"><LayoutDashboard size={20} /></div>
          <h1 className="text-xl font-bold text-gray-800">Admin Panel <span className="text-blue-600">Nostressia</span></h1>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 text-sm font-medium bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                <UserCircle size={20} className="text-blue-500"/>
                <div className="flex flex-col leading-tight">
                    <span className="text-gray-700 font-bold">{currentUser.name}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
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
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500">Manage Motivation and Health Tips content.</p>
          {skipAuth && (
            <p className="mt-2 text-xs font-bold text-orange-600 bg-orange-100 inline-block px-2 py-1 rounded">
              * You are in Developer Mode (Login Bypassed)
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Motivation Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={80} className="text-orange-500" /></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Sparkles size={24} /></div>
              <span className="text-3xl font-bold text-gray-800">{quotes.length} <span className="text-sm font-normal text-gray-500">Motivations</span></span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 relative z-10">Daily Motivation</h3>
            <p className="text-sm text-gray-500 mb-6 relative z-10">Manage quotes & authors.</p>
            <button onClick={() => setActiveModal('motivation')} className="relative z-10 w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 cursor-pointer">Manage Motivation</button>
          </div>

          {/* Tips Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Lightbulb size={80} className="text-blue-500" /></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Lightbulb size={24} /></div>
              <span className="text-3xl font-bold text-gray-800">{tipCategories.length} <span className="text-sm font-normal text-gray-500">Categories</span></span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 relative z-10">Health Tips</h3>
            <p className="text-sm text-gray-500 mb-6 relative z-10">Manage tip categories from database.</p>
            <button onClick={() => setActiveModal('tips')} className="relative z-10 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 cursor-pointer">Manage Tips</button>
          </div>
        </div>
      </main>

      {/* MOTIVATION MODAL */}
      {activeModal === 'motivation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

            {/* HEADER */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-orange-600" /> Manage Motivation
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* MAIN WRAPPER — THIS MUST SCROLL */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

              <div className="flex flex-row gap-6">

                {/* LEFT PANEL — STICKY & FIXED POSITION */}
                <div className="w-1/3 h-fit sticky top-0 self-start">
                  <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
                    <h4 className="font-bold text-sm text-orange-800 uppercase tracking-wide mb-3">
                      Add Quote
                    </h4>

                    <form onSubmit={handleAddQuote} className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">
                          QUOTE TEXT
                        </label>
                        <textarea
                          placeholder="Write motivational quote..."
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 resize-none"
                          rows="3"
                          value={quoteForm.text}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, text: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">
                          AUTHOR
                        </label>
                        <input
                          type="text"
                          placeholder="Author name"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400"
                          value={quoteForm.author}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, author: e.target.value })
                          }
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-orange-600 text-white font-bold rounded-lg py-3 hover:bg-orange-700 shadow-md mt-2"
                      >
                        Add Quote
                      </button>
                    </form>
                  </div>
                </div>

                {/* RIGHT PANEL — LIST */}
                <div className="w-2/3 space-y-4">
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-gray-800 text-base leading-relaxed mb-3 italic">
                            "{quote.text}"
                          </p>
                          <p className="text-sm font-bold text-gray-700">— {quote.author}</p>
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <User size={10} /> ({quote.uploaderId})
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg border border-red-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}



      {/* TIPS MODAL */}
      {activeModal === 'tips' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl">

            {/* HEADER */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                {selectedTipCategory && (
                  <button 
                    onClick={() => { setSelectedTipCategory(null); setCurrentTipInput(""); }} 
                    className="mr-2 p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft size={20} className="text-gray-600" />
                  </button>
                )}

                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Lightbulb className="text-blue-600" />
                  {selectedTipCategory ? activeCategoryData?.name : "Manage Tips (Select Category)"}
                </h3>
              </div>

              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* MAIN SCROLL AREA */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

              {/* VIEW 1: CATEGORY LIST */}
              {!selectedTipCategory && (
                <div>
                  {loadingCategories ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading categories...</p>
                      </div>
                    </div>

                  ) : tipCategories.length === 0 ? (
                    <div className="flex items-center justify-center py-20 text-center text-gray-400">
                      <span className="text-5xl mb-3 block">📂</span>
                      <p className="text-lg">No categories available</p>
                      <p className="text-lg">, Add categories via API or database.</p>
                    </div>

                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                      {tipCategories.map((cat) => (
                        <div 
                          key={cat.id}
                          onClick={() => openCategory(cat.id)}
                          className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center gap-4 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                            {cat.icon}
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                              {cat.name}
                            </h4>

                            <p className="text-sm text-gray-500 font-medium mt-1">
                              {tipCountByCategory[cat.id] ?? 0} Tips
                            </p>
                          </div>

                          <button className="mt-2 text-blue-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Manage Tips →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: TIPS INSIDE CATEGORY */}
              {selectedTipCategory && activeCategoryData && (
                <div className="animate-fade-in max-w-3xl mx-auto">

                  {/* TIPS LIST — REMOVE INTERNAL SCROLL */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 min-h-[300px] flex flex-col">
                    <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-4">Current Tips List</h4>

                    {loadingTips ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                        <p className="text-sm">Loading tips...</p>
                      </div>

                    ) : currentCategoryTips.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                        <span className="text-4xl mb-2">📭</span>
                        <p className="text-sm">No tips available yet.</p>
                      </div>

                    ) : (
                      <ul className="space-y-3 flex-1 pr-2">
                        {currentCategoryTips.map((tip, idx) => (
                          <li 
                            key={tip.id}
                            className="flex justify-between items-start gap-4 p-4 bg-gray-50 rounded-xl border hover:border-blue-100 transition-all"
                          >
                            <div className="flex items-start gap-3 w-full">
                              <span className="min-w-[24px] h-[24px] rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>

                              <div className="flex-1">
                                <p className="text-base text-gray-800 font-medium">
                                  {tip.tip_text || tip.tipText}
                                </p>

                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <User size={10} />
                                  Added by ({tip.uploader_id ? `ADM${String(tip.uploader_id).padStart(3, "0")}` : "Admin"})
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteTipFromCategory(selectedTipCategory, tip.id)}
                              className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* ADD TIP INPUT */}
                  <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-4 flex gap-3 sticky bottom-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <Sparkles size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder={`Write new tip for ${activeCategoryData.name}...`}
                      className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-base"
                      value={currentTipInput}
                      onChange={(e) => setCurrentTipInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTipToCategory(selectedTipCategory)}
                    />
                    <button
                      onClick={() => handleAddTipToCategory(selectedTipCategory)}
                      disabled={!currentTipInput.trim()}
                      className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      
      <style>{`
        @keyframes fade-in { 
          from { opacity: 0; transform: scale(0.98); } 
          to { opacity: 1; transform: scale(1); } 
        } 
        .animate-fade-in { 
          animation: fade-in 0.2s ease-out forwards; 
        } 
        .custom-scrollbar::-webkit-scrollbar { 
          width: 4px; 
        } 
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: transparent; 
        } 
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #e5e7eb; 
          border-radius: 10px; 
        }
      `}</style>
    </div>
  );
}
