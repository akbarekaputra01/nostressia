// src/pages/admin/AdminPage.jsx
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Sparkles, Lightbulb, LogOut, 
  Trash2, X, UserCircle, User, ArrowLeft, Users, BookOpen 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminDiaries, getAdminUsers, deleteAdminDiary, deleteAdminUser, updateAdminUser } from "../../services/adminService";
import { createMotivation, deleteMotivation, getMotivations } from "../../services/motivationService";
import { createTip, createTipCategory, deleteTip, deleteTipCategory, getTipCategories, getTipsByCategory, updateTip } from "../../services/tipsService";

export default function AdminPage({ skipAuth = false }) {
  const navigate = useNavigate();
  
  // --- EXISTING STATE ---
  const [activeModal, setActiveModal] = useState(null);
  const [selectedTipCategory, setSelectedTipCategory] = useState(null);
  const [currentUser, setCurrentUser] = useState({ id: 0, name: "", role: "" });

  // --- STATE: VIEWS & DATA ---
  const [activeView, setActiveView] = useState("dashboard"); 
  
  // User Data
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Diary Data
  const [diaries, setDiaries] = useState([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);
  const [totalDiariesCount, setTotalDiariesCount] = useState(0);

  // Common UI State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats
  const [totalUserCount, setTotalUserCount] = useState(0); 

  // Modal State
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // AUTH CHECK
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

  const token = localStorage.getItem("adminToken");

  // ==============================
  // 1. MOTIVATION & DASHBOARD STATS
  // ==============================
  const [quotes, setQuotes] = useState([]);
  const [quoteForm, setQuoteForm] = useState({ text: "", author: "" });

  useEffect(() => {
    // 1. Fetch Motivations (Biarkan bagian ini tetap sama)
    getMotivations()
      .then((data) => {
        const formatted = data.map(item => ({
          id: item.motivationId,
          text: item.quote,
          author: item.authorName || "Unknown",
          uploaderName: "Admin",
          uploaderId: "ADM" + String(item.uploaderId || 0).padStart(3, "0"),
        }));
        setQuotes(formatted);
      })
      .catch(err => console.log("Offline/Error:", err));

    // ✅ 2. Fetch Dashboard Stats (INI YANG DIUPDATE)
    const fetchStats = async () => {
        try {
            // UBAH: Ambil list user (limit besar, misal 1000) agar bisa kita filter manual
            const data = await getAdminUsers({ limit: 1000 });

            // HITUNG MANUAL: Hanya user yang verified
            const validUsersCount = (data.data || []).filter(u =>
                u.isVerified === true || u.isVerified === 1 || u.isVerified == "1"
            ).length;

            setTotalUserCount(validUsersCount); 

            // Bagian Diary biarkan tetap sama
            const diaryData = await getAdminDiaries({ limit: 1 });
            setTotalDiariesCount(diaryData.total || 0);

        } catch (error) { console.error("Failed to calculate stats:", error); }
    };
    
    if(token) fetchStats();

  }, [token]);

  const handleAddQuote = async (e) => {
    e.preventDefault();
    const payload = { quote: quoteForm.text, authorName: quoteForm.author, uploaderId: currentUser.id };
    try {
      const data = await createMotivation(payload);
      setQuotes([{ id: data.motivationId, text: data.quote, author: data.authorName, uploaderName: currentUser.name, uploaderId: "ADM" + String(currentUser.id).padStart(3, "0") }, ...quotes]);
      setQuoteForm({ text: "", author: "" });
    } catch { alert("Failed to save."); }
  };

  const handleDeleteQuote = async (id) => {
    if (!confirm("Delete this quote?")) return;
    try {
      await deleteMotivation(id);
      setQuotes(quotes.filter(q => q.id !== id));
    } catch (err) { console.error(err); }
  };

  // ==============================
  // 2. TIPS LOGIC
  // ==============================
  const [tipCategories, setTipCategories] = useState([]);
  const [tipsByCategory, setTipsByCategory] = useState({});
  const [tipCountByCategory, setTipCountByCategory] = useState({});
  const [currentTipInput, setCurrentTipInput] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTips, setLoadingTips] = useState(false);
  const [editingTipId, setEditingTipId] = useState(null);
  const [editingTipText, setEditingTipText] = useState("");
  const [isUpdatingTip, setIsUpdatingTip] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const iconForCategoryId = (id) => {
    const map = {1:"📚",2:"🥗",3:"😴",4:"🧘",5:"🗣️",6:"🧠"};
    return map[id] || "💡";
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoryError("");
        const data = await getTipCategories();
        const mapped = data.map(item => ({ id: item.tipCategoryId, name: item.categoryName || `Category ${item.tipCategoryId}`, icon: item.icon || iconForCategoryId(item.tipCategoryId) }));
        setTipCategories(mapped);
        const counts = {};
        for (const cat of mapped) {
            try {
                const dataTips = await getTipsByCategory(cat.id);
                counts[cat.id] = dataTips.length;
            } catch { counts[cat.id] = 0; }
        }
        setTipCountByCategory(counts);
      } catch (err) {
        setTipCategories([]);
        setCategoryError("Failed to load categories.");
      } finally { setLoadingCategories(false); }
    };
    loadCategories();
  }, []);

  const openCategory = async (catId) => {
    setSelectedTipCategory(catId);
    setEditingTipId(null);
    setEditingTipText("");
    if (!tipsByCategory[catId]) {
      setLoadingTips(true);
      try {
        const data = await getTipsByCategory(catId);
        const mappedTips = (data || []).map(item => ({ id: item.tipId ?? item.id, tip_text: item.detail || item.tipText, uploader_id: item.uploaderId }));
        setTipsByCategory(prev => ({ ...prev, [catId]: mappedTips }));
      } catch { setTipsByCategory(prev => ({ ...prev, [catId]: [] })); } finally { setLoadingTips(false); }
    }
  };

  const handleAddTipToCategory = async (catId) => {
    if (!currentTipInput.trim()) return;
    const payload = { detail: currentTipInput, tipCategoryId: catId, uploaderId: currentUser.id };
    try {
      const rawNewTip = await createTip(payload);
      const newTip = { id: rawNewTip.tipId, tip_text: rawNewTip.detail || currentTipInput, uploader_id: currentUser.id };
      setTipsByCategory(prev => ({ ...prev, [catId]: [...(prev[catId] || []), newTip] }));
      setTipCountByCategory(prev => ({ ...prev, [catId]: (prev[catId] || 0) + 1 }));
      setCurrentTipInput("");
    } catch { alert("Failed to add tip."); }
  };

  const handleDeleteTipFromCategory = async (catId, tipId) => {
    if (!confirm("Delete this tip?")) return;
    try {
      await deleteTip(tipId);
      setTipsByCategory(prev => ({ ...prev, [catId]: (prev[catId] || []).filter(t => t.id !== tipId) }));
      setTipCountByCategory(prev => ({ ...prev, [catId]: Math.max(0, (prev[catId] || 1) - 1) }));
    } catch { alert("Failed to delete tip."); }
  };

  const handleStartEditTip = (tip) => {
    if (!tip) return;
    setEditingTipId(tip.id);
    setEditingTipText(tip.tip_text || tip.tipText || "");
  };

  const handleCancelEditTip = () => {
    setEditingTipId(null);
    setEditingTipText("");
  };

  const handleSaveTipUpdate = async (catId, tipId) => {
    if (!editingTipText.trim()) return;
    setIsUpdatingTip(true);
    try {
      const updated = await updateTip(tipId, { detail: editingTipText });
      setTipsByCategory((prev) => ({
        ...prev,
        [catId]: (prev[catId] || []).map((tip) =>
          tip.id === tipId
            ? {
                ...tip,
                tip_text: updated.detail ?? editingTipText,
              }
            : tip
        ),
      }));
      handleCancelEditTip();
    } catch {
      alert("Failed to update tip.");
    } finally {
      setIsUpdatingTip(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const payload = { categoryName: newCategoryName.trim() };
      const created = await createTipCategory(payload);
      const newCategoryId = created.tipCategoryId ?? created.id;
      const newCategory = {
        id: newCategoryId,
        name: created.categoryName || newCategoryName.trim(),
        icon: iconForCategoryId(newCategoryId),
      };
      setTipCategories((prev) => [...prev, newCategory]);
      setTipCountByCategory((prev) => ({ ...prev, [newCategoryId]: 0 }));
      setNewCategoryName("");
    } catch {
      alert("Failed to create category.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Delete this category? Tips under it will be removed.")) return;
    try {
      await deleteTipCategory(categoryId);
      setTipCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      setTipCountByCategory((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
    } catch {
      alert("Failed to delete category.");
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTipCategory(null);
    setCurrentTipInput("");
    setEditingTipId(null);
    setEditingTipText("");
    setNewCategoryName("");
  };
  const activeCategoryData = tipCategories.find(c => c.id === selectedTipCategory);
  const currentCategoryTips = tipsByCategory[selectedTipCategory] || [];

  // ==============================
  // 3. USER MANAGEMENT LOGIC
  // ==============================
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({ page: page, limit: 10 });
      if (search) params.append("search", search);
      
      const data = await getAdminUsers({ page: Number(page), limit: 10, search });

      const normalizedUsers = (data.data || []).map((user) => ({
        ...user,
        userId: user.userId ?? user.id,
        username: user.username,
        userDob: user.userDob,
        isVerified: user.isVerified
      }));

      // 🔍 DEBUG: Cek di Console browser (F12) apakah ada field 'isVerified'
      console.log("Contoh Data User dari Backend:", normalizedUsers[0]); 

      // ✅ PERBAIKAN FILTER: Menangani Boolean, Angka (1), dan String ("1")
      const validUsers = normalizedUsers.filter(user => {
          // Kita anggap valid jika: true, angka 1, atau string "1"
          return user.isVerified === true || user.isVerified === 1 || user.isVerified == "1";
      });
      
      // Jika setelah filter hasilnya kosong tapi data aslinya ada, 
      // berarti backend TIDAK mengirim field 'isVerified'.
      if (validUsers.length === 0 && normalizedUsers.length > 0) {
          console.warn("⚠️ PERINGATAN: Sepertinya Backend tidak mengirim data 'isVerified'. Filter gagal.");
          setUsers(normalizedUsers); // Terpaksa tampilkan semua daripada kosong
      } else {
          setUsers(validUsers);
      }

      // Update total halaman berdasarkan data yang sudah difilter (estimasi)
      // Catatan: Pagination akan sedikit tidak akurat jika filter dilakukan di Frontend
      setTotalPages(Math.ceil(data.total / 10));

    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoadingUsers(false); 
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to DELETE this user permanently?")) return;
    try {
      await deleteAdminUser(userId);
      alert("User deleted successfully");
      fetchUsers();
      setTotalUserCount(prev => Math.max(0, prev - 1));
    } catch (error) { alert(error.message); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      await updateAdminUser(editingUser.userId, {
        name: editingUser.name,
        username: editingUser.username,
        email: editingUser.email,
        gender: editingUser.gender,
        userDob: editingUser.userDob,
      });
      alert("User updated!");
      setIsEditUserModalOpen(false);
      fetchUsers();
    } catch (error) { alert(error.message); }
  };

  // ==============================
  // 4. DIARY MANAGEMENT LOGIC
  // ==============================
  const fetchDiaries = async () => {
    setLoadingDiaries(true);
    try {
      const params = new URLSearchParams({ page: page, limit: 10 });
      if (search) params.append("search", search);
      const data = await getAdminDiaries({ page: Number(page), limit: 10, search });
      const normalizedDiaries = (data.data || []).map((diary) => ({
        ...diary,
        diaryId: diary.diaryId ?? diary.id,
        createdAt: diary.createdAt,
        username: diary.username
      }));
      setDiaries(normalizedDiaries);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (error) { console.error(error); } finally { setLoadingDiaries(false); }
  };

  const handleDeleteDiary = async (diaryId) => {
    if (!confirm("Delete this diary entry permanently?")) return;
    try {
      await deleteAdminDiary(diaryId);
      alert("Diary deleted");
      fetchDiaries();
      setTotalDiariesCount(prev => Math.max(0, prev - 1));
    } catch (error) { alert(error.message); }
  };

  // SWITCHER LOGIC
  useEffect(() => {
    if (activeView === "users") fetchUsers();
    else if (activeView === "diaries") fetchDiaries();
  }, [activeView, page, search]);


  // ==============================
  // RENDER HELPERS
  // ==============================

  const renderDashboardCards = () => (
    <>
      <div className="mb-8 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500">Manage content and users.</p>
        {skipAuth && (<p className="mt-2 text-xs font-bold text-orange-600 bg-orange-100 inline-block px-2 py-1 rounded">* Developer Mode</p>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-fade-in">
        {[{title: "Daily Motivation", count: quotes.length, desc: "Manage quotes & authors.", color: "orange", icon: <Sparkles size={24}/>, action: () => setActiveModal('motivation'), btn: "Manage"},
          {title: "Health Tips", count: tipCategories.length, desc: "Manage tip categories.", color: "blue", icon: <Lightbulb size={24}/>, action: () => setActiveModal('tips'), btn: "Manage"},
          {title: "User Management", count: totalUserCount, desc: "Fix data & manage profiles.", color: "purple", icon: <Users size={24}/>, action: () => setActiveView('users'), btn: "Manage"},
          // ✅ PERBAIKAN: Ganti "rose" menjadi "red" di sini
          {title: "Diary Moderation", count: totalDiariesCount, desc: "Delete user diaries.", color: "red", icon: <BookOpen size={24}/>, action: () => setActiveView('diaries'), btn: "Moderate"}
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group flex flex-col h-full">
            {/* Menggunakan dynamic class yang aman untuk red/orange/blue/purple */}
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${card.color}-500`}>{React.cloneElement(card.icon, {size: 80})}</div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 bg-${card.color}-100 text-${card.color}-600 rounded-xl`}>{card.icon}</div>
              <span className="text-3xl font-bold text-gray-800">{card.count}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 relative z-10">{card.title}</h3>
            <p className="text-sm text-gray-500 mb-6 relative z-10 flex-1">{card.desc}</p>
            <button onClick={card.action} className={`relative z-10 w-full py-3 bg-${card.color}-500 text-white rounded-xl font-bold hover:bg-${card.color}-600 transition-colors shadow-lg shadow-${card.color}-200 cursor-pointer mt-auto`}>{card.btn}</button>
          </div>
        ))}
      </div>
    </>
  );

  const renderUserTable = () => (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => setActiveView("dashboard")} className="flex items-center text-gray-500 hover:text-blue-600 mb-2 font-bold transition-colors cursor-pointer"><ArrowLeft size={18} className="mr-2" /> Back to Dashboard</button>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        </div>
      </div>
      <div className="mb-6">
        <input type="text" placeholder="Search by Name, Email, or Username..." className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none cursor-text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User Info</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Profile</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stats</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loadingUsers ? (<tr><td colSpan="4" className="text-center py-8 text-gray-500">Loading...</td></tr>) : users.length === 0 ? (<tr><td colSpan="4" className="text-center py-8 text-gray-500">No users found.</td></tr>) : (
              users.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-bold text-gray-900">{user.name}</div><div className="text-sm text-gray-500">{user.email}</div><div className="text-xs text-purple-600 font-mono">@{user.username}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><div>{user.gender || "-"}</div><div className="text-xs text-gray-400">{user.userDob || "No DOB"}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">🔥 {user.streak || 0} Streak</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setEditingUser({...user, userDob: user.userDob ? user.userDob.split("T")[0] : ""}); setIsEditUserModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4 font-bold cursor-pointer">Edit</button>
                    <button onClick={() => handleDeleteUser(user.userId)} className="text-red-600 hover:text-red-900 font-bold cursor-pointer">Delete</button>
                  </td>
                </tr>
            )))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-center items-center gap-4">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600 cursor-pointer disabled:cursor-not-allowed">Previous</button>
        <span className="text-gray-600 text-sm font-medium">Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600 cursor-pointer disabled:cursor-not-allowed">Next</button>
      </div>
    </div>
  );

  const renderDiaryTable = () => (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => setActiveView("dashboard")} className="flex items-center text-gray-500 hover:text-blue-600 mb-2 font-bold transition-colors cursor-pointer"><ArrowLeft size={18} className="mr-2" /> Back to Dashboard</button>
          <h2 className="text-2xl font-bold text-gray-900">Diary Moderation</h2>
        </div>
      </div>
      <div className="mb-6">
        {/* ✅ PERBAIKAN: focus:ring-red-500 */}
        <input type="text" placeholder="Search by Content or User Name..." className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none cursor-text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Content Snippet</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loadingDiaries ? (<tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading diaries...</td></tr>) : diaries.length === 0 ? (<tr><td colSpan="5" className="text-center py-8 text-gray-500">No diaries found.</td></tr>) : (
                diaries.map((diary) => (
                <tr key={diary.diaryId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-bold text-gray-900">{diary.username}</div><div className="text-xs text-gray-500"></div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(diary.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">{diary.title || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{diary.content.length > 60 ? diary.content.substring(0, 60) + "..." : diary.content}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* ✅ PERBAIKAN: Ganti semua 'rose' menjadi 'red' */}
                    <button onClick={() => handleDeleteDiary(diary.diaryId)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 px-3 py-1 rounded-lg border border-red-100 cursor-pointer">Delete</button>
                  </td>
                </tr>
            )))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-center items-center gap-4">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600 cursor-pointer disabled:cursor-not-allowed">Previous</button>
        <span className="text-gray-600 text-sm font-medium">Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 text-sm font-bold text-gray-600 cursor-pointer disabled:cursor-not-allowed">Next</button>
      </div>
    </div>
  );

  // ==============================
  // MAIN RENDER
  // ==============================
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* NAVBAR CANTIK */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700 shadow-sm px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            {/* Logo Section */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-2.5 rounded-xl shadow-md">
                    <LayoutDashboard size={22} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                    Admin Panel <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Nostressia</span>
                </h1>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                {/* User Pill */}
                <div className="hidden md:flex items-center gap-3 pl-2 pr-5 py-1.5 rounded-full bg-gray-50 border border-gray-100 shadow-inner">
                    <div className="bg-white p-1 rounded-full border border-gray-200">
                        <UserCircle size={28} className="text-blue-500"/>
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-bold text-gray-700">{currentUser.name}</span>
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                            {currentUser.id === 999 ? "DEV-MODE" : `ADM-${String(currentUser.id).padStart(3, "0")}`}
                        </span>
                    </div>
                </div>

                {/* Logout Button */}
                <button 
                    onClick={handleLogout} 
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 cursor-pointer border border-transparent hover:border-red-100"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Logout
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-10">
        {activeView === 'dashboard' && renderDashboardCards()}
        {activeView === 'users' && renderUserTable()}
        {activeView === 'diaries' && renderDiaryTable()}
      </main>

      {/* --- MODALS --- */}
      {/* MOTIVATION MODAL */}
      {activeModal === 'motivation' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Sparkles className="text-orange-600" /> Manage Motivation</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full cursor-pointer"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 h-fit md:sticky top-0 self-start">
                  <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
                    <h4 className="font-bold text-sm text-orange-800 uppercase tracking-wide mb-3">Add Quote</h4>
                    <form onSubmit={handleAddQuote} className="space-y-3">
                      <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">QUOTE TEXT</label><textarea placeholder="Write motivational quote..." className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 resize-none cursor-text" rows="3" value={quoteForm.text} onChange={(e) => setQuoteForm({ ...quoteForm, text: e.target.value })} /></div>
                      <div><label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">AUTHOR</label><input type="text" placeholder="Author name" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 cursor-text" value={quoteForm.author} onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })} /></div>
                      <button type="submit" className="w-full bg-orange-600 text-white font-bold rounded-lg py-3 hover:bg-orange-700 shadow-md mt-2 cursor-pointer">Add Quote</button>
                    </form>
                  </div>
                </div>
                <div className="w-full md:w-2/3 space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1"><p className="text-gray-800 text-base leading-relaxed mb-3 italic">"{quote.text}"</p><p className="text-sm font-bold text-gray-700">— {quote.author}</p><p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><User size={10} /> ({quote.uploaderId})</p></div>
                        <button onClick={() => handleDeleteQuote(quote.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg border border-red-100 cursor-pointer"><Trash2 size={18} /></button>
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                {selectedTipCategory && (
                  <button
                    onClick={() => {
                      setSelectedTipCategory(null);
                      setCurrentTipInput("");
                      setEditingTipId(null);
                      setEditingTipText("");
                    }}
                    className="mr-2 p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={20} className="text-gray-600" />
                  </button>
                )}
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Lightbulb className="text-blue-600" /> {selectedTipCategory ? activeCategoryData?.name : "Manage Tips (Select Category)"}</h3>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full cursor-pointer"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {!selectedTipCategory && (
                <div>
                  {loadingCategories ? (<div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>) : (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-center">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="New category name..."
                            className="w-full bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-base cursor-text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim()}
                          className="px-6 py-2.5 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-white disabled:opacity-50 cursor-pointer dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          Add Category
                        </button>
                      </div>
                      {categoryError && (
                        <div className="text-sm text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2">
                          {categoryError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tipCategories.map((cat) => (
                          <div key={cat.id} className="relative bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center gap-4 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all group">
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="absolute top-3 right-3 text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div onClick={() => openCategory(cat.id)} className="flex flex-col items-center gap-4 cursor-pointer">
                              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{cat.icon}</div>
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{cat.name}</h4>
                                <p className="text-sm text-gray-500 font-medium mt-1">{tipCountByCategory[cat.id] ?? 0} Tips</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {selectedTipCategory && activeCategoryData && (
                <div className="animate-fade-in max-w-3xl mx-auto">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 min-h-[300px] flex flex-col">
                    <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-4">Current Tips List</h4>
                    {loadingTips ? (<div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10"><div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div><p>Loading tips...</p></div>) : (
                      <ul className="space-y-3 flex-1 pr-2">
                        {currentCategoryTips.map((tip, idx) => (
                          <li key={tip.id} className="flex justify-between items-start gap-4 p-4 bg-gray-50 rounded-xl border hover:border-blue-100 transition-all">
                            <div className="flex items-start gap-3 w-full">
                              <span className="min-w-[24px] h-[24px] rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                              <div className="flex-1">
                                {editingTipId === tip.id ? (
                                  <>
                                    <input
                                      type="text"
                                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                      value={editingTipText}
                                      onChange={(e) => setEditingTipText(e.target.value)}
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleSaveTipUpdate(selectedTipCategory, tip.id)}
                                        disabled={!editingTipText.trim() || isUpdatingTip}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        {isUpdatingTip ? "Saving..." : "Save"}
                                      </button>
                                      <button
                                        onClick={handleCancelEditTip}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-base text-gray-800 font-medium">{tip.tip_text || tip.tipText}</p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><User size={10} /> Added by ({tip.uploader_id ? `ADM${String(tip.uploader_id).padStart(3, "0")}` : "Admin"})</p>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleStartEditTip(tip)}
                                className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-all cursor-pointer"
                              >
                                <UserCircle size={18} />
                              </button>
                              <button onClick={() => handleDeleteTipFromCategory(selectedTipCategory, tip.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all cursor-pointer"><Trash2 size={18} /></button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-4 flex gap-3 sticky bottom-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white"><Sparkles size={20} /></div>
                    <input type="text" placeholder={`Write new tip for ${activeCategoryData.name}...`} className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-base cursor-text" value={currentTipInput} onChange={(e) => setCurrentTipInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddTipToCategory(selectedTipCategory)} />
                    <button onClick={() => handleAddTipToCategory(selectedTipCategory)} disabled={!currentTipInput.trim()} className="px-6 py-2.5 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-white disabled:opacity-50 cursor-pointer dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">Add</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 transform transition-all">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit User Data</h2>
                <button onClick={() => setIsEditUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label><input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none cursor-text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label><input type="email" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none cursor-text" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Username</label><input type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none cursor-text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Gender</label><select className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer" value={editingUser.gender || ""} onChange={e => setEditingUser({...editingUser, gender: e.target.value})}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label><input type="date" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 cursor-pointer" value={editingUser.userDob || ""} onChange={e => setEditingUser({...editingUser, userDob: e.target.value})} /></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Reset Password <span className="text-xs font-normal text-gray-400">(Unavailable)</span></label>
                  <div className="w-full border border-gray-200 p-3 rounded-lg bg-gray-100 text-gray-400">
                    Password reset is not available on the backend yet.
                  </div>
                  <p className="text-xs text-gray-400 mt-1">This will be enabled once the reset endpoint is available.</p>
                </div>
                <div className="flex justify-end gap-3 mt-8"><button type="button" onClick={() => setIsEditUserModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold transition-colors cursor-pointer">Cancel</button><button type="submit" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-md shadow-purple-200 transition-all cursor-pointer">Save Changes</button></div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } } 
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; } 
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>
    </div>
  );
}
