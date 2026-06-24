import { Routes, Route, useLocation } from "react-router-dom";
import BottomNav from "@/components/ui/BottomNav";
import AppInitializer from "@/components/AppInitializer";
import LevelUpWatcher from "@/components/LevelUpWatcher";
import NicknamePrompt from "@/components/NicknamePrompt";

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

export default function App() {
  const { pathname } = useLocation();

  const hideNav =
    NO_NAV_PREFIXES.some((p) =>
      p.endsWith("/") ? pathname.startsWith(p) : pathname === p,
    ) && pathname !== "/tips";

  return (
    <div className="relative mx-auto min-h-screen max-w-app overflow-x-hidden bg-white shadow-xl">
      <AppInitializer />
      <LevelUpWatcher />
      <NicknamePrompt />
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
