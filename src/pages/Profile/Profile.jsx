// src/pages/Profile/Profile.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { 
  User, Mail, Heart, Settings, LogOut, 
  Edit3, Trophy, BookOpen, 
  ChevronRight, Bell, CheckCircle, X,
  Cake, Smile, Activity, Lock, Key, Clock, Smartphone, Bookmark, Plus
} from "lucide-react";

// --- KOMPONEN GAME (EASTER EGG) - VISUAL FULL (IKAN, CACING, DLL) ---
const FishGameModal = ({ onClose }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // --- VARIABLES ---
    let player, worms, powerUps, score, gameOver, timeLeft, keys, spawnInterval, timer, frame, explosions;
    let highScore = parseInt(localStorage.getItem("fishWormHighScore")) || 0;
    let lives;
    let audioCtx = null;
    let animationFrameId;

    // --- AUDIO MANAGER ---
    const playSound = (freq, type, duration = 0.1) => {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) { console.error(e); }
    };

    // --- DOM UPDATES ---
    const updateScore = (val) => { const el = document.getElementById('game-score'); if(el) el.innerText = val; };
    const updateTime = (val) => { const el = document.getElementById('game-time'); if(el) el.innerText = val; };
    const updateLives = (val) => { const el = document.getElementById('game-lives'); if(el) el.innerText = "❤️".repeat(Math.max(0, val)) + "🤍".repeat(Math.max(0, 3 - val)); };
    const updateStatus = (msg) => { const el = document.getElementById('game-status'); if(el) el.innerText = msg; };
    const showRestart = (show) => { const el = document.getElementById('game-restart'); if(el) el.style.display = show ? 'block' : 'none'; };

    // --- DRAWING FUNCTIONS ---
    function drawFish(x, y, size, polarity, dir) {
        const color = polarity === "N" ? "#2979ff" : "#ff1744";
        const glowColor = polarity === "N" ? "#64b5f6" : "#ff5722";
        
        ctx.save();   
        ctx.translate(x, y);

        // Glow effect
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;

        // Rotation
        if (dir === "left") ctx.rotate(Math.PI);
        else if (dir === "up") ctx.rotate(-Math.PI/2);
        else if (dir === "down") ctx.rotate(Math.PI/2);

        // Body Gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, polarity === "N" ? "#1565c0" : "#c62828");
        
        // Draw Body (Oval Shape - Fish look)
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.65, 0, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated tail
        const tailSwing = Math.sin(frame * 0.2) * size * 0.4;
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(-size - size * 0.8, -size * 0.5 + tailSwing);
        ctx.lineTo(-size - size * 0.8, size * 0.5 + tailSwing);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(size * 0.6, -size * 0.1, size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; 
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.65, -size * 0.1, size * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = "#111"; 
        ctx.fill();

        // Eye shine
        ctx.beginPath();
        ctx.arc(size * 0.62, -size * 0.12, size * 0.03, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; 
        ctx.fill();

        // Polarity Text
        ctx.fillStyle = "#fff"; 
        ctx.font = "bold 12px Arial"; 
        ctx.textAlign = "center"; 
        ctx.textBaseline = "middle";
        ctx.fillText(polarity, 0, 0);

        ctx.restore();
    }

    function drawWorm(w) {
        const segCount = 5;
        const baseColor = w.polarity === "N" ? "#2979ff" : "#ff1744";
        
        for (let i = 0; i < segCount; i++){
            let offset = Math.sin(frame * 0.2 + w.phase + i * 0.5) * 4;
            let alpha = 1 - (i * 0.1);
            
            ctx.save();
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = 8;
            
            ctx.beginPath();
            ctx.arc(w.x + offset, w.y - i * 8, w.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.fillStyle = "#fff"; 
        ctx.font = "bold 10px Arial"; 
        ctx.textAlign = "center";
        ctx.fillText(w.polarity, w.x, w.y - 25);
    }

    function drawPowerUp(p) {
        ctx.save();
        const pulse = Math.sin(frame * 0.3) * 0.2 + 1;
        ctx.translate(p.x, p.y);
        ctx.scale(pulse, pulse);
        
        let color, glowColor, icon;
        if (p.type==="speed") { color="#ffea00"; glowColor="#fff176"; icon="⚡"; }
        else if (p.type==="size") { color="#00e676"; glowColor="#69f0ae"; icon="🍀"; }
        else if (p.type==="poison") { color="#9c27b0"; glowColor="#ba68c8"; icon="☠"; }
        else { color="#f44336"; glowColor="#ff7043"; icon="💣"; } 
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000"; 
        ctx.font = "12px Arial"; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, 0, 1);
        
        ctx.restore();
    }

    function drawExplosion(ex) {
        ctx.save();
        ctx.globalAlpha = ex.alpha;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(ex.x, ex.y, ex.radius - i * 10, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${20 + i * 30}, 100%, ${70 - i * 20}%)`;
            ctx.fill();
        }
        ctx.restore();
    }

    // --- GAME LOGIC ---
    function initGame() {
        player = { x: 250, y: 200, size: 22, polarity: "N", dir: "right", speed: 4 };
        worms = []; powerUps = []; explosions = [];
        score = 0; gameOver = false; timeLeft = 30; frame = 0; keys = {}; lives = 3;
        
        updateScore(score); updateTime(timeLeft); updateLives(lives);
        updateStatus(""); showRestart(false);
        
        clearInterval(spawnInterval); clearInterval(timer);

        spawnInterval = setInterval(() => { 
            if (!gameOver) {
                const polarity = Math.random() < 0.5 ? "N" : "S";
                worms.push({ x: Math.random()*460+20, y: -20, size:14, polarity, speed:2, phase: Math.random()*Math.PI*2 });
                if (Math.random() < 0.25) {
                    const types = ["speed", "size", "poison", "bomb"];
                    powerUps.push({ x: Math.random()*460+20, y: -20, size: 12, type: types[Math.floor(Math.random()*types.length)], speed: 2.5 });
                }
            }
        }, 1500);

        timer = setInterval(()=>{
            if(gameOver){clearInterval(timer);return;}
            timeLeft--;
            updateTime(timeLeft);
            if(timeLeft<=0){ endGame("⏰ Time's up!");}
        },1000);

        loop();
    }

    function endGame(msg) {
        gameOver = true;
        playSound(150, 'sawtooth', 0.5);
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("fishWormHighScore", highScore);
            msg += " 🏆 New Record!";
        }
        updateStatus(`${msg} Score: ${score}`);
        showRestart(true);
    }

    function loop() {
        frame++;
        ctx.clearRect(0,0,canvas.width,canvas.height);

        if(!gameOver) {
            // Player Movement
            if(keys["ArrowUp"]) { player.y-=player.speed; player.dir="up"; }
            if(keys["ArrowDown"]) { player.y+=player.speed; player.dir="down"; }
            if(keys["ArrowLeft"]) { player.x-=player.speed; player.dir="left"; }
            if(keys["ArrowRight"]) { player.x+=player.speed; player.dir="right"; }
            
            // Screen Wrap
            if (player.x < -player.size) player.x = canvas.width + player.size;
            if (player.x > canvas.width + player.size) player.x = -player.size;
            if (player.y < -player.size) player.y = canvas.height + player.size;
            if (player.y > canvas.height + player.size) player.y = -player.size;

            // Draw Player
            drawFish(player.x, player.y, player.size, player.polarity, player.dir);

            // Worms
            for(let i=worms.length-1;i>=0;i--){
                let w=worms[i]; w.y+=w.speed;
                drawWorm(w); 
                
                // Collision
                let dx=player.x-w.x, dy=player.y-w.y;
                if(Math.sqrt(dx*dx+dy*dy) < player.size+w.size/2) {
                    if(w.polarity !== player.polarity) {
                        score++; updateScore(score); playSound(440, 'sine');
                        timeLeft = Math.min(timeLeft + 1, 60); updateTime(timeLeft);
                        if(player.size < 60) player.size += 1; 
                    } else {
                        lives--; updateLives(lives); playSound(100, 'square');
                        if(lives<=0) endGame("❌ No lives!");
                    }
                    worms.splice(i,1);
                } else if (w.y > canvas.height + 20) worms.splice(i,1);
            }

            // Powerups
            for(let i=powerUps.length-1;i>=0;i--){
                let p=powerUps[i]; p.y+=p.speed;
                drawPowerUp(p); 
                
                let dx=player.x-p.x, dy=player.y-p.y;
                if(Math.sqrt(dx*dx+dy*dy) < player.size+p.size) {
                    playSound(600, 'triangle');
                    if(p.type==="speed"){ player.speed=7; setTimeout(()=>player.speed=4,5000); }
                    if(p.type==="size"){ player.size=Math.max(15, player.size-5); }
                    if(p.type==="poison"){ player.speed=2; setTimeout(()=>player.speed=4,4000); }
                    if(p.type==="bomb"){ 
                        explosions.push({x:player.x, y:player.y, radius:20, alpha:1});
                        lives--; updateLives(lives); playSound(100, 'sawtooth'); 
                        if(lives<=0) endGame("💥 Boom!"); 
                    }
                    powerUps.splice(i,1);
                } else if (p.y > canvas.height + 20) powerUps.splice(i,1);
            }

            // Explosions
            for (let i=explosions.length-1;i>=0;i--){
                let ex=explosions[i];
                drawExplosion(ex);
                ex.radius+=3;
                ex.alpha-=0.03;
                if(ex.alpha<=0) explosions.splice(i,1);
            }
        }
        animationFrameId = requestAnimationFrame(loop);
    }

    const handleKey = (e) => {
        if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        if(e.type === 'keydown') {
            keys[e.key] = true;
            if(e.code === "Space" && !gameOver) {
                player.polarity = player.polarity === "N" ? "S" : "N";
                playSound(300, 'sine');
            }
        } else {
            keys[e.key] = false;
        }
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);

    initGame();
    
    const restartBtn = document.getElementById('game-restart');
    if(restartBtn) restartBtn.addEventListener('click', initGame);

    return () => {
        window.removeEventListener("keydown", handleKey);
        window.removeEventListener("keyup", handleKey);
        if(restartBtn) restartBtn.removeEventListener('click', initGame);
        cancelAnimationFrame(animationFrameId);
        clearInterval(spawnInterval);
        clearInterval(timer);
        if(audioCtx) audioCtx.close();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap'); .fish-game-font { font-family: 'Orbitron', monospace; }`}</style>
        <div className="relative w-full max-w-2xl bg-[#1a1a2e] border-2 border-[#00e5ff] rounded-2xl p-6 text-[#f0f8ff] fish-game-font flex flex-col items-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-[#00e5ff] hover:text-white cursor-pointer"><X size={24}/></button>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00e5ff] to-[#ffeb3b] bg-clip-text text-transparent mb-1">🐟 Fish & Worm Polarity</h2>
            <p className="text-xs text-[#64b5f6] mb-4">Space: Switch Polarity | Arrows: Move | Goal: Eat Opposite Polarity</p>
            <div className="flex justify-between w-full max-w-[500px] mb-4 text-sm font-bold">
                <div className="text-[#ff6b6b]">Lives: <span id="game-lives">❤️❤️❤️</span></div>
                <div className="text-[#00e5ff]">Score: <span id="game-score">0</span></div>
                <div className="text-[#ffeb3b]">Time: <span id="game-time">30</span></div>
            </div>
            <canvas ref={canvasRef} width={500} height={400} className="w-full max-w-[500px] h-auto bg-[#0a0a0a] border-2 border-[#1de9b6] rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] cursor-crosshair"></canvas>
            <div id="game-status" className="mt-4 text-[#ffeb3b] font-bold text-lg h-6"></div>
            <button id="game-restart" className="mt-4 px-6 py-2 bg-gradient-to-r from-[#00e5ff] to-[#1de9b6] text-black font-bold rounded-full hover:scale-105 transition-transform hidden cursor-pointer">Restart Game</button>
        </div>
    </div>
  );
};

// --- PAGE COMPONENT ---
export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal"); 
  const fileInputRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false); 
  const [showGameModal, setShowGameModal] = useState(false); 

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

  const [user, setUser] = useState({
    username: "epin_chill", 
    fullName: "Epin",       
    email: "epin@student.binus.ac.id", 
    avatar: "https://i.pravatar.cc/150?img=12",
    birthday: "12 October 2004", 
    gender: "Male",              
  });

  const [formData, setFormData] = useState(user);
  const stats = [
    { label: "Streak", value: "12 Days", icon: <Trophy className="w-5 h-5 text-yellow-500" />, bg: "bg-yellow-100" },
    { label: "Entries", value: "45 Notes", icon: <BookOpen className="w-5 h-5 text-blue-500" />, bg: "bg-blue-100" },
    { label: "Stress", value: "Low", icon: <Activity className="w-5 h-5 text-green-500" />, bg: "bg-green-100" },
  ];
  const [savedItems, setSavedItems] = useState([
    { id: 1, text: "Every small step counts towards peace.", category: "Mindfulness", date: "2 mins ago" },
    { id: 2, text: "You don't have to be productive all the time. Just breathe.", category: "Self Care", date: "1 day ago" },
  ]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData({ ...formData, [name]: value }); };
  const handleSaveProfile = () => { setUser(formData); showNotification("Profile updated successfully!"); };
  const handleImageClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, avatar: imageUrl }); setUser(prev => ({ ...prev, avatar: imageUrl })); showNotification("Profile picture updated!");
    }
  };
  const handleUnsave = (id) => { setSavedItems(savedItems.filter(item => item.id !== id)); showNotification("Item removed", "info"); };
  const handleEmailChangeRequest = () => { if (window.confirm("Changing email requires verification. Do you want to proceed?")) alert("Redirecting to email verification..."); };
  const handleLogout = () => { if (window.confirm("Are you sure you want to log out?")) window.location.href = "/login"; };

  // --- TRIGGER LANGSUNG SAAT INPUT 04:04 ---
  const handleNotifChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Update state agar input terisi
    setNotifSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));

    // Trigger Game jika waktunya 04:04
    // Kita TIDAK menutup showNotifModal di sini, jadi modal settings tetap ada di bawah game
    if (name === "reminderTime" && value === "04:04") {
        setShowGameModal(true);
    }
  };

  // --- SAVE PREFERENCE NORMAL ---
  const saveNotifSettings = () => {
    setShowNotifModal(false);
    showNotification("Notification preferences saved!");
  };

  const handlePasswordChangeInput = (e) => { const { name, value } = e.target; setPasswordForm({ ...passwordForm, [name]: value }); };
  const handleSubmitPasswordChange = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) { showNotification("Please fill in all fields", "error"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showNotification("New passwords do not match!", "error"); return; }
    setShowPasswordModal(false); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); showNotification("Password changed successfully!");
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10 font-sans" style={{ background: `linear-gradient(135deg, #FFF3E0 0%, #eaf2ff 50%, #e3edff 100%)`, backgroundAttachment: "fixed" }}>
      <Navbar />

      {/* EASTER EGG GAME MODAL (z-index 200 agar di atas notif modal) */}
      {showGameModal && <FishGameModal onClose={() => setShowGameModal(false)} />}

      {/* TOAST */}
      {notification && (
        <div className="fixed top-24 right-4 z-[100] animate-bounce-in">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${notification.type === "success" ? "bg-white text-green-600 border-green-100" : notification.type === "error" ? "bg-white text-red-600 border-red-100" : "bg-white text-blue-600 border-blue-100"}`}>
            {notification.type === "success" ? <CheckCircle className="w-5 h-5"/> : notification.type === "error" ? <X className="w-5 h-5"/> : <Heart className="w-5 h-5"/>}
            <span className="font-bold">{notification.message}</span>
          </div>
        </div>
      )}

      {/* NOTIF MODAL (z-index 50) */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-white/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500" /> Notifications</h3>
                    <button onClick={() => setShowNotifModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-full text-blue-600"><Smartphone className="w-5 h-5" /></div><div><p className="font-bold text-gray-800">Daily Reminder</p><p className="text-xs text-gray-500">Remind me to check-in</p></div></div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="dailyReminder" checked={notifSettings.dailyReminder} onChange={handleNotifChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {notifSettings.dailyReminder && (
                        <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4" /><span className="text-sm font-semibold">Time</span></div>
                            <input type="time" name="reminderTime" value={notifSettings.reminderTime} onChange={handleNotifChange} className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"/>
                        </div>
                    )}
                    <div className="h-px bg-gray-100"></div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><div className="bg-purple-100 p-2 rounded-full text-purple-600"><Mail className="w-5 h-5" /></div><div><p className="font-bold text-gray-800">Weekly Report</p><p className="text-xs text-gray-500">Receive summary via email</p></div></div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="emailUpdates" checked={notifSettings.emailUpdates} onChange={handleNotifChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                    {/* BUTTON SAVE PREFERENCES (NORMAL) */}
                    <button onClick={saveNotifSettings} className="w-full mt-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all cursor-pointer transform active:scale-95">Save Preferences</button>
                </div>
            </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-white/50">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-500" /> Change Password</h3><button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><X className="w-6 h-6" /></button></div>
                <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-600 ml-1">Current Password</label><div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChangeInput} placeholder="Enter current password" className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"/></div></div>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-600 ml-1">New Password</label><div className="relative"><Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChangeInput} placeholder="Enter new password" className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"/></div></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-600 ml-1">Confirm New Password</label><div className="relative"><Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChangeInput} placeholder="Re-enter new password" className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"/></div></div>
                    <button type="submit" className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all cursor-pointer transform active:scale-95">Update Password</button>
                </form>
            </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-4 pt-24 md:pt-28">
        {/* Profile Header */}
        <div className="relative bg-white/60 backdrop-blur-xl border border-white/40 rounded-[30px] p-6 md:p-10 shadow-xl overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="relative group">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden"><img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /></div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/><button onClick={handleImageClick} className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-all cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                </div>
                <div className="text-center md:text-left flex-1"><h1 className="text-3xl font-extrabold text-gray-800">{user.fullName}</h1><p className="text-gray-500 font-medium mb-1">@{user.username}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200/60">
                {stats.map((stat, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-2">
                        <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center mb-2`}>{stat.icon}</div>
                        <span className="text-lg font-bold text-gray-800">{stat.value}</span><span className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
            <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-2xl flex gap-2 border border-white/30 shadow-sm overflow-x-auto">
                {[{ id: "personal", label: "Personal", icon: <User className="w-4 h-4" /> },{ id: "bookmark", label: "Bookmark", icon: <Bookmark className="w-4 h-4" /> }, { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> }].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? "bg-white text-blue-600 shadow-md scale-105" : "text-gray-500 hover:text-gray-700 hover:bg-white/30"}`}>{tab.icon} {tab.label}</button>
                ))}
            </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in-up pb-20">
            {activeTab === "personal" && (
                <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-[24px] p-6 md:p-8 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Personal Details</h3>
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-600 ml-1">Username</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span><input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all" /></div></div>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-600 ml-1">Full Name</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.fullName} readOnly className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100/80 border border-transparent text-gray-500 cursor-not-allowed select-none" /></div></div>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-600 ml-1">Email Address</label><div className="relative flex items-center gap-2"><div className="relative flex-1"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" value={formData.email} readOnly className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100/80 border border-transparent text-gray-500 cursor-not-allowed select-none" /></div><button onClick={handleEmailChangeRequest} className="px-4 py-3 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap">Change</button></div></div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><label className="text-sm font-bold text-gray-600 ml-1">Birthday</label><div className="relative"><Cake className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.birthday} readOnly className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100/80 border border-transparent text-gray-500 cursor-not-allowed select-none" /></div></div>
                             <div className="space-y-2"><label className="text-sm font-bold text-gray-600 ml-1">Gender</label><div className="relative"><Smile className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={formData.gender} readOnly className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100/80 border border-transparent text-gray-500 cursor-not-allowed select-none" /></div></div>
                        </div>
                        <div className="pt-4 flex justify-end"><button onClick={handleSaveProfile} className="px-8 py-3 bg-[#F2994A] hover:bg-[#e08a3e] text-white font-bold rounded-xl shadow-lg hover:shadow-orange-200 transition-all cursor-pointer transform active:scale-95">Save Changes</button></div>
                    </form>
                </div>
            )}
            {activeTab === "bookmark" && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">{savedItems.map((item) => (<div key={item.id} className="bg-white/70 backdrop-blur-sm p-6 rounded-[24px] border border-white/50 shadow-sm hover:shadow-md transition-all relative"><div className="flex justify-between items-start mb-3"><span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">{item.category}</span><button onClick={() => handleUnsave(item.id)} className="text-orange-500 hover:scale-110 transition-transform cursor-pointer"><Bookmark className="w-5 h-5 fill-current" /></button></div><p className="text-gray-800 font-medium italic text-lg mb-4">"{item.text}"</p></div>))}</div>
                    <div className="flex justify-center"><Link to="/motivation" className="px-6 py-3 rounded-xl border-2 border-dashed border-orange-300 text-orange-600 font-bold hover:bg-orange-50 hover:border-orange-500 transition-all flex items-center gap-2"><Plus className="w-5 h-5" />Add More Bookmarks</Link></div>
                </div>
            )}
            {activeTab === "settings" && (
                <div className="space-y-4">
                     <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-[24px] overflow-hidden shadow-lg p-2">
                        <button onClick={() => setShowNotifModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-white/50 rounded-xl transition-colors cursor-pointer group"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Bell className="w-5 h-5" /></div><div className="text-left"><h4 className="font-bold text-gray-800">Notifications</h4></div></div><ChevronRight className="w-5 h-5 text-gray-400" /></button>
                        <div className="h-px bg-gray-100 mx-4"></div>
                        <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-white/50 rounded-xl transition-colors cursor-pointer group"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Lock className="w-5 h-5" /></div><div className="text-left"><h4 className="font-bold text-gray-800">Change Password</h4></div></div><ChevronRight className="w-5 h-5 text-gray-400" /></button>
                     </div>
                     <button onClick={handleLogout} className="w-full bg-white/80 border border-red-100 p-4 rounded-[24px] flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 cursor-pointer"><LogOut className="w-5 h-5" /> Log Out</button>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}