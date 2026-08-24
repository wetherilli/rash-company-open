/* =====================================================================
 *  라슈 컴퍼니 — 엔진
 *  (스토리와 캐릭터를 고치려면 data/story.js, data/characters.js 를 여세요.
 *   이 파일은 건드릴 필요가 없습니다.)
 * ===================================================================== */
"use strict";

/* ── 판 번호 ───────────────────────────────────────────────────
 *  내용을 고칠 때마다 올려 주세요.
 *    앞자리  큰 구조가 바뀔 때 (전투 방식이 바뀐다든지)
 *    가운뎃자리  장이 늘거나 기능이 추가될 때
 *    뒷자리  대사·수치 손질
 */
const VERSION = "0.24.0";
const VERSION_NAME = "그밖의 이야기";

/* ── 규칙 상수 ─ 밸런스를 만지려면 여기 ────────────────────── */
const RULE = {
  manageStart: 3,      // 전투 시작 관리력
  manageMax:   5,
  manageGain:  1,      // 턴마다 회복
  guardCut:    0.40,   // 방어 시 받는 피해 비율
  guardManage: 1,      // 방어하면 관리력 +1
  critRate:    0.05,   // 치명타 확률
  critMult:    1.3,    // 치명타 배율
  pullCost:    30,     // 뽑기 1회 비용
  /* 중복으로 나왔을 때 돌려주는 원고료 — 성급마다 다릅니다.
   * 여기 적은 값이 그대로 나갑니다 (아래 moneyGain 을 타지 않습니다).
   * 인격·교육위원·E.G.O 기프트 모두 이 표를 씁니다. */
  dupRefund:   { 1: 3, 2: 15, 3: 50 },
  moneyGain:   0.7,    // 원고료로 들어오는 모든 수입에 곱하는 값 — 황금교본 교환은 제외
  /* 뽑기 확률 — 합이 1이 되게 맞추세요 */
  rate1:       0.83,   // 1성 (전원 보유 상태라 중복으로 나와 환급된다)
  rate2:       0.13,   // 2성
  rate3:       0.03,   // 3성
  rateAdv:     0.01,   // 보조 교육위원
  guaranteePulls: 10,  // 이 횟수만큼 한 번에 뽑으면 ★★ 이상이 하나 확정
  reviveRatio: 0.2,    // 첨삭으로 일어날 때 체력
  healRatio:   0.30,   // 퇴고로 회복하는 양 (최대 체력 대비)
  correctCut:  0.25,   // 교정 대상이 받는 피해 비율
  pushMult:    1.5,    // 독촉 배수
  winHeal:     0.25,   // 전투에 이기면 최대 체력의 이만큼 회복
  scriptedOut: 0.20,   // 각본 전투(lose:"story")에서 적이 물러나는 체력 비율
  battleDelay: 700,    // 전투 시작 시 버튼이 잠기는 시간(ms). 0 이면 바로 시작
  foeFallMs:   1100,   // 적이 쓰러질 때 깜빡이며 사라지는 시간(ms)
  hitFxMs:     420,    // 참격이 그어지고 적이 흔들리는 시간(ms)
  hitFxGap:    170,    // 여럿이 때릴 때 참격 사이 간격(ms)
  /* 한 턴을 풀어 놓는 속도 — 턴제처럼 느껴지도록 끊어 보여 줍니다 */
  allyStepMs:  260,    // 아군이 하나씩 때리는 간격(ms)
  foePauseMs:  420,    // 아군이 다 때린 뒤 적이 되받아치기까지(ms)
  turnGapMs:   380,    // 적이 친 뒤 다음 턴 명령을 받기까지(ms)
  shakeMs:     320,    // 맞을 때 화면이 흔들리는 시간(ms)
  shakeHardMs: 620,    // 강타를 맞을 때(ms)
  gachaFxMs:   900     // 배정에서 ★★★ 이 나왔을 때 빛이 터지는 시간(ms).
                       // 그 뒤로는 누를 때까지 머뭅니다. 0 이면 연출을 아예 안 합니다
};

/* ── 엔케팔린 ──────────────────────────────────────────────────
 *  거울 던전에 들어갈 때 드는 재화입니다.
 *  시간이 지나면 저절로 찹니다. 기준은 이 기기의 시계입니다.
 *
 *    · 2시간마다 1개  (하루를 꼬박 두면 12개가 들어옵니다)
 *    · 가지고 있을 수 있는 것은 max 개까지
 *    · 자정을 넘기면 dailyFill 개까지 한 번에 채워 줍니다
 *
 *  게임을 켜 두지 않아도 시각으로 계산하므로, 며칠 만에 열어도 제대로 찹니다.
 */
const ENK_RULE = {
  name:      "엔케팔린",
  max:       10,                  // 보유 상한
  dailyFill: 10,                  // 자정을 넘겼을 때 채워 주는 양
  everyMs:   2 * 60 * 60 * 1000,  // 1개가 차는 데 걸리는 시간 (2시간)
  cost:      1,                   // 거울 던전 1회 입장에 드는 양
  costHard:  1                    // 하드 거울 던전 1회 입장에 드는 양
};

/* ── 판이 올라갔을 때 ──────────────────────────────────────────
 *  보관함에는 저장할 때의 판 번호가 함께 찍힙니다.
 *  옛 판에서 만든 보관함을 열면, 모아 둔 원고료가 절반만 넘어옵니다.
 *  (인격·교육위원·기프트·황금교본·클리어 기록은 그대로입니다)
 *
 *    compare: "minor"  0.13.x → 0.14.0 처럼 가운뎃자리가 달라질 때만
 *             "patch"  0.13.1 → 0.13.2 처럼 뒷자리만 달라져도
 *             "major"  앞자리가 달라질 때만
 */
const VERSION_RULE = {
  on:        true,
  compare:   "minor",
  moneyKeep: 0.5      // 넘어오는 비율 (0.5 = 절반)
};

function verKey(v) {
  const p = String(v || "0.0.0").split(".");
  const n = VERSION_RULE.compare === "patch" ? 3
          : VERSION_RULE.compare === "major" ? 1 : 2;
  return p.slice(0, n).join(".");
}

const SAVE_KEY  = "rash_company_save_v1";    // 진행 기록 (어디까지 읽었나)
const VAULT_KEY = "rash_company_vault_v1";   // 보관함 (모은 인격 — 회차가 바뀌어도 남는다)

/* ── DOM ──────────────────────────────────────────────────── */
const $log     = document.getElementById("log");
const $stage   = document.getElementById("stage");
const $party   = document.getElementById("party");
const $actions = document.getElementById("actions");
const $modal   = document.getElementById("modal");
const $sheet   = document.getElementById("sheet");
const $chap    = document.getElementById("chaplabel");
const $wallet  = document.getElementById("wallet");

/* ── 상태 ─────────────────────────────────────────────────── */
let S = null;
let SCENES = [];       // 평탄화된 현재 장의 장면들
let MIRROR = null;      // 거울 던전을 돌 때만 채워지는 임시 장

const STARTING_PARTY = ["kim_duhyeon", "lee_hanbeom", "kim_taeseong"];

/* ── 저장소 ────────────────────────────────────────────────────
 *  보통은 브라우저 localStorage 를 씁니다.
 *  파일을 특이한 방식으로 열어 저장소가 막힌 경우(미리보기 창 등)에는
 *  메모리에만 담아 두어, 창을 닫기 전까지는 정상 동작하게 합니다.
 */
const Store = {
  ok: (function () {
    try { localStorage.setItem("__probe", "1"); localStorage.removeItem("__probe"); return true; }
    catch (e) { return false; }
  })(),
  mem: {},
  get(k) { if (this.ok) { try { return localStorage.getItem(k); } catch (e) {} } return this.mem[k] || null; },
  set(k, v) { if (this.ok) { try { localStorage.setItem(k, v); return; } catch (e) {} } this.mem[k] = v; },
  del(k) { if (this.ok) { try { localStorage.removeItem(k); } catch (e) {} } delete this.mem[k]; }
};

/* ── 보관함 ────────────────────────────────────────────────────
 *  담기는 것: 보유 인격 · 보유 교육위원 · 클리어한 장 (+ 장착 상태, 원고료)
 *  읽는 순서: 브라우저 저장소 → 없으면 data/vault.js 의 VAULT_SEED
 */
function vaultToObject() {
  return {
    ids:      Object.keys(S.owned).filter(k => idByKey(k)),
    advisors: Object.keys(S.advisorsOwned || {}),
    advisor:  S.advisor || null,
    gifts:    Object.keys(S.giftsOwned || {}),
    gift:     S.gift || null,
    supports: Object.keys(S.supportsOwned || {}),
    achieved: Object.keys(S.achieved || {}),
    cleared:  Object.keys(S.cleared || {}),
    equip:    S.equip,
    party:    S.party,
    money:    S.money,
    codex:    S.codex,
    enk:      S.enk || null,
    ver:      VERSION
  };
}
function loadVault() {
  let v = null;
  try { v = JSON.parse(Store.get(VAULT_KEY)); } catch (e) { v = null; }
  if (!v && typeof VAULT_SEED !== "undefined" && VAULT_SEED) v = VAULT_SEED;
  if (!v) return null;

  /* 배열로 적힌 것을 다루기 쉬운 표로 바꾼다 */
  const toMap = a => { const m = {}; (a || []).forEach(k => m[k] = true); return m; };
  return {
    owned:    toMap(v.ids),
    advisors: toMap(v.advisors),
    advisor:  v.advisor || null,
    gifts:    toMap(v.gifts),
    gift:     v.gift || null,
    supports: toMap(v.supports),
    achieved: toMap(v.achieved),
    cleared:  toMap(v.cleared),
    equip:    v.equip || {},
    party:    v.party || null,
    money:    v.money,
    codex:    v.codex,
    enk:      v.enk || null,
    ver:      v.ver || null
  };
}
function saveVault() {
  if (!S) return;
  Store.set(VAULT_KEY, JSON.stringify(vaultToObject()));
}
function clearVault() { Store.del(VAULT_KEY); }

