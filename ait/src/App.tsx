import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "@/components/ui/BottomNav";
import AppInitializer from "@/components/AppInitializer";
import LevelUpWatcher from "@/components/LevelUpWatcher";
import { getToken } from "@/lib/session";

import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Product from "@/pages/Product";
import Tracking from "@/pages/Tracking";
import Feed from "@/pages/Feed";
import FeedWrite from "@/pages/FeedWrite";
import Tips from "@/pages/Tips";
import TipDetail from "@/pages/TipDetail";
import TipWrite from "@/pages/TipWrite";
import Ranking from "@/pages/Ranking";
import Profile from "@/pages/Profile";
import Premium from "@/pages/Premium";
import Onboarding from "@/pages/Onboarding";
import NotFound from "@/pages/NotFound";

// Routes that hide the bottom tab bar (full-screen / focused flows).
const NO_NAV_PREFIXES = ["/onboarding", "/product/", "/feed/write", "/tips/write", "/tips/"];

const SEEN_KEY = "jjannaewang-seen-intro";

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // First launch (no session, not yet seen intro) → show the onboarding/intro
  // screen. Satisfies Toss review (explain the service before login) and gives
  // a login entry point. Guests can still tap "먼저 둘러보기" to browse.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (!seen && !getToken() && pathname === "/") {
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      navigate("/onboarding", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hideNav =
    NO_NAV_PREFIXES.some((p) =>
      p.endsWith("/") ? pathname.startsWith(p) : pathname === p,
    ) && pathname !== "/tips";

  return (
    <div className="relative mx-auto min-h-screen max-w-app overflow-x-hidden bg-white shadow-xl">
      <AppInitializer />
      <LevelUpWatcher />
      <main className={hideNav ? "" : "pb-24"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/feed/write" element={<FeedWrite />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/tips/write" element={<TipWrite />} />
          <Route path="/tips/:id" element={<TipDetail />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
