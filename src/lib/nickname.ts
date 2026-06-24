import { containsBannedWords } from '@/lib/moderation';

const ADJ = ['알뜰한', '짠내나는', '꼼꼼한', '똑똑한', '부지런한', '야무진', '절약왕', '실속있는'];
const NOUN = ['너구리', '다람쥐', '고양이', '펭귄', '수달', '햄스터', '여우', '토끼', '곰돌이'];

/** Friendly random default nickname, e.g. "알뜰한너구리1234". */
export function randomNickname(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${a}${n}${num}`;
}

export interface NicknameCheck {
  ok: boolean;
  value?: string;
  error?: string;
}

/** Validate + normalize a user-entered nickname. */
export function validateNickname(input: unknown): NicknameCheck {
  if (typeof input !== 'string') return { ok: false, error: '닉네임을 입력해주세요' };
  const value = input.trim().replace(/\s+/g, ' ');
  if (value.length < 2) return { ok: false, error: '닉네임은 2자 이상이어야 해요' };
  if (value.length > 12) return { ok: false, error: '닉네임은 12자 이하여야 해요' };
  if (containsBannedWords(value)) return { ok: false, error: '사용할 수 없는 단어가 포함되어 있어요' };
  return { ok: true, value };
}