/* data/vault.js 에 붙여 넣을 수 있는 형태로 뽑아낸다 */
function vaultExportText() {
  const o = vaultToObject();
  const q = s => '"' + String(s).replace(/"/g, '\\"') + '"';
  const arr = (a, ind) => a.length
    ? "[\n" + a.map(x => ind + "  " + q(x)).join(",\n") + "\n" + ind + "]"
    : "[]";
  const eq = Object.keys(o.equip).filter(k => o.equip[k])
    .map(k => "    " + k + ": " + q(o.equip[k])).join(",\n");
  return "const VAULT_SEED = {\n" +
    "  ids: " + arr(o.ids, "  ") + ",\n" +
    "  advisors: " + arr(o.advisors, "  ") + ",\n" +
    "  advisor: " + (o.advisor ? q(o.advisor) : "null") + ",\n" +
    "  gifts: " + arr(o.gifts, "  ") + ",\n" +
    "  gift: " + (o.gift ? q(o.gift) : "null") + ",\n" +
    "  cleared: " + arr(o.cleared, "  ") + ",\n" +
    "  equip: {\n" + eq + "\n  },\n" +
    "  party: " + arr(o.party, "  ") + ",\n" +
    "  money: " + o.money + ",\n" +
    "  codex: " + (o.codex || 0) + ",\n" +
    "  enk: " + (o.enk
      ? "{ n: " + o.enk.n + ", at: " + o.enk.at + ", day: " + q(o.enk.day) + " }"
      : "null") + ",\n" +
    "  ver: " + q(o.ver) + "\n" +
    "};\n";
}

/* ── 엔케팔린 계산 ─────────────────────────────────────────────
 *  저장된 { n: 남은 개수, at: 마지막으로 정산한 시각, day: 그날 }
 *  과 지금 시각을 비교해 그동안 찬 만큼을 더해 줍니다.
 *  화면을 그릴 때마다 enkSync() 를 부르면 알아서 맞습니다.
 */
function enkDayKey(ms) {
  const d = new Date(ms);
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function enkSync() {
  if (!S) return null;
  const now = Date.now();

  if (!S.enk || typeof S.enk.n !== "number")
    S.enk = { n: ENK_RULE.max, at: now, day: enkDayKey(now) };

  const e = S.enk;
  if (!e.at || e.at > now) e.at = now;              // 시계를 되돌린 경우

  /* 자정을 넘겼으면 한 번 가득 채운다 */
  const today = enkDayKey(now);
  if (e.day !== today) {
    e.day = today;
    if (e.n < ENK_RULE.dailyFill) e.n = ENK_RULE.dailyFill;
    e.at = now;
  }

  /* 2시간마다 1개 */
  if (e.n >= ENK_RULE.max) {
    e.n = Math.min(e.n, ENK_RULE.max);
    e.at = now;
  } else {
    const got = Math.floor((now - e.at) / ENK_RULE.everyMs);
    if (got > 0) {
      e.n = Math.min(ENK_RULE.max, e.n + got);
      e.at = (e.n >= ENK_RULE.max) ? now : e.at + got * ENK_RULE.everyMs;
    }
  }
  return e;
}

function enkCount() { const e = enkSync(); return e ? e.n : 0; }

/* 다음 1개까지 남은 시간 (ms). 이미 가득이면 0 */
function enkNextMs() {
  const e = enkSync();
  if (!e || e.n >= ENK_RULE.max) return 0;
  return Math.max(0, e.at + ENK_RULE.everyMs - Date.now());
}
/* 밀리초를 「1시간 20분」 같은 말로 */
function enkSpan(ms) {
  const m = Math.ceil(ms / 60000);
  if (m >= 60) {
    const h = Math.floor(m / 60), r = m % 60;
    return r ? (h + "시간 " + r + "분") : (h + "시간");
  }
  return m + "분";
}

/* 가득 찰 때까지 남은 시간 (ms). 이미 가득이면 0 */
function enkFullMs() {
  const e = enkSync();
  if (!e || e.n >= ENK_RULE.max) return 0;
  const left = ENK_RULE.max - e.n;                 // 더 채워야 할 개수
  return enkNextMs() + (left - 1) * ENK_RULE.everyMs;
}

function enkNextText() {
  const ms = enkNextMs();
  if (!ms) return "가득 찼습니다";
  let t = enkSpan(ms) + " 뒤 1개";
  const full = enkFullMs();
  if (full > ms) t += "　·　다 차기까지 " + enkSpan(full);
  return t;
}

/* 쓴다. 모자라면 false */
function enkSpend(n) {
  const e = enkSync();
  const need = n || 1;
  if (!e || e.n < need) return false;
  if (e.n >= ENK_RULE.max) e.at = Date.now();   // 가득에서 처음 쓰는 순간부터 다시 잰다
  e.n -= need;
  saveVault();
  return true;
}

/* 눈금 막대 — 유리창과 운전석 아래쪽에 붙습니다 */
function enkBarHTML() {
  const e = enkSync();
  const n = e ? e.n : 0;
  let pips = "";
  for (let i = 0; i < ENK_RULE.max; i++)
    pips += '<i class="' + (i < n ? 'on' : '') + '"></i>';
  return '<div class="enkwrap">' +
           '<span class="enknm">' + ENK_RULE.name + '</span>' +
           '<span class="enkpips">' + pips + '</span>' +
           '<span class="enknum">' + n + ' / ' + ENK_RULE.max + '</span>' +
           '<span class="enksub">' + enkNextText() + '</span>' +
         '</div>';
}

/* 지금 진행 중인 장 — 거울 던전이면 그쪽을 돌려준다 */
function curChapter() { return S && S.mirror ? MIRROR : CHAPTERS[S.ch]; }

function newState() {
  const owned = {};
  for (const who in SINNERS)                     // 1성은 전원 기본 보유
    SINNERS[who].ids.forEach(id => { if (id.star === 1) owned[idKey(who, id)] = true; });

  const v = loadVault();
  if (v && v.owned) for (const k in v.owned) if (idByKey(k)) owned[k] = true;

  const equip = {};
  for (const who in SINNERS) {
    const saved = v && v.equip ? v.equip[who] : null;
    equip[who] = (saved && owned[saved] && idByKey(saved)) ? saved : firstOwned(who, owned);
  }

  /* 지원 작성위원은 업적으로 얻습니다. 얻지 않은 사람은 편성에 서지 못합니다. */
  const supportsOwned = {};
  if (v && v.supports) for (const k in v.supports) if (supportBy(k)) supportsOwned[k] = true;
  const achievedMap = (v && v.achieved) ? v.achieved : {};

  let party = STARTING_PARTY.slice();
  const okMember = (w, i) =>
    isSupport(w) ? (supportBy(w) && supportsOwned[w] && slotTakesSupport(i))
                 : (SINNERS[w] && equip[w]);
  if (v && v.party && v.party.length === 3 && v.party.every(okMember))
    party = v.party.slice();

  const advisorsOwned = {};
  if (v && v.advisors) for (const k in v.advisors) if (advisorById(k)) advisorsOwned[k] = true;
  const advisor = (v && v.advisor && advisorsOwned[v.advisor]) ? v.advisor : null;

  const giftsOwned = {};
  if (v && v.gifts) for (const k in v.gifts) if (giftById(k)) giftsOwned[k] = true;
  const gift = (v && v.gift && giftsOwned[v.gift]) ? v.gift : null;

  /* 옛 판에서 만든 보관함이면 원고료가 절반만 넘어온다 */
  let money = (v && typeof v.money === "number") ? v.money : 120;
  let verNote = null;
  if (v && VERSION_RULE.on && verKey(v.ver) !== verKey(VERSION)) {
    const before = money;
    money = Math.floor(money * VERSION_RULE.moneyKeep);
    verNote = { from: v.ver || null, to: VERSION, before, after: money };
  }

  return {
    ch: 0, sc: 0,
    party,
    equip, owned,
    advisorsOwned, advisor,
    giftsOwned, gift,
    supportsOwned,
    achieved: achievedMap,
    hp: {},                 // who -> 현재 체력 (없으면 최대)
    money,
    verNote,                // 판이 올라갔을 때 한 번 알려 줄 내용
    codex: v && typeof v.codex === "number" ? v.codex : 0,   // 황금교본 — 보관함에 남는다
    enk: (v && v.enk && typeof v.enk.n === "number") ? v.enk : null,  // 엔케팔린 — enkSync() 가 채운다
    cleared: v && v.cleared ? v.cleared : {},
    flags: {},
    battle: null,
    waiting: false,
    ended: false,
    mirror: false,
    mirrorHard: false
  };
}

/* ── 패치 노트 ────────────────────────────────────────────────
 *  내용은 data/patch.js 의 PATCH_NOTES 에 적습니다.
 *  「다음부터 표시하지 않음」을 누르면 그 판에 한해 유리창의 손잡이가 사라지고,
 *  판이 새로 올라가면 다시 나타납니다.
 */
const PATCH_SEEN_KEY = "rash_company_patch_seen";

function patchList() { return (typeof PATCH_NOTES !== "undefined" && PATCH_NOTES) ? PATCH_NOTES : []; }
function patchHidden() { return Store.get(PATCH_SEEN_KEY) === VERSION; }
function patchHide()   { Store.set(PATCH_SEEN_KEY, VERSION); }

function openPatch(back) {
  $modal.classList.add("on");
  const list = patchList();
  let h = '<h2>패 치 노 트</h2>' +
          '<div class="hint">지금 판은 <b>v' + VERSION + ' «' + VERSION_NAME + '»</b> 입니다.</div>';

  if (!list.length) h += '<div class="hint">아직 적어 둔 것이 없습니다.</div>';
  list.forEach((p, i) => {
    h += '<div class="patch' + (i === 0 ? ' now' : '') + '">' +
           '<div class="pv">v' + p.ver + (p.name ? '　«' + p.name + '»' : '') +
             (p.date ? '<span class="pd">' + p.date + '</span>' : '') + '</div>' +
           '<ul class="pl">' +
             (p.lines || []).map(x => '<li>' + x + '</li>').join("") +
           '</ul>' +
         '</div>';
  });

  h += '<div class="modalfoot">' +
         '<button id="ptclose">닫기</button>' +
         '<button id="pthide" class="ghost">다음부터 표시하지 않음</button>' +
       '</div>';
  $sheet.innerHTML = h;

  document.getElementById("ptclose").onclick = () => { closeModal(); if (back) back(); };
  document.getElementById("pthide").onclick = () => {
    patchHide();
    closeModal();
    if (back) back();
  };
}

/* 판이 올라간 것을 한 번 알리고, 보관함에 새 판 도장을 찍는다.
 * 도장을 찍어 두어야 다음 번에 또 깎이지 않습니다. */
function versionNotice() {
  if (!S || !S.verNote) return;
  const n = S.verNote;
  S.verNote = null;
  saveVault();
  divider();
  say("판이 올라갔습니다.  " + (n.from ? "v" + n.from : "옛 판") + " → v" + n.to, "place");
  say("모아 둔 인격·교육위원·기프트·황금교본·클리어 기록은 그대로입니다.", "sys");
  say("다만 " + CURRENCY + "는 " +
      Math.round(VERSION_RULE.moneyKeep * 100) + "% 만 넘어옵니다 — " +
      n.before + " → " + n.after, "bad");
  divider();
}

/* ── 보조 교육위원 찾기 ────────────────────────────────────────
 *  ADVISORS 는 영문 키 없는 목록입니다. 구분은 「제목|이름」으로 합니다.
 */
function advisorList() { return (typeof ADVISORS !== "undefined" && ADVISORS) ? ADVISORS : []; }
function advisorId(a)  { return a ? a.title + "|" + a.name : null; }
function advisorById(id) {
  if (!id) return null;
  return advisorList().find(a => advisorId(a) === id) || null;
}
/* 스토리에서 { t:"advisor", name:"이형우", title:"N사 이단심문관" } 로 가리킨 것을 찾는다 */
function advisorFrom(s) {
  if (!s) return null;
  if (s.title && s.name) return advisorById(s.title + "|" + s.name);
  if (s.who) return advisorById(s.who) ||
                    advisorList().find(a => a.title === s.who || a.name === s.who) || null;
  return null;
}

/* 교육위원이 특정 인격에게만 걸어 주는 보정.
 * effect 에 tag 가 있으면 그 말이 든 인격에게만 atk/def/hp 가 붙습니다. */
function advisorBonusFor(who) {
  const out = { atk: 0, def: 0, hp: 0 };
  const a = advisorById(S.advisor);
  if (!a || !a.effect || !a.effect.tag) return out;

  const id = idByKey(S.equip[who]);
  const title = id ? id.title : "";
  const tags = Array.isArray(a.effect.tag) ? a.effect.tag : [a.effect.tag];
  if (!tags.some(t => title.indexOf(t) >= 0)) return out;

  /* 기프트가 이 교육위원을 북돋우면 함께 배가 된다 */
  let m = 1;
  const g = equippedGift();
  if (g && g.effect && g.effect.advisorName && a.name === g.effect.advisorName)
    m = g.effect.mult || 1;

  out.atk = (a.effect.atk || 0) * m;
  out.def = (a.effect.def || 0) * m;
  out.hp  = (a.effect.hp  || 0) * m;
  return out;
}

/* ── E.G.O 기프트 ──────────────────────────────────────────── */
/* 기프트는 이름이 곧 구분입니다 (예전 영문 id 도 받아 줍니다) */
function giftById(id) {
  if (typeof GIFTS === "undefined" || !id) return null;
  return GIFTS.find(g => g.name === id) || GIFTS.find(g => g.id === id) || null;
}
function giftId(g) { return g ? g.name : null; }
function equippedGift() { return S && S.gift ? giftById(S.gift) : null; }

/* "박수오" 처럼 한글 이름으로 적어도 찾아 줍니다 */
function sinnerKey(x) {
  if (!x) return null;
  if (SINNERS[x]) return x;
  for (const k in SINNERS) if (SINNERS[k].name === x) return k;
  return x;
}

/* 이 기프트가 이 작성위원에게 걸리는가 */
function giftHits(e, who) {
  if (!e) return false;
  if (e.advisorTag) {                       // 그 계열 교육위원을 세웠는가
    const adv = advisorById(S.advisor);
    return !!(adv && adv.title.indexOf(e.advisorTag) >= 0);
  }
  const id = idByKey(S.equip[who]);
  const title = id ? id.title : "";
  const tags = e.tag ? (Array.isArray(e.tag) ? e.tag : [e.tag]) : [];
  if (tags.length && tags.some(t => title.indexOf(t) >= 0)) return true;
  if (e.who && sinnerKey(e.who) === who) return true;
  return false;
}

/* 작성위원 한 명에게 걸리는 기프트 보정 */
function giftBonusFor(who) {
  const out = { atk: 0, def: 0, hp: 0 };
  const g = equippedGift();
  if (!g || !g.effect) return out;
  const e = g.effect;

  if (e.all) {
    out.atk += e.all.atk || 0; out.def += e.all.def || 0; out.hp += e.all.hp || 0;
  }
  if (giftHits(e, who)) {
    out.atk += e.atk || 0; out.def += e.def || 0; out.hp += e.hp || 0;
  }
  return out;
}

/* 방어의 일부를 공격으로 옮기는 기프트 (제3발톱 의리사슬) */
function giftConvertFor(who) {
  const g = equippedGift();
  if (!g || !g.effect || !g.effect.defToAtk) return 0;
  return giftHits(g.effect, who) ? g.effect.defToAtk : 0;
}

function giftCrit()     { const g = equippedGift(); return (g && g.effect && g.effect.crit) || 0; }
function giftCritMult() { const g = equippedGift(); return (g && g.effect && g.effect.critMult) || 0; }

/* ── 보조 교육위원 효과 ────────────────────────────────────── */
function advisorEffect() {
  const a = advisorById(S.advisor);
  const e = (a && a.effect) || {};
  const out = {
    manage:    e.manage    || 0,
    manageMax: e.manageMax || 0,
    gain:      e.gain      || 0,
    /* tag 가 있으면 파티 전체가 아니라 그 인격에게만 걸리므로 여기서는 뺀다 */
    atk:       e.tag ? 0 : (e.atk || 0),
    def:       e.tag ? 0 : (e.def || 0),
    hp:        e.tag ? 0 : (e.hp  || 0),
    revive:    e.revive    || 0,
    correct:   e.correct   || 0,
    push:      e.push      || 0,
    cheap:     e.cheap     || 0,
    crit:      e.crit      || 0,   // 치명타 확률 +
    critMult:  e.critMult  || 0    // 치명타 배율 +
  };

  /* 기프트가 이 교육위원을 북돋우거나, 자원을 더해 준다 */
  const g = equippedGift();
  if (g && g.effect) {
    if (g.effect.advisorName && a && a.name === g.effect.advisorName) {
      const m = g.effect.mult || 1;
      for (const k in out) out[k] *= m;
    }
    if (g.effect.manage) out.manage += g.effect.manage;
  }
  return out;
}
/* 원고료 수입은 전부 이 문을 지나갑니다. RULE.moneyGain 하나로 조절됩니다. */
function earn(n) { return Math.max(1, Math.round(n * RULE.moneyGain)); }

function manageCap()  { return RULE.manageMax + advisorEffect().manageMax; }
function skillCost(base) { return Math.max(1, base - advisorEffect().cheap); }

/* 중복으로 나왔을 때 돌려줄 원고료 — 성급을 넣으면 됩니다 */
function dupRefund(star) {
  const t = RULE.dupRefund;
  if (typeof t === "number") return t;          // 옛 방식(하나로 정해 둔 값)도 받아 줍니다
  return t[star] || t[1] || 0;
}
/* 화면에 적을 때 — 「★ 3　★★ 15　★★★ 50」 */
function dupRefundText() {
  const t = RULE.dupRefund;
  if (typeof t === "number") return t + " 환급";
  return [1, 2, 3].filter(s => t[s] != null)
                  .map(s => stars(s) + " " + t[s]).join("　") + " 환급";
}

/* 치명타 — 지금은 보조 교육위원만 손대지만, 나중에 인격·장비 효과를 더 얹으려면 여기에 더하면 됩니다 */
function critRate() { return RULE.critRate + advisorEffect().crit + giftCrit(); }
function critMult() { return RULE.critMult + advisorEffect().critMult + giftCritMult(); }

/* ── 인격 유틸 ─────────────────────────────────────────────── */
function idKey(who, id)  { return who + "|" + id.star + "|" + id.title; }
function parseKey(key)   { const a = key.split("|"); return { who: a[0], star: +a[1], title: a[2] }; }

function idByKey(key) {
  if (!key) return null;
  const k = parseKey(key);
  const s = SINNERS[k.who];
  if (!s) return null;
  return s.ids.find(i => i.star === k.star && i.title === k.title) || null;
}
/* 인격 고유 수치 — data/characters.js 에 적힌 값을 그대로 씁니다.
 * 값을 안 적은 인격은 성급 평균값으로 대체됩니다. */
function baseStatsOf(key) {
  const id = idByKey(key);
  if (!id) return { atk: 5, def: 2, hp: 30 };
  const base = STAR_BASE[id.star] || STAR_BASE[1];
  return {
    atk: id.atk != null ? id.atk : base.atk,
    def: id.def != null ? id.def : base.def,
    hp:  id.hp  != null ? id.hp  : base.hp
  };
}

/* ── 편성 시너지 ─────────────────────────────────────────────
 *  편성된 작성위원 3명 + 세워둔 보조 교육위원까지, 넷의 이름을 함께 봅니다.
 *  3명이 맞으면 1.75배, 교육위원까지 넷이 맞으면 2배가 됩니다.
 */
function synergyNames(party) {
  const list = (party || S.party)
    .filter(w => w && (isSupport(w) || S.equip[w]))
    .map(w => memberTitle(w))
    .filter(t => t);
  const a = advisorById(S.advisor);
  if (a) list.push(a.title);
  return list;
}

function activeSynergies(party) {
  if (typeof SYNERGIES === "undefined") return [];
  const titles = synergyNames(party);

  const out = [];
  SYNERGIES.forEach(sy => {
    /* tag 는 하나만 적어도 되고, 여러 개를 배열로 적어도 됩니다 */
    const tags = Array.isArray(sy.tag) ? sy.tag : [sy.tag];
    const n = titles.filter(t => tags.some(tg => t.indexOf(tg) >= 0)).length;
    if (n < sy.need) return;
    let scale = n >= 4 ? 2 : n >= 3 ? 1.75 : 1;
    /* 기프트가 이 시너지를 북돋우는 경우 */
    const g = equippedGift();
    if (g && g.effect && g.effect.synergy &&
        (tags.indexOf(g.effect.synergy) >= 0 || g.effect.synergy === sy.name))
      scale *= (g.effect.mult || 1);
    out.push({
      name: sy.name, tag: tags[0], count: n, desc: sy.desc,
      atk: (sy.atk || 0) * scale,
      def: (sy.def || 0) * scale,
      hp:  (sy.hp  || 0) * scale
    });
  });
  return out;
}
function synergyBonus() {
  const b = { atk: 0, def: 0, hp: 0 };
  activeSynergies().forEach(s => { b.atk += s.atk; b.def += s.def; b.hp += s.hp; });
  return b;
}

/* 실제 전투에 쓰이는 수치 — 인격 고유값 × 편성 시너지.
 * 시너지는 '편성된 3명' 의 인격 이름만 보고 계산되므로,
 * 보관함에만 있는 인격은 아무 영향도 주지 않는다. */
function effStats(who) {
  /* 지원 작성위원은 인격이 없고, 수치가 제 줄에 그대로 적혀 있다 */
  const sup = supportBy(who);
  const s = sup ? { atk: sup.atk, def: sup.def, hp: sup.hp } : statsOf(S.equip[who]);
  if (S.party.indexOf(who) < 0) return s;      // 편성 밖이면 시너지 없음
  const b = synergyBonus();
  const a = advisorEffect();                   // 보조 교육위원은 파티 전원에게 걸린다
  const gf = giftBonusFor(who);                // E.G.O 기프트
  const af = advisorBonusFor(who);             // 교육위원이 특정 인격에만 거는 보정
  const atk = Math.round(s.atk * (1 + b.atk + a.atk + gf.atk + af.atk));
  const def = Math.round(s.def * (1 + b.def + a.def + gf.def + af.def));
  const hp  = Math.round(s.hp  * (1 + b.hp  + a.hp  + gf.hp  + af.hp));
  /* 방어의 일부를 공격으로 옮기는 기프트 */
  const conv = giftConvertFor(who);
  return { atk: atk + Math.round(def * conv), def: def, hp: hp };
}

/* 인격 단독 수치 (시너지 미포함) */
function statsOf(key) { return baseStatsOf(key); }
function firstOwned(who, owned) {
  const s = SINNERS[who];
  const list = s.ids.filter(i => owned[idKey(who, i)] && !i.todo);
  if (!list.length) return null;
  list.sort((a, b) => b.star - a.star);
  return idKey(who, list[0]);
}
function ownedIds(who) {
  return SINNERS[who].ids.filter(i => !i.todo && S.owned[idKey(who, i)]);
}
function maxHp(who) { return effStats(who).hp; }
function curHp(who) { return S.hp[who] != null ? S.hp[who] : maxHp(who); }
function setHp(who, v) { S.hp[who] = Math.max(0, Math.min(maxHp(who), Math.round(v))); }
function alive(who) { return curHp(who) > 0; }
function stars(n) { return "★".repeat(n); }
function rnd(n) { return Math.floor(Math.random() * n); }

/* ── 지원 작성위원 ────────────────────────────────────────────
 *  12명 밖에서 손을 빌려주는 사람들. 편성 칸에 「지원|제목|이름」으로 들어갑니다.
 *  인격을 갈아 끼우지 않고, 수치가 data/characters.js 에 그대로 적혀 있습니다.
 */
const SUP_PREFIX = "지원|";
function supportList() { return (typeof SUPPORTS !== "undefined" && SUPPORTS) ? SUPPORTS : []; }
function supportId(s)  { return s ? SUP_PREFIX + s.title + "|" + s.name : null; }
function isSupport(w)  { return typeof w === "string" && w.indexOf(SUP_PREFIX) === 0; }
function supportBy(w) {
  if (!isSupport(w)) return null;
  return supportList().find(s => supportId(s) === w) || null;
}
/* 업적으로 얻었는가 */
let SUP_OPEN = false;
function supportOwned(sp) {
  const id = typeof sp === "string" ? sp : supportId(sp);
  return !!(S && S.supportsOwned && S.supportsOwned[id]);
}

function supportSlot() {
  const n = (typeof SUPPORT_RULE !== "undefined" && SUPPORT_RULE.slot) || 0;
  return n;                                       // 0 이면 아무 칸이나
}
function supportMax() {
  return (typeof SUPPORT_RULE !== "undefined" && SUPPORT_RULE.max != null) ? SUPPORT_RULE.max : 1;
}
/* 그 칸에 지원 작성위원을 세울 수 있는가 (i 는 0부터) */
function slotTakesSupport(i) {
  const n = supportSlot();
  return n === 0 || i === n - 1;
}

/* 편성에 든 사람 하나 — 작성위원이든 지원이든 */
function memberOf(w) {
  if (isSupport(w)) return supportBy(w);
  return SINNERS[w] || null;
}
function memberName(w) {
  const m = memberOf(w);
  return m ? m.name : (w || "");
}
/* 시너지가 보는 이름 — 작성위원은 장착한 인격, 지원은 제 title */
function memberTitle(w) {
  if (isSupport(w)) { const s = supportBy(w); return s ? s.title : ""; }
  const id = idByKey(S.equip[w]);
  return id ? id.title : "";
}

function nameOf(who) {
  if (who === "manager") return CREW.manager.codename;
  if (isSupport(who)) return memberName(who);
  if (SINNERS[who]) return SINNERS[who].name;
  return who;                                     // 원문에 그대로 적힌 이름
}
/* 초상 찾기.
 * 작성위원 → 승무원 → 교육위원 순으로 보고, 그래도 없으면
 * 이름이 들어맞는 적(FOES)의 그림을 빌려 씁니다.
 * 덕분에 "원대한", "김준성" 처럼 이름만 적어도 얼굴이 뜹니다. */
function portraitOf(who) {
  if (!who) return null;
  if (who === "manager") return CREW.manager.portrait;
  if (isSupport(who)) { const s = supportBy(who); return s ? s.portrait : null; }
  if (SINNERS[who])  return SINNERS[who].portrait;
  if (CREW[who])     return CREW[who].portrait;
  { const a = advisorById(who) || advisorList().find(x => x.name === who); if (a) return a.portrait; }

  if (who.length >= 2 && typeof FOES !== "undefined") {
    for (const k in FOES) {
      const f = FOES[k];
      if (f.img && f.name && f.name.indexOf(who) >= 0) return f.img;
    }
  }
  return null;
}

/* ── 출력 ─────────────────────────────────────────────────── */
function say(text, cls) {
  const el = document.createElement("p");
  el.className = cls || "n";
  el.textContent = text;
  $log.appendChild(el);
  $log.scrollTop = $log.scrollHeight;
}
function speak(who, text) {
  const w = document.createElement("p");
  w.className = "who";
  w.textContent = nameOf(who);
  $log.appendChild(w);
  if (text === "TODO" || text == null) say("(대사 미작성)", "todo");
  else say(text, "d");
  const pt = portraitOf(who);
  if (pt) showSpeaker(pt, nameOf(who));
}
function divider() {
  const d = document.createElement("div");
  d.className = "divider";
  $log.appendChild(d);
}
function clearLog() { $log.innerHTML = ""; }

/* ── 무대 ─────────────────────────────────────────────────── */
/* 그림 경로 → 실제 주소.
 * 완전판(그림까지 한 파일에 담은 판)에서는 ASSET_DATA 에서 꺼내 씁니다. */
function assetURL(p) {
  if (!p) return p;
  if (typeof ASSET_DATA !== "undefined" && ASSET_DATA[p]) return ASSET_DATA[p];
  return p;
}

/* ── 무대 ──────────────────────────────────────────────────────
 *  칸은 늘 같은 높이(--stageh)이고, 그 안이 두 겹입니다.
 *    배경  — 지금 있는 장소 그림. 칸을 꽉 채웁니다.
 *    사람  — 그 위에 얹히는 초상. 대사하는 사람은 왼쪽, 적은 가운데.
 *  배경은 장면이 바뀔 때만 갈리고, 사람만 자주 바뀝니다.
 */
let CUR_BG   = null;    // 지금 깔려 있는 배경 그림
let CUR_NAME = null;    // 칸 아래에 적을 지명

/* 배경은 새 그림을 줄 때만 갈립니다.
 * 그림 없는 장면(img:null)이 와도 깔려 있던 배경을 지우지 않습니다 —
 * 초상과 적은 배경 '위에' 겹쳐 서는 것이지, 각자 자리를 차지하는 것이 아니니까요.
 * 정말로 비우려면 setBackdrop(false) 로 부릅니다. */
function setBackdrop(src, placeName) {
  if (src) CUR_BG = src;
  else if (src === false) CUR_BG = null;
  if (placeName !== undefined) CUR_NAME = placeName || null;
  drawStage(null, null, null);
}

/* fig  : 배경 위에 얹을 그림 (없으면 배경만)
 * side : "left" 대사하는 사람 · "mid" 적
 * tag  : 그림에 붙일 이름 (지금은 화면에 쓰지 않고 alt 로만)      */
function drawStage(fig, side, tag) {
  /* 칸의 높이는 그림에 따라 달라지지 않습니다.
   * 그릴 것이 하나도 없어도 칸은 그대로 있고, 안이 비어 있을 뿐입니다.
   * (그림이 사라질 때마다 화면이 덜컥 접히는 일이 없도록) */
  $stage.className = "on";
  /* assets/scene 의 그림은 배경이라 칸을 꽉 채웁니다.
   * assets/logo 의 그림은 흰 종이에 그린 것이라, 칸 바탕도 흰색으로 깔고 담습니다.
   * 그 밖의 그림은 검은 바탕에 잘리지 않게 담습니다. */
  const wide  = !!CUR_BG && CUR_BG.indexOf("assets/scene") === 0;
  const paper = !!CUR_BG && CUR_BG.indexOf("assets/logo") === 0;
  let html = '<div class="scenebox' + (paper ? ' paper' : '') + '">';
  if (CUR_BG)
    html += '<img class="scene' + (wide ? '' : ' fit') + '" src="' + assetURL(CUR_BG) + '" alt="" ' +
            'onerror="this.style.display=\'none\'">';
  if (fig)
    html += '<div class="figwrap ' + (side === "mid" ? "mid" : "left") + '">' +
              '<img id="figure" src="' + assetURL(fig) + '" alt="' + (tag || "") + '" ' +
              'onerror="this.style.display=\'none\'"></div>';
  /* 지명은 칸 안쪽 아래에 얹습니다 — 밖에 두면 있고 없고에 따라 높이가 흔들립니다 */
  if (CUR_NAME) html += '<div class="placename">' + CUR_NAME + '</div>';
  html += '</div>';
  $stage.innerHTML = html;
}

/* 무대를 아예 접는다 — 지금은 출입 코드 화면에서만 씁니다 */
function hideStage() { $stage.className = ""; $stage.innerHTML = ""; CUR_BG = null; CUR_NAME = null; }

/* 대사하는 사람을 왼쪽에 세운다 */
function showSpeaker(src, tag) { drawStage(src, "left", tag); }
/* 적을 가운데에 세운다 */
function showFoe(src, tag)     { drawStage(src, "mid", tag); }

/* 맞는 연출 — 참격이 한 번 그어지고, 적이 좌우로 흔들리며 점멸한다 */
function foeHit(delay) {
  setTimeout(() => {
    const box = document.querySelector(".scenebox");
    if (!box) return;

    const fig = document.getElementById("figure");
    if (fig) {
      fig.classList.remove("hit");
      void fig.offsetWidth;               // 잇달아 맞아도 다시 흔들리도록 되감는다
      fig.classList.add("hit");
      setTimeout(() => { const f = document.getElementById("figure");
                         if (f) f.classList.remove("hit"); }, RULE.hitFxMs);
    }

    const s = document.createElement("img");
    s.className = "slashfx";
    s.src = assetURL("assets/fx/slash.png");
    s.onerror = function () { if (this.parentNode) this.parentNode.removeChild(this); };
    box.appendChild(s);
    setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, RULE.hitFxMs);
  }, delay || 0);
}

/* 쓰러지는 연출 — 깜빡이다 살짝 내려앉으며 사라진다 */
function foeFalls(after) {
  const el = document.getElementById("figure");
  if (!el) { if (after) after(); return; }
  el.classList.remove("hit");
  el.classList.add("gone");
  setTimeout(() => {
    const e2 = document.getElementById("figure");
    if (e2) e2.parentNode.removeChild(e2);
    if (after) after();
  }, RULE.foeFallMs);
}

/* 예전 이름 — 부르던 곳이 많아 그대로 남겨 둡니다.
 * 그림 하나만 넘기면 그것이 배경이 됩니다. */
function showCard(src, tag, placeName, placeDesc) {
  CUR_NAME = placeName || null;
  setBackdrop(src, placeName || null);
}

function renderHeader() {
  const c = curChapter();
  $chap.textContent = (c ? (c.no + "  " + c.title + (c.subtitle ? "  ─  " + c.subtitle : "")) : "")
                      + "   v" + VERSION;
  let right = (S.battle ? '<span class="fighting">전투 중</span>' : "") +
              CURRENCY + " <b>" + S.money + "</b>";
  if (S.codex) right += "   황금교본 <b>" + S.codex + "</b>";
  /* 관리력은 머리에 숫자로 적지 않고, 아래쪽 눈금으로 보여 줍니다 (renderManage) */
  $wallet.innerHTML = right;
}

function renderParty() {
  $party.innerHTML = "";
  S.party.forEach(who => {
    if (!who) return;
    const id = idByKey(S.equip[who]);
    const st = effStats(who);
    const hp = curHp(who), mx = maxHp(who);
    const b = S.battle;
    const cmd = b && b.cmds[who];
    /* 카드는 세 가지를 서로 다르게 보여 준다.
     *   차례   — 지금 이 사람의 명령을 고르는 중 (금색 테두리)
     *   노려짐 — 이번 턴 적이 노리는 사람 (붉은 테두리 + 점선)
     *   정함   — 이미 명령을 골라 둔 사람 (초록 테두리, 흐리게) */
    const aimed  = !!(b && b.aim === who && hp > 0);
    const acting = !!(b && b.cur === who && hp > 0);
    const ready  = !!(cmd && !acting && hp > 0);
    const sup    = supportBy(who);
    const div = document.createElement("div");
    div.className = "pcard" + (hp <= 0 ? " down" : "") +
                    (sup ? " sup" : "") +
                    (acting ? " acting" : "") +
                    (aimed  ? " aimed"  : "") +
                    (ready ? (cmd === "guard" ? " cmd-guard" : " cmd-attack") : "");
    let mark = "";
    if (hp <= 0)      mark = ' <span style="color:#c8403a">쓰러짐</span>';
    else {
      if (acting) mark += ' <span class="turntag">차례</span>';
      if (aimed)  mark += ' <span class="aimtag">노려짐' + (b.heavy ? '·강타' : '') + '</span>';
      if (ready)  mark += ' <span class="readytag">' +
                          (cmd === "guard" ? "방어" : "공격") + '</span>';
    }
    if (sup) mark += ' <span class="suptag">지원</span>';
    div.innerHTML =
      '<div class="nm">' + memberName(who) + mark + '</div>' +
      '<div class="id"><span class="star">' +
        (sup ? stars(sup.star) : (id ? stars(id.star) : "")) + '</span> ' +
        (sup ? sup.title : (id ? id.title : "인격 없음")) + '</div>' +
      '<div class="hpbar"><i style="width:' + Math.round(hp / mx * 100) + '%"></i></div>' +
      /* 좁은 화면에서는 ostat(공·방)을 감춥니다 — 체력만 남깁니다 */
      /* 고른 명령은 이름 옆 «공격»·«방어» 로 이미 보입니다.
       * 아래에 줄을 하나 더 붙이면 카드 높이가 들쭉날쭉해져 눌리는 자리가 흔들립니다. */
      '<div class="st"><span class="hpnum">' + hp + ' / ' + mx + '</span>' +
        '<span class="ostat">　공 ' + st.atk + '　방 ' + st.def + '</span></div>';
    $party.appendChild(div);
  });
}

function buttons(list) {
  $actions.classList.remove("mid");   // 가운데 정렬은 출입 코드 화면에서만
  showEnkBar(false);          // 눈금은 유리창에서만 — 필요한 곳에서 다시 켭니다
  $actions.innerHTML = "";
  list.forEach(b => {
    if (!b) return;
    const el = document.createElement("button");
    el.textContent = b.label + (b.key ? "  (" + b.key.toUpperCase() + ")" : "");
    if (b.key) el.dataset.key = b.key.toLowerCase();
    if (b.cls) el.className = b.cls;
    if (b.disabled) el.disabled = true;
    else el.onclick = b.fn;
    $actions.appendChild(el);
  });
}

/* ── 배정에서 ★★★ 이 나왔을 때 ─────────────────────────────────
 *  결과를 바로 보여주지 않고, 한 번 크게 빛낸 뒤에 펼칩니다.
 *  길이는 RULE.gachaFxMs 에서 고칩니다. 0 으로 두면 그냥 넘어갑니다.
 */
function starFlash(star, line, after) {
  if (!RULE.gachaFxMs) { if (after) after(); return; }
  const el = document.createElement("div");
  el.className = "flashfx";
  el.innerHTML = '<div class="ring"></div>' +
                 '<div class="beam"></div>' +
                 '<div class="txt"><span class="star">' + stars(star) + '</span>' +
                   (line ? '<div class="line">“' + line + '”</div>' : '') +
                 '</div>' +
                 '<div class="tap">눌러서 계속</div>';
  $modal.appendChild(el);

  /* 빛이 터진 뒤에는 그대로 머물러 있다가, 누르면 결과로 넘어갑니다. */
  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    document.removeEventListener("keydown", onKey, true);
    if (el.parentNode) el.parentNode.removeChild(el);
    if (after) after();
  };
  const onKey = (e) => {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); close(); }
  };

  /* 터지는 동안 눌린 것은 무시합니다 — 못 보고 지나치지 않도록 */
  setTimeout(() => {
    if (!el.parentNode) return;
    el.classList.add("hold");
    el.onclick = close;
    document.addEventListener("keydown", onKey, true);
  }, RULE.gachaFxMs);
}

