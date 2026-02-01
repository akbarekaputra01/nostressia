import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}
