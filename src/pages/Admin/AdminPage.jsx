import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Sparkles, Lightbulb, LogOut, 
  Trash2, X, UserCircle, User, ArrowLeft 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminPage({ skipAuth = false }) {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  
  // --- STATE FOR TIPS NAVIGATION ---
  const [selectedTipCategory, setSelectedTipCategory] = useState(null);

  // --- USER STATE ---
  const [currentUser, setCurrentUser] = useState({
      id: 0,
      name: "",
      role: ""
  });

  // 2. CHECK LOGIN / BYPASS
  useEffect(() => {
    if (skipAuth) {
      setCurrentUser({
        id: 999,
        name: "Developer Mode",
        role: "admin"
      });
      return; 
    }

    const storedUser = localStorage.getItem("adminData");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      navigate("/admin/login");
    }
  }, [navigate, skipAuth]);

  // --- LOGOUT FUNCTION ---
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
  const [quoteForm, setQuoteForm] = useState({ text: "", author: "" });
  
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/motivations")
      .then(res => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
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
      alert("Failed to save to server (API Error)");
    }
  };

  const handleDeleteQuote = async (id) => {
    if (!confirm("Delete this quote?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/motivations/${id}`, {
        method: "DELETE",
      });
      setQuotes(quotes.filter(q => q.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };


  // 2. TIPS (FIXED 6 CATEGORIES MATCHING TIPS.JSX)
  const [tipCategories, setTipCategories] = useState([
    {
      id: 'reading', name: 'Reading & Learning', icon: '📚', uploaderName: 'System', 
      tips: [
        { id: 'read-1', text: 'Read for 20-30 minutes before bed to calm your mind', uploaderName: 'System Admin' },
        { id: 'read-2', text: 'Choose books that inspire and motivate you', uploaderName: 'System Admin' },
        { id: 'read-3', text: 'Join a book club to share insights with others', uploaderName: 'System Admin' },
        { id: 'read-4', text: 'Keep a reading journal to track your thoughts', uploaderName: 'System Admin' },
        { id: 'read-5', text: 'Try audiobooks during commutes or workouts', uploaderName: 'System Admin' },
        { id: 'read-6', text: 'Set realistic reading goals to avoid pressure', uploaderName: 'System Admin' },
        { id: 'read-7', text: 'Explore different genres to broaden perspectives', uploaderName: 'System Admin' }
      ]
    },
    {
      id: 'nutrition', name: 'Healthy Nutrition', icon: '🥗', uploaderName: 'System', 
      tips: [
        { id: 'nut-1', text: 'Drink at least 8 glasses of water daily', uploaderName: 'System Admin' },
        { id: 'nut-2', text: 'Include fruits and vegetables in every meal', uploaderName: 'System Admin' },
        { id: 'nut-3', text: 'Limit caffeine intake, especially in the afternoon', uploaderName: 'System Admin' },
        { id: 'nut-4', text: 'Eat regular meals to maintain energy levels', uploaderName: 'System Admin' },
        { id: 'nut-5', text: 'Choose whole grains over processed foods', uploaderName: 'System Admin' },
        { id: 'nut-6', text: 'Prepare healthy snacks in advance', uploaderName: 'System Admin' },
        { id: 'nut-7', text: 'Practice mindful eating without distractions', uploaderName: 'System Admin' }
      ]
    },
    {
      id: 'sleep', name: 'Quality Sleep', icon: '😴', uploaderName: 'System', 
      tips: [
        { id: 'sleep-1', text: 'Maintain a consistent sleep schedule', uploaderName: 'System Admin' },
        { id: 'sleep-2', text: 'Create a relaxing bedtime routine', uploaderName: 'System Admin' },
        { id: 'sleep-3', text: 'Keep your bedroom cool, dark, and quiet', uploaderName: 'System Admin' },
        { id: 'sleep-4', text: 'Avoid screens 1 hour before bedtime', uploaderName: 'System Admin' },
        { id: 'sleep-5', text: 'Limit naps to 20-30 minutes during the day', uploaderName: 'System Admin' },
        { id: 'sleep-6', text: 'Exercise regularly but not close to bedtime', uploaderName: 'System Admin' },
        { id: 'sleep-7', text: 'Use relaxation techniques like deep breathing', uploaderName: 'System Admin' }
      ]
    },
    {
      id: 'meditation', name: 'Meditation & Mindfulness', icon: '🧘', uploaderName: 'System', 
      tips: [
        { id: 'med-1', text: 'Start with just 5 minutes of meditation daily', uploaderName: 'System Admin' },
        { id: 'med-2', text: 'Focus on your breath to anchor your attention', uploaderName: 'System Admin' },
        { id: 'med-3', text: 'Use guided meditation apps for beginners', uploaderName: 'System Admin' },
        { id: 'med-4', text: 'Practice mindfulness during daily activities', uploaderName: 'System Admin' },
        { id: 'med-5', text: 'Create a dedicated quiet space for meditation', uploaderName: 'System Admin' },
        { id: 'med-6', text: 'Be patient with yourself and your thoughts', uploaderName: 'System Admin' },
        { id: 'med-7', text: 'Try different meditation styles to find what works', uploaderName: 'System Admin' }
      ]
    },
    {
      id: 'social', name: 'Social Connection', icon: '🗣️', uploaderName: 'System', 
      tips: [
        { id: 'soc-1', text: 'Spend quality time with friends and family', uploaderName: 'System Admin' },
        { id: 'soc-2', text: 'Join community groups or clubs with similar interests', uploaderName: 'System Admin' },
        { id: 'soc-3', text: 'Practice active listening in conversations', uploaderName: 'System Admin' },
        { id: 'soc-4', text: 'Reach out to someone you haven\'t talked to in a while', uploaderName: 'System Admin' },
        { id: 'soc-5', text: 'Volunteer for causes you care about', uploaderName: 'System Admin' },
        { id: 'soc-6', text: 'Set healthy boundaries in relationships', uploaderName: 'System Admin' },
        { id: 'soc-7', text: 'Share your feelings with trusted people', uploaderName: 'System Admin' }
      ]
    },
    {
      id: 'mindset', name: 'Positive Mindset', icon: '🧠', uploaderName: 'System', 
      tips: [
        { id: 'mind-1', text: 'Practice gratitude by listing 3 things daily', uploaderName: 'System Admin' },
        { id: 'mind-2', text: 'Challenge negative thoughts with evidence', uploaderName: 'System Admin' },
        { id: 'mind-3', text: 'Celebrate small wins and progress', uploaderName: 'System Admin' },
        { id: 'mind-4', text: 'Use positive affirmations each morning', uploaderName: 'System Admin' },
        { id: 'mind-5', text: 'Limit exposure to negative news and social media', uploaderName: 'System Admin' },
        { id: 'mind-6', text: 'Focus on what you can control', uploaderName: 'System Admin' },
        { id: 'mind-7', text: 'Learn from setbacks instead of dwelling on them', uploaderName: 'System Admin' }
      ]
    }
  ]);

  const [currentTipInput, setCurrentTipInput] = useState("");

  const handleAddTipToCategory = (catId) => {
    if (!currentTipInput.trim()) return;
    
    const updatedCategories = tipCategories.map(cat => {
      if (cat.id === catId) {
        return { 
          ...cat, 
          tips: [...cat.tips, { 
            id: Date.now(), 
            text: currentTipInput, 
            uploaderName: currentUser.name 
          }] 
        };
      } 
      return cat;
    });
    
    setTipCategories(updatedCategories);
    setCurrentTipInput("");
  };

  const handleDeleteTipFromCategory = (catId, tipId) => {
    if(!confirm("Delete this tip?")) return;
    setTipCategories(tipCategories.map(cat => cat.id === catId ? { ...cat, tips: cat.tips.filter(t => t.id !== tipId) } : cat));
  };

  // Helper to close modal & reset state
  const closeModal = () => {
      setActiveModal(null);
      setSelectedTipCategory(null);
      setCurrentTipInput("");
  }

  // Helper to get active category data
  const activeCategoryData = tipCategories.find(c => c.id === selectedTipCategory);

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
            <p className="text-sm text-gray-500 mb-6 relative z-10">Manage 6 fixed tip categories.</p>
            <button onClick={() => setActiveModal('tips')} className="relative z-10 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 cursor-pointer">Manage Tips</button>
          </div>
        </div>
      </main>

      {/* MOTIVATION MODAL */}
      {activeModal === 'motivation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Sparkles className="text-orange-600" /> Manage Motivation</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 bg-gray-50">
              <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm sticky top-0">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm text-orange-800 uppercase tracking-wide flex items-center gap-2">Add Quote</h4>
                  </div>
                  <form onSubmit={handleAddQuote} className="space-y-3">
                    <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">QUOTE TEXT</label><textarea placeholder="Write motivational quote..." className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none" rows="3" value={quoteForm.text} onChange={e => setQuoteForm({...quoteForm, text: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">AUTHOR</label><input type="text" placeholder="Author name" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none" value={quoteForm.author} onChange={e => setQuoteForm({...quoteForm, author: e.target.value})} /></div>
                    <button type="submit" className="w-full bg-orange-600 text-white font-bold rounded-lg py-3 hover:bg-orange-700 transition-colors shadow-md mt-2">Add Quote</button>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIPS MODAL (FIXED CATEGORIES) */}
      {activeModal === 'tips' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl transition-all">
            
            {/* --- MODAL HEADER --- */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                 {/* Show Back Button if inside a category */}
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
                    {selectedTipCategory ? activeCategoryData.name : "Manage Tips (Select Category)"}
                 </h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
               
               {/* --- VIEW 1: CATEGORY GRID (Shown when NO category is selected) --- */}
               {!selectedTipCategory && (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                     {tipCategories.map((cat) => (
                        <div 
                            key={cat.id} 
                            onClick={() => setSelectedTipCategory(cat.id)}
                            className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center gap-4 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{cat.icon}</div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{cat.name}</h4>
                                <p className="text-sm text-gray-500 font-medium mt-1">{cat.tips.length} Tips</p>
                            </div>
                            <button className="mt-2 text-blue-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Manage Tips &rarr;</button>
                        </div>
                     ))}
                   </div>
               )}

               {/* --- VIEW 2: TIP DETAILS (Shown when a category IS selected) --- */}
               {selectedTipCategory && activeCategoryData && (
                   <div className="animate-fade-in max-w-3xl mx-auto">
                        {/* List Tips */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 min-h-[300px] flex flex-col">
                            <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-4">Current Tips List</h4>
                            
                            {activeCategoryData.tips.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
                                    <span className="text-4xl mb-2">📭</span>
                                    <p className="text-sm">No tips available yet in this category.</p>
                                </div>
                            ) : (
                                <ul className="space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                                    {activeCategoryData.tips.map((tip, idx) => (
                                        <li key={tip.id} className="flex justify-between items-start gap-4 p-4 bg-gray-50 rounded-xl border border-transparent hover:border-blue-100 group transition-all">
                                            <div className="flex items-start gap-3 w-full">
                                                <span className="min-w-[24px] h-[24px] rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold mt-0.5">{idx + 1}</span>
                                                <div className="flex-1">
                                                    <p className="text-base text-gray-800 leading-snug font-medium">{tip.text}</p>
                                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><User size={10} /> Added by {tip.uploaderName}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteTipFromCategory(selectedTipCategory, tip.id)} 
                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                title="Delete Tip"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Sticky Bottom Input Form */}
                        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-4 flex gap-3 items-center sticky bottom-0">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <input 
                                type="text" 
                                placeholder={`Write new tip for ${activeCategoryData.name}...`} 
                                className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-base"
                                value={currentTipInput}
                                onChange={(e) => setCurrentTipInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTipToCategory(selectedTipCategory)}
                                autoFocus
                            />
                            <button 
                                onClick={() => handleAddTipToCategory(selectedTipCategory)}
                                disabled={!currentTipInput.trim()}
                                className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
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
      <style>{`@keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fade-in 0.2s ease-out forwards; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }`}</style>
    </div>
  );
}