/* 이번 묶음에서 처음 손에 넣은 ★★★ — 없으면 null.
 * 중복으로 나온 것은 축하할 일이 아니라 세지 않습니다. */
function bigWin(out) {
  return (out || []).find(r =>
    r.isNew && (r.kind === "adv" ? r.adv.star : r.id.star) >= 3) || null;
}

/* 빛날 때 함께 보여 줄 한 줄.
 * 인격은 그 인격에 적힌 짧은 말(note)만 보여 줍니다 — 이름은 뒤에 결과로 나오니까요. */
function bigWinLine(r) {
  if (!r) return null;
  if (r.kind === "adv") return r.adv.title + " " + r.adv.name;
  return r.id.note || null;
}

/* ── 단축키 ────────────────────────────────────────────────────
 *  손잡이에 key 를 적어 두면 그 글쇠로도 눌립니다. 예) key: "p"
 *  창이 떠 있거나, 글자를 치는 중이거나, 잠긴 손잡이면 듣지 않습니다.
 *  늘리려면 손잡이 쪽에 key 한 줄만 더하면 됩니다.
 */
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
  if ($modal && $modal.classList.contains("on")) return;      // 창이 떠 있을 때
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

  const k = String(e.key || "").toLowerCase();
  if (!k || k.length !== 1) return;
  const btn = $actions.querySelector('button[data-key="' + k + '"]');
  if (!btn || btn.disabled) return;
  e.preventDefault();
  btn.click();
});
/* 엔케팔린 눈금을 화면 아래에 켜고 끈다 */
function showEnkBar(on) {
  const box = document.getElementById("enk");
  if (!box) return;
  box.innerHTML = on ? enkBarHTML() : "";
}

/* 발동 중인 편성 시너지 — 전투 중에도 항상 보인다 */
function renderSynergy() {
  const box = document.getElementById("synergy");
  if (!box) return;

  /* 세워둔 보조 교육위원과 지닌 기프트 — 별과 이름만 */
  let head = "";
  const a = advisorById(S.advisor);
  if (a) head += '<span class="adv"><span class="star">' + stars(a.star) + '</span> ' +
                 a.title + ' ' + a.name + '</span>';
  const gf = equippedGift();
  if (gf) head += '<span class="gift"><span class="star">' + stars(gf.star) + '</span> ' +
                  gf.name + '</span>';

  const list = activeSynergies();
  if (!list.length) {
    box.innerHTML = head +
      '<span class="none">발동 중인 시너지 없음 — 비슷한 이름의 인격을 함께 편성해 보십시오.</span>';
    return;
  }
  box.innerHTML = head + list.map(s => {
    const eff = [];
    if (s.atk) eff.push("공 +" + Math.round(s.atk * 100) + "%");
    if (s.def) eff.push("방 +" + Math.round(s.def * 100) + "%");
    if (s.hp)  eff.push("체 +" + Math.round(s.hp  * 100) + "%");
    return '<span class="syn' + (s.count >= 3 ? ' full' : '') + '" title="' + (s.desc || "") + '">' +
             '<b>' + s.name + '</b>' +
             '<span class="cnt">' + s.count + '명' + (s.count >= 3 ? ' 완전' : '') + '</span>' +
             '<span class="eff">' + eff.join(" ") + '</span>' +
           '</span>';
  }).join("");
}

function render() { renderMood(); renderHeader(); renderParty(); renderSynergy(); renderManage(); }

/* 전투 중에는 화면 전체가 붉게 가라앉는다 — 색은 index.html 의 body.battling */
function renderMood() {
  document.body.classList.toggle("battling", !!(S && S.battle));
}

/* ── 관리력 눈금 ──────────────────────────────────────────────
 *  전투 중에만, 화면 아래쪽(버튼 바로 위)에 눈금으로 보여 줍니다.
 *  칸 하나가 관리력 1. 다음 능력에 몇 칸이 드는지 옆에 적어 둡니다.
 */
function renderManage() {
  const box = document.getElementById("manage");
  if (!box) return;
  if (!S || !S.battle) { box.innerHTML = ""; return; }

  const now = S.battle.manage, cap = manageCap();
  let pips = "";
  for (let i = 0; i < cap; i++)
    pips += '<i class="' + (i < now ? 'on' : '') + '"></i>';

  /* 관리자 능력이 무엇을 하는지 한 줄씩 — 지금 쓸 수 있는 것은 밝게 */
  const help = CREW.manager.skills.map(s => {
    const c  = skillCost(s.cost);
    const ok = now >= c;
    return '<span class="mgsk' + (ok ? '' : ' off') + '">' +
             '<b>' + s.name + '</b><i>' + c + '</i>' +
             (s.short || s.desc || "") +
           '</span>';
  }).join("");

  box.innerHTML =
    '<div class="mgwrap">' +
      '<span class="mgnm">관리력</span>' +
      '<span class="mgpips">' + pips + '</span>' +
      '<span class="mgnum">' + now + ' / ' + cap + '</span>' +
      '<span class="mgsub">턴마다 ' + (RULE.manageGain + advisorEffect().gain) +
        ' 회복　·　누가 방어하면 +' + RULE.guardManage + '</span>' +
    '</div>' +
    '<div class="mgskills">' + help + '</div>';
}

/* =====================================================================
 *  장면 진행
 * ===================================================================== */
function buildScenes(chapter) {
  const out = [];
  chapter.scenes.forEach(s => {
    if (s.t === "recall") {
      out.push({ t: "recallStart", name: s.name, img: s.img || null });
      s.scenes.forEach(x => out.push(x));
      out.push({ t: "recallEnd" });
    } else out.push(s);
  });
  return out;
}

/* ── 장마다 꼭 있어야 하는 사람 ────────────────────────────────
 *  data/story.js 의 장에 이렇게 적으면, 그 사람이 편성되어 있어야 들어갈 수 있습니다.
 *
 *      require: ["seong_siyun"],        // 한 명이면 require: "seong_siyun" 도 됩니다
 *
 *  적지 않은 장은 지금까지처럼 아무나 데리고 들어갑니다.
 */
function chapterNeeds(c) {
  if (!c || !c.require) return [];
  return (Array.isArray(c.require) ? c.require : [c.require]).filter(w => SINNERS[w]);
}
function chapterMissing(c) {
  return chapterNeeds(c).filter(w => S.party.indexOf(w) < 0);
}
function nameList(keys) { return keys.map(w => memberName(w)).join(", "); }

/* 꼭 있어야 할 사람이 빠졌을 때 — 들어가지 않고 편성으로 돌려보냅니다 */
function chapterGate(i, miss) {
  const c = CHAPTERS[i];
  S.ch = i; S.sc = 0; S.ended = true;
  S.mirror = false; MIRROR = null;
  SCENES = [];
  clearLog();
  $log.classList.remove("recalling");
  showCard(c.img || null, c.no + "  " + c.title);
  divider();
  say(c.no + "  " + c.title, "place");
  if (c.subtitle) say("— " + c.subtitle + " —", "sys");
  divider();
  say("이 장은 " + withJosa(nameList(miss), "이") + " 편성되어 있어야 들어갈 수 있다.", "bad");
  say("지금 편성 — " + S.party.filter(Boolean).map(w => memberName(w)).join("　·　"), "sys");
  say("편성을 고치고 다시 들어오십시오.", "sys");
  render();
  buttons([
    { label: "편성 고치기", cls: "primary", fn: () => openParty(() => startChapter(i)) },
    { label: "운전석", fn: () => openChapterSelect(() => glass()) },
    { label: "유리창", cls: "ghost", fn: () => glass() }
  ]);
}

function startChapter(i) {
  const c = CHAPTERS[i];

  /* 들어가기 전에 편성부터 확인한다 */
  const miss = chapterMissing(c);
  if (miss.length) return chapterGate(i, miss);

  S.ch = i; S.sc = 0; S.ended = false;
  S.mirror = false; MIRROR = null;
  SCENES = buildScenes(c);
  S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });   // 장 시작 시 회복
  clearLog();
  $log.classList.remove("recalling");
  showCard(c.img || null, c.no + "  " + c.title);
  divider();
  say(c.no + "  " + c.title, "place");
  if (c.subtitle) say("— " + c.subtitle + " —", "sys");
  if (c.place)    say("무대: " + c.place, "sys");
  const needs = chapterNeeds(c);
  if (needs.length) say("편성 확인 — " + nameList(needs) + " 동행.", "good");
  divider();
  render();
  next();
}

function next() {
  if (S.waiting) return;
  if (S.sc >= SCENES.length) { chapterEnd(); return; }
  const s = SCENES[S.sc++];
  play(s);
}

function play(s) {
  switch (s.t) {
    case "n":     say(s.text, "n"); return cont();
    case "d":     speak(s.who, s.text); return cont();

    case "place":
      showCard(s.img || (curChapter() || {}).img, s.name, s.name);
      say("▶ " + s.name, "place");
      return cont();

    case "recallStart":
      $log.classList.add("recalling");
      if (s.img) showCard(s.img, s.name);
      divider(); say("── 회상 · " + s.name + " ──", "recall");
      return cont();
    case "recallEnd":
      $log.classList.remove("recalling");
      showCard((curChapter() || {}).img, (curChapter() || {}).no);
      divider();
      return cont();

    case "TODO":
      say("(집필 예정 — " + (s.note || "") + ")", "todo");
      return cont();

    case "label":  return next();

    case "mirrorClear": return mirrorClear();

    case "advisor":
      grantAdvisor(s);
      return cont();

    case "party":
      say(s.text || "편성을 조정하십시오.", "sys");
      S.waiting = true;
      buttons([
        { label: "편성", cls: "primary", fn: () => openParty(() => { S.waiting = false; next(); }) },
        { label: "이대로 진행", fn: () => { S.waiting = false; next(); } }
      ]);
      return;

    case "camera":  return doCamera(s);
    case "cook":    return doCook(s);
    case "choice":  return doChoice(s);
    case "battle":  return startBattle(s);

    case "gain": {
      const g = s.starter ? STARTER_ID : s;
      grant(g.who, g.star, g.title);
      return cont();
    }

    /* 본편 황금교본은 그 장을 처음 마칠 때만 준다 */
    case "codex": {
      const c = curChapter();
      const already = !!(S.cleared && c && S.cleared[c.id]);
      divider();
      if (already) {
        say("황금교본은 이미 이 손을 거쳐 갔다.", "sys");
      } else {
        S.codex += 1;
        say("황금교본을 확보했다.  (보유 " + S.codex + ")", "gain");
        saveVault();
      }
      render();
      return cont();
    }

    case "end":
      say(s.text, "sys");
      S.ended = true;
      return chapterEnd();

    default:
      return next();
  }
}

/* 계속 버튼 */
function cont() {
  render();
  buttons([{ label: "계속", cls: "primary", fn: next },
           { label: "기록", cls: "ghost", fn: () => openRecord(() => cont()) },
           { label: "유리창", cls: "ghost", fn: () => toGlass(() => cont()) }]);
}

/* 유리창(메인 화면)으로 돌아가기 — 장 도중이면 한 번 물어본다 */
function toGlass(back) {
  const midChapter = !S.ended && S.sc > 0 && S.sc < SCENES.length;
  if (midChapter &&
      !confirm("유리창으로 돌아갑니다.\n기록하지 않은 이 장의 진행은 사라집니다. 계속할까요?")) {
    if (back) back();
    return;
  }
  S.battle = null;
  S.waiting = false;
  glass();
}

