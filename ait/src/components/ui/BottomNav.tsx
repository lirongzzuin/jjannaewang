import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", icon: "home", label: "홈" },
  { to: "/feed", icon: "local_fire_department", label: "딜" },
  { to: "/search", icon: "search", label: "검색" },
  { to: "/tips", icon: "lightbulb", label: "꿀팁" },
  { to: "/ranking", icon: "emoji_events", label: "랭킹" },
  { to: "/profile", icon: "person", label: "MY" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-app -translate-x-1/2 border-t border-slate-100 bg-white/95 px-1 pb-6 pt-2 backdrop-blur-md">
      {navItems.map((item) => {
        const isActive =
          pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? "text-primary" : "text-slate-400"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${isActive ? "fill-icon" : ""}`}
            >
              {item.icon}
            </span>
            <p
              className={`text-[10px] leading-normal ${isActive ? "font-bold" : "font-medium"}`}
            >
              {item.label}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}
