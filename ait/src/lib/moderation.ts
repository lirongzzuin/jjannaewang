const BANNED_WORDS = [
  '사기', '스팸', '광고', '홍보', '협찬', '판매', '구매하세요', '클릭하세요',
  // Add more as needed
];

export function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

export function sanitizeText(text: string): string {
  let sanitized = text.trim();
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  // Limit length
  return sanitized;
}

export const DISCLAIMER_TEXT = '본 게시판의 정보는 유저들의 개인 경험이며, 투자/금융 결정은 본인의 판단과 책임 하에 이루어져야 합니다.';