/* ── 인격 지급 ─────────────────────────────────────────────── */
function grant(who, star, title) {
  const s = SINNERS[who];
  if (!s) { say("(지급 실패: " + who + ")", "todo"); return; }
  const id = s.ids.find(i => i.star === star && i.title === title);
  if (!id) { say("(지급 실패: " + title + ")", "todo"); return; }
  const key = idKey(who, id);
  divider();
  if (S.owned[key]) {
    const rf = dupRefund(star);
    S.money += rf;
    say("이미 가진 인격이다. " + CURRENCY + " " + rf + " 환급.", "sys");
  } else {
    S.owned[key] = true;
    say("인격 획득 — " + stars(star) + " " + title + " " + s.name, "gain");
    if (id.note) say("(" + id.note + ")", "sys");
    if (!S.equip[who] || (idByKey(S.equip[who]) || {}).star < star) {
      S.equip[who] = key;
      if (S.party.indexOf(who) >= 0) S.hp[who] = maxHp(who);
      say(withJosa(s.name, "이") + " 새 인격을 장착했다.", "sys");
    }
  }
  saveVault();
  render();
}

/* ── 카메라 (2장) ──────────────────────────────────────────── */
function doCamera(s) {
  S.waiting = true;
  const taken = [];
  divider();
  say("카메라를 든다. 담고 싶은 것을 고르십시오.", "sys");

  const draw = () => {
    const list = s.shots.map((sh, i) => ({
      label: (taken.indexOf(i) >= 0 ? "✓ " : "") + nameOf(sh.who),
      disabled: taken.indexOf(i) >= 0,
      fn: () => {
        taken.push(i);
        showSpeaker(portraitOf(sh.who), nameOf(sh.who));
        say(sh.text, "n");
        /* 담고 나서 하민군이 속으로 한마디 — 무대 그림은 찍힌 사람 그대로 둔다 */
        if (sh.think) {
          const w = document.createElement("p");
          w.className = "who";
          w.textContent = SINNERS.song_hamin ? SINNERS.song_hamin.name : "송하민";
          $log.appendChild(w);
          say(sh.think, "d");
        }
        if (taken.length === s.shots.length) {
          if (s.note) say("(" + s.note + ")", "todo");
          divider();
          say("셔터를 내린다. 하민군은 끝내 그 안에 들어가지 않았다.", "recall");
          S.waiting = false;
          cont();
        } else draw();
      }
    }));
    buttons(list);
  };
  draw();
}

/* ── 선택지 ───────────────────────────────────────────────── */
/* ── 요리 대결 ─────────────────────────────────────────────────
 *  싸움이 아닌 장면입니다. 3.5장 「영덕의 밤」에서 씁니다.
 *
 *  한 판은 두 걸음입니다.
 *    1. 누가 만들까  — 편성한 작성위원 중 하나. 한 번 나온 사람은 다시 안 나옵니다
 *    2. 무엇으로 만들까 — 재료 하나. 재료도 한 번 쓰면 없어집니다
 *
 *  «그 사람이 낀 인격» 이 솜씨를, «재료» 가 맛을 정합니다.
 *  싸움이 없는 장에서도 편성이 뜻을 갖도록 한 것입니다.
 *
 *      { t: "cook",
 *        judge: "베르렐리우스",        // 맛보는 사람 (초상이 왼쪽에 섭니다)
 *        rounds: 3,                    // 몇 번 낼까 (편성 인원보다 크면 인원 수로)
 *        intro: "...",                 // 시작 한 줄 (없으면 기본 문장)
 *
 *        ingredients: [                // ■ 재료 — 고르는 차례로 늘어섭니다
 *          { name: "영덕 대게", score: 3, text: "...", judge: "..." },
 *          { name: "오이", score: -2, text: "...", judge: "...",
 *            withAdvisor: { name: "이형우", score: -8, head: "...", say: "...",
 *                           reveal: "...", judge: "...", flag: "오이참사" } },
 *          { name: "포도", score: 2, text: "...", judge: "...",
 *            withSupport: { name: "이유건", score: -8, head: "...", say: "...",
 *                           reveal: "...", judge: "...", flag: "포도참사" } }
 *        ],
 *
 *        cooks: {                      // 인격 제목 → 솜씨. 사람 열쇠로 적어도 됩니다
 *          "그늘의 아이":   { dish: "...", line: "...", score: 4 },
 *          "kim_taeseong": { dish: "TODO", line: "TODO" }
 *        },
 *        fallback: { dish: "TODO", line: "TODO" },
 *        advisor:  { name: "이형우", bonus: 2, text: "..." },   // 그 교육위원을 세웠으면
 *        tiers:    [ { over: 10, text: "..." }, { over: 0, text: "..." } ],
 *        pay: 20 }                     // 점수 1점당 원고료
 *
 *    재료의  name   손잡이에 적히는 이름
 *            score  더하거나 빼는 점수 (음수도 됩니다)
 *            text   골랐을 때의 해설
 *            judge  맛본 사람의 한마디
 *            flag   적어 두면 골랐을 때 S.flags 에 남습니다 — 뒤에서 골라 쓸 수 있습니다
 *
 *    ■ withAdvisor / withSupport / withMember — 「그 사람 앞에 하필 그것을 냈을 때」
 *      withAdvisor 는 그 이름의 «보조 교육위원» 을 세웠을 때,
 *      withSupport 는 그 이름의 «지원 작성위원» 을 편성했을 때,
 *      withMember  는 그 이름이 «편성 어디엔가» 있을 때 터집니다.
 *      score 는 그 재료의 점수를 대신하고, text·judge 도 대신합니다.
 *
 *            head    붉게 뜨는 사고 한 줄 (없으면 「상이 엎어진다.」)
 *            say     그 사람이 하는 말
 *            reveal  ★ 왜 이런 일이 났는지. 여기서 «처음» 밝혀집니다
 *
 *      ★ 고르기 전에는 아무 낌새도 없어야 합니다.
 *        손잡이에도, 재료 해설에도, 노트에도 적지 마십시오.
 *
 *      지금 걸려 있는 것 (3.5장)
 *        · 이형우 교육위원 — 오이 알레르기
 *        · 이유건 지원 작성위원 — 포도 알레르기 (아직 SUPPORTS 에 없습니다)
 *        · 김하주 작성위원 — 갑각류 알레르기. 꽃게와 영덕 대게 «둘 다» 에 걸어 두었습니다
 *
 *    솜씨의  dish   그 인격이 그 재료로 무엇을 만드는가
 *            line   만든 사람의 한마디
 *            score  적지 않으면 «그 인격의 별» 이 점수가 됩니다 (★=1 ★★=2 ★★★=3)
 *
 *  ■ 점수는 결말을 바꾸지 않습니다.
 *    원작에서 길잡이는 무엇을 내든 참깨라면 한 봉지와 맥주 한 캔을 먹고 잠듭니다.
 *    점수는 맺음말 한 줄과 원고료만 정합니다. 이겨서 인정받는 장이 아닙니다.
 */
function doCook(s) {
  S.waiting = true;
  const cooks  = S.party.filter(Boolean);
  const stock  = (s.ingredients || []).slice();
  const rounds = Math.min(s.rounds || cooks.length, cooks.length, stock.length || 99);
  const usedW  = [];
  const usedI  = [];
  let score = 0;

  divider();
  say(s.intro || "상이 차려진다. 누가 무엇을 낼지 정하십시오.", "sys");
  if (s.judge) showSpeaker(portraitOf(s.judge), nameOf(s.judge));

  /* 그 사람의 솜씨 — 인격 제목으로 먼저 찾고, 없으면 사람 열쇠로, 그래도 없으면 fallback */
  const skillOf = w => {
    const id = idByKey(S.equip[w]);
    const t  = id ? id.title : null;
    const k  = (s.cooks && t && s.cooks[t]) || (s.cooks && s.cooks[w]) || s.fallback || {};
    return { id: id, k: k, pts: typeof k.score === "number" ? k.score : (id ? id.star : 1) };
  };

  const line = (text, who) => {
    if (!text || text === "TODO") say("(대사 미작성)", "todo");
    else if (who) speak(who, text);
    else say(text, "n");
  };

  /* 1걸음 — 누가 만들까 */
  const pickCook = () => {
    divider();
    say(countBefore(rounds - usedW.length) + " 번 남았다. 누가 만들지 고르십시오.", "sys");
    buttons(cooks.map(w => ({
      label: (usedW.indexOf(w) >= 0 ? "✓ " : "") + memberName(w),
      disabled: usedW.indexOf(w) >= 0,
      fn: () => pickIngredient(w)
    })));
  };

  /* 2걸음 — 무엇으로 만들까 */
  const pickIngredient = w => {
    const sk = skillOf(w);
    say("→ " + memberName(w) +
        (sk.id ? "　" + stars(sk.id.star) + " " + sk.id.title : ""), "sys");
    say("무엇으로 만들지 고르십시오.", "sys");
    buttons(stock.map((ing, i) => ({
      label: (usedI.indexOf(i) >= 0 ? "✓ " : "") + ing.name,
      disabled: usedI.indexOf(i) >= 0,
      fn: () => serve(w, i)
    })));
  };

  const serve = (w, i) => {
    const sk  = skillOf(w);
    const ing = stock[i];
    usedW.push(w);
    usedI.push(i);

    /* 그 재료를 «그 사람» 앞에 냈을 때만 벌어지는 일.
     * 3.5장에서는 이형우 교육위원이 오이 알레르기라 상이 엎어집니다.
     * 고르기 전에는 아무 데도 그런 낌새가 없어야 합니다. */
    const a = advisorById(S.advisor);
    const hasSupport = n => S.party.some(x => x && isSupport(x) && memberName(x) === n);
    const hasMember  = n => S.party.some(x => x && memberName(x) === n);
    const wa =
      (ing.withAdvisor && a && a.name === ing.withAdvisor.name && ing.withAdvisor) ||
      (ing.withSupport && hasSupport(ing.withSupport.name) && ing.withSupport) ||
      (ing.withMember  && hasMember(ing.withMember.name)   && ing.withMember)   || null;

    score += sk.pts + (wa && typeof wa.score === "number" ? wa.score : (ing.score || 0));
    if (ing.flag)       S.flags[ing.flag] = true;
    if (wa && wa.flag)  S.flags[wa.flag]  = true;

    divider();
    say(withJosa(memberName(w), "이") + " " + withJosa(ing.name, "을") + " 집는다.", "sys");
    line(wa && wa.text ? wa.text : ing.text);
    line(sk.k.dish);
    if (sk.k.line) line(sk.k.line, w);

    if (wa) {
      divider();
      say(wa.head || "상이 엎어진다.", "bad");
      shakeScreen(true);
      line(wa.say, wa.name);
      /* 왜 이런 일이 났는지는 «여기서 처음» 밝혀집니다.
       * 고르기 전에는 아무 데도 적혀 있지 않아야 합니다 — 손잡이에도, 재료 설명에도. */
      if (wa.reveal) {
        if (wa.reveal === "TODO") say("(무슨 일이 난 것인지 설명 미작성)", "todo");
        else say(wa.reveal, "recall");
      }
    }

    const jd = (wa && wa.judge) || ing.judge;
    if (jd) line(jd, s.judge || "베르렐리우스");

    if (usedW.length >= rounds) return finish();
    pickCook();
  };

  const finish = () => {
    /* 그 상을 차린 교육위원을 세웠으면 덤 */
    if (s.advisor) {
      const a = advisorById(S.advisor);
      if (a && a.name === s.advisor.name) {
        score += s.advisor.bonus || 0;
        divider();
        line(s.advisor.text, a.name);
      }
    }

    divider();
    say("차림이 끝났다.　점수 " + score, "sys");

    /* 점수대별 맺음말 — 그래도 결말은 하나뿐입니다 */
    if (s.tiers) {
      const t = s.tiers.find(x => score >= (x.over || 0));
      if (t) line(t.text);
    }

    const pay = Math.max(0, score) * (s.pay || 0);
    if (pay > 0) { S.money += pay; say(CURRENCY + " " + pay + " 획득.", "gain"); render(); }

    S.waiting = false;
    cont();
  };

  pickCook();
}

function doChoice(s) {
  S.waiting = true;
  divider();
  say(s.prompt, "sys");
  buttons(s.options.map(o => ({
    label: o.text,
    fn: () => {
      say("→ " + o.text, "sys");
      if (o.flag) S.flags[o.flag] = true;
      S.waiting = false;
      if (o.goto) {
        const i = SCENES.findIndex(x => x.t === "label" && x.id === o.goto);
        if (i >= 0) S.sc = i + 1;
      }
      next();
    }
  })));
}

/* =====================================================================
 *  전투
 * ===================================================================== */
function startBattle(scene) {
  const f = FOES[scene.foe];
  if (!f) { say("(적 데이터 없음: " + scene.foe + ")", "todo"); return cont(); }

  S.waiting = true;
  S.battle = {
    id: scene.foe, name: f.name, def: f.def, atk: f.atk,
    hp: f.hp, maxhp: f.hp, boss: !!f.boss,
    loseOk: scene.lose === "story",
    manage: RULE.manageStart + advisorEffect().manage,
    turn: 0, cmds: {}, cur: null, mods: {},
    scene: scene
  };
  const b = S.battle;            // 딜레이가 끝났을 때 같은 전투인지 확인용

  /* 전투에 들어서면 판을 한 번 비운다 —
   * 앞서 이야기하던 사람의 초상과 그때까지의 대화록이 남아 있으면 정신이 없다. */
  clearLog();
  $log.classList.remove("recalling");
  drawStage(null, null, null);

  if (f.desc) say(f.desc, "sys");
  if (f.quote) say("“" + f.quote + "”", "d");
  if (f.intro && f.intro !== "TODO") say(f.intro, "bad");
  else if (f.intro === "TODO") say("(등장 대사 미작성)", "todo");
  showFoe(f.img || null, f.name);          // 적은 배경 가운데에 선다
  say("▶ " + withJosa(f.name, "이") + " 나타났다!", "bad");
  say("체력 " + f.hp + "　공격 " + f.atk + "　방어 " + f.def, "sys");

  if (!S.party.some(alive)) S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });

  /* '계속'을 연타하다 전투에 들어온 것을 놓치지 않도록,
   * 잠깐 버튼을 잠가 둡니다. 그 사이 눌린 것은 아무 일도 하지 않습니다. */
  render();
  if (RULE.battleDelay > 0) {
    buttons([{ label: "전투 개시…", cls: "primary", disabled: true }]);
    setTimeout(() => { if (S.battle === b) beginTurn(); }, RULE.battleDelay);
  } else beginTurn();
}

function beginTurn() {
  const b = S.battle;
  b.turn++;
  b.cmds = {}; b.mods = {};
  b.manage = Math.min(manageCap(), b.manage + (b.turn > 1 ? RULE.manageGain + advisorEffect().gain : 0));
  divider();
  say("── " + b.turn + "턴 ──  " + b.name + "  " + b.hp + "/" + b.maxhp, "sys");

  /* 이번 턴에 적이 누구를 노리는지 먼저 알려 준다.
   * 노려진 사람을 방어시키거나 교정해 두는 판단을 하라는 뜻입니다.
   * 실제로 때리는 것은 resolveTurn 이고, 여기서 정한 표적을 그대로 씁니다. */
  const standing = S.party.filter(w => w && alive(w));
  b.heavy = !!(b.boss && b.turn % 3 === 0);
  b.aim   = standing.length ? standing[rnd(standing.length)] : null;
  if (b.aim)
    say("▷ " + withJosa(b.name, "이") + " " + withJosa(memberName(b.aim), "을") + " 노리고 있다!" +
        (b.heavy ? "  크게 휘두를 자세다." : ""), "bad");

  /* 보스가 강타를 준비하는 턴에는 한마디 한다.
   * data/story.js 의 FOES 에 heavyLine 으로 적습니다. 여럿이면 배열로. */
  if (b.heavy && b.aim) {
    const f = FOES[b.id] || {};
    let line = f.heavyLine;
    if (Array.isArray(line)) line = line[rnd(line.length)];
    if (line) {
      const w = document.createElement("p");
      w.className = "who";
      w.textContent = b.name;
      $log.appendChild(w);
      if (line === "TODO") say("(강타 대사 미작성)", "todo");
      else say(line, "d");
    }
  }

  askNext();
}

function askNext() {
  const b = S.battle;
  const pending = S.party.filter(w => w && alive(w) && !b.cmds[w]);
  if (!pending.length) { resolveTurn(); return; }
  b.cur = pending[0];
  render();

  const who = b.cur;
  /* 손잡이는 늘 같은 자리에 섭니다 — 남은 사람 수에 따라 사라지지 않도록 */
  const list = [];

  /* '전원 공격' 은 늘 첫 손잡이입니다. 한 사람만 남았어도 자리를 지킵니다.
   * P 로도 눌립니다. */
  list.push({ label: "전원 공격", cls: "primary", key: "p",
              fn: () => { pending.forEach(w => b.cmds[w] = "attack"); askNext(); } });

  list.push({ label: "공격",
              fn: () => { b.cmds[who] = "attack"; askNext(); } });
  list.push({ label: "방어", fn: () => {
      b.cmds[who] = "guard";
      b.manage = Math.min(manageCap(), b.manage + RULE.guardManage);
      askNext();
    } });

  /* 관리자 능력 — 비용과 성능은 세워둔 보조 교육위원에 따라 달라진다 */
  const ae = advisorEffect();
  const cRevive  = skillCost(2);
  const cCorrect = skillCost(1);
  const cPush    = skillCost(1);
  const downed = S.party.filter(w => w && !alive(w));

  list.push({
    label: "첨삭 (" + cRevive + ")", cls: "ghost",
    disabled: b.manage < cRevive || !downed.length,
    fn: () => {
      const t = downed[0];
      b.manage -= cRevive;
      setHp(t, maxHp(t) * (RULE.reviveRatio + ae.revive));
      say(CREW.manager.codename + "의 첨삭 — " + withJosa(memberName(t), "이") + " 다시 일어선다.", "good");
      askNext();
    }
  });
  /* 퇴고 — 서 있는 사람 중 체력이 가장 적은 한 명을 최대 체력의 healRatio 만큼 회복 */
  const cHeal = skillCost(2);
  const hurt = S.party.filter(w => w && alive(w) && curHp(w) < maxHp(w))
                      .sort((a, b) => curHp(a) - curHp(b))[0];
  list.push({
    label: "퇴고 (" + cHeal + ")", cls: "ghost",
    disabled: b.manage < cHeal || !hurt,
    fn: () => {
      b.manage -= cHeal;
      const before = curHp(hurt);
      setHp(hurt, before + maxHp(hurt) * RULE.healRatio);
      say(CREW.manager.codename + "의 퇴고 — " + withJosa(memberName(hurt), "이") +
          " " + (curHp(hurt) - before) + " 회복했다.", "good");
      askNext();
    }
  });

  list.push({
    label: "교정 (" + cCorrect + ")", cls: "ghost",
    disabled: b.manage < cCorrect || b.mods[who + "_guard"],
    fn: () => {
      b.manage -= cCorrect; b.mods[who + "_guard"] = true;
      say(withJosa(CREW.manager.codename, "이") + " " + memberName(who) + "의 글을 교정한다.", "good");
      askNext();
    }
  });
  list.push({
    label: "독촉 (" + cPush + ")", cls: "ghost",
    disabled: b.manage < cPush || b.mods[who + "_push"],
    fn: () => {
      b.manage -= cPush; b.mods[who + "_push"] = true;
      say(withJosa(CREW.manager.codename, "이") + " " + withJosa(memberName(who), "을") + " 독촉한다.", "good");
      askNext();
    }
  });

  buttons(list);
  renderHeader();
}

/* ── 업적 ──────────────────────────────────────────────────────
 *  적을 쓰러뜨릴 때마다 조건을 살펴, 맞으면 그 자리에서 보상을 줍니다.
 *  이미 받은 것은 보관함에 이름으로 남습니다.
 */
function achieveList() { return (typeof ACHIEVEMENTS !== "undefined" && ACHIEVEMENTS) ? ACHIEVEMENTS : []; }
function achieved(a)   { return !!(S.achieved && S.achieved[a.name]); }

/* 지금 어디서 싸우고 있는가 */
function battleWhere() {
  if (!S.mirror) return "story";
  return (MIRROR && MIRROR.id === "mirror_hard") ? "mirrorHard" : "mirror";
}

