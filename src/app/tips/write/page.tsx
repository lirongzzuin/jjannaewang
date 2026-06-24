'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TIP_CATEGORIES, TipCategory } from '@/types';

const TITLE_MAX = 40;
const BODY_MAX = 2000;

export default function WriteTipPage() {
  const router = useRouter();
  const [category, setCategory] = useState<TipCategory | ''>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = category && title.trim().length >= 5 && body.trim().length >= 20;

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // user_id comes from auth session in production; using mock for now
          user_id: 'mock-user-001',
          title: title.trim(),
          body: body.trim(),
          category,
          tags,
          link_url: linkUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || '등록에 실패했어요. 다시 시도해주세요.');
        return;
      }
      router.push('/tips');
    } catch {
      alert('네트워크 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = TIP_CATEGORIES.filter(c => c.id !== 'all');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()}>
          <span className="material-symbols-outlined text-slate-600">close</span>
        </button>
        <h1 className="text-base font-extrabold text-slate-900">꿀팁 작성</h1>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
            canSubmit && !isSubmitting
              ? 'bg-primary text-white active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '등록 중...' : '등록'}
        </button>
      </header>

      <div className="p-4 space-y-5">
        {/* Category */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-2">카테고리 <span className="text-red-500">*</span></p>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as TipCategory)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
                  category === cat.id
                    ? 'bg-primary border-primary text-white'
                    : 'border-slate-200 text-slate-600 bg-white'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700">제목 <span className="text-red-500">*</span></p>
            <span className="text-xs text-slate-400">{title.length}/{TITLE_MAX}</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={e => {
              if (e.target.value.length <= TITLE_MAX) setTitle(e.target.value);
            }}
            placeholder="제목을 입력하세요 (최소 5자)"
            className="w-full bg-slate-50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-300 outline-none border border-slate-200 focus:border-primary transition-colors"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700">내용 <span className="text-red-500">*</span></p>
            <span className="text-xs text-slate-400">{body.length}/{BODY_MAX}</span>
          </div>
          <textarea
            value={body}
            onChange={e => {
              if (e.target.value.length <= BODY_MAX) setBody(e.target.value);
            }}
            placeholder="꿀팁을 공유해주세요! (최소 20자)&#10;&#10;자신의 경험이나 정보를 자세하게 적어주세요."
            rows={8}
            className="w-full bg-slate-50 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-300 outline-none border border-slate-200 focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Image attachment */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-2">이미지 첨부 (최대 3장)</p>
          <div className="flex gap-2">
            <button className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-primary hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
              <span className="text-[10px]">추가</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-2">태그 (최대 5개)</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {tags.map(tag => (
              <div key={tag} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1.5 rounded-full">
                #{tag}
                <button onClick={() => removeTag(tag)}>
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </div>
            ))}
          </div>
          {tags.length < 5 && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="#태그 입력 후 Enter"
                className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 outline-none border border-slate-200 focus:border-primary transition-colors"
              />
              <button
                onClick={addTag}
                className="px-3 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl"
              >
                추가
              </button>
            </div>
          )}
        </div>

        {/* Link */}
        <div>
          <p className="text-xs font-bold text-slate-700 mb-2">관련 링크 (선택)</p>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus-within:border-primary transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">link</span>
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-300 outline-none"
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[16px] mt-0.5 shrink-0">info</span>
            <div>
              <p className="text-xs font-bold text-amber-800 mb-1">작성 전 확인해주세요</p>
              <ul className="text-[11px] text-amber-700 space-y-0.5 leading-relaxed">
                <li>· 투자/금융 정보는 개인 경험이며 책임은 본인에게 있습니다</li>
                <li>· 홍보/광고성 게시물은 제재될 수 있습니다</li>
                <li>· 허위 정보 작성 시 커뮤니티에서 제한될 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
