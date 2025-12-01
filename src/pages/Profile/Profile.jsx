// src/pages/Profile/Profile.jsx
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom"; // [BARU] Import Link
import Navbar from "../../components/Navbar";
import { 
  User, Mail, Heart, Settings, LogOut, 
  Edit3, Trophy, BookOpen, 
  ChevronRight, Bell, CheckCircle, X,
  Cake, Smile, Activity, Lock, Key, Clock, Smartphone, Bookmark, Plus // [BARU] Tambah icon Plus
} from "lucide-react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal"); 
  const fileInputRef = useRef(null);

  // --- STATE NOTIFIKASI TOAST ---
  const [notification, setNotification] = useState(null);

  // --- STATE MODAL ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false); 

  // --- STATE SETTINGS DATA ---
  const [notifSettings, setNotifSettings] = useState({
    dailyReminder: true,
    reminderTime: "08:00",
    emailUpdates: false
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // --- STATE USER ---
  const [user, setUser] = useState({
    username: "epin_chill", 
    fullName: "Epin",       
    email: "epin@student.binus.ac.id", 
    avatar: "https://i.pravatar.cc/150?img=12",
    birthday: "12 October 2004", 
    gender: "Male",              
  });

  const [formData, setFormData] = useState(user);

  // --- MOCK DATA STATS ---
  const stats = [
    { label: "Streak", value: "12 Days", icon: <Trophy className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-100" },
    { label: "Entries", value: "45 Notes", icon: <BookOpen className="w-5 h-5 text-blue-500" />, bg: "bg-blue-100" },
    { label: "Stress", value: "Low", icon: <Activity className="w-5 h-5 text-green-500" />, bg: "bg-green-100" },
  ];

  // --- SAVED ITEMS ---
  const [savedItems, setSavedItems] = useState([
    { id: 1, text: "Every small step counts towards peace.", category: "Mindfulness", date: "2 mins ago" },
    { id: 2, text: "You don't have to be productive all the time. Just breathe.", category: "Self Care", date: "1 day ago" },
  ]);

  // --- FUNCTIONS ---

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // -- Profile Functions --
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveProfile = () => {
    setUser(formData);
    showNotification("Profile updated successfully!");
  };

  const handleImageClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, avatar: imageUrl });
      setUser(prev => ({ ...prev, avatar: imageUrl }));
      showNotification("Profile picture updated!");
    }
  };

  const handleUnsave = (id) => {
    setSavedItems(savedItems.filter(item => item.id !== id));
    showNotification("Item removed", "info");
  };

  const handleEmailChangeRequest = () => {
    if (window.confirm("Changing email requires verification. Do you want to proceed?")) {
        alert("Redirecting to email verification..."); 
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      window.location.href = "/login"; 
    }
  };

  // -- Notification Functions --
  const handleNotifChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotifSettings({
        ...notifSettings,
        [name]: type === 'checkbox' ? checked : value
    });
  };

  const saveNotifSettings = () => {
    setShowNotifModal(false);
    showNotification("Notification preferences saved!");
  };

  // -- Password Functions --
  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handleSubmitPasswordChange = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        showNotification("Please fill in all fields", "error");
        return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showNotification("New passwords do not match!", "error");
        return;
    }
    // Simulate API call
    setShowPasswordModal(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    showNotification("Password changed successfully!");
  };

  return (
    <div 
      className="min-h-screen pb-24 md:pb-10 font-sans"
      style={{ 
        background: `linear-gradient(135deg, #FFF3E0 0%, #eaf2ff 50%, #e3edff 100%)`,
        backgroundAttachment: "fixed" 
      }}
    >
      <Navbar />

      {/* --- NOTIFICATION TOAST --- */}
      {notification && (
        <div className="fixed top-24 right-4 z-[100] animate-bounce-in">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
            notification.type === "success" ? "bg-white text-green-600 border-green-100" : 
            notification.type === "error" ? "bg-white text-red-600 border-red-100" :
            "bg-white text-blue-600 border-blue-100"
          }`}>
            {notification.type === "success" ? <CheckCircle className="w-5 h-5"/> : 
             notification.type === "error" ? <X className="w-5 h-5"/> : <Heart className="w-5 h-5"/>}
            <span className="font-bold">{notification.message}</span>
          </div>
        </div>
      )}

      {/* --- NOTIFICATION SETTINGS MODAL --- */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-white/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-500" /> Notifications
                    </h3>
                    <button onClick={() => setShowNotifModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Daily Reminder Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Daily Reminder</p>
                                <p className="text-xs text-gray-500">Remind me to check-in</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="dailyReminder"
                                checked={notifSettings.dailyReminder}
                                onChange={handleNotifChange}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Time Picker (Only show if toggle is ON) */}
                    {notifSettings.dailyReminder && (
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-semibold">Time</span>
                            </div>
                            <input 
                                type="time" 
                                name="reminderTime"
                                value={notifSettings.reminderTime}
                                onChange={handleNotifChange}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                            />
                        </div>
                    )}

                    <div className="h-px bg-gray-100"></div>

                    {/* Email Updates */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Weekly Report</p>
                                <p className="text-xs text-gray-500">Receive summary via email</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="emailUpdates"
                                checked={notifSettings.emailUpdates}
                                onChange={handleNotifChange}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <button 
                        onClick={saveNotifSettings}
                        className="w-full mt-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all cursor-pointer transform active:scale-95"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- PASSWORD MODAL --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-white/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-500" /> Change Password
                    </h3>
                    <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 ml-1">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="password" 
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChangeInput}
                                placeholder="Enter current password"
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 ml-1">New Password</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="password" 
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChangeInput}
                                placeholder="Enter new password"
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 ml-1">Confirm New Password</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="password" 
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChangeInput}
                                placeholder="Re-enter new password"
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all cursor-pointer transform active:scale-95">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 pt-24 md:pt-28">
        
        {/* PROFILE HEADER */}
        <div className="relative bg-white/60 backdrop-blur-xl border border-white/40 rounded-[30px] p-6 md:p-10 shadow-xl overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="relative group">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                    <button onClick={handleImageClick} className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-all cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-extrabold text-gray-800">{user.fullName}</h1>
                    <p className="text-gray-500 font-medium mb-1">@{user.username}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200/60">
                {stats.map((stat, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-2">
                        <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center mb-2`}>
                            {stat.icon}
                        </div>
                        <span className="text-lg font-bold text-gray-800">{stat.value}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* --- TABS NAVIGATION --- */}
        <div className="flex justify-center mb-6">
            <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-2xl flex gap-2 border border-white/30 shadow-sm overflow-x-auto">
                {[
                    { id: "personal", label: "Personal", icon: <User className="w-4 h-4" /> },
                    { id: "bookmark", label: "Bookmark", icon: <Bookmark className="w-4 h-4" /> }, 
                    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap
                            ${activeTab === tab.id ? "bg-white text-blue-600 shadow-md scale-105" : "text-gray-500 hover:text-gray-700 hover:bg-white/30"}
                        `}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* --- CONTENT SECTIONS --- */}
        <div className="animate-fade-in-up pb-20">
            
            {/* PERSONAL TAB */}
            {activeTab === "personal" && (
                <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-[24px] p-6 md:p-8 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-500" /> Personal Details
                    </h3>
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 ml-1">Username</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" value={formData.fullName} readOnly className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100/80 border border-transparent text-gray-500 cursor-not-allowed select-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 ml-1">Email Address</label>
                            <div className="relative flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" value={formData.email} readOnly className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100/80 border border-transparent text-gray-500 cursor-not-allowed select-none" />
                                </div>
                                <button onClick={handleEmailChangeRequest} className="px-4 py-3 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap">Change</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 ml-1">Birthday</label>
                                <div className="relative">
                                    <Cake className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={formData.birthday} readOnly className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100/80 border border-transparent text-gray-500 cursor-not-allowed select-none" />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 ml-1">Gender</label>
                                <div className="relative">
                                    <Smile className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={formData.gender} readOnly className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100/80 border border-transparent text-gray-500 cursor-not-allowed select-none" />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button onClick={handleSaveProfile} className="px-8 py-3 bg-[#F2994A] hover:bg-[#e08a3e] text-white font-bold rounded-xl shadow-lg hover:shadow-orange-200 transition-all cursor-pointer transform active:scale-95">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}

            {/* BOOKMARK TAB (Previously SAVED) */}
            {activeTab === "bookmark" && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {savedItems.map((item) => (
                            <div key={item.id} className="bg-white/70 backdrop-blur-sm p-6 rounded-[24px] border border-white/50 shadow-sm hover:shadow-md transition-all relative">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">{item.category}</span>
                                    {/* [UBAH] Ikon hati jadi bookmark & warna oranye */}
                                    <button onClick={() => handleUnsave(item.id)} className="text-orange-500 hover:scale-110 transition-transform cursor-pointer">
                                        <Bookmark className="w-5 h-5 fill-current" />
                                    </button>
                                </div>
                                <p className="text-gray-800 font-medium italic text-lg mb-4">"{item.text}"</p>
                            </div>
                        ))}
                    </div>

                    {/* [BARU] Tombol Add More Bookmarks */}
                    <div className="flex justify-center">
                        <Link 
                            to="/motivation" 
                            className="px-6 py-3 rounded-xl border-2 border-dashed border-orange-300 text-orange-600 font-bold hover:bg-orange-50 hover:border-orange-500 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add More Bookmarks
                        </Link>
                    </div>
                </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
                <div className="space-y-4">
                     <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-[24px] overflow-hidden shadow-lg p-2">
                        
                        {/* Notifications Button */}
                        <button 
                            onClick={() => setShowNotifModal(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/50 rounded-xl transition-colors cursor-pointer group"
                        >
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Bell className="w-5 h-5" /></div>
                                <div className="text-left"><h4 className="font-bold text-gray-800">Notifications</h4></div>
                             </div>
                             <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                        
                        <div className="h-px bg-gray-100 mx-4"></div>

                        {/* Change Password Button */}
                        <button 
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/50 rounded-xl transition-colors cursor-pointer group"
                        >
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Lock className="w-5 h-5" /></div>
                                <div className="text-left"><h4 className="font-bold text-gray-800">Change Password</h4></div>
                             </div>
                             <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                     </div>

                     <button onClick={handleLogout} className="w-full bg-white/80 border border-red-100 p-4 rounded-[24px] flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 cursor-pointer">
                        <LogOut className="w-5 h-5" /> Log Out
                    </button>
                </div>
            )}

        </div>
      </main>
    </div>
  );
}