function achieveMatches(a, foeName) {
  const w = a.when || {};

  if (w.kill) {
    const list = Array.isArray(w.kill) ? w.kill : [w.kill];
    if (!list.some(k => String(foeName).indexOf(k) >= 0)) return false;
  }
  if (w.where) {
    const here = battleWhere();
    /* 하드는 거울 던전이기도 하다 */
    if (w.where === "mirror") { if (here !== "mirror" && here !== "mirrorHard") return false; }
    else if (here !== w.where) return false;
  }
  if (w.advisor) {
    const ad = advisorById(S.advisor);
    if (!ad || ad.name !== w.advisor) return false;
  }
  if (w.party) {
    const need = Array.isArray(w.party) ? w.party : [w.party];
    if (!need.every(p => S.party.indexOf(p) >= 0)) return false;
  }
  if (w.titleHas) {
    if (!S.party.some(m => m && memberTitle(m).indexOf(w.titleHas) >= 0)) return false;
  }
  return true;
}

/* 적을 쓰러뜨렸을 때 부릅니다 */
function checkAchievements(foeName) {
  achieveList().forEach(a => {
    if (achieved(a) || !achieveMatches(a, foeName)) return;
    if (!S.achieved) S.achieved = {};
    S.achieved[a.name] = true;

    divider();
    say("업적 달성 — " + a.name, "gain");
    if (a.desc) say(a.desc, "sys");

    const g = a.give || {};
    if (g.support) {
      const sp = supportBy(SUP_PREFIX + g.support);
      if (sp) {
        if (!S.supportsOwned) S.supportsOwned = {};
        S.supportsOwned[SUP_PREFIX + g.support] = true;
        say("지원 작성위원 합류 — " + stars(sp.star) + " " + sp.title + " " + sp.name, "gain");
        if (sp.note) say("(" + sp.note + ")", "sys");
      } else say("(보상 지원 작성위원을 찾지 못했습니다: " + g.support + ")", "todo");
    }
    if (g.money) { S.money += g.money; say(CURRENCY + " " + g.money + " 획득.", "gain"); }
    if (g.codex) { S.codex += g.codex; say("황금교본 " + g.codex + "권 획득.", "gain"); }
    saveVault();
  });
}

/* 「3을」이 아니라 「셋을」로 — 세는 말은 우리말 수사로 */
function countWord(n) {
  const w = { 1: "하나를", 2: "둘을", 3: "셋을", 4: "넷을", 5: "다섯을",
              6: "여섯을", 7: "일곱을", 8: "여덟을", 9: "아홉을", 10: "열을" };
  return w[n] || (n + "을");
}

/* 「세 번」처럼 뒤에 세는 말이 붙을 때 쓰는 꼴 — 하나가 아니라 한, 셋이 아니라 세 */
function countBefore(n) {
  const w = { 1: "한", 2: "두", 3: "세", 4: "네", 5: "다섯",
              6: "여섯", 7: "일곱", 8: "여덟", 9: "아홉", 10: "열" };
  return w[n] || String(n);
}

/* 받침을 보고 조사를 고른다 — 「김하주 이(가)」 같은 것을 없앱니다.
 *   josa("김하주", "이") → "가"      josa("김태성", "이") → "이"
 *   josa("대게", "을")   → "를"      josa("문어",   "은") → "는"
 * 끝이 한글이 아니면(숫자·영문) 받침이 있는 것으로 봅니다. */
function josa(word, kind) {
  const pair = { "이": ["이", "가"], "가": ["이", "가"],
                 "을": ["을", "를"], "를": ["을", "를"],
                 "은": ["은", "는"], "는": ["은", "는"],
                 "과": ["과", "와"], "와": ["과", "와"],
                 "으로": ["으로", "로"], "로": ["으로", "로"] }[kind];
  if (!pair) return kind;
  const ch = String(word || "").trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (!(code >= 0xac00 && code <= 0xd7a3)) return pair[0];
  const jong = (code - 0xac00) % 28;
  /* 「로/으로」만은 ㄹ 받침을 받침 없는 것처럼 봅니다 */
  if ((kind === "로" || kind === "으로") && jong === 8) return pair[1];
  return jong ? pair[0] : pair[1];
}
function withJosa(word, kind) { return word + josa(word, kind); }

/* 화면을 한 번 흔든다. 강타면 크게. */
function shakeScreen(hard) {
  const el = document.getElementById("app");
  if (!el) return;
  const cls = hard ? "shakehard" : "shake";
  el.classList.remove("shake", "shakehard");
  void el.offsetWidth;                       // 연달아 맞아도 다시 흔들리도록
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), hard ? RULE.shakeHardMs : RULE.shakeMs);
}

/* 명령이 다 모이면 한 턴을 풀어 놓는다.
 * 예전에는 모두가 한꺼번에 때리고 적도 곧바로 되받아쳐, 턴이라는 느낌이 없었다.
 * 이제 때리는 사람을 하나씩 끊어 보여 주고, 적이 칠 때 화면이 흔들린다. */
function resolveTurn() {
  const b = S.battle;
  b.cur = null;
  render();
  buttons([{ label: "…", cls: "primary", disabled: true }]);   // 푸는 동안은 잠근다

  const same = () => S.battle === b;
  const hitters = S.party.filter(w => w && alive(w) && b.cmds[w] === "attack");
  let i = 0;

  /* ① 아군이 하나씩 때린다 */
  const swing = () => {
    if (!same()) return;
    if (i >= hitters.length) return setTimeout(afterAllies, RULE.foePauseMs);

    const who = hitters[i++];
    const st = effStats(who);
    let dmg = st.atk + rnd(4) - b.def;
    if (b.mods[who + "_push"]) dmg *= RULE.pushMult + advisorEffect().push;
    const crit = Math.random() < critRate();
    if (crit) dmg *= critMult();
    dmg = Math.max(1, Math.floor(dmg));
    b.hp -= dmg;
    say(crit ? (memberName(who) + "의 치명적인 공격! — " + dmg + " 피해")
             : (memberName(who) + "의 공격 — " + dmg + " 피해"), crit ? "crit" : "hit");
    foeHit(0);
    render();

    if (b.hp <= 0) return setTimeout(afterAllies, RULE.turnGapMs);
    setTimeout(swing, RULE.allyStepMs);
  };

  /* ② 다 때렸으면 결판을 본다 */
  const afterAllies = () => {
    if (!same()) return;
    if (b.hp <= 0) return victory();
    if (b.loseOk && b.hp <= b.maxhp * RULE.scriptedOut) return scriptedEnd();

    const targets = S.party.filter(w => w && alive(w));
    if (!targets.length) return defeat();
    foeTurn(targets);
  };

  /* ③ 적이 되받아친다 — 이때 화면이 흔들린다 */
  const foeTurn = (targets) => {
    if (!same()) return;
    /* 턴 머리에서 예고한 그 표적을 그대로 친다.
     * 그 사이 쓰러졌다면(첨삭 전이라면) 서 있는 사람 중에서 다시 고른다. */
    const heavy = !!b.heavy;
    const t = (b.aim && targets.indexOf(b.aim) >= 0) ? b.aim : targets[rnd(targets.length)];
    const st = effStats(t);
    let dmg = (heavy ? b.atk * 1.7 : b.atk) + rnd(4) - st.def;
    if (b.cmds[t] === "guard") dmg *= RULE.guardCut;
    if (b.mods[t + "_guard"]) dmg *= Math.max(0.05, RULE.correctCut - advisorEffect().correct);
    dmg = Math.max(1, Math.floor(dmg));
    setHp(t, curHp(t) - dmg);

    shakeScreen(heavy);

    /* 강타는 보통 공격과 한눈에 갈리도록 따로 적습니다 */
    say((heavy ? "▶ " + b.name + "의 강타! — " : b.name + "의 공격 — ") +
        memberName(t) + "에게 " + dmg + " 피해" +
        (b.cmds[t] === "guard" ? " (방어)" : ""), heavy ? "heavy" : "bad");

    if (!alive(t)) say(withJosa(memberName(t), "이") + " 쓰러졌다.", "bad");
    render();

    if (!S.party.some(alive)) return setTimeout(defeat, RULE.turnGapMs);
    setTimeout(() => { if (same()) beginTurn(); }, RULE.turnGapMs);
  };

  if (!hitters.length) setTimeout(afterAllies, RULE.foePauseMs);
  else swing();
}

function victory() {
  const b = S.battle;
  const reward = earn(Math.floor((b.maxhp + b.atk * 4) / 6) * (b.boss ? 2 : 1));
  S.money += reward;
  divider();
  say("▶ " + b.name + " 격파.", "good");
  say(CURRENCY + " " + reward + " 획득.", "gain");
  checkAchievements(b.name);
  saveVault();
  healParty(RULE.winHeal, "숨을 고른다.");
  S.battle = null;
  S.waiting = true;                 // 쓰러지는 동안은 손잡이를 잠근다
  render();
  buttons([{ label: "…", cls: "primary", disabled: true }]);
  foeFalls(() => { S.waiting = false; cont(); });
}

/* 각본상 결말이 정해진 전투 — 적이 물러나고 이야기가 이어진다 */
function scriptedEnd() {
  const b = S.battle;
  divider();
  say(b.scene.endText || (withJosa(b.name, "은") + " 더 상대하지 않고 물러난다."), "sys");
  healParty(RULE.winHeal, null);
  S.battle = null;
  S.waiting = true;
  render();
  buttons([{ label: "…", cls: "primary", disabled: true }]);
  foeFalls(() => { S.waiting = false; cont(); });
}

function healParty(ratio, msg) {
  let any = false;
  S.party.forEach(w => {
    if (!w || !alive(w)) return;
    const before = curHp(w);
    setHp(w, before + maxHp(w) * ratio);
    if (curHp(w) > before) any = true;
  });
  if (any && msg) say(msg, "sys");
}

function defeat() {
  const b = S.battle;
  divider();
  say("작성위원 전원이 쓰러졌다.", "bad");
  if (b.loseOk) {
    say("…하지만 이야기는 멈추지 않는다.", "sys");
    S.party.forEach(w => { if (w) S.hp[w] = Math.max(1, Math.floor(maxHp(w) * 0.3)); });
    S.battle = null; S.waiting = false;
    render(); cont();
    return;
  }
  const scene = b.scene;
  S.battle = null;
  buttons([
    { label: "다시 도전", cls: "primary", fn: () => {
        S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
        S.waiting = false; startBattle(scene);
      } },
    { label: "편성 바꾸기", fn: () => openParty(() => {
        S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
        S.waiting = false; startBattle(scene);
      }) },
    { label: "상점", fn: () => openShop(() => {}) },
    { label: "보관함", cls: "ghost", fn: openVault },
    { label: "유리창", cls: "ghost", fn: () => { S.battle = null; S.waiting = false; glass(); } }
  ]);
}

/* ── 장 종료 ──────────────────────────────────────────────── */
function chapterEnd() {
  divider();
  const c = curChapter();
  if (S.mirror) return mirrorClear();
  if (!S.cleared) S.cleared = {};
  S.cleared[c.id] = true;
  saveVault();
  say("── " + c.no + " 종료 ──", "place");
  save();
  const hasNext = S.ch + 1 < CHAPTERS.length;
  buttons([
    hasNext ? { label: "다음 장으로", cls: "primary", fn: () => startChapter(S.ch + 1) } : null,
    { label: "편성", fn: () => openParty(() => {}) },
    { label: "상점", fn: () => openShop(() => {}) },
    { label: "보관함", fn: () => openVault(() => chapterEnd()) },
    { label: "노트", cls: "ghost", fn: () => openNote(() => chapterEnd()) },
    { label: "운전석", cls: "ghost", fn: () => openChapterSelect(() => chapterEnd()) },
    { label: "유리창", cls: "ghost", fn: () => glass() },
    !hasNext ? { label: "처음부터", cls: "ghost", fn: () => { S = newState(); startChapter(0); } } : null
  ]);
  if (!hasNext) {
    divider();
    say("여기까지가 지금 만들어진 부분입니다.", "sys");
  }
}

/* =====================================================================
 *  편성 / 뽑기
 * ===================================================================== */
function closeModal() { $modal.classList.remove("on"); }

function openParty(done) {
  $modal.classList.add("on");
  let picking = S.party.slice();

  const draw = () => {
    let h = '<h2>편 성</h2>';

    /* 맨 위 — 전투를 도와줄 보조 교육위원 */
    const a = advisorById(S.advisor);
    const advCount = Object.keys(S.advisorsOwned || {}).length;
    h += '<div class="hint">전투를 도와줄 보조 교육위원을 한 명 세울 수 있습니다. ' +
         '직접 싸우지는 않고, 작성위원 전원에게 상시 효과를 겁니다.</div>' +
         '<div class="grid"><div class="slot' + (a ? ' sel' : '') + '" data-adv="1">' +
           (a ? '<div class="nm"><span class="star">' + stars(a.star) + '</span> ' +
                  a.title + ' ' + a.name + '</div><div class="sub">' + a.desc + '</div>'
              : '<div class="lock">세우지 않음</div><div class="sub">' +
                  (advCount ? '눌러서 고르십시오' : '아직 함께하는 교육위원이 없습니다') + '</div>') +
         '</div></div>';

    /* E.G.O 기프트 */
    const gf = equippedGift();
    const gfCount = Object.keys(S.giftsOwned || {}).length;
    h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">E.G.O 기프트</div>' +
         '<div class="hint">하나만 지닐 수 있습니다. 상점에서 황금교본으로 뽑습니다.</div>' +
         '<div class="grid"><div class="slot' + (gf ? ' sel' : '') + '" data-gift="1">' +
           (gf ? '<div class="nm"><span class="star">' + stars(gf.star) + '</span> ' + gf.name +
                 '</div><div class="sub">' + gf.desc + '</div>'
               : '<div class="lock">지니지 않음</div><div class="sub">' +
                 (gfCount ? '눌러서 고르십시오' : '아직 가진 기프트가 없습니다') + '</div>') +
         '</div></div>';

    h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">작성위원</div>' +
         '<div class="hint">3명을 고르고, 각자 장착할 인격을 정합니다. 고른 순서대로 배치됩니다.</div>' +
         '<div class="grid">';
    Object.keys(SINNERS).forEach(who => {
      const s = SINNERS[who];
      const sel = picking.indexOf(who);
      const id = idByKey(S.equip[who]);
      h += '<div class="slot' + (sel >= 0 ? ' sel' : '') + '" data-who="' + who + '">' +
             '<div class="nm">' + (sel >= 0 ? (sel + 1) + '. ' : '') + s.name +
               ' <span class="sub">No.' + s.no + '</span></div>' +
             '<div class="sub">' + s.ego + '</div>' +
             '<div class="sub"><span class="star">' + (id ? stars(id.star) : '') + '</span> ' +
               (id ? id.title : '인격 없음') + '</div>' +
             '<div class="sub">보유 인격 ' + ownedIds(who).length + '종</div>' +
           '</div>';
    });
    h += '</div>';

    /* ── 지원 작성위원 — 접어 둡니다 ── */
    const sups = supportList();
    if (sups.length) {
      const mine = sups.filter(sp => supportOwned(sp));
      const slotTxt = supportSlot() ? supportSlot() + "번째 칸" : "아무 칸";
      const on = SUP_OPEN;
      h += '<div class="eqhead' + (on ? ' open' : '') + '" id="suphead">' +
             '<span class="arrow">' + (on ? '▾' : '▸') + '</span>' +
             '<b>지원 작성위원</b>' +
             '<span class="wearing">' + slotTxt + '에만 · 한 전투에 ' + supportMax() + '명</span>' +
             '<span class="cnt">' + mine.length + ' / ' + sups.length + '</span>' +
           '</div>';
      if (on) {
        h += '<div class="eqbody"><div class="hint">' +
             '12명 밖에서 손을 빌려주는 사람들입니다. 인격을 갈아 끼우지 않고, ' +
             '편성 시너지는 똑같이 받습니다. <b>업적으로 얻습니다.</b></div>' +
             '<div class="grid">';
        sups.forEach(sp => {
          const id = supportId(sp);
          const has = supportOwned(sp);
          const sel = picking.indexOf(id);
          /* 아직 얻지 못한 사람은 이름도 수치도 보이지 않습니다 */
          if (!has) {
            h += '<div class="slot"><div class="lock">' + stars(sp.star) + ' ？？？</div>' +
                 '<div class="sub">업적으로 얻습니다</div></div>';
            return;
          }
          /* 별 위치는 작성위원 칸과 같게 — 이름줄이 아니라 인격줄 앞에 붙습니다 */
          h += '<div class="slot' + (sel >= 0 ? ' sel' : '') + '" data-sup="' + id + '">' +
                 '<div class="nm">' + (sel >= 0 ? (sel + 1) + '. ' : '') + sp.name +
                   ' <span class="sub">지원</span></div>' +
                 (sp.note ? '<div class="sub">' + sp.note + '</div>' : '') +
                 '<div class="sub"><span class="star">' + stars(sp.star) + '</span> ' +
                   sp.title + '</div>' +
                 '<div class="sub">공 ' + sp.atk + '　방 ' + sp.def + '　체 ' + sp.hp + '</div>' +
               '</div>';
        });
        h += '</div></div>';
      }
    }

    h += '<div class="modalfoot">' +
         '<button id="pdone">확정</button>' +
         '<button id="pids" class="ghost">인격 장착</button>' +
         '</div>';
    $sheet.innerHTML = h;

    /* 지원은 정해진 칸에만 설 수 있으므로, 그 자리를 비워 두고 넣습니다 */
    const putSupport = (id) => {
      const at = supportSlot() ? supportSlot() - 1 : picking.length;
      const cur = picking.indexOf(id);
      if (cur >= 0) { picking.splice(cur, 1); return; }        // 눌러서 빼기
      picking = picking.filter(w => !isSupport(w));            // 지원은 한 명뿐
      while (picking.length < at) picking.push(null);
      picking[at] = id;
      picking = picking.slice(0, 3);
    };

    $sheet.querySelectorAll(".slot[data-who]").forEach(el => {
      el.onclick = () => {
        const who = el.dataset.who;
        const i = picking.indexOf(who);
        if (i >= 0) picking.splice(i, 1);
        else {
          const free = picking.filter(Boolean).length;
          if (free < 3) {
            /* 지원이 차지한 칸은 건드리지 않는다 */
            let at = picking.indexOf(null);
            if (at < 0) { if (picking.length < 3) picking.push(who); }
            else picking[at] = who;
          }
        }
        draw();
      };
    });
    $sheet.querySelectorAll(".slot[data-sup]").forEach(el => {
      el.onclick = () => { putSupport(el.dataset.sup); draw(); };
    });
    const supHead = document.getElementById("suphead");
    if (supHead) supHead.onclick = () => { SUP_OPEN = !SUP_OPEN; draw(); };
    document.getElementById("pdone").onclick = () => {
      const chosen = picking.filter(Boolean);
      if (chosen.length !== 3) { alert("3명을 골라주세요."); return; }
      S.party = picking.slice();
      S.party.forEach(w => { if (S.hp[w] == null) S.hp[w] = maxHp(w); });
      saveVault();
      closeModal(); render();
      if (done) done();
    };
    document.getElementById("pids").onclick = () => openEquip(() => draw());
    const advSlot = $sheet.querySelector(".slot[data-adv]");
    if (advSlot) advSlot.onclick = () => openAdvisor(() => draw());
    const gfSlot = $sheet.querySelector(".slot[data-gift]");
    if (gfSlot) gfSlot.onclick = () => openGiftPick(() => draw());
  };
  draw();
}

/* 인격 장착 — 사람이 많고 인격은 더 많아서, 접어 둔 채로 엽니다.
 *  · 사람 이름줄을 누르면 그 사람만 펴지고 접힙니다.
 *  · 「보유한 것만」 을 끄면 아직 없는 인격도 함께 보입니다.
 *  펴 둔 사람과 이 설정은 창을 닫아도 그대로 남습니다. */
let EQUIP_OPEN = {};        // who -> 펴 두었나
let EQUIP_OWNED_ONLY = true;

