// src/pages/Tips/Tips.jsx
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";

const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";

const BASE_URL = "https://nostressia-backend2.vercel.app/api/tips";

const Tips = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tips, setTips] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTips, setLoadingTips] = useState(false);

  // ===============================
  // 1) LOAD CATEGORIES FROM API
  // ===============================
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${BASE_URL}/categories`);
        const data = await res.json();

        // Icon mapping berdasarkan nama kategori
        const iconMap = {
          'reading & learning': '📚',
          'reading': '📚',
          'healthy nutrition': '🥗',
          'nutrition': '🥗',
          'quality sleep': '😴',
          'sleep': '😴',
          'meditation & mindfulness': '🧘',
          'meditation': '🧘',
          'mindfulness': '🧘',
          'social connection': '🗣️',
          'social': '🗣️',
          'positive mindset': '🧠',
          'mindset': '🧠',
          'physical activities': '🏃',
          'physical': '🏃',
          'exercise': '🏃',
          'time management': '⏰',
          'creative expression': '🎨',
          'creative': '🎨'
        };

        const mapped = data.map((item) => {
          const categoryNameLower = item.categoryName.toLowerCase();
          const icon = iconMap[categoryNameLower] || '💡'; // fallback ke 💡 jika tidak ada di map

          return {
            id: item.tipCategoryID,
            name: item.categoryName,
            icon: icon
          };
        });

        setCategories(mapped);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // ===============================
  // 2) LOAD TIPS BY CATEGORY
  // ===============================
  const openCategory = async (cat) => {
    setSelectedCategory(cat);
    setLoadingTips(true);

    try {
      const res = await fetch(`${BASE_URL}/by-category/${cat.id}`);
      const data = await res.json();

      const mappedTips = data.map((item) => ({
        id: item.tipID,
        text: item.detail,
      }));

      setTips(mappedTips);
    } catch (err) {
      console.error("Failed loading tips:", err);
      setTips([]);
    } finally {
      setLoadingTips(false);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setTips([]);
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: bgCream,
        backgroundImage: `radial-gradient(at 10% 10%, ${bgCream} 0%, transparent 50%), radial-gradient(at 90% 20%, ${bgPink} 0%, transparent 50%), radial-gradient(at 50% 80%, ${bgLavender} 0%, transparent 50%)`,
        backgroundSize: "200% 200%",
        animation: "gradient-bg 20s ease infinite",
      }}
    >
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>

      <Navbar />

      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 pt-28 md:pt-8 pb-20">

        {/* ============================ */}
        {/* VIEW: CATEGORY LIST */}
        {/* ============================ */}
        {!selectedCategory && (
          <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-[20px] shadow-xl p-6 md:p-8">
            {/* Header */}
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: '#3664BA' }}>
                Stress Management Tips
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Choose a category to explore helpful tips for managing stress
              </p>
            </div>

            {loadingCategories ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3664BA]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => openCategory(cat)}
                    className="group relative bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 md:p-8 
                      hover:bg-white/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left cursor-pointer"
                  >
                    {/* Icon */}
                    <div className="text-5xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {cat.icon}
                    </div>
                    
                    {/* Category Name */}
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-[#3664BA] transition-colors duration-200">
                      {cat.name}
                    </h3>
                    
                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-[#F2994A] group-hover:translate-x-1 transition-all duration-200 text-xl">
                      
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================ */}
        {/* VIEW: TIPS DETAIL */}
        {/* ============================ */}
        {selectedCategory && (
          <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-[20px] shadow-xl p-6 md:p-8">
            
            {/* Header with Back Button */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 hover:bg-white/80 
                         border border-white/30 text-gray-700 font-semibold
                         transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                 Back
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedCategory.icon}</span>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: '#3664BA' }}>
                    {selectedCategory.name}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {tips.length} helpful tips
                  </p>
                </div>
              </div>
            </div>

            {loadingTips ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3664BA]"></div>
              </div>
            ) : (
              <>
                {/* Tips List */}
                <div className="space-y-3">
                  {tips.map((tip, index) => (
                    <div
                      key={tip.id}
                      className="group bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl p-4 md:p-5
                        hover:bg-white/80 hover:shadow-md hover:translate-x-1 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        {/* Number Badge */}
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                   text-white font-bold text-sm shadow-md"
                          style={{ backgroundColor: "#F2994A" }}
                        >
                          {index + 1}
                        </div>
                        
                        {/* Tip Text */}
                        <p className="text-gray-700 leading-relaxed flex-1 pt-1 text-sm md:text-base">
                          {tip.text}
                        </p>
                        
                        {/* Check Icon (appears on hover) */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="text-2xl" style={{ color: '#3664BA' }}></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Note */}
                <div className="mt-8 p-4 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl">
                  <p className="text-sm text-gray-600 text-center">
                    ✨ Remember: Small consistent steps lead to big changes. Start with one tip today!
                  </p>
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default Tips;
