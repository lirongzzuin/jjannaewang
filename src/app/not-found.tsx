import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-light flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-extrabold text-slate-900 mb-2">페이지를 찾을 수 없어요</h2>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        요청하신 페이지가 삭제됐거나 주소가 변경됐어요.
      </p>
      <Link href="/">
        <button className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform">
          홈으로 돌아가기
        </button>
      </Link>
    </div>
  );
}