function openEquip(back) {
  let h = '<h2>인 격 장 착</h2>' +
          '<div class="hint">사람 이름을 누르면 그 사람의 인격이 펴집니다. ' +
          '장착 중인 인격은 이름줄에 함께 적힙니다.</div>' +
          '<div class="eqbar">' +
            '<label class="eqchk"><input type="checkbox" id="eqowned"' +
              (EQUIP_OWNED_ONLY ? ' checked' : '') + '> 보유한 것만 보기</label>' +
            '<button id="eqall" class="ghost">모두 펴기</button>' +
            '<button id="eqnone" class="ghost">모두 접기</button>' +
          '</div>';

  Object.keys(SINNERS).forEach(who => {
    const s = SINNERS[who];
    const open = !!EQUIP_OPEN[who];
    const cur  = idByKey(S.equip[who]);
    const mine = ownedIds(who).length;
    const tot  = s.ids.filter(i => !i.todo).length;

    h += '<div class="eqhead' + (open ? ' open' : '') + '" data-open="' + who + '">' +
           '<span class="arrow">' + (open ? '▾' : '▸') + '</span>' +
           '<b>' + s.name + '</b>' +
           '<span class="wearing">' +
             (cur ? '<span class="star">' + stars(cur.star) + '</span> ' + cur.title : '인격 없음') +
           '</span>' +
           '<span class="cnt">' + mine + ' / ' + tot + '</span>' +
         '</div>';

    if (!open) return;

    let shown = 0;
    let body = '<div class="grid eqbody">';
    s.ids.forEach(id => {
      const key = idKey(who, id);
      if (id.todo) {
        if (!EQUIP_OWNED_ONLY) {
          body += '<div class="slot"><div class="lock">' + stars(id.star) + ' (미작성)</div></div>';
          shown++;
        }
        return;
      }
      const has = !!S.owned[key];
      if (EQUIP_OWNED_ONLY && !has) return;
      shown++;
      const on = S.equip[who] === key;
      const st = statsOf(key);
      body += '<div class="slot' + (on ? ' sel' : '') + '"' +
                (has ? ' data-key="' + key + '"' : '') + '>' +
                '<div class="' + (has ? 'nm' : 'lock') + '">' +
                  '<span class="star">' + stars(id.star) + '</span> ' + id.title +
                  (on ? ' <span class="sub">· 장착</span>' : '') + '</div>' +
                '<div class="sub">' + (has ? ('공 ' + st.atk + '　방 ' + st.def + '　체 ' + st.hp) : '미보유') + '</div>' +
                (has && id.note ? '<div class="sub">' + id.note + '</div>' : '') +
              '</div>';
    });
    body += '</div>';
    h += shown ? body
               : '<div class="hint eqbody">가진 인격이 없습니다. ' +
                 '「보유한 것만 보기」를 끄면 어떤 인격이 있는지 볼 수 있습니다.</div>';
  });

  h += '<div class="modalfoot"><button id="edone">돌아가기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".eqhead[data-open]").forEach(el => {
    el.onclick = () => {
      const w = el.dataset.open;
      EQUIP_OPEN[w] = !EQUIP_OPEN[w];
      openEquip(back);
    };
  });
  document.getElementById("eqowned").onchange = (e) => {
    EQUIP_OWNED_ONLY = e.target.checked;
    openEquip(back);
  };
  document.getElementById("eqall").onclick = () => {
    Object.keys(SINNERS).forEach(w => EQUIP_OPEN[w] = true);
    openEquip(back);
  };
  document.getElementById("eqnone").onclick = () => { EQUIP_OPEN = {}; openEquip(back); };

  $sheet.querySelectorAll(".slot[data-key]").forEach(el => {
    el.onclick = () => {
      const key = el.dataset.key;
      const who = parseKey(key).who;
      S.equip[who] = key;
      S.hp[who] = maxHp(who);
      saveVault();
      openEquip(back);
    };
  });
  document.getElementById("edone").onclick = () => { if (back) back(); else closeModal(); };
}

/* ── 노트 ─────────────────────────────────────────────────────
 *  수감자 신상과 설정을 모아 보는 곳. 스토리는 담지 않습니다.
 *  내용은 전부 data/characters.js 에서 그대로 읽어옵니다.
 */
function noteTag(t) { return '<span class="tag2">' + t + '</span>'; }

function openNote(back, focus) {
  $modal.classList.add("on");

  /* ── 한 사람 자세히 ── */
  const detail = (who) => {
    const s = SINNERS[who];
    const mine = ownedIds(who).length;
    const tot  = s.ids.filter(i => !i.todo).length;

    let h = '<h2>노 트</h2>' +
            '<div class="hint">신상 기록 · 관리자 열람용</div>' +
            '<div class="note">';

    h += '<div class="notepic">';
    if (s.portrait)
      h += '<div class="card"><img src="' + assetURL(s.portrait) + '" alt="" ' +
           'onerror="this.parentNode.style.display=\'none\'">' +
           '<div class="tag">No.' + s.no + '　' + s.name + '</div></div>';
    h += '</div>';

    h += '<div class="notebody">' +
           '<div class="noteno">No. ' + s.no + '</div>' +
           '<div class="notename">' + s.name + '</div>' +
           '<div class="noteego">E.G.O :: ' + s.ego + '</div>';

    if (s.quote) h += '<div class="notequote">“' + s.quote + '”</div>';

    if (s.caution && s.caution.length)
      h += '<div class="noterow"><span class="k">주의사항</span>' +
           s.caution.map(noteTag).join("") + '</div>';

    if (s.brief)
      h += '<div class="notebrief">' + s.brief.replace(/\n/g, "<br>") + '</div>';

    h += '<div class="noterow"><span class="k">인격</span>' +
         '<span class="sub">' + mine + ' / ' + tot + ' 보유</span></div>' +
         '<div class="grid">';
    s.ids.forEach(id => {
      if (id.todo) { h += '<div class="slot"><div class="lock">' + stars(id.star) + ' (미작성)</div></div>'; return; }
      const key = idKey(who, id);
      const has = !!S.owned[key];
      const st  = baseStatsOf(key);
      /* 아직 얻지 못한 인격은 이름만 보입니다. 수치와 설명은 얻어야 열립니다. */
      h += '<div class="slot">' +
             '<div class="' + (has ? 'nm' : 'lock') + '">' +
               '<span class="star">' + stars(id.star) + '</span> ' + id.title + '</div>' +
             '<div class="sub">' + (has ? ('공 ' + st.atk + '　방 ' + st.def + '　체 ' + st.hp) : '미보유') + '</div>' +
             (has && id.note ? '<div class="sub">' + id.note + '</div>' : '') +
           '</div>';
    });
    h += '</div></div></div>';

    h += '<div class="modalfoot">' +
           '<button id="nback">목록으로</button>' +
           '<button id="nclose" class="ghost">닫기</button>' +
         '</div>';
    $sheet.innerHTML = h;
    document.getElementById("nback").onclick = () => index();
    document.getElementById("nclose").onclick = () => { closeModal(); render(); if (back) back(); };
  };

  /* ── 목록 ── */
  const index = () => {
    let h = '<h2>노 트</h2>' +
            '<div class="hint">수감자 신상과 설정을 모아 둔 곳입니다. 이야기 내용은 담기지 않습니다.</div>';

    h += '<div style="margin:10px 0 6px;color:#e8e4de;font-weight:700">작성위원</div><div class="grid">';
    Object.keys(SINNERS).forEach(who => {
      const s = SINNERS[who];
      h += '<div class="slot" data-who="' + who + '">' +
             '<div class="nm">No.' + s.no + '　' + s.name + '</div>' +
             '<div class="sub">' + s.ego + '</div>' +
             (s.caution ? '<div class="sub">' + s.caution.join(" · ") + '</div>' : '') +
           '</div>';
    });
    h += '</div>';

    h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">승무원</div><div class="grid">';
    Object.keys(CREW).forEach(k => {
      const c = CREW[k];
      h += '<div class="slot">' +
             '<div class="nm">' + c.role + '　' + c.name + '</div>' +
             (c.codename ? '<div class="sub">' + c.codename + '</div>' : '') +
             '<div class="sub">' + (c.desc === "TODO" ? '(설정 미작성)' : c.desc) + '</div>' +
           '</div>';
    });
    h += '</div>';

    const advAll = advisorList();
    if (advAll.length) {
      h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">교육위원</div><div class="grid">';
      advAll.forEach(a => {
        const has = !!(S.advisorsOwned && S.advisorsOwned[advisorId(a)]);
        /* 효과는 함께하게 된 뒤에야 읽을 수 있습니다 */
        h += '<div class="slot">' +
               '<div class="' + (has ? 'nm' : 'lock') + '">' +
                 '<span class="star">' + stars(a.star) + '</span> ' + a.title + ' ' + a.name + '</div>' +
               '<div class="sub">' + (has ? a.desc : '미보유　— 효과는 함께한 뒤에 열립니다') + '</div>' +
             '</div>';
      });
      h += '</div>';
    }

    /* ── 편성 시너지 한눈에 ──
     *  data/characters.js 의 SYNERGIES 를 그대로 읽어 옵니다.
     *  지금 편성으로 몇 명이 걸려 있는지도 함께 적습니다. */
    const syAll = (typeof SYNERGIES !== "undefined" && SYNERGIES) ? SYNERGIES : [];
    if (syAll.length) {
      const nowTitles = synergyNames();
      h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">편성 시너지 ' +
           '<span class="sub" style="font-weight:400">모두 ' + syAll.length + '가지</span></div>' +
           '<div class="hint">파티 셋이 <b>장착한 인격 이름</b>에 같은 말이 들어가면 발동합니다. ' +
           '몇 명부터 발동하는지는 시너지마다 다르고, 3명이면 1.75배, 보조 교육위원까지 넷이면 2배가 됩니다.</div>' +
           '<div class="grid">';
      syAll.forEach(sy => {
        const tags = Array.isArray(sy.tag) ? sy.tag : [sy.tag];
        /* 지금 편성으로 몇 명이 걸려 있는가 */
        const now = nowTitles.filter(t => tags.some(tg => t.indexOf(tg) >= 0)).length;
        /* 보관함에 이 말이 든 인격이 몇 종이나 있는가 */
        let ownedN = 0, totalN = 0;
        for (const w in SINNERS) SINNERS[w].ids.forEach(id => {
          if (id.todo || !tags.some(tg => id.title.indexOf(tg) >= 0)) return;
          totalN++; if (S.owned[idKey(w, id)]) ownedN++;
        });
        const eff = [];
        if (sy.atk) eff.push("공 +" + Math.round(sy.atk * 100) + "%");
        if (sy.def) eff.push("방 +" + Math.round(sy.def * 100) + "%");
        if (sy.hp)  eff.push("체 +" + Math.round(sy.hp  * 100) + "%");
        const on = now >= sy.need;
        h += '<div class="slot' + (on ? ' sel' : '') + '">' +
               '<div class="nm">' + sy.name +
                 (on ? ' <span class="synon">발동 중 ' + now + '명</span>' : '') + '</div>' +
               '<div class="sub">찾는 말 「' + tags.join("」 「") + '」　·　' + sy.need + '명부터</div>' +
               '<div class="sub" style="color:#d8b26a">' + eff.join("　") + '</div>' +
               (sy.desc ? '<div class="sub">' + sy.desc + '</div>' : '') +
               '<div class="sub">해당 인격 ' + ownedN + ' / ' + totalN + ' 보유' +
                 (totalN < sy.need ? '　— 인격이 모자라 발동할 수 없습니다' : '') + '</div>' +
             '</div>';
      });
      h += '</div>';
    }

    h += '<div class="modalfoot"><button id="nclose">닫기</button></div>';
    $sheet.innerHTML = h;

    $sheet.querySelectorAll(".slot[data-who]").forEach(el => {
      el.onclick = () => detail(el.dataset.who);
    });
    document.getElementById("nclose").onclick = () => { closeModal(); render(); if (back) back(); };
  };

  if (focus && SINNERS[focus]) detail(focus); else index();
}

/* ── 상점 ─────────────────────────────────────────────────────
 *  인격 배정(뽑기)과 황금교본 교환이 이곳에 모여 있습니다.
 *  파는 물건을 늘리려면 SHOP_TRADES 에 줄을 더하세요.
 */
/* 「인격 배정소」 칸 머리에 얹을 그림 — 특정 배정 칸과 크기를 맞추기 위한 것입니다.
 * 판마다 갈아 끼우고 싶으면 여기만 고치면 됩니다. */
const GACHA_STRIP = "assets/scene/거울던전.jpg";

const SHOP_TRADES = [
  {
    id: "codex_to_money",
    name: "황금교본 되팔기",
    desc: "황금교본 1권을 " + 100 + " " + "원고료로 바꾼다.",
    can:  () => S.codex >= 1,
    need: () => "황금교본 1권",
    give: () => { S.codex -= 1; S.money += 100; return "황금교본 1권을 넘기고 원고료 100을 받았다."; }
  }
];

function openShop(back) {
  $modal.classList.add("on");

  const draw = (msg) => {
    let h = '<h2>상 점</h2>' +
            '<div class="hint">보유 ' + CURRENCY + ' <b>' + S.money + '</b>' +
            '　·　황금교본 <b>' + S.codex + '</b></div>';

    if (msg) h += '<div class="hint" style="color:#d8b26a">' + msg + '</div>';

    h += '<div style="margin:10px 0 6px;color:#e8e4de;font-weight:700">인격 배정</div>' +
         '<div class="grid">' +
           '<div class="slot" data-gacha="1">' +
             stripHTML(GACHA_STRIP) +
             '<div class="nm">인격 배정소</div>' +
             '<div class="sub">1회 ' + RULE.pullCost + ' ' + CURRENCY + '</div>' +
             '<div class="sub">' + RULE.guaranteePulls + '회에 ★★ 이상 하나 확정</div>' +
           '</div>';
    if (pickupOn())
      h +=   '<div class="slot pk" data-pickup="1">' +
               stripHTML(PICKUP.banner) +
               '<div class="nm">' + PICKUP.name + '</div>' +
               '<div class="sub">1회 ' + pickupCost() + ' ' + CURRENCY + '</div>' +
               '<div class="sub" style="color:#d8b26a">' + PICKUP.desc + '</div>' +
             '</div>';
    h += '</div>';

    const gTotal = (typeof GIFTS !== "undefined") ? GIFTS.length : 0;
    const gMine  = Object.keys(S.giftsOwned || {}).length;
    h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">E.G.O 기프트</div>' +
         '<div class="grid">' +
           '<div class="slot"' + (S.codex >= GIFT_RULE.cost ? ' data-gift="1"' : '') + '>' +
             '<div class="' + (S.codex >= GIFT_RULE.cost ? 'nm' : 'lock') + '">기프트 배정소</div>' +
             '<div class="sub">1회 황금교본 ' + GIFT_RULE.cost + '　·　보유 ' + gMine + ' / ' + gTotal + '</div>' +
             '<div class="sub">★ ' + Math.round(GIFT_RULE.rate1 * 100) + '%　★★ ' +
               Math.round(GIFT_RULE.rate2 * 100) + '%　★★★ ' + Math.round(GIFT_RULE.rate3 * 100) + '%</div>' +
             '<div class="sub">' + (S.codex >= GIFT_RULE.cost
               ? '중복이면 ' + CURRENCY + ' ' + dupRefundText()
               : '황금교본이 모자랍니다') + '</div>' +
           '</div>' +
         '</div>';

    const aTotal = advisorList().length;
    const aMine  = Object.keys(S.advisorsOwned || {}).length;
    h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">보조 교육위원</div>' +
         '<div class="grid">' +
           '<div class="slot"' + (S.codex >= ADVISOR_RULE.cost ? ' data-adv="1"' : '') + '>' +
             '<div class="' + (S.codex >= ADVISOR_RULE.cost ? 'nm' : 'lock') + '">교육위원 파견 요청</div>' +
             '<div class="sub">1회 황금교본 ' + ADVISOR_RULE.cost + '　·　보유 ' + aMine + ' / ' + aTotal + '</div>' +
             '<div class="sub">★★ ' + Math.round(ADVISOR_RULE.rate2 * 100) + '%　★★★ ' +
               Math.round(ADVISOR_RULE.rate3 * 100) + '%</div>' +
             '<div class="sub">' + (S.codex >= ADVISOR_RULE.cost
               ? '중복이면 ' + CURRENCY + ' ' + dupRefundText()
               : '황금교본이 모자랍니다') + '</div>' +
           '</div>' +
         '</div>';

    h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">교환</div>' +
         '<div class="grid">';
    SHOP_TRADES.forEach(t => {
      const ok = t.can();
      h += '<div class="slot"' + (ok ? ' data-trade="' + t.id + '"' : '') + '>' +
             '<div class="' + (ok ? 'nm' : 'lock') + '">' + t.name + '</div>' +
             '<div class="sub">' + t.desc + '</div>' +
             '<div class="sub">' + (ok ? '필요: ' + t.need() : '가진 것이 모자랍니다') + '</div>' +
           '</div>';
    });
    h += '</div>';

    h += '<div class="modalfoot"><button id="shclose">닫기</button></div>';
    $sheet.innerHTML = h;

    const g = $sheet.querySelector(".slot[data-gacha]");
    if (g) g.onclick = () => openGacha(() => draw(null));

    const pu = $sheet.querySelector(".slot[data-pickup]");
    if (pu) pu.onclick = () => openGacha(() => draw(null), true);

    const gp = $sheet.querySelector(".slot[data-gift]");
    if (gp) gp.onclick = () => {
      if (S.codex < GIFT_RULE.cost) return;
      S.codex -= GIFT_RULE.cost;

      const r = Math.random();
      const star = r < GIFT_RULE.rate3 ? 3
                 : r < GIFT_RULE.rate3 + GIFT_RULE.rate2 ? 2 : 1;
      let cand = GIFTS.filter(x => x.star === star && !(S.giftsOwned && S.giftsOwned[giftId(x)]));
      if (!cand.length) cand = GIFTS.filter(x => x.star === star);
      if (!cand.length) cand = GIFTS;
      const pick = cand[rnd(cand.length)];

      let msg;
      const isNew = !(S.giftsOwned && S.giftsOwned[giftId(pick)]);
      if (!isNew) {
        const back2 = dupRefund(pick.star);
        S.money += back2;
        msg = stars(pick.star) + " " + pick.name + " — 이미 지닌 것이다. " +
              CURRENCY + " " + back2 + " 환급.";
      } else {
        if (!S.giftsOwned) S.giftsOwned = {};
        S.giftsOwned[giftId(pick)] = true;
        if (!S.gift) S.gift = giftId(pick);
        msg = stars(pick.star) + " " + pick.name + " 획득 — " + pick.desc;
      }
      saveVault(); render();
      /* 중복은 축하할 일이 아니니 연출을 넣지 않습니다.
       * 이름은 알리지 않습니다 — 눌러 봐야 무엇을 얻었는지 알도록. */
      if (pick.star >= 3 && isNew)
        starFlash(3, pick.desc || null, () => draw(msg));
      else draw(msg);
    };

    const ap = $sheet.querySelector(".slot[data-adv]");
    if (ap) ap.onclick = () => {
      if (S.codex < ADVISOR_RULE.cost) return;
      const all = advisorList();
      if (!all.length) return;
      S.codex -= ADVISOR_RULE.cost;

      const star = Math.random() < ADVISOR_RULE.rate3 ? 3 : 2;
      let cand = all.filter(a => a.star === star && !(S.advisorsOwned && S.advisorsOwned[advisorId(a)]));
      if (!cand.length) cand = all.filter(a => a.star === star);
      if (!cand.length) cand = all;
      const pick = cand[rnd(cand.length)];
      const key = advisorId(pick);

      let msg;
      const isNew = !(S.advisorsOwned && S.advisorsOwned[key]);
      if (!isNew) {
        const backA = dupRefund(pick.star);
        S.money += backA;
        msg = stars(pick.star) + " " + pick.title + " " + pick.name +
              " — 이미 함께하고 있다. " + CURRENCY + " " + backA + " 환급.";
      } else {
        if (!S.advisorsOwned) S.advisorsOwned = {};
        S.advisorsOwned[key] = true;
        if (!S.advisor) S.advisor = key;
        msg = stars(pick.star) + " " + pick.title + " " + pick.name + " 합류 — " + pick.desc;
      }
      saveVault(); render();
      /* 중복은 축하할 일이 아니니 연출을 넣지 않습니다 */
      /* 이름은 알리지 않습니다 — 눌러 봐야 무엇을 얻었는지 알도록 */
      if (pick.star >= 3 && isNew)
        starFlash(3, pick.note || pick.desc || null, () => draw(msg));
      else draw(msg);
    };

    $sheet.querySelectorAll(".slot[data-trade]").forEach(el => {
      el.onclick = () => {
        const t = SHOP_TRADES.find(x => x.id === el.dataset.trade);
        if (!t || !t.can()) return;
        const said = t.give();
        saveVault(); render();
        draw(said);
      };
    });
    document.getElementById("shclose").onclick = () => { closeModal(); render(); if (back) back(); };
  };
  draw(null);
}

