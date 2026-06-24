import { getLevelInfo } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

export default function LevelBadge({ level, size = 'md', showTitle = false }: LevelBadgeProps) {
  const info = getLevelInfo(level);

  const ringColors = [
    'border-slate-300', // 1
    'border-slate-400', // 2
    'border-amber-600',  // 3
    'border-amber-500',  // 4
    'border-yellow-500', // 5
    'border-yellow-400', // 6
    'border-primary',    // 7
    'border-orange-400', // 8
    'border-purple-500', // 9
    'border-primary',    // 10
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        'flex items-center justify-center rounded-full border-2 bg-white',
        ringColors[level - 1] || 'border-primary',
        size === 'sm' && 'w-8 h-8 text-xs',
        size === 'md' && 'w-12 h-12 text-xl',
        size === 'lg' && 'w-16 h-16 text-2xl',
      )}>
        <span>{info.icon}</span>
      </div>
      {showTitle && (
        <div className="text-center">
          <p className="text-[10px] font-bold text-primary uppercase">Lv.{level}</p>
          <p className="text-xs font-bold text-slate-700">{info.title}</p>
        </div>
      )}
    </div>
  );
}
