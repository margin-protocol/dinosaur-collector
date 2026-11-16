// 審核員（湘）的公鑰。由審核頁 review.html 產生金鑰後，把顯示的公鑰貼到這裡。
// 公鑰公開無妨；私鑰只在湘的手機裡。尚未設定時，暗號、審核、約會碼都會暫停。
// 可以放多把：第一把是目前使用的印章，後面是以前的印章（舊章蓋過的暗號、紙條仍然有效）。
export const REVIEWER_PUBLIC_JWKS = [
  { kty: 'EC', crv: 'P-256', x: 'SSQ755TSAjFXw-Yr_r_cbw2YXAChdjH6eZflxIXta-k', y: 'YDi7XQt-3bsMxaYmHYQkgjNKstXqcuv6w13jjxCAtX0' }, // 2026-11-16
  { kty: 'EC', crv: 'P-256', x: 'Usw2J0PN8shLPkTCZcV82sIlp0qcrEQ_bDElPSxNYf0', y: 'mlvpmvRyyflvkSjReeC8k0gaNj1G2ahzbGTyQWgnodM' },
];
export const REVIEWER_PUBLIC_JWK = REVIEWER_PUBLIC_JWKS;
