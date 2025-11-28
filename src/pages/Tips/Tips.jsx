// src/pages/Tips/Tips.jsx
import { useState } from "react";
import Navbar from "../../components/Navbar";

const Tips = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    {
      id: 'reading',
      name: 'Reading & Learning',
      icon: '📚',
      tips: [
        'Read for 20-30 minutes before bed to calm your mind',
        'Choose books that inspire and motivate you',
        'Join a book club to share insights with others',
        'Keep a reading journal to track your thoughts',
        'Try audiobooks during commutes or workouts',
        'Set realistic reading goals to avoid pressure',
        'Explore different genres to broaden perspectives'
      ]
    },
    {
      id: 'nutrition',
      name: 'Healthy Nutrition',
      icon: '🥗',
      tips: [
        'Drink at least 8 glasses of water daily',
        'Include fruits and vegetables in every meal',
        'Limit caffeine intake, especially in the afternoon',
        'Eat regular meals to maintain energy levels',
        'Choose whole grains over processed foods',
        'Prepare healthy snacks in advance',
        'Practice mindful eating without distractions'
      ]
    },
    {
      id: 'sleep',
      name: 'Quality Sleep',
      icon: '😴',
      tips: [
        'Maintain a consistent sleep schedule',
        'Create a relaxing bedtime routine',
        'Keep your bedroom cool, dark, and quiet',
        'Avoid screens 1 hour before bedtime',
        'Limit naps to 20-30 minutes during the day',
        'Exercise regularly but not close to bedtime',
        'Use relaxation techniques like deep breathing'
      ]
    },
    {
      id: 'meditation',
      name: 'Meditation & Mindfulness',
      icon: '🧘',
      tips: [
        'Start with just 5 minutes of meditation daily',
        'Focus on your breath to anchor your attention',
        'Use guided meditation apps for beginners',
        'Practice mindfulness during daily activities',
        'Create a dedicated quiet space for meditation',
        'Be patient with yourself and your thoughts',
        'Try different meditation styles to find what works'
      ]
    },
    {
      id: 'social',
      name: 'Social Connection',
      icon: '🗣️',
      tips: [
        'Spend quality time with friends and family',
        'Join community groups or clubs with similar interests',
        'Practice active listening in conversations',
        'Reach out to someone you haven\'t talked to in a while',
        'Volunteer for causes you care about',
        'Set healthy boundaries in relationships',
        'Share your feelings with trusted people'
      ]
    },
    {
      id: 'mindset',
      name: 'Positive Mindset',
      icon: '🧠',
      tips: [
        'Practice gratitude by listing 3 things daily',
        'Challenge negative thoughts with evidence',
        'Celebrate small wins and progress',
        'Use positive affirmations each morning',
        'Limit exposure to negative news and social media',
        'Focus on what you can control',
        'Learn from setbacks instead of dwelling on them'
      ]
    }
  ];

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF3E0 40%, #FFEFD5 70%, #eaf2ff 95%)' }}>
      {/* Navbar */}
      <Navbar onPredictClick={() => console.log('Predict clicked')} />
      
      {/* Main Content 
          - pt-24: Jarak atas untuk Mobile (agar pas di bawah navbar fixed)
          - md:pt-8: Jarak atas untuk Desktop
      */}
      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 pt-26 md:pt-8 pb-20">
        
        {/* Category Selection View */}
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

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="group relative bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 md:p-8 
                             hover:bg-white/80 hover:shadow-lg hover:-translate-y-1 
                             transition-all duration-300 text-left cursor-pointer"
                  >
                    {/* Icon */}
                    <div className="text-5xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    
                    {/* Category Name */}
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-[#3664BA] transition-colors duration-200">
                      {category.name}
                    </h3>
                    
                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-[#F2994A] group-hover:translate-x-1 transition-all duration-200">
                      <i className="ph ph-arrow-right text-xl"></i>
                    </div>
                  </button>
                ))}
              </div>
            </div>
        )}

        {/* Tips Detail View */}
        {selectedCategory && (
            <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-[20px] shadow-xl p-6 md:p-8 animate-fade-in-up">
              {/* Header with Back Button */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 hover:bg-white/80 
                           border border-white/30 text-gray-700 font-semibold
                           transition-all duration-200 hover:shadow-md cursor-pointer"
                >
                  <i className="ph ph-arrow-left text-lg"></i>
                  Back
                </button>
                
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCategory.icon}</span>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: '#3664BA' }}>
                      {selectedCategory.name}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {selectedCategory.tips.length} helpful tips
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips List */}
              <div className="space-y-3">
                {selectedCategory.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="group bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl p-4 md:p-5
                             hover:bg-white/80 hover:shadow-md hover:translate-x-1
                             transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Number Badge */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                 text-white font-bold text-sm shadow-md"
                        style={{ backgroundColor: '#F2994A' }}
                      >
                        {index + 1}
                      </div>
                      
                      {/* Tip Text */}
                      <p className="text-gray-700 leading-relaxed flex-1 pt-1 text-sm md:text-base">
                        {tip}
                      </p>
                      
                      {/* Check Icon (appears on hover) */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <i className="ph ph-check-circle text-2xl" style={{ color: '#3664BA' }}></i>
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
            </div>
        )}
      </div>
      
      {/* Tambahan style animasi sederhana */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Tips;