/* 무엇이 나올지 정한다 — 1 / 2 / 3 (성) 또는 "adv" (보조 교육위원) */
function rollTier(forceHigh) {
  if (forceHigh) {
    /* 확정 칸: 2성 이상만. 서로의 비율은 그대로 둔다 */
    const w = RULE.rate2 + RULE.rate3 + RULE.rateAdv;
    const r = Math.random() * w;
    if (r < RULE.rateAdv) return "adv";
    if (r < RULE.rateAdv + RULE.rate3) return 3;
    return 2;
  }
  const r = Math.random();
  if (r < RULE.rateAdv) return "adv";
  if (r < RULE.rateAdv + RULE.rate3) return 3;
  if (r < RULE.rateAdv + RULE.rate3 + RULE.rate2) return 2;
  return 1;
}

/* ── 특정 배정 (픽업) ─────────────────────────────────────────
 *  data/pickup.js 의 PICKUP 을 그대로 읽습니다. 파일이 없으면 그냥 꺼집니다.
 */
function pickupOn()   { return typeof PICKUP !== "undefined" && PICKUP && PICKUP.on; }
function pickupTags() {
  if (!pickupOn()) return [];
  return Array.isArray(PICKUP.tag) ? PICKUP.tag : [PICKUP.tag];
}
/* 제목에 픽업 대상 단어가 들어 있는가 */
function pickupHit(title) {
  const t = String(title || "");
  return pickupTags().some(w => w && t.indexOf(w) >= 0);
}
function pickupCost() {
  if (pickupOn() && typeof PICKUP.cost === "number") return PICKUP.cost;
  return RULE.pullCost;
}

/* 상점 칸 머리에 얹는 작은 그림 띠 — 글씨 없이 그림만.
 * 칸마다 이것을 하나씩 달아 두면 칸 크기가 서로 어긋나지 않습니다. */
function stripHTML(img) {
  if (!img) return "";
  return '<div class="pkline small pic" ' +
         'style="background-image:url(\'' + assetURL(img) + '\')"></div>';
}

/* 특정 배정 광고 띠 — 그림을 깔고 그 위에 문구를 얹습니다. (배정 화면 큰 띠) */
function pkBannerHTML() {
  if (!pickupOn() || !PICKUP.line) return "";
  const bg = PICKUP.banner
    ? ' style="background-image:url(\'' + assetURL(PICKUP.banner) + '\')"' : "";
  return '<div class="pkline' + (PICKUP.banner ? ' pic' : '') + '"' + bg + '>' +
           '<span>' + PICKUP.line + '</span>' +
         '</div>';
}

function openGacha(done, pk) {
  $modal.classList.add("on");
  const pickup = !!(pk && pickupOn());
  const cost   = pickup ? pickupCost() : RULE.pullCost;
  const rate   = pickup ? (typeof PICKUP.rate === "number" ? PICKUP.rate : 0.5) : 0;

  /* 1성도 포함 — 1성은 전원 보유 상태라 중복으로 나와 환급된다 */
  const pool = [];
  for (const who in SINNERS)
    SINNERS[who].ids.forEach(id => { if (!id.todo) pool.push({ who, id }); });

  const pct = x => (x * 100).toFixed(x * 100 % 1 ? 1 : 0) + "%";

  const draw = (result) => {
    let h = '<h2>' + (pickup ? '특 정 배 정' : '인 격 배 정') + '</h2>';
    if (pickup) {
      /* 이 판의 광고 문구 — data/pickup.js 의 line·banner 에서 갈아 끼웁니다 */
      if (PICKUP.line) h += pkBannerHTML();
      h += '<div class="hint" style="color:#d8b26a">' + PICKUP.name +
           '　·　' + PICKUP.desc + '<br>' +
           '같은 성급 안에서 ' + pct(rate) + ' 확률로 대상이 먼저 나옵니다. ' +
           '성급 확률은 일반 배정과 같습니다.</div>';
    }
    h +=    '<div class="hint">1회 ' + cost + ' ' + CURRENCY +
            '　·　중복 시 ' + dupRefundText() + '　·　보유 ' + CURRENCY + ' ' + S.money + '<br>' +
            '★ ' + pct(RULE.rate1) + '　★★ ' + pct(RULE.rate2) + '　★★★ ' + pct(RULE.rate3) +
            '　보조 교육위원 ' + pct(RULE.rateAdv) +
            '　·　' + RULE.guaranteePulls + '회 배정에는 ★★ 이상이 하나 확정</div>';
    if (result) {
      h += '<div class="grid">';
      result.forEach(r => {
        if (r.kind === "adv") {
          h += '<div class="slot' + (r.isNew ? ' sel' : '') + '">' +
                 '<div class="nm"><span class="star">' + stars(r.adv.star) + '</span> ' +
                   r.adv.title + ' ' + r.adv.name + '</div>' +
                 '<div class="sub">보조 교육위원' + (r.isNew ? '　— 신규' : '　— 중복') + '</div>' +
               '</div>';
        } else {
          h += '<div class="slot' + (r.isNew ? ' sel' : '') + '">' +
                 '<div class="nm"><span class="star">' + stars(r.id.star) + '</span> ' + r.id.title + '</div>' +
                 '<div class="sub">' + SINNERS[r.who].name + (r.isNew ? '　— 신규' : '　— 중복') + '</div>' +
               '</div>';
        }
      });
      h += '</div>';
    }
    h += '<div class="modalfoot">' +
         '<button id="g1" class="primary"' + (S.money < cost ? ' disabled' : '') + '>1회 배정</button>' +
         '<button id="g10"' + (S.money < cost * RULE.guaranteePulls ? ' disabled' : '') + '>' +
           RULE.guaranteePulls + '회 배정</button>' +
         '<button id="gclose" class="ghost">닫기</button></div>';
    $sheet.innerHTML = h;

    /* 특정 배정이면, 정해진 확률로 대상 안에서만 고른다 */
    const narrow = (list, get) => {
      if (!pickup || Math.random() >= rate) return list;
      const only = list.filter(x => pickupHit(get(x)));
      return only.length ? only : list;
    };

    const pullIdentity = (star) => {
      let cand = pool.filter(p => p.id.star === star && !S.owned[idKey(p.who, p.id)]);
      if (!cand.length) cand = pool.filter(p => p.id.star === star);
      if (!cand.length) cand = pool;
      cand = narrow(cand, p => p.id.title);
      const pick = cand[rnd(cand.length)];
      const key = idKey(pick.who, pick.id);
      const isNew = !S.owned[key];
      if (isNew) {
        S.owned[key] = true;
        const cur = idByKey(S.equip[pick.who]);
        if (!cur || cur.star < pick.id.star) {
          S.equip[pick.who] = key;
          if (S.party.indexOf(pick.who) >= 0) S.hp[pick.who] = maxHp(pick.who);
        }
      } else S.money += dupRefund(pick.id.star);
      return { kind: "id", who: pick.who, id: pick.id, isNew };
    };

    const pullAdvisor = () => {
      const all = advisorList();
      if (!all.length) return pullIdentity(3);          // 교육위원이 없으면 3성으로 대신
      let cand = all.filter(a => !(S.advisorsOwned && S.advisorsOwned[advisorId(a)]));
      if (!cand.length) cand = all;
      cand = narrow(cand, a => a.title);
      const a = cand[rnd(cand.length)];
      const k = advisorId(a);
      const isNew = !(S.advisorsOwned && S.advisorsOwned[k]);
      if (isNew) {
        if (!S.advisorsOwned) S.advisorsOwned = {};
        S.advisorsOwned[k] = true;
        if (!S.advisor) S.advisor = k;
      } else S.money += dupRefund(a.star);
      return { kind: "adv", key: k, adv: a, isNew };
    };

    const pull = (n) => {
      const out = [];
      const guaranteed = n >= RULE.guaranteePulls;      // 이 묶음에 확정 칸이 있는가
      let gotHigh = false;

      for (let i = 0; i < n; i++) {
        if (S.money < cost) break;
        S.money -= cost;

        const last = (i === n - 1);
        const force = guaranteed && last && !gotHigh;   // 마지막까지 안 나왔으면 확정
        const tier = rollTier(force);

        if (tier !== 1) gotHigh = true;
        out.push(tier === "adv" ? pullAdvisor() : pullIdentity(tier));
      }
      saveVault();
      render();
      /* 처음 얻은 ★★★ 이 섞여 있으면 한 번 빛낸 뒤에 펼친다 */
      const win = bigWin(out);
      if (win) starFlash(3, bigWinLine(win), () => draw(out));
      else draw(out);
    };

    const g1 = document.getElementById("g1");
    const g5 = document.getElementById("g10");
    if (g1 && !g1.disabled) g1.onclick = () => pull(1);
    if (g5 && !g5.disabled) g5.onclick = () => pull(RULE.guaranteePulls);
    document.getElementById("gclose").onclick = () => { closeModal(); if (done) done(); };
  };
  draw(null);
}

/* =====================================================================
 *  저장 / 시작
 * ===================================================================== */
function readSave() { return Store.get(SAVE_KEY); }
function save() {
  try {
    const c = JSON.parse(JSON.stringify(S));
    c.battle = null; c.waiting = false;
    Store.set(SAVE_KEY, JSON.stringify(c));
    say("기록했다. (" + curChapter().no + ")", "sys");
  } catch (e) { say("기록 실패.", "todo"); }
}
function load() {
  const raw = readSave();
  if (!raw) return false;
  try {
    S = JSON.parse(raw);
    S.battle = null; S.waiting = false;
    SCENES = buildScenes(CHAPTERS[S.ch]);   // 기록은 본편만 남는다
    clearLog();
    say("기록을 불러왔다.", "sys");
    divider();
    render();
    cont();
    return true;
  } catch (e) { return false; }
}

/* ── 장 선택 ──────────────────────────────────────────────────
 *  0장은 언제나 열려 있고, 그 뒤로는 앞 장을 클리어해야 열립니다.
 *  화면에는 장 번호와 제목만 보여 줍니다. (내용은 스포일러라 적지 않습니다)
 */
/* ── 곁가지 이야기(.5장) ──────────────────────────────────────
 *  data/story.js 의 장에 side: true 를 달면 「그밖의 이야기」가 됩니다.
 *
 *    · 바로 앞 «본편» 을 마치면 열립니다 (3.5장은 3장을 마치면)
 *    · 건너뛰어도 다음 본편에 갈 수 있습니다 (4장은 3장만 요구합니다)
 *    · 클리어 수에 세지 않습니다
 *
 *  CHAPTERS 안에서는 읽는 차례대로 두면 됩니다 — 3장, 3.5장, 4장 순으로.
 */
function isSide(c) { return !!(c && c.side); }
function mainChapters() { return CHAPTERS.filter(c => !isSide(c)); }

function chapterUnlocked(i) {
  /* 앞쪽에서 가장 가까운 «본편» 을 찾는다. 곁가지는 건너뛴다. */
  for (let k = i - 1; k >= 0; k--) {
    if (isSide(CHAPTERS[k])) continue;
    return !!(S.cleared && S.cleared[CHAPTERS[k].id]);
  }
  return true;                       // 앞에 본편이 없다 = 첫 장
}

function openChapterSelect(back) {
  $modal.classList.add("on");
  let h = '<h2>운 전 석</h2><div class="hint">어디로 갈지 정합니다. ' +
          '앞 장을 마쳐야 다음 장이 열립니다. ' +
          '「그밖의 이야기」는 마치지 않아도 다음 장에 갈 수 있습니다.</div>';

  /* 읽던 데가 있으면 맨 위에 */
  if (readSave())
    h += '<div class="grid"><div class="slot" data-resume="1">' +
           '<div class="nm">이어하기</div>' +
           '<div class="sub">기록해 둔 곳에서 이어서 읽습니다</div>' +
         '</div></div>';

  const head = t => '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">' + t + '</div>';

  const chapSlot = (c, i) => {
    const done  = S.cleared && S.cleared[c.id];
    const open  = chapterUnlocked(i);
    const needs = chapterNeeds(c);
    const miss  = chapterMissing(c);
    return '<div class="slot' + (done ? ' sel' : '') + '"' + (open ? ' data-i="' + i + '"' : '') + '>' +
             '<div class="' + (open ? 'nm' : 'lock') + '">' + c.no +
               (c.subtitle ? '　' + c.subtitle : (c.title ? '　' + c.title : '')) + '</div>' +
             '<div class="sub">' + (open ? (done ? '클리어' : '진행 가능') : '잠김') + '</div>' +
             (c.note ? '<div class="sub">' + c.note + '</div>' : '') +
             (needs.length
               ? '<div class="sub"' + (miss.length ? ' style="color:#c8403a"' : '') + '>' +
                   nameList(needs) + ' 편성 필요' +
                   (miss.length ? '　— 지금은 빠져 있습니다' : '　— 확인됨') + '</div>'
               : '') +
           '</div>';
  };

  h += head("본편") + '<div class="grid">';
  CHAPTERS.forEach((c, i) => { if (!isSide(c)) h += chapSlot(c, i); });
  h += '</div>';

  /* 곁가지 이야기 — 본편 아래에 따로 섭니다 */
  if (CHAPTERS.some(isSide)) {
    h += head("그밖의 이야기") + '<div class="grid">';
    CHAPTERS.forEach((c, i) => { if (isSide(c)) h += chapSlot(c, i); });
    h += '</div>';
  }

  /* 거울 던전 — 보통과 하드가 나란히 섭니다 */
  const enkNow = enkCount();
  const slot = (rule, attr) => {
    const open  = mirrorUnlocked(rule);
    const canGo = open && enkNow >= rule.cost;
    return '<div class="slot' + (open && !canGo ? ' sel' : '') + '"' +
             (canGo ? ' ' + attr + '="1"' : '') + '>' +
             '<div class="' + (canGo ? 'nm' : 'lock') + '">' + rule.name + '　' + rule.sub + '</div>' +
             '<div class="sub">' + (open
               ? ('이미 만난 적 ' + countWord(rule.count) + ' 연달아 상대합니다. ' +
                  '본편의 ' + rule.scale + '배 세기입니다.' +
                  (rule.maxBoss > 1 ? ' 보스가 ' + rule.maxBoss + '까지 섞입니다.' : ''))
               : ('본편을 ' + rule.needCleared + '장 마치면 열립니다')) + '</div>' +
             '<div class="sub">완주 보상 ' + CURRENCY + ' ' + rule.bonus +
               '　·　황금교본 ' + rule.codex + '</div>' +
             '<div class="sub"' + (canGo ? '' : ' style="color:#c8403a"') + '>' +
               '입장 ' + ENK_RULE.name + ' ' + rule.cost +
               (open && !canGo ? '　— ' + ENK_RULE.name + '이 모자랍니다' : '') + '</div>' +
           '</div>';
  };

  h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">거울</div>' +
       '<div class="grid">' + slot(MIRROR_RULE, "data-mirror") +
                              slot(MIRROR_HARD, "data-mirrorhard") + '</div>' +
       '<div style="margin:10px 0 0">' + enkBarHTML() + '</div>';

  h += '<div class="modalfoot"><button id="csclose" class="ghost">닫기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".slot[data-i]").forEach(el => {
    el.onclick = () => { closeModal(); startChapter(+el.dataset.i); };
  });
  const rs = $sheet.querySelector(".slot[data-resume]");
  if (rs) rs.onclick = () => { closeModal(); if (!load()) { glass(); say("기록이 손상되었다.", "todo"); } };
  const m = $sheet.querySelector(".slot[data-mirror]");
  if (m) m.onclick = () => { closeModal(); startMirror(false); };
  const mh = $sheet.querySelector(".slot[data-mirrorhard]");
  if (mh) mh.onclick = () => { closeModal(); startMirror(true); };
  document.getElementById("csclose").onclick = () => { closeModal(); if (back) back(); };
}

/* ── 거울 던전 ────────────────────────────────────────────────
 *  유리창에 비친 것들과 싸운다. 이미 만난 적들 중 셋이 무작위로 나오고,
 *  본편보다 scale 만큼 강해져 있습니다. 쉬지 않고 이어집니다.
 *
 *  두 갈래가 있습니다.
 *    MIRROR_RULE  보통 — 30% 강함
 *    MIRROR_HARD  하드 — 2배. 보스가 둘까지 섞이고, 보상이 훨씬 큽니다.
 *  둘 다 들어갈 때 엔케팔린을 씁니다 (ENK_RULE 참고).
 *
 *  누가 나올지는 들어가기 전에 알려 주지 않습니다. 부딪쳐 봐야 압니다.
 */
/* 거울 던전 배경 — 보통과 하드가 같은 그림을 씁니다 */
const MIRROR_BG = "assets/scene/거울던전.jpg";

const MIRROR_RULE = {
  name: "거울 던전",
  sub:  "유리창에 비친 것들",
  count:  3,      // 몇 명과 연달아 싸우는가
  scale:  1.3,    // 본편 대비 강화 배수 (1.3 = 30% 강함)
  bonus:  260,    // 완주 보상 (원고료)
  codex:  1,      // 완주 보상 (황금교본) — 돌 때마다 받습니다
  maxBoss: 1,     // 한 번에 나올 수 있는 보스 수
  bossChance: 0.65, // 보스가 섞여 나올 확률
  needCleared: 1, // 본편을 몇 장 마쳐야 열리는가
  cost: ENK_RULE.cost   // 입장에 드는 엔케팔린
};

const MIRROR_HARD = {
  name: "하드 거울 던전",
  sub:  "깨진 유리창에 비친 것들",
  count:  3,
  scale:  2.0,    // 본편의 2배
  bonus:  720,    // 보통의 약 2.8배
  codex:  3,
  maxBoss: 2,     // 보스가 둘까지 섞인다
  bossChance: 0.90,
  needCleared: 3, // 본편을 세 장 마쳐야 열립니다
  cost: ENK_RULE.costHard
};

function mirrorRuleNow() { return S && S.mirrorHard ? MIRROR_HARD : MIRROR_RULE; }

function mirrorUnlocked(rule) {
  const r = rule || MIRROR_RULE;
  return Object.keys(S.cleared || {}).length >= r.needCleared;
}

/* 본편 적을 강화해 임시 적으로 만든다 */
function buildMirrorFoes(rule) {
  const r = rule || MIRROR_RULE;
  const k = r.scale;
  const keys = Object.keys(FOES).filter(x => x.indexOf("__mirror_") !== 0);
  const bosses  = keys.filter(x => FOES[x].boss);
  const normals = keys.filter(x => !FOES[x].boss);
  const picked = [];

  /* 보스는 최대 maxBoss 명까지만 */
  if (bosses.length && Math.random() < r.bossChance) {
    const bag = bosses.slice();
    for (let i = 0; i < r.maxBoss && bag.length; i++)
      picked.push(bag.splice(rnd(bag.length), 1)[0]);
  }
  /* 나머지는 보스가 아닌 적으로 채운다 */
  const bag = normals.slice();
  while (picked.length < r.count && bag.length)
    picked.push(bag.splice(rnd(bag.length), 1)[0]);

  /* 약한 것부터 나오도록 — 보스가 있으면 자연히 마지막이 된다 */
  picked.sort((a, b) => FOES[a].hp - FOES[b].hp);

  return picked.map((src, i) => {
    const f = FOES[src];
    const id = "__mirror_" + i;
    FOES[id] = {
      name: (r === MIRROR_HARD ? "깨진 거울의 " : "거울의 ") + f.name,
      hp:  Math.round(f.hp  * k),
      atk: Math.round(f.atk * k),
      def: Math.round(f.def * k),
      boss: !!f.boss,
      img: f.img || null,
      /* 등장 대사와 강타 대사는 본래 것을 그대로 가져옵니다.
       * 빠뜨리면 거울 던전 보스가 강타를 준비하며 아무 말도 안 하게 됩니다. */
      intro: f.intro || null,
      quote: f.quote || null,
      heavyLine: f.heavyLine || null,
      desc: "유리창에 비쳐 나온 것. 본래보다 " +
            Math.round((k - 1) * 100) + "% 강하다."
    };
    return id;
  });
}

