'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: 'home', label: '홈' },
  { href: '/feed', icon: 'local_fire_department', label: '딜' },
  { href: '/search', icon: 'search', label: '검색' },
  { href: '/tips', icon: 'lightbulb', label: '꿀팁' },
  { href: '/ranking', icon: 'emoji_events', label: '랭킹' },
  { href: '/profile', icon: 'person', label: 'MY' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 flex border-t border-slate-100 bg-white/95 backdrop-blur-md px-1 pb-6 pt-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-icon' : ''}`}>
              {item.icon}
            </span>
            <p className={`text-[10px] leading-normal ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}
