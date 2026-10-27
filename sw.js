/* =====================================================================
 *  라슈 컴퍼니 — 서비스 워커 (앱으로 설치할 때 씁니다)
 * ---------------------------------------------------------------------
 *  네트워크가 먼저입니다. 새 판은 곧바로 받고, 받은 것은 캐시에 남겨 두었다가
 *  인터넷이 끊겼을 때만 꺼내 씁니다. 그래서 «캐시에 옛 engine.js 가 남아 보관함이
 *  잠기는» 일이 없습니다(배포하기.sh 의 캐시 갈이 참고).
 *
 *  ■ 미리 받아 두는 것이 없습니다
 *    그림·소리가 40MB 남짓이라 설치하자마자 통째로 받으면 휴대폰 데이터를 잡아먹습니다.
 *    한 번 연 화면의 것만 캐시에 쌓입니다.
 *
 *  ■ CACHE 이름
 *    배포하기.sh 가 "dev" 자리를 판 번호로 갈아 끼웁니다. 이 파일이 바뀌면 브라우저가
 *    새 서비스 워커를 받고, activate 에서 옛 판의 캐시를 지웁니다.
 *
 *  다른 주소(콘첸트라트 서버 · 글꼴)는 건드리지 않습니다.
 * ===================================================================== */
const CACHE = "rash-company-v2.19.0";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("rash-company-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  /* 소리를 끊어 받는 요청(Range)은 캐시에 못 넣습니다 — 그대로 보냅니다 */
  if (req.headers.has("range")) return;
  e.respondWith(fetch(req).then(res => {
    if (res.status === 200) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
  /* 스크립트는 ?v= 까지 똑같은 것만 꺼냅니다 — 판이 섞이면 보관함이 잠깁니다 */
  }).catch(() => caches.match(req)
    .then(hit => hit || (req.mode === "navigate" ? caches.match("./", { ignoreSearch: true }) : undefined))
    .then(hit => hit || Response.error())));
});
