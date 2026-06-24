import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-light px-6 text-center">
      <div className="mb-3 text-5xl">🫙</div>
      <h1 className="text-lg font-extrabold text-slate-900">페이지를 찾을 수 없어요</h1>
      <p className="mt-1 text-sm text-slate-500">주소가 바뀌었거나 삭제된 페이지예요.</p>
      <Link to="/">
        <button className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-slate-900">
          홈으로 가기
        </button>
      </Link>
    </div>
  );
}