function startMirror(hard) {
  const rule = hard ? MIRROR_HARD : MIRROR_RULE;

  if (!mirrorUnlocked(rule)) {
    say(rule.name + "은 본편을 " + rule.needCleared + "장 마쳐야 열립니다.", "sys");
    return;
  }
  if (!enkSpend(rule.cost)) {
    say(ENK_RULE.name + "이 모자랍니다. (" + enkCount() + " / " + ENK_RULE.max + ")　" +
        enkNextText(), "bad");
    render();
    return;
  }

  const ids = buildMirrorFoes(rule);
  const scenes = [{ t: "place", img: MIRROR_BG, name: rule.name },
                  { t: "n", text: hard
                      ? "유리창에 금이 간다. 갈라진 틈마다 다른 것이 서 있다."
                      : "메카고질라의 유리창이 흐려지더니, 비친 것들이 걸어 나온다." },
                  { t: "n", text: "쉴 틈은 없다. " + countWord(rule.count) + " 연달아 상대해야 한다." }];
  ids.forEach((id, i) => {
    if (i) scenes.push({ t: "n", text: "숨을 고를 새도 없이, 다음 것이 유리를 밀고 나온다." });
    scenes.push({ t: "battle", foe: id });
  });
  scenes.push({ t: "mirrorClear" });

  MIRROR = {
    id: hard ? "mirror_hard" : "mirror", no: rule.name, title: "",
    subtitle: rule.sub, scenes: scenes
  };

  S.mirror = true;
  S.mirrorHard = !!hard;
  S.sc = 0;
  S.ended = false;
  SCENES = buildScenes(MIRROR);
  S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
  setBackdrop(MIRROR_BG, null);
  clearLog();
  $log.classList.remove("recalling");
  showCard(null);
  divider();
  say(rule.name, "place");
  say("— " + rule.sub + " —", "sys");
  /* 무엇이 나올지는 알려 주지 않습니다 */
  say("무엇이 비쳐 나올지는 부딪쳐 봐야 안다.", "sys");
  say(ENK_RULE.name + " " + rule.cost + " 소모.  (남은 것 " + enkCount() +
      " / " + ENK_RULE.max + ")", "sys");
  divider();
  render();
  next();
}

function mirrorClear() {
  const rule = mirrorRuleNow();
  const hard = !!S.mirrorHard;
  divider();
  say(hard ? "깨진 유리가 도로 맞물린다." : "유리창이 다시 맑아진다.", "good");
  const mb = earn(rule.bonus);
  S.money += mb;
  say(CURRENCY + " " + mb + " 획득.", "gain");
  if (rule.codex) {
    S.codex += rule.codex;
    say("비친 것들이 남기고 간 황금교본 " + rule.codex + "권.  (보유 " + S.codex + ")", "gain");
  }
  saveVault();
  S.mirror = false;
  S.mirrorHard = false;
  MIRROR = null;
  S.ended = true;
  render();
  const again = enkCount() >= rule.cost;
  buttons([
    { label: again ? "한 번 더" : "한 번 더 (" + ENK_RULE.name + " 부족)",
      cls: "primary", disabled: !again, fn: () => startMirror(hard) },
    { label: "유리창", fn: () => glass() },
    { label: "상점", cls: "ghost", fn: () => openShop(() => {}) }
  ]);
  showEnkBar(true);
}

/* ── 기록 (진행 저장 + 보관함 파일 내보내기) ───────────────── */
function openRecord(back) {
  save();
  saveVault();
  $modal.classList.add("on");
  const t = vaultStats();
  const total = t[1][0] + t[2][0] + t[3][0];
  const adv = Object.keys(S.advisorsOwned || {}).length;
  const cl  = Object.keys(S.cleared || {}).length;

  $sheet.innerHTML =
    '<h2>기 록</h2>' +
    '<div class="hint">진행과 보관함을 이 브라우저에 저장했습니다.' +
      (Store.ok ? '' : '<br><b style="color:#d9705f">지금 이 환경은 브라우저 저장이 막혀 있어, 창을 닫으면 사라집니다. 아래로 내보내 두세요.</b>') +
    '</div>' +
    '<div class="grid">' +
      '<div class="slot"><div class="nm">보유 인격</div><div class="sub">' + total + '종</div></div>' +
      '<div class="slot"><div class="nm">보조 교육위원</div><div class="sub">' + adv + '명</div></div>' +
      '<div class="slot"><div class="nm">클리어한 장</div><div class="sub">' + cl + '개</div></div>' +
      '<div class="slot"><div class="nm">' + CURRENCY + '</div><div class="sub">' + S.money + '</div></div>' +
    '</div>' +
    '<div class="hint" style="margin-top:16px">저장을 내보내시겠습니까?</div>' +
    '<div class="modalfoot">' +
      '<a id="vdl" class="dl" download="vault.js">내보내기</a>' +
      '<button id="rclose">닫기</button>' +
    '</div>';

  const a = document.getElementById("vdl");
  a.href = "data:text/javascript;charset=utf-8," + encodeURIComponent(vaultExportText());
  document.getElementById("rclose").onclick = () => { closeModal(); if (back) back(); };
}

/* ── 업적 ────────────────────────────────────────────────────
 *  제목·조건·보상을 그대로 보여 줍니다.
 *  보상으로 받는 사람의 수치와 설명은 손에 넣기 전까지 가립니다.
 */
function openAchieve(back) {
  $modal.classList.add("on");
  const all = achieveList();
  const done = all.filter(achieved).length;

  let h = '<h2>업 적</h2>' +
          '<div class="hint">조건을 채우면 그 자리에서 보상이 들어옵니다.　' +
          done + ' / ' + all.length + '</div>';

  if (!all.length) h += '<div class="box dim">아직 업적이 없습니다.</div>';

  h += '<div class="grid">';
  all.forEach(a => {
    const got = achieved(a);
    h += '<div class="slot' + (got ? ' sel' : '') + '">' +
           '<div class="' + (got ? 'nm' : 'lock') + '">' +
             (got ? '✓ ' : '') + a.name + '</div>' +
           '<div class="sub">' + (a.desc || '') + '</div>' +
           '<div class="sub"><span class="star">보상</span> ' +
             (got ? (a.reward || '') : '？？？') + '</div>' +
         '</div>';
  });
  h += '</div>';

  h += '<div class="hint" style="margin-top:14px">' +
       '보상으로 오는 사람은 손에 넣기 전까지 이름과 수치가 가려집니다.</div>' +
       '<div class="modalfoot"><button id="acclose">닫기</button></div>';
  $sheet.innerHTML = h;
  document.getElementById("acclose").onclick = () => {
    closeModal(); render(); if (back) back();
  };
}

/* ── 보조 교육위원 편성 ────────────────────────────────────── */
function openAdvisor(back) {
  $modal.classList.add("on");
  const all = advisorList();
  const mine = all.filter(a => S.advisorsOwned && S.advisorsOwned[advisorId(a)]);

  let h = '<h2>보 조 교 육 위 원</h2>' +
          '<div class="hint">관리자 옆에 한 명만 세울 수 있습니다. 직접 싸우지는 않고, ' +
          '편성된 작성위원 전원에게 상시 효과를 겁니다.　보유 ' + mine.length + ' / ' +
          all.length + '</div><div class="grid">';

  h += '<div class="slot' + (!S.advisor ? ' sel' : '') + '" data-pick="">' +
         '<div class="nm">세우지 않음</div><div class="sub">효과 없음</div></div>';

  all.forEach(a => {
    const k = advisorId(a);
    const has = !!(S.advisorsOwned && S.advisorsOwned[k]);
    const on  = S.advisor === k;
    h += '<div class="slot' + (on ? ' sel' : '') + '"' + (has ? ' data-pick="' + k + '"' : '') + '>' +
           '<div class="' + (has ? 'nm' : 'lock') + '">' +
             '<span class="star">' + stars(a.star) + '</span> ' + a.title + ' ' + a.name +
             (on ? ' <span class="sub">· 배치</span>' : '') + '</div>' +
           '<div class="sub">' + (has ? a.desc : '미보유') + '</div>' +
           (has && a.note ? '<div class="sub">' + a.note + '</div>' : '') +
         '</div>';
  });
  h += '</div><div class="modalfoot"><button id="aclose">돌아가기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".slot[data-pick]").forEach(el => {
    el.onclick = () => {
      S.advisor = el.dataset.pick || null;
      S.party.forEach(w => { if (w) S.hp[w] = Math.min(curHp(w), maxHp(w)); });
      saveVault(); render();
      openAdvisor(back);
    };
  });
  document.getElementById("aclose").onclick = () => { if (back) back(); else { closeModal(); render(); } };
}

/* ── E.G.O 기프트 고르기 ───────────────────────────────────── */
function openGiftPick(back) {
  $modal.classList.add("on");
  const mine = (typeof GIFTS !== "undefined" ? GIFTS : []).filter(g => S.giftsOwned && S.giftsOwned[giftId(g)]);

  let h = '<h2>E . G . O   기 프 트</h2>' +
          '<div class="hint">하나만 지닐 수 있습니다. 편성된 작성위원 전원에게 걸립니다.　보유 ' +
          mine.length + ' / ' + (typeof GIFTS !== "undefined" ? GIFTS.length : 0) + '</div><div class="grid">';

  h += '<div class="slot' + (!S.gift ? ' sel' : '') + '" data-pick="">' +
         '<div class="nm">지니지 않음</div><div class="sub">효과 없음</div></div>';

  (typeof GIFTS !== "undefined" ? GIFTS : []).forEach(g => {
    const has = !!(S.giftsOwned && S.giftsOwned[giftId(g)]);
    const on  = S.gift === giftId(g);
    h += '<div class="slot' + (on ? ' sel' : '') + '"' + (has ? ' data-pick="' + giftId(g) + '"' : '') + '>' +
           '<div class="' + (has ? 'nm' : 'lock') + '">' +
             '<span class="star">' + stars(g.star) + '</span> ' + g.name +
             (on ? ' <span class="sub">· 지님</span>' : '') + '</div>' +
           '<div class="sub">' + (has ? g.desc : '미보유') + '</div>' +
         '</div>';
  });
  h += '</div><div class="modalfoot"><button id="gfclose">돌아가기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".slot[data-pick]").forEach(el => {
    el.onclick = () => {
      S.gift = el.dataset.pick || null;
      S.party.forEach(w => { if (w) S.hp[w] = Math.min(curHp(w), maxHp(w)); });
      saveVault(); render();
      openGiftPick(back);
    };
  });
  document.getElementById("gfclose").onclick = () => { if (back) back(); else { closeModal(); render(); } };
}

function grantAdvisor(s) {
  const a = advisorFrom(typeof s === "string" ? { who: s } : s);
  const k = advisorId(a);
  divider();
  if (!a) { say("(교육위원을 찾지 못했습니다)", "todo"); return; }
  if (!S.advisorsOwned) S.advisorsOwned = {};
  if (S.advisorsOwned[k]) { say("이미 함께하고 있는 교육위원이다.", "sys"); return; }
  S.advisorsOwned[k] = true;
  if (!S.advisor) S.advisor = k;
  say("보조 교육위원 합류 — " + stars(a.star) + " " + a.title + " " + a.name, "gain");
  say(a.desc, "sys");
  saveVault(); render();
}

/* ── 보관함 ──────────────────────────────────────────────── */
function vaultStats() {
  const t = { 1: [0, 0], 2: [0, 0], 3: [0, 0] };
  for (const who in SINNERS)
    SINNERS[who].ids.forEach(id => {
      if (id.todo) return;
      t[id.star][1]++;
      if (S.owned[idKey(who, id)]) t[id.star][0]++;
    });
  return t;
}

function openVault(back) {
  $modal.classList.add("on");
  const t = vaultStats();
  const total = t[1][0] + t[2][0] + t[3][0];
  const all   = t[1][1] + t[2][1] + t[3][1];
  let h = '<h2>보 관 함</h2>' +
          '<div class="hint">모은 인격 <b>' + total + ' / ' + all + '</b>　·　' +
          '★ ' + t[1][0] + '/' + t[1][1] + '　★★ ' + t[2][0] + '/' + t[2][1] +
          '　★★★ ' + t[3][0] + '/' + t[3][1] + '　·　' +
          CURRENCY + ' ' + S.money + '<br>' +
          '여기 담긴 것은 회차를 새로 시작해도 사라지지 않습니다. 눌러서 장착합니다.</div>';

  Object.keys(SINNERS).forEach(who => {
    const s = SINNERS[who];
    const mine = ownedIds(who).length;
    const tot  = s.ids.filter(i => !i.todo).length;
    h += '<div style="margin:14px 0 6px;color:#e8e4de;font-weight:700">' + s.name +
         ' <span class="sub" style="font-weight:400">' + mine + '/' + tot + '</span></div><div class="grid">';
    s.ids.forEach(id => {
      const key = idKey(who, id);
      if (id.todo) { h += '<div class="slot"><div class="lock">' + stars(id.star) + ' (미작성)</div></div>'; return; }
      const has = !!S.owned[key];
      const on  = S.equip[who] === key;
      const st  = baseStatsOf(key);
      h += '<div class="slot' + (on ? ' sel' : '') + '"' + (has ? ' data-key="' + key + '"' : '') + '>' +
             '<div class="' + (has ? 'nm' : 'lock') + '">' +
               '<span class="star">' + stars(id.star) + '</span> ' + id.title +
               (on ? ' <span class="sub">· 장착</span>' : '') + '</div>' +
             '<div class="sub">' + (has ? ('공 ' + st.atk + '　방 ' + st.def + '　체 ' + st.hp) : '미보유') + '</div>' +
             (has && id.note ? '<div class="sub">' + id.note + '</div>' : '') +
           '</div>';
    });
    h += '</div>';
  });
  h += '<div class="modalfoot"><button id="vclose">닫기</button>' +
       '<button id="vrec">기록 · 내보내기</button>' +
       '<button id="vreset" class="ghost">보관함 비우기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".slot[data-key]").forEach(el => {
    el.onclick = () => {
      const key = el.dataset.key;
      S.equip[parseKey(key).who] = key;
      S.hp[parseKey(key).who] = maxHp(parseKey(key).who);
      saveVault(); render();
      openVault(back);
    };
  });
  document.getElementById("vclose").onclick = () => { closeModal(); render(); if (back) back(); };
  document.getElementById("vrec").onclick = () => openRecord(() => openVault(back));
  document.getElementById("vreset").onclick = () => {
    if (!confirm("보관함을 비웁니다. 모은 인격과 " + withJosa(CURRENCY, "이") + " 모두 사라집니다. 계속할까요?")) return;
    clearVault();
    closeModal();
    title();
  };
}

/* ── 유리창 ────────────────────────────────────────────────────
 *  메인 화면. 장을 고르고, 작성위원을 편성하고, 보관함을 여는 곳.
 *  메카고질라 안에서 밖을 내다보는 자리다.
 */
function glass() {
  S = newState();          // 보관함에서 다시 읽어 온다
  SCENES = [];
  clearLog();
  showCard("assets/logo/작성위원 전원.png", "라슈 컴퍼니");
  say("유 리 창", "place");
  say("라슈 컴퍼니 · 신생 L사　　v" + VERSION + " «" + VERSION_NAME + "»", "sys");
  divider();
  say("당신은 관리자 노란테다.", "n");
  say("작성위원들을 이끌고 흩어진 황금교본을 되찾아야 한다.", "n");
  divider();

  const t = vaultStats();
  const total = t[1][0] + t[2][0] + t[3][0];
  const adv = Object.keys(S.advisorsOwned || {}).length;
  /* 클리어 수는 «본편» 만 셉니다. 곁가지(.5장)는 세지 않습니다. */
  const mains = mainChapters();
  const done  = mains.filter(c => S.cleared && S.cleared[c.id]).length;
  const sides = CHAPTERS.filter(c => isSide(c) && S.cleared && S.cleared[c.id]).length;
  say("보유 인격 " + total + "종　·　보조 교육위원 " + adv + "명　·　클리어 " +
      done + "/" + mains.length + "장" +
      (sides ? "　·　그밖의 이야기 " + sides + "편" : ""), "sys");
  say(CURRENCY + " " + S.money + "　·　황금교본 " + S.codex, "sys");
  say(ENK_RULE.name + " " + enkCount() + " / " + ENK_RULE.max + "　·　" + enkNextText(), "sys");
  versionNotice();          // 옛 판 보관함을 열었으면 여기서 한 번 알린다

  render();
  buttons([
    { label: "운전석", cls: "primary", fn: () => openChapterSelect(() => glass()) },
    { label: "편성",   fn: () => openParty(() => glass()) },
    { label: "상점",   fn: () => openShop(() => glass()) },
    { label: "노트",   fn: () => openNote(() => glass()) },
    { label: "업적",   fn: () => openAchieve(() => glass()) },
    { label: "보관함", fn: () => openVault(() => glass()) },
    /* 「다음부터 표시하지 않음」을 누른 판에서는 이 손잡이가 사라집니다 */
    patchHidden() ? null
                  : { label: "패치 노트", cls: "ghost", fn: () => openPatch(() => glass()) }
  ]);
  showEnkBar(true);
}

/* 예전 이름 — 부팅과 내부 호출에서 그대로 쓸 수 있게 남겨 둡니다 */
function title() { glass(); }

/* ── 출입 코드 ────────────────────────────────────────────────
 *  data/access.js 에 적힌 해시와 맞아야 들어올 수 있습니다.
 *  한 번 통과하면 그 브라우저에 기억해 둡니다.
 */
const UNLOCK_KEY = "rash_company_unlocked_v1";

function codeHash(s) {
  let h = 2166136261;
  s = String(s).trim().toLowerCase();
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function gateOpen() {
  if (typeof ACCESS === "undefined" || !ACCESS.enabled) return true;
  return Store.get(UNLOCK_KEY) === "1";
}
function lockAgain() { Store.del(UNLOCK_KEY); gate(); }

function gate(msg) {
  S = newState();
  clearLog();
  showCard("assets/portrait/logo.png", "라슈 컴퍼니");
  say(ACCESS.title || "출 입 코 드", "place");
  say(ACCESS.line || "", "n");
  divider();
  say(ACCESS.hint || "", "sys");
  if (msg) say(msg, "bad");
  $party.innerHTML = "";
  document.getElementById("synergy").innerHTML = "";
  $chap.textContent = "v" + VERSION;
  $wallet.innerHTML = "";

  $actions.innerHTML =
    '<input id="codein" class="codein" autocomplete="off" spellcheck="false" placeholder="코드">' +
    '<button id="codego" class="primary">확인</button>';
  $actions.classList.add("mid");        // 출입 코드 칸은 화면 가운데에

  const inp = document.getElementById("codein");
  const go = () => {
    const v = inp.value;
    if (!v) return;
    if (codeHash(v) === ACCESS.hash) {
      Store.set(UNLOCK_KEY, "1");
      glass();
    } else {
      inp.value = "";
      gate("코드가 맞지 않는다.");
    }
  };
  document.getElementById("codego").onclick = go;
  inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  inp.focus();
}

function boot() { if (gateOpen()) glass(); else gate(); }

boot();   // 코드를 통과하면 유리창부터
