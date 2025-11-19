// src/components/Navbar.jsx
export default function Navbar() {
  return (
    <nav className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center">
      {/* Logo */}
      <h1 className="text-2xl font-bold text-blue-600 tracking-wide">
        Nostressia
      </h1>

      {/* Menu */}
      <ul className="hidden md:flex gap-8 text-gray-700 font-medium">
        <li className="hover:text-blue-600 cursor-pointer">Dashboard</li>
        <li className="hover:text-blue-600 cursor-pointer">Analytics</li>
        <li className="hover:text-blue-600 cursor-pointer">Tips</li>
        <li className="hover:text-blue-600 cursor-pointer">Motivations</li>
        <li className="hover:text-blue-600 cursor-pointer">Diary</li>
      </ul>

      {/* Button */}
      <button className="hidden md:block bg-blue-600 text-white px-4 py-2 rounded-lg">
        Logout
      </button>

      {/* Mobile Menu Icon */}
      <div className="md:hidden text-2xl cursor-pointer">☰</div>
    </nav>
  );
}
