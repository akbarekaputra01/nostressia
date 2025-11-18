import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import Tips from "../pages/Tips/Tips";
import Motivation from "../pages/Motivations/Motivations";
import Diary from "../pages/Diary/Diary";
import Analytics from "../pages/Analytics/Analytics";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/motivations" element={<Motivation />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
