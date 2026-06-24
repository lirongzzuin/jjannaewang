'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[짠내왕 Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background-light flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">😵</div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">앗, 오류가 발생했어요!</h2>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        일시적인 오류입니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          다시 시도
        </button>
        <Link href="/">
          <button className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold">
            홈으로
          </button>
        </Link>
      </div>
    </div>
  );
}
