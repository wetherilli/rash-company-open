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
const VERSION = "1.0.10";
const VERSION_NAME = "기대가 어긋나는";

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
  /* 원고료로 들어오는 수입에 곱하는 값.
   * 타지 않는 것 셋 — 황금교본 교환, 위 dupRefund, 거울 던전 완주 보상(고정값). */
  moneyGain:   0.35,
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
  startMoney:  400,    // 보관함이 아예 없을 때 손에 쥐고 시작하는 원고료
  /* 장을 마칠 때 주는 원고료. «처음 마칠 때만» 나옵니다 (storyPays 참고).
   * 장마다 다르게 주고 싶으면 그 장에 clearPay 를 적으면 그것이 이깁니다. */
  clearPay:    200,
  /* 체포로 깎는 적 방어 비율. 이번 턴에만 걸립니다.
   * data/characters.js 의 「체포」 설명 글에도 같은 수가 적혀 있습니다 — 함께 고치십시오. */
  arrestCut:   0.20,
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
  cost:        1,                 // 거울 던전 1회 입장에 드는 양
  costHard:    1,                 // 하드 거울 던전 1회 입장에 드는 양
  costExtreme: 2                  // 익스트림 거울 던전 1회 입장에 드는 양
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

/* 판 번호를 앞자리부터 수로 견줍니다. a 가 뒤면 음수, 앞서면 양수. */
function verCmp(a, b) {
  const x = String(a || "0").split(".").map(Number);
  const y = String(b || "0").split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d;
  }
  return 0;
}

/* ── 뒤에서 온 보관함 ─────────────────────────────────────────
 *  이 판보다 «나중» 판에서 저장한 보관함을 열었을 때입니다.
 *  그 보관함에는 이 판이 모르는 것들이 들어 있을 수 있어,
 *  읽어서 다시 쓰면 모르는 것을 조용히 지워 버립니다.
 *
 *  그래서 자물쇠를 겁니다.
 *    · 게임을 시작하지 못하게 막고
 *    · saveVault() 가 한 글자도 쓰지 못하게 합니다
 *  최신 판으로 열면 그대로 살아 있습니다.
 */
let VAULT_LOCK = null;   // { from, to } — 잠겼을 때만 채워집니다
function vaultLocked() { return !!VAULT_LOCK; }

/* 지난번 접속 때의 판 번호. 보관함을 읽을 때 붙잡아 둡니다 (newState 참고).
 * 보관함이 아예 없으면 null — 처음 오신 분입니다. */
let LAST_VER = null;

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
  const o = vaultBody();
  o.sig = vaultSig(o);      // 내용을 요약한 값 — 손댄 흔적을 알아보는 몫
  return o;
}
function vaultBody() {
  return {
    /* 걸러 내지 않습니다 — 지금 못 알아보는 열쇠를 지워 버리면 되살릴 길이 없어집니다 */
    ids:      Object.keys(S.owned),
    advisors: Object.keys(S.advisorsOwned || {}),
    /* advisor / gift 는 «첫째 칸» 입니다. 옛 판이 읽을 수 있게 남겨 둡니다.
     * 실제로 세운 것 전부는 advisorOn / giftOn 에 있습니다. */
    advisor:  advisorOnList()[0] || null,
    advisorOn: (S.advisorOn || []).filter(Boolean),
    gifts:    Object.keys(S.giftsOwned || {}),
    gift:     giftOnList()[0] || null,
    giftOn:   (S.giftOn || []).filter(Boolean),
    /* 저장해 둔 편성 3칸 */
    presets:  S.presets || null,
    supports: Object.keys(S.supportsOwned || {}),
    achieved: Object.keys(S.achieved || {}),
    cleared:  Object.keys(S.cleared || {}),
    equip:    S.equip,
    party:    ownParty(),          /* 조력자는 «내 것» 이 아니라 담지 않습니다 */
    money:    S.money,
    codex:    S.codex,
    newbie:   S.newbie || 0,   // 신입 관리자 기념 배정을 몇 번 썼는가
    enk:      S.enk || null,
    /* 이미 받은 우편. 이것을 빠뜨리면 받은 표시가 안 남아 무한정 다시 받힙니다. */
    mailTaken: Object.keys(S.mailTaken || {}),
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
    /* 옛 보관함에는 advisorOn 이 없습니다 — 그때는 한 명뿐이었으니 그것을 씁니다 */
    advisorOn: v.advisorOn || (v.advisor ? [v.advisor] : []),
    gifts:    toMap(v.gifts),
    gift:     v.gift || null,
    giftOn:   v.giftOn || (v.gift ? [v.gift] : []),
    presets:  v.presets || null,
    supports: toMap(v.supports),
    achieved: toMap(v.achieved),
    mailTaken: toMap(v.mailTaken),
    cleared:  toMap(v.cleared),
    equip:    v.equip || {},
    party:    v.party || null,
    money:    v.money,
    codex:    v.codex,
    newbie:   typeof v.newbie === "number" ? v.newbie : 0,
    enk:      v.enk || null,
    ver:      v.ver || null
  };
}
/* ── 판이 바뀔 때 보관함을 한 벌 떠 둡니다 ──────────────────────
 *
 *  판이 올라간 뒤 처음 저장할 때, «덮어쓰기 전의 것» 을 따로 보관합니다.
 *  이렇게 해 두면 「업데이트하고 나서 뭐가 없어졌다」는 말을 실제로 견줘 볼 수 있습니다.
 *
 *  내보내기로는 이 몫을 할 수 없습니다. 내보내기는 «지금 상태» 를 뽑는 것이고,
 *  기록 화면은 열리자마자 saveVault() 를 부르므로 그때는 이미 덮어쓴 뒤입니다.
 *
 *  판마다 한 벌씩, 최근 셋까지만 둡니다.
 */
const VAULT_BACK_KEY = "rash_company_vault_backup_v1";

/* ── 손댄 흔적 ────────────────────────────────────────────────
 *
 *  보관함에 «내용을 요약한 값» 을 하나 함께 적어 둡니다.
 *  다음에 열 때 그 값이 안 맞으면 «손댄 것» 으로 봅니다.
 *
 *  ■ 이것은 잠금이 아닙니다. 막으려는 것이 아니라 «알아보려는» 것입니다.
 *    셈하는 법이 이 파일에 그대로 적혀 있으니, 마음먹으면 값도 같이 고칠 수 있습니다.
 *    손으로 슬쩍 고친 것을 가려내 오류 보고를 헛짚지 않으려는 몫입니다.
 */
function vaultSig(o) {
  if (!o) return "";
  const j = a => (a || []).slice().sort().join(",");
  return codeHash([
    j(o.ids), j(o.advisors), j(o.gifts), j(o.supports),
    j(o.achieved), j(o.cleared),
    o.money, o.codex, o.ver
  ].join("|"));
}
/* 저장된 값과 지금 셈한 값이 다른가 */
function vaultTouched(o) {
  if (!o || !o.sig) return false;      // 옛 판에는 없던 값이라, 없으면 «모름» 으로 봅니다
  return o.sig !== vaultSig(o);
}

function vaultBackups() {
  try { return JSON.parse(Store.get(VAULT_BACK_KEY)) || []; } catch (e) { return []; }
}

function backupVault() {
  const raw = Store.get(VAULT_KEY);
  if (!raw) return;                       // 뜰 것이 없습니다
  let o = null;
  try { o = JSON.parse(raw); } catch (e) { o = null; }
  const ver = (o && o.ver) || "(판 없음)";
  if (ver === VERSION) return;            // 같은 판이면 덮어써도 잃는 것이 없습니다

  const list = vaultBackups();
  if (list.some(b => b.ver === ver)) return;   // 그 판은 이미 떠 두었습니다
  list.unshift({ at: Date.now(), ver: ver, to: VERSION, raw: raw });
  try { Store.set(VAULT_BACK_KEY, JSON.stringify(list.slice(0, 3))); } catch (e) {}
}

function saveVault() {
  if (!S) return;
  if (vaultLocked()) return;   // 뒤에서 온 보관함은 절대 덮어쓰지 않습니다
  backupVault();               // 덮어쓰기 «전에» 한 벌 떠 둡니다
  Store.set(VAULT_KEY, JSON.stringify(vaultToObject()));
}
/* 보관함을 아주 비웁니다.
 *
 *  저장소만 지우고 말면 **머릿속에 든 S 가 그대로** 남아, 다음에 무엇이든 저장하는 순간
 *  지운 것이 통째로 되살아납니다. 그래서 진행 기록까지 지우고 S 를 새로 세웁니다.
 *
 *  data/vault.js 에 VAULT_SEED 를 적어 두었다면 «그 지점» 으로 돌아갑니다.
 *  아무것도 안 적혀 있으면(기본) 맨 처음으로 돌아갑니다 —
 *  신입 관리자 기념 배정도 다시 열립니다. */
function clearVault() {
  Store.del(VAULT_KEY);
  Store.del(SAVE_KEY);      // 어디까지 읽었나 하는 기록도 함께
  S = newState();           // 머릿속도 같이 비워야 곧바로 되살아나지 않습니다
  enkSync();
}

/* ── 값 하나를 vault.js 에 적을 글자로 ────────────────────────
 *  ind 는 그 값이 «놓이는 줄» 의 들여쓰기입니다.
 *
 *  ■ 줄머리의 «};» 는 파일 끝에 한 번뿐이어야 합니다
 *    되읽는 parseVaultSeedText() 가 그것으로 덩이의 끝을 찾습니다.
 *    그래서 안쪽 덩이의 닫는 괄호는 반드시 들여씁니다.
 */
function vaultQuote(s) { return JSON.stringify(String(s)); }

function vaultValueText(v, ind) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "string") return vaultQuote(v);
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return "[\n" + v.map(x => ind + "  " + vaultValueText(x, ind + "  ")).join(",\n") +
           "\n" + ind + "]";
  }
  /* 표 안의 빈 칸(null)은 적지 않습니다 — 장착하지 않은 자리까지 줄줄이 적히면 읽기 나쁩니다.
   * 맨 바깥 칸은 이 길로 오지 않으므로(아래 vaultExportText 참고) 빈 채로도 그대로 남습니다. */
  const keys = Object.keys(v).filter(k => v[k] !== null && v[k] !== undefined);
  if (!keys.length) return "{}";
  const key = k => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : vaultQuote(k);
  return "{\n" + keys.map(k =>
      ind + "  " + key(k) + ": " + vaultValueText(v[k], ind + "  ")).join(",\n") +
    "\n" + ind + "}";
}

/* ── data/vault.js 에 붙여 넣을 수 있는 형태로 뽑아낸다 ────────
 *
 *  ■ 담을 칸을 손으로 세지 않습니다
 *    예전에는 여기에 «ids, advisors, gifts, cleared …» 하고 이름을 하나하나 적어
 *    두었습니다. 그래서 vaultBody() 에 칸이 새로 생겨도 이쪽은 따라오지 않았고,
 *    업적 · 지원 작성위원 · 받은 우편 · 편성 3칸 · 둘째 셋째 교육위원이
 *    내보낸 파일에서 통째로 빠져 있었습니다. 그 파일로 되돌리면 업적이 사라졌습니다.
 *    요약값 sig 는 업적과 지원까지 세고 있었으므로, 되읽으면 내용과 어긋나
 *    «손댄 흔적» 으로도 잘못 떴습니다.
 *
 *    이제는 vaultToObject() 가 내놓는 칸을 그대로 훑어 적습니다.
 *    보관함에 칸을 더하면 내보내기도 저절로 따라옵니다 — 여기는 안 고쳐도 됩니다.
 */
function vaultExportText() {
  const o = vaultToObject();
  const head =
    "/* =====================================================================\n" +
    " *  라슈 컴퍼니 — 보관함\n" +
    " * ---------------------------------------------------------------------\n" +
    " *  ■ 이 파일을 다시 읽히려면\n" +
    " *    게임 폴더의  data/vault.js  에 이 파일을 통째로 덮어쓰십시오.\n" +
    " *    (index.html 이 있는 곳 아래의 data 폴더입니다)\n" +
    " *    덮어쓴 뒤 index.html 을 새로고침하면 그 지점부터 이어집니다.\n" +
    " *\n" +
    " *    단, 브라우저에 저장된 것이 먼저입니다. 이 파일로 되돌리려면\n" +
    " *    보관함 화면에서 [보관함 비우기] 를 한 번 하고 새로고침하십시오.\n" +
    " *    (기록 화면의 [가져오기] 를 쓰면 그 손질 없이 바로 옮겨 담습니다)\n" +
    " *\n" +
    " *  ■ 여기 담기는 것\n" +
    " *    보관함에 남는 것 «전부» 입니다 — 인격 · 교육위원 · 기프트 · 지원 작성위원 ·\n" +
    " *    업적 · 클리어한 장 · 편성 3칸 · 받은 우편 · 원고료 · 황금교본 · 엔케팔린.\n" +
    " *\n" +
    " *  ■ 무언가 없어진 것 같으면\n" +
    " *    고칠 것 없이 이 파일을 그대로 보내 주십시오.\n" +
    " *    아래에 «판이 바뀌기 전» 의 보관함과 무엇이 없어졌는지가 함께 적혀 있습니다.\n" +
    " * ===================================================================== */\n\n";

  /* 맨 바깥 칸은 빈 것(null)이라도 그대로 적습니다 — 무엇이 담기는 자리인지
   * 파일만 봐도 알 수 있도록. 안쪽 표는 vaultValueText 가 빈 칸을 걸러 냅니다. */
  const seed =
    "/* sig 는 위 내용을 요약한 값입니다.\n" +
    " * 손으로 아래를 고치면 이 값과 어긋나 기록 화면에 «손댄 흔적» 으로 뜹니다. */\n" +
    "const VAULT_SEED = {\n" +
    Object.keys(o).map(k => "  " + k + ": " + vaultValueText(o[k], "  ")).join(",\n") +
    "\n};\n";

  /* ── 적자마자 스스로 되읽어 봅니다 ───────────────────────────
   *  방금 만든 글을 그 자리에서 parseVaultSeedText() 로 되읽어, 칸이 하나도
   *  빠지지 않았는지 봅니다. 빠진 것이 있으면 파일 «맨 위» 에 그대로 적습니다 —
   *  못 쓰는 파일을 모르고 건네는 일이 없도록. */
  const back = parseVaultSeedText(seed);
  const miss = back ? Object.keys(o).filter(k => !(k in back)) : Object.keys(o);
  const warn = (back && !miss.length) ? "" :
    "/* ★ 이 파일은 온전하지 않습니다 — " +
    (back ? "다음 칸이 빠졌습니다: " + miss.join(", ") : "스스로 되읽지 못했습니다") + "\n" +
    " *   이대로 쓰지 마시고, 이 파일을 그대로 보내 주십시오. */\n\n";

  return warn + head + seed +
    /* ── 아래는 «되돌리기» 가 아니라 «따져 보기» 용입니다 ──────────
     *  게임은 VAULT_SEED 만 읽습니다. 아래 것은 읽지 않으므로,
     *  이 파일을 data/vault.js 에 그대로 덮어써도 아무 탈이 없습니다.
     *
     *  판이 바뀔 때 떠 둔 «덮어쓰기 전» 보관함이 여기 함께 들어갑니다.
     *  「업데이트하고 나서 뭐가 없어졌다」는 말이 나오면 이 파일 하나만 받으면 됩니다. */
    "\n" + vaultDiffText() + "\n" +
    "\n/* 판이 바뀌기 «전» 의 보관함 — 게임은 읽지 않습니다 */\n" +
    "const VAULT_BACKUPS = " + JSON.stringify(vaultBackups(), null, 2) + ";\n";
}

/* ── 내보낸 파일을 도로 읽기 ──────────────────────────────────
 *  vaultExportText() 가 뽑아낸 vault.js 는 «const VAULT_SEED = {...};» 로
 *  시작하는 진짜 자바스크립트입니다(JSON 이 아닙니다 — 키에 따옴표가 없습니다).
 *  그 덩이만 잘라내 Function 으로 읽습니다. 이 파일은 이용자가 방금 고른
 *  자기 파일이지 남이 준 것이 아니므로, eval 급 실행이라도 위험하지 않습니다.
 */
function parseVaultSeedText(text) {
  const m = /const\s+VAULT_SEED\s*=\s*(\{[\s\S]*?\n\};)/.exec(text || "");
  if (!m) return null;
  try {
    const obj = new Function("return " + m[1])();
    return (obj && typeof obj === "object") ? obj : null;
  } catch (e) { return null; }
}

/* 고른 파일을 읽어 보관함을 통째로 갈아 끼운다. 성공하면 새로고침한다 —
 * S 를 그 자리에서 다시 짜 맞추는 대신, 평소 켤 때와 똑같은 길로
 * 보관함 → S 순서를 타게 하는 편이 안전하다. */
function importVaultFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const seed = parseVaultSeedText(String(reader.result || ""));
    if (!seed) {
      alert("이 파일에서 보관함을 읽지 못했습니다. [기록 · 내보내기] 로 받은 vault.js 가 맞는지 확인하십시오.");
      return;
    }
    if (!confirm("지금 이 브라우저에 저장된 보관함을 방금 고른 파일 내용으로 덮어씁니다.\n" +
                 "지금 것은 되돌릴 수 없습니다 — 계속하기 전에 걱정되면 먼저 [내보내기] 로 받아 두십시오.\n\n계속할까요?")) return;
    /* sig 는 손대지 않는다 — 파일이 만들어질 때(내보낼 때) 찍힌 값을 그대로 두어야
     * 다음에 열었을 때 «그 사이 손을 댔는지» 를 여전히 가려낼 수 있다. */
    Store.set(VAULT_KEY, JSON.stringify(seed));
    location.reload();
  };
  reader.onerror = () => alert("파일을 읽지 못했습니다.");
  reader.readAsText(file, "utf-8");
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
  /* 모르는 열쇠도 버리지 않고 담아 둡니다.
   * 이름이 바뀌었는데 was 를 아직 안 적어 둔 경우, 나중에 적으면 그때 되살아납니다.
   * 못 알아보는 열쇠는 아무 데도 안 걸리므로 그대로 있어도 해롭지 않습니다. */
  if (v && v.owned) for (const k in v.owned) owned[canonIdKey(k)] = true;

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

  /* 옛 이름으로 적힌 것도 지금 이름으로 옮겨 담는다 (위원 줄의 was 를 본다).
   * 이렇게 해야 보관함 표시·뽑기 후보·중복 환급이 모두 한 이름으로 맞물린다.
   * 한 번 불러오고 saveVault() 가 돌면 보관함이 새 이름으로 갈린다. */
  const advisorsOwned = {};
  if (v && v.advisors) for (const k in v.advisors) {
    const a = advisorById(k);
    if (a) advisorsOwned[advisorId(a)] = true;
  }
  const advSaved = (v && v.advisor) ? advisorById(v.advisor) : null;
  const advisor  = (advSaved && advisorsOwned[advisorId(advSaved)]) ? advisorId(advSaved) : null;

  const giftsOwned = {};
  if (v && v.gifts) for (const k in v.gifts) if (giftById(k)) giftsOwned[k] = true;
  const gift = (v && v.gift && giftsOwned[v.gift]) ? v.gift : null;

  /* 세워 둔 것들 — 가진 것만 남기고, 같은 것이 두 번 들어가지 않게 걸러 냅니다.
   * 개명 대비로 advisorById 를 거쳐 지금 이름으로 옮겨 담습니다. */
  const advisorOn = [];
  const 선이름 = {};
  ((v && v.advisorOn) || []).forEach(k => {
    const a = advisorById(k);
    if (!a) return;
    const id = advisorId(a);
    /* 같은 사람이 두 번 들어가지 않게 이름으로도 걸러 냅니다 */
    if (advisorsOwned[id] && advisorOn.indexOf(id) < 0 && !선이름[a.name]) {
      선이름[a.name] = true;
      advisorOn.push(id);
    }
  });
  const giftOn = [];
  ((v && v.giftOn) || []).forEach(k => {
    const g = giftById(k);
    if (!g) return;
    const id = giftId(g);
    if (giftsOwned[id] && giftOn.indexOf(id) < 0) giftOn.push(id);
  });

  /* 뒤에서 온 보관함이면 여기서 자물쇠를 겁니다.
   * 값은 읽되(무엇이 들었는지 보여 주려고), 쓰기는 막힙니다. */
  if (v && v.ver && verCmp(v.ver, VERSION) > 0)
    VAULT_LOCK = { from: v.ver, to: VERSION };

  /* 지난번에 어느 판으로 놀았는지 — 보관함에는 그때 판 번호가 찍혀 있습니다.
   * saveVault() 가 곧 지금 판으로 덮어쓰므로, 여기서 붙잡아 둡니다.
   * 패치 노트가 «그 뒤로 새로 나온 것» 만 펼쳐 보이는 데 씁니다. */
  LAST_VER = (v && v.ver) ? v.ver : null;

  /* 옛 판에서 만든 보관함이면 원고료가 절반만 넘어온다 */
  let money = (v && typeof v.money === "number") ? v.money : RULE.startMoney;
  let verNote = null;
  if (v && VERSION_RULE.on && !vaultLocked() && verKey(v.ver) !== verKey(VERSION)) {
    const before = money;
    money = Math.floor(money * VERSION_RULE.moneyKeep);
    verNote = { from: v.ver || null, to: VERSION, before, after: money };
  }

  return {
    ch: 0, sc: 0,
    party,
    equip, owned,
    advisorsOwned, advisor, advisorOn,
    giftsOwned, gift, giftOn,
    presets: (v && v.presets) || [null, null, null],
    supportsOwned,
    achieved: achievedMap,
    mailTaken: (v && v.mailTaken) ? v.mailTaken : {},
    hp: {},                 // who -> 현재 체력 (없으면 최대)
    money,
    verNote,                // 판이 올라갔을 때 한 번 알려 줄 내용
    codex: v && typeof v.codex === "number" ? v.codex : 0,   // 황금교본 — 보관함에 남는다
    newbie: v && typeof v.newbie === "number" ? v.newbie : 0, // 신입 관리자 기념 배정을 쓴 횟수
    enk: (v && v.enk && typeof v.enk.n === "number") ? v.enk : null,  // 엔케팔린 — enkSync() 가 채운다
    cleared: v && v.cleared ? v.cleared : {},
    flags: {},
    battle: null,
    waiting: false,
    ended: false,
    mirror: false,
    mirrorHard: false,
    mirrorTier: null,
    partyStack: [],          // 강제 편성 — forcePartyPush/Pop 이 씁니다
    battleForced: false
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

/* 그 덩이가 «지난번 접속 뒤에 새로 나온 것» 인가.
 * 보관함이 없으면(처음 오신 분) 맨 위 하나만 새것으로 봅니다 —
 * 다 펼쳐 놓으면 첫 화면부터 글이 쏟아집니다. */
function patchIsNew(p, i) {
  if (!LAST_VER) return i === 0;
  return verCmp(p.ver, LAST_VER) > 0;
}

function openPatch(back) {
  $modal.classList.add("on");
  const list = patchList();
  const news = list.filter(patchIsNew);

  let h = '<h2>패 치 노 트</h2>' +
          '<div class="hint">지금 판은 <b>v' + VERSION + ' «' + VERSION_NAME + '»</b> 입니다.' +
          (LAST_VER
            ? (news.length
                ? '　지난번에 보신 <b>v' + LAST_VER + '</b> 뒤로 <b style="color:#d8b26a">' +
                  news.length + '개</b>가 새로 나왔습니다. 그것만 펼쳐 두었습니다.'
                : '　지난번 <b>v' + LAST_VER + '</b> 뒤로 새로 나온 것은 없습니다.')
            : '　머리를 누르면 접었다 펼 수 있습니다.') +
          '</div>';

  if (!list.length) h += '<div class="hint">아직 적어 둔 것이 없습니다.</div>';
  list.forEach((p, i) => {
    const 새것 = patchIsNew(p, i);
    h += '<div class="patch' + (i === 0 ? ' now' : '') + (새것 ? '' : ' folded') +
           '" data-patch="' + i + '">' +
           '<div class="pv">' +
             '<span class="pfold">' + (새것 ? '▾' : '▸') + '</span>' +
             'v' + p.ver + (p.name ? '　«' + p.name + '»' : '') +
             (새것 ? '<span class="pnew">NEW</span>' : '') +
             (p.date ? '<span class="pd">' + p.date + '</span>' : '') + '</div>' +
           '<ul class="pl">' +
             (p.lines || []).map(x => '<li>' + x + '</li>').join("") +
           '</ul>' +
         '</div>';
  });

  h += '<div class="modalfoot">' +
         '<button id="ptclose">닫기</button>' +
         '<button id="ptall" class="ghost">모두 펼치기</button>' +
         '<button id="pthide" class="ghost">다음부터 표시하지 않음</button>' +
       '</div>';
  $sheet.innerHTML = h;

  /* 머리를 누르면 그 덩이만 접었다 펼칩니다 */
  $sheet.querySelectorAll(".patch .pv").forEach(el => {
    el.onclick = () => {
      const box = el.parentElement;
      const 접힘 = box.classList.toggle("folded");
      const 화살 = el.querySelector(".pfold");
      if (화살) 화살.textContent = 접힘 ? "▸" : "▾";
    };
  });
  const 모두 = document.getElementById("ptall");
  모두.onclick = () => {
    const 펼칠까 = !!$sheet.querySelector(".patch.folded");
    $sheet.querySelectorAll(".patch").forEach(box => {
      box.classList.toggle("folded", !펼칠까);
      const 화살 = box.querySelector(".pfold");
      if (화살) 화살.textContent = 펼칠까 ? "▾" : "▸";
    });
    모두.textContent = 펼칠까 ? "모두 접기" : "모두 펼치기";
  };

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
 *
 *  ■ 제목이나 이름을 고칠 때 — was 를 적어 주세요
 *    보관함에는 「제목|이름」 문자열만 남습니다. 그래서 그냥 고치면
 *    옛 보관함이 그 위원을 못 찾아 조용히 잃어버립니다. 환급도 없습니다.
 *    바꾸기 전 이름을 was 에 적어 두면 옛 보관함도 그대로 찾아옵니다.
 *
 *      { name: "이형우", title: "영덕의 요리사", star: 2,
 *        was: "영덕의 숙수|이형우",                        // 하나면 그냥 문자열
 *        ... }
 *
 *      { name: "강호영", title: "영덕의 요리사", star: 3,
 *        was: ["영덕의 숙수|강호영", "kang_hoyeong_cook"],  // 여럿이면 배열
 *        ... }
 *
 *    옛 영문 id 를 쓰던 판(lee_hyeongwu_inquisitor 같은 것)도 여기 적으면 됩니다.
 *    한 번 불러오면 지금 이름으로 옮겨 담기므로 옛 이름은 보관함에서 사라지지만,
 *    was 는 지우지 마세요 — 더 옛날 보관함이 언제 들어올지 모릅니다.
 */
function advisorList() { return (typeof ADVISORS !== "undefined" && ADVISORS) ? ADVISORS : []; }
function advisorId(a)  { return a ? a.title + "|" + a.name : null; }

/* 이 위원이 예전에 쓰던 이름들 */
function advisorWas(a) {
  if (!a || !a.was) return [];
  return Array.isArray(a.was) ? a.was : [a.was];
}

function advisorById(id) {
  if (!id) return null;
  const list = advisorList();
  /* 지금 이름을 먼저 봅니다 — 새 위원이 옛 이름을 물려받아도 현역이 이깁니다 */
  return list.find(a => advisorId(a) === id) ||
         list.find(a => advisorWas(a).indexOf(id) >= 0) || null;
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
  const id = idByKey(S.equip[who]);
  const title = id ? id.title : "";

  equippedAdvisors().forEach(a => {
    if (!a.effect || !a.effect.tag) return;
    const tags = Array.isArray(a.effect.tag) ? a.effect.tag : [a.effect.tag];
    if (!tags.some(t => title.indexOf(t) >= 0)) return;

    /* 기프트가 이 교육위원을 북돋우면 함께 배가 된다 */
    let m = 1;
    equippedGifts().forEach(g => {
      if (g.effect && g.effect.advisorName && a.name === g.effect.advisorName)
        m *= g.effect.mult || 1;
    });

    out.atk += (a.effect.atk || 0) * m;
    out.def += (a.effect.def || 0) * m;
    out.hp  += (a.effect.hp  || 0) * m;
  });
  return out;
}

/* ── 몇 개까지 들고 가는가 ────────────────────────────────────
 *  기프트와 교육위원은 장을 마치면 하나씩 늘어납니다.
 *  아래 표에 { n, needCleared } 를 얹으면 그만큼 늘어납니다 —
 *  needCleared 를 적지 않은 줄이 기본값입니다.
 *
 *    기프트    6장을 마치면 2개
 *    교육위원  7장을 마치면 2명
 *
 *  칸을 더 늘리려면 줄 하나만 더 얹으면 됩니다. 편성 화면도, 저장해 둔 편성도
 *  전부 이 수를 보고 스스로 늘어납니다.
 */
const SLOT_RULE = {
  gift:    [{ n: 1 }, { n: 2, needCleared: "ch6" }],
  advisor: [{ n: 1 }, { n: 2, needCleared: "ch7" }]
};
function slotCount(kind) {
  let n = 1;
  (SLOT_RULE[kind] || []).forEach(r => {
    if (!r.needCleared || (S && S.cleared && S.cleared[r.needCleared])) n = Math.max(n, r.n);
  });
  return n;
}
function giftSlots()    { return slotCount("gift"); }
function advisorSlots() { return slotCount("advisor"); }

/* 다음 칸이 어느 장에서 열리는가 — 화면에 일러 주려고 씁니다. 다 열렸으면 null. */
function nextSlotChapter(kind) {
  const now = slotCount(kind);
  const r = (SLOT_RULE[kind] || []).filter(x => x.n > now)
              .sort((a, b) => a.n - b.n)[0];
  if (!r || !r.needCleared) return null;
  const c = CHAPTERS.find(x => x.id === r.needCleared);
  if (c) return c.no;
  /* 아직 안 만든 장이면 id 에서 번호만 뽑아 적습니다 — ch6 → 6장, ch5_5 → 5.5장 */
  const m = String(r.needCleared).match(/^ch(\d+)(?:_(\d+))?$/);
  return m ? (m[1] + (m[2] ? "." + m[2] : "") + "장") : r.needCleared;
}

/* ── E.G.O 기프트 ──────────────────────────────────────────── */
/* 기프트는 이름이 곧 구분입니다 (예전 영문 id 도 받아 줍니다) */
function giftById(id) {
  if (typeof GIFTS === "undefined" || !id) return null;
  return GIFTS.find(g => g.name === id) || GIFTS.find(g => g.id === id) || null;
}
function giftId(g) { return g ? g.name : null; }

/* 지금 지니고 있는 기프트들. 칸이 줄어들면 뒤엣것부터 떨어져 나갑니다. */
function giftOnList() {
  if (!S) return [];
  return (S.giftOn || []).filter(Boolean).slice(0, giftSlots());
}
function equippedGifts() { return giftOnList().map(giftById).filter(Boolean); }
/* 하나만 필요한 자리에서 씁니다 — 첫째 칸입니다 */
function equippedGift() { return equippedGifts()[0] || null; }
function giftIsOn(id)   { return giftOnList().indexOf(id) >= 0; }

/* 세우고 있는 교육위원들 */
function advisorOnList() {
  if (!S) return [];
  return (S.advisorOn || []).filter(Boolean).slice(0, advisorSlots());
}
function equippedAdvisors() { return advisorOnList().map(advisorById).filter(Boolean); }
function equippedAdvisor()  { return equippedAdvisors()[0] || null; }
function advisorIsOn(k)     { return advisorOnList().indexOf(k) >= 0; }

/* 한 사람을 둘 세울 수는 없습니다.
 * 강호영처럼 제목만 다른 인격이 여럿인 교육위원이 있어, 제목이 다르다고
 * 같은 사람을 둘 세우면 그 사람 몫이 두 번 들어갑니다.
 * 이미 세운 사람과 이름이 같으면(자기 자신은 빼고) 못 세웁니다. */
function advisorNameTaken(k) {
  const a = advisorById(k);
  if (!a) return false;
  return equippedAdvisors().some(x => x.name === a.name && advisorId(x) !== k);
}

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
    return equippedAdvisors().some(adv => adv.title.indexOf(e.advisorTag) >= 0);
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
  equippedGifts().forEach(g => {
    const e = g.effect;
    if (!e) return;
    if (e.all) {
      out.atk += e.all.atk || 0; out.def += e.all.def || 0; out.hp += e.all.hp || 0;
    }
    if (giftHits(e, who)) {
      out.atk += e.atk || 0; out.def += e.def || 0; out.hp += e.hp || 0;
    }
  });
  return out;
}

/* 방어의 일부를 공격으로 옮기는 기프트 (제3발톱 의리사슬) */
function giftConvertFor(who) {
  let n = 0;
  equippedGifts().forEach(g => {
    if (g.effect && g.effect.defToAtk && giftHits(g.effect, who)) n += g.effect.defToAtk;
  });
  return n;
}

function giftCrit() {
  return equippedGifts().reduce((s, g) => s + ((g.effect && g.effect.crit) || 0), 0);
}
function giftCritMult() {
  return equippedGifts().reduce((s, g) => s + ((g.effect && g.effect.critMult) || 0), 0);
}

/* ── 보조 교육위원 효과 ────────────────────────────────────── */
function advisorEffect() {
  const out = {
    manage: 0, manageMax: 0, gain: 0,
    atk: 0, def: 0, hp: 0,
    revive: 0, correct: 0, push: 0, cheap: 0, arrest: 0,
    crit: 0,       // 치명타 확률 +
    critMult: 0    // 치명타 배율 +
  };
  const gifts = equippedGifts();

  equippedAdvisors().forEach(a => {
    const e = a.effect || {};
    const one = {
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
      arrest:    e.arrest    || 0,   // 체포로 깎는 적 방어 +
      crit:      e.crit      || 0,
      critMult:  e.critMult  || 0
    };
    /* 기프트가 이 교육위원을 북돋우면 그 사람 몫만 배가 됩니다 */
    gifts.forEach(g => {
      if (g.effect && g.effect.advisorName && a.name === g.effect.advisorName) {
        const m = g.effect.mult || 1;
        for (const k in one) one[k] *= m;
      }
    });
    for (const k in one) out[k] += one[k];
  });

  /* 기프트가 자원을 그냥 더해 주는 경우 — 교육위원과 무관합니다 */
  gifts.forEach(g => { if (g.effect && g.effect.manage) out.manage += g.effect.manage; });
  return out;
}
/* 원고료 수입은 전부 이 문을 지나갑니다. RULE.moneyGain 하나로 조절됩니다.
 * 거울 던전 완주 보상만은 예외로, 고정값이 그대로 들어옵니다. */
function earn(n) { return Math.max(1, Math.round(n * RULE.moneyGain)); }

/* 이야기가 원고료를 내주는가.
 *
 *  본편은 «처음 지나갈 때만» 냅니다. 한 번 마친 장을 다시 돌면 한 푼도 안 나옵니다.
 *  되풀이해서 벌 수 있는 곳은 거울 던전뿐입니다.
 *
 *  거울 던전 안이면 여기를 묻지 않고 언제나 냅니다.
 *  장 밖(어디에도 속하지 않은 전투)이라면 막지 않습니다. */
function storyPays() {
  if (S.mirror) return true;
  const c = curChapter();
  if (!c) return true;
  return !(S.cleared && S.cleared[c.id]);
}

function manageCap()  { return RULE.manageMax + advisorEffect().manageMax; }

/* 관리자 능력 중에는 어떤 장을 마쳐야 열리는 것이 있습니다 (needCleared).
 * 열리기 전에는 전투 손잡이에도, 아래 설명 줄에도 나오지 않습니다 —
 * 아직 없는 것을 미리 보여 주지 않으려는 것입니다. */
function skillOpen(s) {
  if (!s || !s.needCleared) return true;
  return !!(S && S.cleared && S.cleared[s.needCleared]);
}
function managerSkills() { return (CREW.manager.skills || []).filter(skillOpen); }
function skillBy(id) { return (CREW.manager.skills || []).find(s => s.id === id); }
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

/* ── 인격이 이름을 바꿔도 보관함이 잃지 않도록 ──────────────────
 *
 *  보관함은 인격을 «누구|성급|제목» 이라는 글자 열쇠로 적어 둡니다.
 *  줄 순서와는 상관이 없습니다 — 줄을 지우거나 옮겨도 밀리지 않습니다.
 *  다만 «제목이나 성급이 바뀌면» 그 열쇠가 아무것도 가리키지 못하게 되어,
 *  가지고 있던 사람에게서 그 인격이 조용히 사라졌습니다.
 *
 *  교육위원에는 진작 was 가 있었는데 인격에는 없었습니다. 이제 같게 맞춥니다.
 *
 *    { star: 2, title: "공룡의날 올림피아드 우승자",
 *      was: "올림피아드 우승자",              // 제목만 적으면 같은 사람·같은 성급
 *      ... }
 *
 *    { star: 2, title: "모나크 버틀러",
 *      was: ["seong_siyun|2|모나크 집사"],    // 사람이나 성급까지 바뀌었으면 열쇠 통째로
 *      ... }
 *
 *  ■ 제목이나 성급을 고칠 때는 반드시 옛 이름을 was 에 남기십시오.
 *    안 남기면 그것을 가진 사람의 보관함에서 그냥 없어집니다.
 */
function idWas(who, id) {
  if (!id || !id.was) return [];
  const list = Array.isArray(id.was) ? id.was : [id.was];
  /* 제목만 적었으면 같은 사람·같은 성급으로 채워 줍니다 */
  return list.map(x => x.indexOf("|") >= 0 ? x : (who + "|" + id.star + "|" + x));
}

function idByKey(key) {
  if (!key) return null;
  const k = parseKey(key);
  const s = SINNERS[k.who];
  /* ① 지금 이름으로 찾습니다 */
  if (s) {
    const now = s.ids.find(i => i.star === k.star && i.title === k.title);
    if (now) return now;
  }
  /* ② 못 찾으면 옛 이름을 뒤집니다. 사람이 바뀐 경우도 있으므로 전부 봅니다. */
  for (const w in SINNERS) {
    for (const id of SINNERS[w].ids)
      if (idWas(w, id).indexOf(key) >= 0) return id;
  }
  return null;
}

/* 저장된 열쇠를 «지금 열쇠» 로 옮겨 적습니다. 모르는 것은 그대로 돌려줍니다. */
function canonIdKey(key) {
  if (!key) return key;
  const k = parseKey(key);
  const s = SINNERS[k.who];
  if (s && s.ids.some(i => i.star === k.star && i.title === k.title)) return key;
  for (const w in SINNERS) {
    for (const id of SINNERS[w].ids)
      if (idWas(w, id).indexOf(key) >= 0) return idKey(w, id);
  }
  return key;
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
  equippedAdvisors().forEach(a => list.push(a.title));
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
    /* 기프트가 이 시너지를 북돋우는 경우 — 여럿을 지녔으면 곱해집니다 */
    equippedGifts().forEach(g => {
      if (g.effect && g.effect.synergy &&
          (tags.indexOf(g.effect.synergy) >= 0 || g.effect.synergy === sy.name))
        scale *= (g.effect.mult || 1);
    });
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
  /* 지원과 조력자는 인격이 없고, 수치가 제 줄에 그대로 적혀 있다 */
  const flat = allyBy(who) || supportBy(who);
  const s = flat ? { atk: flat.atk, def: flat.def, hp: flat.hp } : statsOf(S.equip[who]);
  if (S.party.indexOf(who) < 0) return s;      // 편성 밖이면 시너지 없음
  const b = synergyBonus();
  const a = advisorEffect();                   // 보조 교육위원은 파티 전원에게 걸린다
  const gf = giftBonusFor(who);                // E.G.O 기프트
  const af = advisorBonusFor(who);             // 교육위원이 특정 인격에만 거는 보정
  /* 깎는 기프트가 있어 배수가 0 아래로 갈 수 있습니다. 바닥을 둡니다 —
   * 공격과 체력은 1, 방어는 0 까지. */
  const atk = Math.max(1, Math.round(s.atk * (1 + b.atk + a.atk + gf.atk + af.atk)));
  const def = Math.max(0, Math.round(s.def * (1 + b.def + a.def + gf.def + af.def)));
  const hp  = Math.max(1, Math.round(s.hp  * (1 + b.hp  + a.hp  + gf.hp  + af.hp)));
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
/* ── 조력자 ────────────────────────────────────────────────────
 *  이야기에서만 옆에 서 주는 사람들입니다. 내용은 data/allies.js.
 *
 *  편성 셋은 그대로 두고 «넷째» 로 붙습니다. 그래서 S.party 에 그냥 얹습니다 —
 *  그러면 전투·회복·시너지·화면이 전부 손댈 것 없이 그대로 돌아갑니다.
 *  대신 «내 것이 아니므로» 보관함과 저장해 둔 편성에는 넣지 않습니다.
 */
const ALLY_PREFIX = "조력|";
function allyList() { return (typeof ALLIES !== "undefined" && ALLIES) ? ALLIES : []; }
function allyId(a)  { return a ? ALLY_PREFIX + a.title + "|" + a.name : null; }
function isAlly(w)  { return typeof w === "string" && w.indexOf(ALLY_PREFIX) === 0; }
function allyBy(w) {
  if (!isAlly(w)) return null;
  return allyList().find(a => allyId(a) === w) || null;
}
/* 이름만 적어도 찾아 줍니다 — 이야기에는 「베르렐리우스」 라고만 적습니다 */
function allyByName(n) { return allyList().find(a => a.name === n) || null; }
function alliesOn()    { return (S && S.party || []).filter(isAlly); }
/* 조력자를 뺀 «내 편성» — 보관함·저장해 둔 편성·편성 화면이 봅니다 */
function ownParty(list) { return (list || (S && S.party) || []).filter(w => !isAlly(w)); }

function allyJoin(name) {
  const a = allyByName(name);
  if (!a) { say("(조력자를 찾지 못했습니다: " + name + ")", "todo"); return; }
  const id = allyId(a);
  if (S.party.indexOf(id) >= 0) return;
  S.party.push(id);
  S.hp[id] = maxHp(id);
  divider();
  say(withJosa(a.name, "이") + " 곁에 선다.", "gain");
  /* 여러 줄이면 차례로 */
  (Array.isArray(a.line) ? a.line : (a.line ? [a.line] : [])).forEach(t => speak(id, t));
  render();
}
function allyLeave(name) {
  const gone = [];
  S.party = S.party.filter(w => {
    if (!isAlly(w)) return true;
    const a = allyBy(w);
    if (name !== true && (!a || a.name !== name)) return true;
    if (a) gone.push(a);
    return false;
  });
  gone.forEach(a => {
    (Array.isArray(a.bye) ? a.bye : (a.bye ? [a.bye] : [])).forEach(t => speak(allyId(a), t));
  });
  if (gone.length) { divider(); say(gone.map(a => a.name).join("　·　") + " 물러난다.", "sys"); }
  render();
}
/* 장을 시작하거나 마칠 때는 조력자를 남기지 않습니다 */
function allyClear() { S.party = ownParty(); }

/* ── 강제 편성 ────────────────────────────────────────────────
 *  이야기가 특정 인원만으로 돌아가야 할 때 씁니다. 원래 편성은 스택에
 *  쌓아 두었다가 forcePartyPop() 으로 그대로 되돌립니다 — 장 강제 위에
 *  전투 강제가 겹쳐도(예: 3명 중 1명으로 더 줄이는 전투) 순서대로 풀립니다.
 *
 *    장에서    { forceParty: ["cha_minjun"] }
 *              장 시작 시 밀어 넣고, 다음 장을 시작할 때(=allyClear 와 같은 자리) 되돌립니다.
 *    전투에서  { t: "battle", foe: "…", party: ["cha_minjun"] }
 *              그 전투가 끝날 때(승리·각본상 후퇴·이야기용 패배) 되돌립니다.
 *              진짜로 전멸해 「다시 도전」을 고르면 강제는 풀지 않고 그대로 재도전시킵니다 —
 *              그래야 패배 후 편성을 바꿔 강제를 우회하는 일이 없습니다. 그래서 이때는
 *              「편성 바꾸기」 버튼 자체를 감춥니다 (defeat() 참고).
 *
 *  조력자(ally)는 그대로 얹힙니다 — 강제 목록 + 지금 붙어 있는 조력자로 편성을 짭니다.
 *  처음 불려 오는 사람은 체력이 없을 수 있어 maxHp 로 채워 둡니다(이미 있으면 그대로).
 *
 *  누가 올지는 못 고르지만, «어떤 인격(장착)으로 올지» 는 강제가 걸리는 그 순간
 *  한 번 openEquip() 을 띄워 손보게 합니다 — startChapter()/startBattle() 참고.
 *  「다시 도전」 재시도에는 다시 띄우지 않습니다(S.battleForced 로 막습니다).
 *
 *  ■ 알려진 한계 — 이야기 진행 중(cont() 화면)에는 편성 버튼이 없어 안전하지만,
 *    유리창을 거쳐 운전석 → 편성으로 들어가면 강제 도중에도 편성을 바꿀 수 있습니다.
 *    작은 팬 프로젝트 규모에서는 손보지 않고 두었습니다 — 다음 장을 시작하면
 *    startChapter() 의 안전망이 원래 편성 계산을 다시 정리합니다.
 */
function forcePartyPush(list) {
  S.partyStack.push(S.party.slice());
  S.party = list.filter(Boolean).concat(alliesOn());
  S.party.forEach(w => { if (w && S.hp[w] == null) S.hp[w] = maxHp(w); });
}
function forcePartyPop() {
  if (S.partyStack.length) S.party = S.partyStack.pop();
}

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
  if (isAlly(w))    return allyBy(w);
  if (isSupport(w)) return supportBy(w);
  return SINNERS[w] || null;
}
function memberName(w) {
  const m = memberOf(w);
  return m ? m.name : (w || "");
}
/* 시너지가 보는 이름 — 작성위원은 장착한 인격, 지원은 제 title */
function memberTitle(w) {
  if (isAlly(w))    { const a = allyBy(w);     return a ? a.title : ""; }
  if (isSupport(w)) { const s = supportBy(w); return s ? s.title : ""; }
  const id = idByKey(S.equip[w]);
  return id ? id.title : "";
}

function nameOf(who) {
  if (isAlly(who) || isSupport(who)) return memberName(who);
  if (SINNERS[who]) return SINNERS[who].name;
  /* 승무원은 열쇠(manager · guide · driver · bus)로 적습니다.
   * 예전에는 manager 만 챙겨서, who:"guide" 라고 적은 대사가 화면에
   * 「guide」 라고 그대로 나오고 있었습니다. */
  if (CREW[who]) return CREW[who].codename || CREW[who].name;
  return who;                                     // 원문에 그대로 적힌 이름
}
/* 초상 찾기.
 * 작성위원 → 승무원 → 교육위원 순으로 보고, 그래도 없으면
 * 이름이 들어맞는 적(FOES)의 그림을 빌려 씁니다.
 * 덕분에 "원대한", "김준성" 처럼 이름만 적어도 얼굴이 뜹니다. */
function portraitOf(who) {
  if (!who) return null;
  if (who === "manager") return CREW.manager.portrait;
  if (isAlly(who)) {
    const a = allyBy(who);
    if (!a) return null;
    if (a.portrait) return a.portrait;
    /* 승무원이면 그쪽 그림을 빌립니다 — 베르렐리우스처럼 */
    for (const k in CREW) if (CREW[k].codename === a.name || CREW[k].name === a.name) return CREW[k].portrait;
    return null;
  }
  if (isSupport(who)) { const s = supportBy(who); return s ? s.portrait : null; }
  if (SINNERS[who])  return SINNERS[who].portrait;
  if (CREW[who])     return CREW[who].portrait;
  /* 이야기에만 나오는 사람 — data/characters.js 의 EXTRA_PORTRAITS */
  if (typeof EXTRA_PORTRAITS !== "undefined" && EXTRA_PORTRAITS[who])
    return EXTRA_PORTRAITS[who];
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
  /* 조력자가 붙어 넷이 되면 칸을 넷으로 (좁은 화면에서는 둘씩 두 줄) */
  $party.classList.toggle("four", S.party.filter(Boolean).length > 3);
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
     *   정함   — 이미 명령을 골라 둔 사람 (초록 테두리, 흐리게)
     * 여기에 관리자 능력이 걸린 자국을 덧붙인다 — 교정·독촉은 이번 턴에만
     * 사는 것이라, 걸어 놓고도 걸렸는지 알 수 없으면 안 쓴 것과 같다. */
    const aimed  = !!(b && b.aim === who && hp > 0);
    const acting = !!(b && b.cur === who && hp > 0);
    const ready  = !!(cmd && !acting && hp > 0);
    const sup    = supportBy(who);
    const ally   = allyBy(who);
    const div = document.createElement("div");
    div.className = "pcard" + (hp <= 0 ? " down" : "") +
                    (sup ? " sup" : "") + (ally ? " ally" : "") +
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
      if (b && b.mods) {
        if (b.mods[who + "_guard"]) mark += ' <span class="corrtag">교정</span>';
        if (b.mods[who + "_push"])  mark += ' <span class="pushtag">독촉</span>';
      }
    }
    if (sup)  mark += ' <span class="suptag">지원</span>';
    if (ally) mark += ' <span class="allytag">조력</span>';
    /* 조력자는 이름을 제 색으로 강조하고, 별 자리에는 idText 를 적습니다
     * (베르렐리우스라면 「길잡이 짧은시선」). data/allies.js 참고. */
    const nameHTML = ally
      ? '<span class="allyname" style="color:' + (ally.color || "#e07aa8") + '">' +
          memberName(who) + '</span>'
      : memberName(who);
    const idHTML = ally
      ? ally.title + (ally.idText ? ' 「' + ally.idText + '」' : "")
      : '<span class="star">' +
          (sup ? stars(sup.star) : (id ? stars(id.star) : "")) + '</span> ' +
        (sup ? sup.title : (id ? id.title : "인격 없음"));
    div.innerHTML =
      '<div class="nm">' + nameHTML + mark + '</div>' +
      '<div class="id">' + idHTML + '</div>' +
      /* 조력자는 수치를 감춥니다 — 실제로는 그대로 쓰이지만 화면에는 ??? 로.
       * 얼마나 센지 모르는 편이 «와 준 사람» 답습니다. */
      '<div class="hpbar"><i style="width:' + (ally ? 100 : Math.round(hp / mx * 100)) + '%"></i></div>' +
      /* 좁은 화면에서는 ostat(공·방)을 감춥니다 — 체력만 남깁니다 */
      /* 고른 명령은 이름 옆 «공격»·«방어» 로 이미 보입니다.
       * 아래에 줄을 하나 더 붙이면 카드 높이가 들쭉날쭉해져 눌리는 자리가 흔들립니다. */
      '<div class="st"><span class="hpnum">' + (ally ? "??? / ???" : hp + ' / ' + mx) + '</span>' +
        '<span class="ostat">　공 ' + (ally ? "???" : st.atk) +
          '　방 ' + (ally ? "???" : st.def) + '</span></div>';
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
/* green 을 켜면 금빛 대신 초록빛으로 터집니다 — 특정 배정의 대상이 나왔을 때 */
function starFlash(star, line, after, green) {
  if (!RULE.gachaFxMs) { if (after) after(); return; }
  const el = document.createElement("div");
  el.className = "flashfx" + (green ? " green" : "");
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

/* 특정 배정에서는 «그 배정의 대상» 을 먼저 집습니다.
 * 한 묶음에 대상과 그 밖의 ★★★ 이 같이 나오면 대상 쪽을 보여 주는 것이 맞습니다. */
function bigWinOn(out, p) {
  if (!p) return null;
  return (out || []).find(r =>
    r.isNew && (r.kind === "adv" ? r.adv.star : r.id.star) >= 3 &&
    pickupHit(p, r.kind === "adv" ? r.adv.title : r.id.title)) || null;
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
  equippedAdvisors().forEach(a => {
    head += '<span class="adv"><span class="star">' + stars(a.star) + '</span> ' +
            a.title + ' ' + a.name + '</span>';
  });
  equippedGifts().forEach(gf => {
    head += '<span class="gift"><span class="star">' + stars(gf.star) + '</span> ' +
            gf.name + '</span>';
  });

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
  const help = managerSkills().map(s => {
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

  /* 앞 장이 강제 편성을 걸어 둔 채 끝났으면(전투 도중 이탈 등) 뿌리까지 되돌린다 —
   * 그래야 아래 chapterMissing() 이 «진짜 편성» 을 보고 판단한다. */
  if (S.partyStack.length) { S.party = S.partyStack[0]; S.partyStack = []; }
  S.battleForced = false;

  /* 들어가기 전에 편성부터 확인한다 */
  const miss = chapterMissing(c);
  if (miss.length) return chapterGate(i, miss);

  S.ch = i; S.sc = 0; S.ended = false;
  S.mirror = false; MIRROR = null;
  SCENES = buildScenes(c);
  allyClear();                                            // 앞 장의 조력자는 데려가지 않습니다

  const enter = () => {
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
  };

  if (c.forceParty) {
    forcePartyPush(c.forceParty);   // 이 장은 정해진 인원만으로 돌아간다
    /* 누가 올지는 못 고르지만, 어떤 인격으로 올지는 한 번 손보게 한다 */
    $modal.classList.add("on");
    openEquip(() => { closeModal(); enter(); });
  } else {
    enter();
  }
}

function next() {
  if (S.waiting) return;
  if (S.sc >= SCENES.length) { chapterEnd(); return; }
  const s = SCENES[S.sc++];
  play(s);
}

/* ── 조건이 맞을 때만 나오는 말 ────────────────────────────────
 *
 *  누구를 데려왔느냐, 무엇을 끼웠느냐에 따라 대사가 달라집니다.
 *  나레이션(n)과 대사(d) 어디에나 붙일 수 있습니다.
 *
 *    alt    조건이 맞으면 «그 줄을 대신합니다». 먼저 맞는 하나만 씁니다.
 *    extra  조건이 맞으면 «그 줄 뒤에 덧붙습니다». 맞는 것이 여럿이면 차례로 다 나옵니다.
 *
 *  ── 적는 법 ────────────────────────────────────────────────
 *
 *    // 성시윤이 「아라온호 선장」을 끼고 있으면 대사가 통째로 바뀝니다
 *    { t: "d", who: "seong_siyun", text: "…그만해.",
 *      alt: [ { when: { equip: { who: "seong_siyun", titleHas: "아라온호 선장" } },
 *               text: "아니, 모든 것은 내 덕이다." } ] }
 *
 *    // I사 인격을 낀 사람이 편성에 있으면 «그 사람이» 한마디 덧붙입니다
 *    { t: "d", who: "park_suo", text: "…I사군.",
 *      extra: [ { when: { titleHas: "I사" }, text: "역시 그랬군요." } ] }
 *
 *  ── when 에 적을 수 있는 것 ─────────────────────────────────
 *
 *    titleHas   편성한 누군가의 «인격 이름» 에 그 말이 들어 있으면 맞습니다.
 *               → 그 사람이 «걸린 사람» 이 되어, who 를 안 적으면 그가 말합니다.
 *    equip      { who: "열쇠", titleHas: "말" } — 그 사람이 그 인격을 끼고 있어야 합니다.
 *    party      그 사람이 편성에 있어야 합니다. 여럿이면 배열(모두 필요).
 *    advisor    그 이름의 보조 교육위원을 세우고 있어야 합니다.
 *    synergy    그 이름의 편성 시너지가 지금 발동 중이어야 합니다.
 *    flag       S.flags 에 그 표가 서 있어야 합니다.
 *
 *  여럿을 함께 적으면 «모두» 맞아야 합니다.
 *  말하는 사람은 who 로 못박을 수 있고, 안 적으면 걸린 사람 → 원래 화자 순으로 찾습니다.
 */
function sceneWhen(c) {
  if (!c) return { ok: true, who: null };
  let hit = null;

  if (c.titleHas) {
    const w = S.party.find(x => x && memberTitle(x).indexOf(c.titleHas) >= 0);
    if (!w) return null;
    hit = w;
  }
  if (c.equip) {
    const e = c.equip;
    if (S.party.indexOf(e.who) < 0) return null;
    if (e.titleHas && memberTitle(e.who).indexOf(e.titleHas) < 0) return null;
    hit = hit || e.who;
  }
  if (c.party) {
    const need = Array.isArray(c.party) ? c.party : [c.party];
    if (!need.every(w => S.party.indexOf(w) >= 0)) return null;
    hit = hit || need[0];
  }
  if (c.advisor) {
    if (!equippedAdvisors().some(a => a.name === c.advisor)) return null;
  }
  if (c.synergy && !activeSynergies().some(x => x.name === c.synergy)) return null;
  if (c.flag && !(S.flags && S.flags[c.flag])) return null;

  return { ok: true, who: hit };
}

/* 조건이 맞는 alt 를 찾아 그 줄을 갈아 끼웁니다. 없으면 원래 줄 그대로. */
function applyAlt(s) {
  if (!s.alt) return s;
  for (const a of s.alt) {
    const m = sceneWhen(a.when);
    if (!m) continue;
    return { t: s.t, who: a.who || m.who || s.who, text: a.text, extra: s.extra };
  }
  return s;
}

/* 조건이 맞는 extra 를 원래 줄 뒤에 붙입니다. */
function playExtras(s) {
  if (!s.extra) return;
  s.extra.forEach(x => {
    const m = sceneWhen(x.when);
    if (!m) return;
    const who = x.who || m.who || s.who;
    if (who) speak(who, x.text);
    else say(x.text, "n");
  });
}

/* 특정 장면 하나만을 위한 새 t 를 붙이는 자리 — SCENE_EXT.무엇 = function(s){...} 로
 * 등록해 두면, 아래 switch 의 default 가 그걸 찾아 대신 부릅니다. 엔진의 switch 문
 * 자체는 wip 로 못 늘리므로(코드 중간을 짜깁기하는 셈이라), 새 장면 종류가 필요한
 * 한 번짜리 기믹은 여기 등록하는 식으로 풉니다. 두루 쓰일 것이면 case 를 그냥 더하십시오. */
const SCENE_EXT = {};

function play(s) {
  /* 화면을 흔듭니다. shake: true 는 가볍게, "hard" 면 크게.
   * 어느 장면에나 붙일 수 있습니다 — 포격을 맞는 대목 같은 데 씁니다. */
  if (s.shake) shakeScreen(s.shake === "hard");

  switch (s.t) {
    /* shake 를 달면 그 줄에서 화면이 흔들립니다 — 번개·폭발 같은 자리에.
     *   { t:"n", text:"…", shake:true }    한 번 흔들림
     *   { t:"n", text:"…", shake:"hard" }  크게 흔들림 (강타와 같은 세기)
     *   { t:"flash" }                       번쩍인 뒤 크게 흔들립니다 */
    case "n":     { const x = applyAlt(s); say(x.text, "n");
                    if (s.shake) shakeScreen(s.shake === "hard");
                    playExtras(x); return cont(); }
    case "d":     { const x = applyAlt(s); speak(x.who, x.text);
                    if (s.shake) shakeScreen(s.shake === "hard");
                    playExtras(x); return cont(); }

    /* 번개 — 화면이 하얗게 터진 뒤 크게 흔들립니다 */
    case "flash":
      flashScreen(s.ms);
      shakeScreen(true);
      if (s.text) say(s.text, s.cls || "n");
      return cont();

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

    /* ── 길잡이가 들러 세워 놓고 간다 ──────────────────────────
     *  { t:"rest", who:"베르렐리우스", say:"...", text:"..." }
     *
     *  쓰러진 사람까지 전부 일으켜 체력을 가득 채우고,
     *  다음 전투는 관리력이 가득 찬 채로 시작합니다.
     *  거울 던전처럼 쉬지 않고 이어지는 자리 가운데에 숨 돌릴 곳을 두려는 것입니다. */
    case "rest": {
      divider();
      if (s.who) speak(s.who, s.say);
      S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });   // 쓰러진 사람도 함께 일어납니다
      S.restManage = true;                                     // 다음 전투는 관리력을 가득 채우고 연다
      say(s.text || "길잡이가 관리력과 체력을 전부 회복시켰다.", "good");
      render();
      return cont();
    }

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

    /* 조력자 — 이야기에서만 옆에 서 주는 사람 (data/allies.js) */
    case "ally":
      if (s.join) allyJoin(s.join);
      if (s.leave) allyLeave(s.leave);
      return cont();

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
      if (SCENE_EXT[s.t]) return SCENE_EXT[s.t](s);
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
  /* offer 를 적어 두면 재료를 그만큼만 무작위로 꺼내 놓습니다.
   * 매번 상이 달라지고, 숨은 사고도 늘 나오지는 않게 됩니다. */
  let stock = (s.ingredients || []).slice();
  if (s.offer && s.offer < stock.length) {
    const bag = stock.slice(), pickN = [];
    while (pickN.length < s.offer && bag.length) pickN.push(bag.splice(rnd(bag.length), 1)[0]);
    stock = pickN;
  }
  const rounds = Math.min(s.rounds || cooks.length, cooks.length, stock.length || 99);
  const usedW  = [];
  const usedI  = [];
  let score = 0;

  divider();
  /* img 를 적어 두면 상을 차리는 동안 그 배경이 깔립니다.
   * failImg 를 적어 두면 «상이 엎어진 뒤로는» 그 배경으로 바뀌어 그대로 갑니다. */
  if (s.img) setBackdrop(s.img);
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
    const hasAdvisor = n => equippedAdvisors().some(x => x.name === n);
    const hasSupport = n => S.party.some(x => x && isSupport(x) && memberName(x) === n);
    const hasMember  = n => S.party.some(x => x && memberName(x) === n);
    const wa =
      (ing.withAdvisor && hasAdvisor(ing.withAdvisor.name) && ing.withAdvisor) ||
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

    /* 그냥 한마디 하고 지나가는 것 — 사고가 아닙니다. 점수도 안 깎입니다.
     * 편성된 사람이면 물론이고, 승무원(하축론 같은)은 늘 배에 있으니 언제나 나옵니다. */
    (ing.react || []).forEach(r => {
      const inParty = S.party.some(x => x && memberName(x) === r.name);
      const inCrew  = Object.keys(CREW).some(k => CREW[k].name === r.name ||
                                                  CREW[k].codename === r.name);
      if (!inParty && !inCrew) return;
      if (r.text) line(r.text);
      if (r.say)  line(r.say, r.name);
    });

    if (wa) {
      divider();
      /* 한 번 엎어지면 그 뒤로는 계속 이 배경입니다 — 불은 저절로 꺼지지 않습니다 */
      if (s.failImg) setBackdrop(s.failImg);
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
      const a = equippedAdvisors().find(x => x.name === s.advisor.name);
      if (a) {
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

    /* 본편과 같은 규칙 — 처음 지나갈 때만 값을 쳐 줍니다 */
    const raw = Math.max(0, score) * (s.pay || 0);
    const pay = (raw > 0 && storyPays()) ? earn(raw) : 0;
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

  /* 이 전투만 정해진 인원으로 — 「다시 도전」으로 되돌아와도 두 번 밀어 넣거나
   * 인격 장착 화면을 두 번 보여 주지 않는다(S.battleForced 가 이미 서 있다) */
  if (scene.party && !S.battleForced) {
    forcePartyPush(scene.party);
    S.battleForced = true;
    $modal.classList.add("on");
    openEquip(() => { closeModal(); startBattleFight(scene, f); });
    return;
  }
  startBattleFight(scene, f);
}

function startBattleFight(scene, f) {
  S.waiting = true;
  S.battle = {
    id: scene.foe, name: f.name, def: f.def, atk: f.atk,
    hp: f.hp, maxhp: f.hp, boss: !!f.boss,
    loseOk: scene.lose === "story",
    /* 길잡이가 다녀간 뒤라면 관리력을 가득 채우고 엽니다 (t:"rest" 참고) */
    manage: S.restManage ? manageCap()
                         : RULE.manageStart + advisorEffect().manage,
    turn: 0, cmds: {}, cur: null, mods: {},
    scene: scene
  };
  S.restManage = false;
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
  S.battle.shown = f.img || null;          // 지금 걸려 있는 그림 (강타 때 갈아 끼웁니다)
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

  /* 강타를 준비하는 턴에는 그림이 바뀝니다.
   * data/story.js 의 FOES 에 heavyImg 로 적습니다. 안 적은 적은 그대로 서 있습니다.
   * 크게 휘두를 자세라는 말과 함께 모습이 달라지도록 한 것입니다. */
  {
    const f = FOES[b.id] || {};
    /* 난입한 것이 있으면 그쪽 그림이 이깁니다 (b.img · b.heavyImg) */
    const nowImg   = b.img      || f.img      || null;
    const nowHeavy = b.heavyImg || f.heavyImg || null;
    const want = (b.heavy && nowHeavy) ? nowHeavy : nowImg;
    if (want !== b.shown) { b.shown = want; showFoe(want, b.name); }
  }
  if (b.aim)
    say("▷ " + withJosa(b.name, "이") + " " + withJosa(memberName(b.aim), "을") + " 노리고 있다!" +
        (b.heavy ? "  크게 휘두를 자세다." : ""), "bad");

  /* 보스가 강타를 준비하는 턴에는 한마디 한다.
   * data/story.js 의 FOES 에 heavyLine 으로 적습니다. 여럿이면 배열로. */
  if (b.heavy && b.aim) {
    const f = FOES[b.id] || {};
    /* 난입한 것이 있으면 그쪽 대사가 이깁니다 (b.heavyLine) */
    let line = b.heavyLine || f.heavyLine;
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

/* ── 관리자 능력의 대상 고르기 ──────────────────────────────────
 *  «누구에게 걸 것인가» 가 중요한 능력은 손잡이 줄을 파티로 한 번 갈아
 *  끼워 고르게 합니다. 명령을 고르는 중인 사람에게 그냥 걸어 버리면,
 *  적이 노리는 사람이 따로 있을 때 관리력만 버리게 됩니다 —
 *  서 있는 셋 중 하나만 맞으니 그냥 누르면 셋에 둘은 헛돕니다.
 *
 *  고르면 done(대상) 을 부르고, 그만두면 askNext() 로 되돌아갑니다.
 *  관리력은 여기서 깎지 않습니다. 깎는 것은 고른 뒤 done 안에서 —
 *  그래야 그만두어도 손해가 없습니다.
 */
function pickTarget(cands, done) {
  const b = S.battle;
  const list = cands.map((w, i) => ({
    label: memberName(w) + (b.aim === w ? "  ◀ 노려짐" : ""),
    cls:   b.aim === w ? "primary" : "",
    key:   i < 9 ? String(i + 1) : null,
    fn:    () => done(w)
  }));
  list.push({ label: "그만두기", cls: "ghost", key: "0", fn: () => askNext() });
  buttons(list);
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

  /* 교정 — 지킬 사람을 고릅니다.
   * 적이 노리는 사람과 지금 명령하는 사람은 대개 다르므로, 예전처럼
   * b.cur 에 그냥 걸면 관리력만 버리는 일이 잦았습니다. pickTarget 참고. */
  const guardable = S.party.filter(w => w && alive(w) && !b.mods[w + "_guard"]);
  list.push({
    label: "교정 (" + cCorrect + ")…", cls: "ghost",
    disabled: b.manage < cCorrect || !guardable.length,
    fn: () => pickTarget(guardable, t => {
      b.manage -= cCorrect; b.mods[t + "_guard"] = true;
      say(withJosa(CREW.manager.codename, "이") + " " + memberName(t) + "의 글을 교정한다.", "good");
      askNext();
    })
  });
  /* 독촉은 고르게 하지 않습니다 — 세게 때리게 할 사람은 지금 명령을 고르는
   * 바로 그 사람이라, b.cur 가 늘 원하는 대상입니다. 이름만 적어 둡니다. */
  list.push({
    label: "독촉 · " + memberName(who) + " (" + cPush + ")", cls: "ghost",
    disabled: b.manage < cPush || b.mods[who + "_push"],
    fn: () => {
      b.manage -= cPush; b.mods[who + "_push"] = true;
      say(withJosa(CREW.manager.codename, "이") + " " + withJosa(memberName(who), "을") + " 독촉한다.", "good");
      askNext();
    }
  });
  /* 체포 — 5장을 마쳐야 열립니다. 겨누는 곳이 적이라 고를 사람이 없습니다.
   * 한 턴에 한 번만 걸리고, 두 번 걸어도 겹쳐 쌓이지 않습니다. */
  const arrest = skillBy("arrest");
  if (skillOpen(arrest)) {
    const cArrest = skillCost(arrest.cost);
    list.push({
      label: "체포 · " + b.name + " (" + cArrest + ")", cls: "ghost",
      disabled: b.manage < cArrest || !!b.mods.arrest,
      fn: () => {
        b.manage -= cArrest;
        b.mods.arrest = true;
        say(withJosa(CREW.manager.codename, "이") + " " + withJosa(b.name, "을") +
            " 체포한다. 이번 턴 방어가 " +
            Math.round(Math.min(0.9, RULE.arrestCut + advisorEffect().arrest) * 100) +
            "% 깎였다.", "good");
        askNext();
      }
    });
  }

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
  return mirrorRuleNow().key;      // mirror · mirrorHard · mirrorExtreme
}

/* cleared 를 넘기면 «거울 던전을 끝까지 돌았다» 는 사건입니다.
 * 적을 쓰러뜨린 사건과 서로 섞이지 않게 갈라 둡니다 — 완주 업적은 완주에만,
 * 나머지 업적은 처치에만 반응합니다. */
function achieveMatches(a, foeName, cleared) {
  const w = a.when || {};

  if (w.clear) { if (w.clear !== cleared) return false; }
  else if (cleared) return false;

  if (w.kill) {
    const list = Array.isArray(w.kill) ? w.kill : [w.kill];
    if (!list.some(k => String(foeName).indexOf(k) >= 0)) return false;
  }
  if (w.where) {
    const here = battleWhere();
    /* "mirror" 라고만 적으면 하드·익스트림까지 다 쳐 줍니다.
     * 특정 갈래만 세고 싶으면 그 key 를 그대로 적으십시오.
     * 여럿을 배열로 적으면 그중 하나만 맞으면 됩니다 —
     *   where: ["mirrorHard", "mirrorExtreme"] */
    const want = Array.isArray(w.where) ? w.where : [w.where];
    const ok = want.some(x => x === "mirror" ? here !== "story" : here === x);
    if (!ok) return false;
  }
  if (w.advisor) {
    if (!equippedAdvisors().some(a => a.name === w.advisor)) return false;
  }
  if (w.party) {
    const need = Array.isArray(w.party) ? w.party : [w.party];
    if (!need.every(p => S.party.indexOf(p) >= 0)) return false;
  }
  if (w.titleHas) {
    if (!S.party.some(m => m && memberTitle(m).indexOf(w.titleHas) >= 0)) return false;
  }
  /* 그 시너지가 지금 «발동 중» 이어야 합니다 (이름으로 찾습니다) */
  if (w.synergy) {
    if (!activeSynergies().some(x => x.name === w.synergy)) return false;
  }
  return true;
}

/* 적을 쓰러뜨렸을 때 부릅니다 */
function checkAchievements(foeName, cleared) {
  achieveList().forEach(a => {
    if (achieved(a) || !achieveMatches(a, foeName, cleared)) return;
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
/* 번개 — 화면 위에 흰 겹을 한 번 덮었다 걷습니다.
 * 무대 그림을 갈아 끼우지 않으므로 어느 장면에서나 쓸 수 있습니다. */
function flashScreen(ms) {
  const el = document.createElement("div");
  el.className = "flashfx";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms || 460);
}

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

  /* ── 난입 ────────────────────────────────────────────────────
   *  적 체력이 어느 선 아래로 내려가면 다른 것이 끼어들어 «한 몸» 이 됩니다.
   *  적을 둘로 늘리지 않고, 지금 적의 수치에 더해 이름을 바꾸는 방식입니다 —
   *  전투 틀을 건드리지 않으면서 「둘째 판이 시작됐다」는 느낌을 줍니다.
   *
   *      { t:"battle", foe:"kevin",
   *        joinIn: { at: 0.2, foe: "mawang_lee", text: "…", heal: 0.35 } }
   *
   *    at    이 비율 아래로 내려가면 (0.2 = 20%)
   *    foe   끼어드는 적. 그쪽 공격·방어가 더해지고 이름과 그림이 그것으로 바뀝니다
   *    heal  끼어들 때 적이 회복하는 양 (최대 체력 대비). 없으면 회복 없음
   *    text  끼어들 때 적을 대신해 나오는 줄
   */
  const checkJoinIn = () => {
    const j = b.scene && b.scene.joinIn;
    if (!j || b.joined || b.hp <= 0) return;
    if (b.hp > b.maxhp * (j.at != null ? j.at : 0.2)) return;
    const f2 = FOES[j.foe];
    if (!f2) { say("(난입할 적을 찾지 못했습니다: " + j.foe + ")", "todo"); b.joined = true; return; }
    b.joined = true;

    divider();
    if (f2.intro) say(f2.intro, "bad");
    if (j.text) say(j.text, "bad");
    say("▶ " + withJosa(f2.name, "이") + " 끼어든다!", "bad");

    b.atk += f2.atk;
    b.def += f2.def;
    if (j.heal) b.hp = Math.min(b.maxhp, b.hp + Math.round(b.maxhp * j.heal));
    b.name = f2.name;
    if (f2.heavyLine) b.heavyLine = f2.heavyLine;
    if (f2.img) { b.img = f2.img; showFoe(f2.img, f2.name); b.shown = f2.img; }
    if (f2.heavyImg) b.heavyImg = f2.heavyImg;
    say("체력 " + b.hp + " / " + b.maxhp + "　공격 " + b.atk + "　방어 " + b.def, "sys");
    shakeScreen(true);
  };

  /* ① 아군이 하나씩 때린다 */
  const swing = () => {
    if (!same()) return;
    if (i >= hitters.length) return setTimeout(afterAllies, RULE.foePauseMs);

    const who = hitters[i++];
    const st = effStats(who);
    /* 체포는 이번 턴 «적 방어» 를 깎습니다. 뺄셈 피해라 방어 한 점이 크게 먹히므로,
     * 방어가 두꺼운 상대에게 걸수록 효과가 큽니다. */
    const arrestCut = Math.min(0.9, RULE.arrestCut + advisorEffect().arrest);
    const fdef = b.mods.arrest
      ? Math.round(b.def * (1 - arrestCut))
      : b.def;
    let dmg = st.atk + rnd(4) - fdef;
    if (b.mods[who + "_push"]) dmg *= RULE.pushMult + advisorEffect().push;
    const crit = Math.random() < critRate();
    if (crit) dmg *= critMult();
    dmg = Math.max(1, Math.floor(dmg));
    b.hp -= dmg;
    say((crit ? (memberName(who) + "의 치명적인 공격! — " + dmg + " 피해")
              : (memberName(who) + "의 공격 — " + dmg + " 피해")) +
        (b.mods[who + "_push"] ? " (독촉)" : "") +
        (b.mods.arrest ? " (체포)" : ""), crit ? "crit" : "hit");
    foeHit(0);
    checkJoinIn();                 // 체력이 내려가면 난입할 것이 있는지 본다
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
        (b.cmds[t] === "guard" ? " (방어)" : "") +
        (b.mods[t + "_guard"] ? " (교정)" : ""), heavy ? "heavy" : "bad");

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
  const reward = storyPays()
    ? earn(Math.floor((b.maxhp + b.atk * 4) / 6) * (b.boss ? 2 : 1))
    : 0;
  S.money += reward;
  divider();
  say("▶ " + b.name + " 격파.", "good");
  if (reward) say(CURRENCY + " " + reward + " 획득.", "gain");
  else say("이미 지나온 길이다. " + CURRENCY + "는 나오지 않는다.", "sys");
  checkAchievements(b.name);
  saveVault();
  healParty(RULE.winHeal, "숨을 고른다.");
  if (b.scene.party) { forcePartyPop(); S.battleForced = false; }
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
  if (b.scene.party) { forcePartyPop(); S.battleForced = false; }
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
    if (b.scene.party) { forcePartyPop(); S.battleForced = false; }
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
    /* 이 전투가 정해진 인원으로만 돌아가는 것이면, 패배 후 편성을 바꿔
     * 강제를 우회하지 못하도록 이 손잡이 자체를 감춘다 (forcePartyPush 참고) */
    scene.party ? null : { label: "편성 바꾸기", fn: () => openParty(() => {
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
  /* «처음» 마쳤는지는 표시를 남기기 전에 봐 두어야 합니다 */
  const first = !S.cleared[c.id];
  S.cleared[c.id] = true;
  say("── " + c.no + " 종료 ──", "place");
  /* 마칠 때 주는 원고료 — 처음 마칠 때만. 장에 clearPay 를 적으면 그것이 이깁니다. */
  const pay = (typeof c.clearPay === "number") ? c.clearPay : RULE.clearPay;
  if (first && pay > 0) {
    S.money += pay;
    say(c.no + "을 마친 삯 — " + CURRENCY + " " + pay + " 획득.", "gain");
  }
  saveVault();
  save();
  const hasNext = S.ch + 1 < CHAPTERS.length;

  /* 첫 장을 처음 마쳤을 때만 — 다음에 무엇을 하면 되는지 일러 둡니다.
   * 여기서 상점을 한 번 열어 보지 않으면 인격이 하나도 없는 채로 1장에 갑니다. */
  const firstEver = first && CHAPTERS[0] && c.id === CHAPTERS[0].id;
  if (firstEver) {
    divider();
    say("이제 [상점] 에서 인격을 배정받아 보십시오.", "good");
    say("모은 " + CURRENCY + "로 새 인격을 뽑고, [편성] 에서 갈아 끼우면 " +
        "작성위원이 훨씬 강해집니다. 뽑은 인격은 회차가 바뀌어도 남습니다.", "sys");
  }

  buttons([
    firstEver ? { label: "상점 — 인격 배정받기", cls: "primary", fn: () => openShop(() => chapterEnd()) } : null,
    hasNext ? { label: "다음 장으로", cls: firstEver ? "" : "primary",
                fn: () => startChapter(S.ch + 1) } : null,
    { label: "편성", fn: () => openParty(() => {}) },
    firstEver ? null : { label: "상점", fn: () => openShop(() => {}) },
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
  let picking = ownParty().slice();          /* 조력자는 고르는 목록에 두지 않습니다 */

  const draw = () => {
    let h = '<h2>편 성</h2>';

    /* 맨 위 — 저장해 둔 편성 */
    h += presetBarHTML();

    /* 전투를 도와줄 보조 교육위원 */
    const advs = equippedAdvisors();
    const advCap = advisorSlots();
    const advNext = nextSlotChapter("advisor");
    const advCount = Object.keys(S.advisorsOwned || {}).length;
    h += '<div class="hint">전투를 도와줄 보조 교육위원을 <b>' + advCap + '명</b>까지 세울 수 있습니다. ' +
         '직접 싸우지는 않고, 작성위원 전원에게 상시 효과를 겁니다.' +
         (advNext ? '　' + advNext + '을 마치면 한 명 더.' : '') + '</div>' +
         '<div class="grid">';
    /* 칸 수만큼 나란히 세웁니다 — 한 칸에 쌓지 않습니다 */
    for (let i = 0; i < advCap; i++) {
      const a = advs[i];
      h += '<div class="slot' + (a ? ' sel' : '') + '" data-adv="' + i + '">' +
             (a ? '<div class="nm"><span class="star">' + stars(a.star) + '</span> ' +
                    a.title + ' ' + a.name + '</div><div class="sub">' + a.desc + '</div>'
                : '<div class="lock">' + (i + 1) + '　비어 있음</div><div class="sub">' +
                    (advCount ? '눌러서 고르십시오' : '아직 함께하는 교육위원이 없습니다') + '</div>') +
           '</div>';
    }
    h += '</div>';

    /* E.G.O 기프트 */
    const gfs = equippedGifts();
    const gfCap = giftSlots();
    const gfNext = nextSlotChapter("gift");
    const gfCount = Object.keys(S.giftsOwned || {}).length;
    h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">E.G.O 기프트</div>' +
         '<div class="hint"><b>' + gfCap + '개</b>까지 지닐 수 있습니다. 상점에서 황금교본으로 뽑습니다.' +
         (gfNext ? '　' + gfNext + '을 마치면 하나 더.' : '') + '</div>' +
         '<div class="grid">';
    for (let i = 0; i < gfCap; i++) {
      const gf = gfs[i];
      h += '<div class="slot' + (gf ? ' sel' : '') + '" data-gift="' + i + '">' +
             (gf ? '<div class="nm"><span class="star">' + stars(gf.star) + '</span> ' + gf.name +
                     '</div><div class="sub">' + gf.desc + '</div>'
                 : '<div class="lock">' + (i + 1) + '　비어 있음</div><div class="sub">' +
                     (gfCount ? '눌러서 고르십시오' : '아직 가진 기프트가 없습니다') + '</div>') +
           '</div>';
    }
    h += '</div>';

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
         '<button id="psave" class="ghost">편성 저장</button>' +
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
      /* 그 장이 요구하는 사람은 «장 안에서도» 빼지 못합니다.
       * 예전에는 들어갈 때만 봤습니다 — 5장 도중에 성시윤을 빼도 그냥 넘어갔습니다. */
      const c = curChapter();
      if (c && !S.mirror) {
        const miss = chapterNeeds(c).filter(w => chosen.indexOf(w) < 0);
        if (miss.length) {
          alert(c.no + "은 " + nameList(miss) + " 없이는 진행할 수 없습니다.");
          return;
        }
      }
      S.party = picking.slice().concat(alliesOn());   // 조력자는 그대로 옆에 남습니다
      S.party.forEach(w => { if (S.hp[w] == null) S.hp[w] = maxHp(w); });
      saveVault();
      closeModal(); render();
      if (done) done();
    };
    document.getElementById("pids").onclick = () => openEquip(() => draw());
    $sheet.querySelectorAll(".slot[data-adv]").forEach(el => {
      el.onclick = () => openAdvisor(() => draw());
    });
    $sheet.querySelectorAll(".slot[data-gift]").forEach(el => {
      el.onclick = () => openGiftPick(() => draw());
    });

    document.getElementById("psave").onclick = () => openPresetSave(() => draw());
    /* 저장해 둔 편성을 누르면 그 자리에서 갈아 끼웁니다.
     * picking 도 함께 맞춰야 아래 목록의 번호가 어긋나지 않습니다. */
    $sheet.querySelectorAll(".slot[data-preset]").forEach(el => {
      el.onclick = () => {
        presetApply(presetList()[+el.dataset.preset]);
        picking = S.party.slice();
        draw();
      };
    });
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

/* ── 신입 관리자 기념 배정 ─────────────────────────────────────
 *  원고료 벌이를 크게 줄인 뒤라 처음에 배정 재화가 마릅니다.
 *  그 자리를 메우려고 둔, «통틀어 두 번만» 열리는 묶음 배정입니다.
 *
 *    · 200 원고료로 10회 — 낱개(1회 30)로 사면 300 이니 3분의 1이 깎인 값입니다
 *    · 10회 묶음이므로 ★★ 이상 하나가 확정으로 들어갑니다
 *    · 참여 횟수는 보관함에 남습니다. 두 번 쓰고 나면 상점에서 아주 사라집니다
 *
 *  다시 열어 주고 싶으면 보관함의 newbie 를 0 으로 되돌리면 됩니다.
 */
const NEWBIE_RULE = {
  name:   "신입 관리자 기념 배정",
  line:   "신입 관리자를 환영합니다",
  desc:   "처음 오신 분께 드리는 묶음입니다. 통틀어 두 번만 열립니다.",
  cost:   200,   // 묶음 하나에 드는 원고료 (낱개 값이 아닙니다)
  pulls:  10,    // 한 묶음에 몇 회
  limit:  2,     // 통틀어 몇 묶음까지
  banner: "assets/logo/작성위원 전원.png"
};
function newbieLeft() { return Math.max(0, NEWBIE_RULE.limit - (S.newbie || 0)); }

/* 황금교본으로 바꿀 수 있는 것들. 값은 여기 한 곳에서 고칩니다. */
const CODEX_PRICE = 70;    // 교본 1권을 되팔 때 받는 원고료 — 고정값입니다 (earn 을 타지 않습니다)
const CODEX_ENK   = { codex: 5, enk: 2 };   // 교본 5권 → 엔케팔린 2

const SHOP_TRADES = [
  {
    id: "codex_to_money",
    name: "황금교본 되팔기",
    desc: "황금교본 1권을 " + CODEX_PRICE + " 원고료로 바꾼다.",
    can:  () => S.codex >= 1,
    need: () => "황금교본 1권",
    give: () => { S.codex -= 1; S.money += CODEX_PRICE;
                  return "황금교본 1권을 넘기고 원고료 " + CODEX_PRICE + "을 받았다."; }
  },
  {
    id: "codex_to_enk",
    name: ENK_RULE.name + " 보충",
    desc: "황금교본 " + CODEX_ENK.codex + "권으로 " + ENK_RULE.name + " " + CODEX_ENK.enk + "를 채운다.",
    can:  () => S.codex >= CODEX_ENK.codex && enkCount() < ENK_RULE.max,
    need: () => "황금교본 " + CODEX_ENK.codex + "권" +
                (enkCount() >= ENK_RULE.max ? "　— 이미 가득 찼습니다" : ""),
    give: () => {
      const e = enkSync();
      const before = e.n;
      S.codex -= CODEX_ENK.codex;
      /* 가득에서 흘러넘치지 않게 상한에 맞춥니다.
       * 가득이 아니었다가 차오르는 것이므로 시계는 건드리지 않습니다 —
       * 그래야 저절로 차던 몫을 잃지 않습니다. */
      e.n = Math.min(ENK_RULE.max, e.n + CODEX_ENK.enk);
      return "황금교본 " + CODEX_ENK.codex + "권을 태워 " + ENK_RULE.name +
             " " + (e.n - before) + "를 채웠다.  (" + e.n + " / " + ENK_RULE.max + ")";
    }
  }
];

/* ── 상점 알림 ──────────────────────────────────────────────────
 *  내용은 data/notice.js 의 SHOP_NOTICE 에 적습니다.
 *  상점에 들어갈 때 한 번 뜨고, 「이번 판에서는 다시 보지 않음」을 누르면
 *  그 판에 한해 안 뜹니다. 판이 올라가면 다시 뜹니다 — 패치 노트와 같은 방식입니다.
 */
const NOTICE_SEEN_KEY = "rash_company_notice_seen";
function noticeData()  { return (typeof SHOP_NOTICE !== "undefined" && SHOP_NOTICE) ? SHOP_NOTICE : null; }
function noticeHidden() { return Store.get(NOTICE_SEEN_KEY) === VERSION; }
function noticeHide()   { Store.set(NOTICE_SEEN_KEY, VERSION); }
function noticeDue() {
  const n = noticeData();
  if (!n || noticeHidden()) return false;
  /* 적어 둔 판 «이상» 일 때만 — 옛 판으로 열었을 때 앞선 소식이 뜨지 않게 */
  if (verCmp(VERSION, n.ver || "0") < 0) return false;
  /* 처음 오신 분께는 «0장을 마친 뒤» 부터 보여 줍니다.
   * 아무것도 모르는 채로 새 인격 목록을 받아 봐야 읽을 수가 없고,
   * 유리창의 「처음이시라면」 안내와도 겹칩니다. */
  return Object.keys(S.cleared || {}).length > 0;
}

function openNotice(then) {
  const n = noticeData();
  $modal.classList.add("on");
  /* 그림 띠 — 특정 배정이 쓰는 .pkline 을 그대로 씁니다 */
  const 띠 = n.banner
    ? '<div class="pkline pic" style="background-image:url(\'' + assetURL(n.banner) + '\')">' +
        '<span>' + (n.line || "") +
          (n.sub ? '<i class="pksub">' + n.sub + '</i>' : "") +
        '</span></div>'
    : "";

  $sheet.innerHTML =
    '<h2>' + (n.title || "알림") + '</h2>' +
    띠 +
    '<div class="hint">이번 판에 새로 들어온 것들입니다.</div>' +
    /* groups 로 적으면 무리마다 제목을 답니다. 옛 방식(lines)도 그대로 받습니다. */
    (n.groups || [{ lines: n.lines || [] }]).map(g =>
      (g.head ? '<div style="margin:14px 0 6px;color:#e8e4de;font-weight:700">' + g.head + '</div>' : "") +
      '<div class="grid one">' +
        (g.lines || []).map(x => '<div class="slot"><div class="sub">' + x + '</div></div>').join("") +
      '</div>'
    ).join("") +
    (n.tail ? '<div class="mailnote ok" style="margin-top:12px">' + n.tail + '</div>' : '') +
    '<div class="modalfoot">' +
      '<button id="ntgo" class="primary">상점으로</button>' +
      '<button id="nthide" class="ghost">이번 판에서는 다시 보지 않음</button>' +
    '</div>';
  document.getElementById("ntgo").onclick   = () => then();
  document.getElementById("nthide").onclick = () => { noticeHide(); then(); };
}

function openShop(back) {
  $modal.classList.add("on");

  const draw = (msg) => {
    let h = '<h2>상 점</h2>' +
            '<div class="hint">보유 ' + CURRENCY + ' <b>' + S.money + '</b>' +
            '　·　황금교본 <b>' + S.codex + '</b></div>';

    if (msg) h += '<div class="hint" style="color:#d8b26a">' + msg + '</div>';

    /* ── 신입 관리자 기념 배정 — 맨 위, 가로로 통째 ──────────────
     * 두 번 다 쓰고 나면 이 덩이 자체를 그리지 않습니다. 아주 사라집니다. */
    if (newbieLeft() > 0) {
      const canBuy = S.money >= NEWBIE_RULE.cost;
      h += '<div class="grid">' +
             '<div class="slot pk wide"' + (canBuy ? ' data-newbie="1"' : '') + '>' +
               '<div class="pkline pic" style="background-image:url(\'' +
                 assetURL(NEWBIE_RULE.banner) + '\')"><span>' + NEWBIE_RULE.line + '</span></div>' +
               '<div class="' + (canBuy ? 'nm' : 'lock') + '">' + NEWBIE_RULE.name + '</div>' +
               '<div class="sub" style="color:#d8b26a">' +
                 NEWBIE_RULE.pulls + '회 묶음에 ' + NEWBIE_RULE.cost + ' ' + CURRENCY +
                 '　·　낱개로 사면 ' + (RULE.pullCost * NEWBIE_RULE.pulls) + '</div>' +
               '<div class="sub">' + NEWBIE_RULE.desc +
                 '　남은 횟수 <b>' + newbieLeft() + '</b> / ' + NEWBIE_RULE.limit + '</div>' +
               (canBuy ? '' : '<div class="sub" style="color:#c8403a">' + CURRENCY + '가 모자랍니다</div>') +
             '</div>' +
           '</div>';
    }

    h += '<div style="margin:10px 0 6px;color:#e8e4de;font-weight:700">인격 배정</div>' +
         '<div class="grid">' +
           '<div class="slot" data-gacha="1">' +
             stripHTML(GACHA_STRIP) +
             '<div class="nm">인격 배정소</div>' +
             '<div class="sub">1회 ' + RULE.pullCost + ' ' + CURRENCY + '</div>' +
             '<div class="sub">' + RULE.guaranteePulls + '회에 ★★ 이상 하나 확정</div>' +
           '</div>';
    /* 서 있는 특정 배정만큼 칸이 섭니다 (최대 PICKUP_MAX 개) */
    pickupList().forEach((p, i) => {
      h += '<div class="slot pk" data-pickup="' + i + '">' +
             stripHTML(p.banner, p.line) +
             '<div class="nm">' + p.name + '</div>' +
             '<div class="sub">1회 ' + pickupCost(p) + ' ' + CURRENCY + '</div>' +
             '<div class="sub" style="color:#d8b26a">' + p.desc + '</div>' +
           '</div>';
    });
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
             /* 못 누르는 까닭은 need() 가 스스로 말합니다 —
              * 「가진 것이 모자랍니다」로 뭉뚱그리면 이미 가득 찬 경우에 거짓말이 됩니다. */
             '<div class="sub"' + (ok ? '' : ' style="color:#c8403a"') + '>' +
               '필요: ' + t.need() + '</div>' +
           '</div>';
    });
    h += '</div>';

    h += '<div class="modalfoot"><button id="shclose">닫기</button></div>';
    $sheet.innerHTML = h;

    const nb = $sheet.querySelector(".slot[data-newbie]");
    if (nb) nb.onclick = () => openGacha(() => draw(null), null, NEWBIE_RULE);

    const g = $sheet.querySelector(".slot[data-gacha]");
    if (g) g.onclick = () => openGacha(() => draw(null));

    $sheet.querySelectorAll(".slot[data-pickup]").forEach(el => {
      const p = pickupList()[+el.dataset.pickup];
      if (p) el.onclick = () => openGacha(() => draw(null), p);
    });

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
        if (!giftOnList().length) { S.giftOn = [giftId(pick)]; S.gift = giftId(pick); }
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
        if (!advisorOnList().length) { S.advisorOn = [key]; S.advisor = key; }
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
 *  data/pickup.js 의 PICKUPS 를 읽습니다. 파일이 없으면 그냥 꺼집니다.
 *  한 번에 세울 수 있는 것은 PICKUP_MAX 개까지 (지금 둘).
 *  넘게 적어 두면 앞에서부터 그만큼만 섭니다.
 */
function pickupMax() {
  return (typeof PICKUP_MAX === "number" && PICKUP_MAX > 0) ? PICKUP_MAX : 2;
}
function pickupList() {
  let all = [];
  if (typeof PICKUPS !== "undefined" && Array.isArray(PICKUPS)) all = PICKUPS;
  else if (typeof PICKUP !== "undefined" && PICKUP) all = [PICKUP];   // 옛 방식도 받아 줍니다
  return all.filter(p => p && p.on).slice(0, pickupMax());
}
function pickupOn() { return pickupList().length > 0; }

function pickupTags(p) {
  if (!p) return [];
  return Array.isArray(p.tag) ? p.tag : [p.tag];
}
/* 제목에 그 배정의 대상 단어가 들어 있는가 */
function pickupHit(p, title) {
  const t = String(title || "");
  return pickupTags(p).some(w => w && t.indexOf(w) >= 0);
}
function pickupCost(p) {
  if (p && typeof p.cost === "number") return p.cost;
  return RULE.pullCost;
}

/* 상점 칸 머리에 얹는 작은 그림 띠 — 글씨 없이 그림만.
 * 칸마다 이것을 하나씩 달아 두면 칸 크기가 서로 어긋나지 않습니다. */
function stripHTML(img, label) {
  if (!img) return "";
  /* label 을 주면 띠 위에 글씨가 얹힙니다 — 특정 배정의 광고 문구 자리입니다 */
  return '<div class="pkline small pic" ' +
         'style="background-image:url(\'' + assetURL(img) + '\')">' +
         (label ? '<span>' + label + '</span>' : "") + '</div>';
}

/* 특정 배정 광고 띠 — 그림을 깔고 그 위에 문구를 얹습니다. (배정 화면 큰 띠) */
function pkBannerHTML(p) {
  if (!p || !p.line) return "";
  const bg = p.banner
    ? ' style="background-image:url(\'' + assetURL(p.banner) + '\')"' : "";
  return '<div class="pkline' + (p.banner ? ' pic' : '') + '"' + bg + '>' +
           '<span>' + p.line + '</span>' +
         '</div>';
}

/* ── 칸 머리의 그림 띠 ──────────────────────────────────────────
 *  운전석의 장 칸과 거울 칸 위에 얹는 얇은 그림입니다. 글씨는 안 들어갑니다.
 *  특정 배정 칸이 쓰던 .pkline.small 을 그대로 씁니다 — 높이를 맞추려는 것입니다.
 *
 *  잠긴 칸에는 그림을 깔지 않습니다. 아직 못 본 곳을 미리 보여 주지 않으려는 것이고,
 *  그래도 빈 띠는 남겨서 칸끼리 높이가 어긋나지 않게 합니다.
 */
function slotStrip(img, label) {
  const inner = label ? '<span>' + label + '</span>' : "";
  if (!img) return '<div class="pkline small blank">' + inner + '</div>';
  return '<div class="pkline small pic" style="background-image:url(\'' +
         assetURL(img) + '\')">' + inner + '</div>';
}

/* 그 장을 대표할 그림 — 맨 처음 나오는 place 장면의 배경을 씁니다.
 * 장에 banner 를 직접 적어 두었으면 그것이 이깁니다. */
function chapterBanner(c) {
  if (!c) return null;
  if (c.banner) return c.banner;
  const s = (c.scenes || []).find(x => x && x.t === "place" && x.img);
  return s ? s.img : null;
}

/* pk 에 특정 배정 하나를 넘기면 그 배정으로 엽니다. 없으면 일반 배정입니다.
 *
 * deal 을 넘기면 «묶음 배정» 이 됩니다 (신입 관리자 기념 배정).
 *   · 낱개 값이 아니라 묶음 값을 한 번에 받습니다 — cost 는 묶음 하나의 값입니다
 *   · 손잡이가 하나뿐입니다. 1회 배정은 없습니다
 *   · 쓸 때마다 S.newbie 가 올라가고, 다 쓰면 상점에서 칸이 사라집니다
 */
function openGacha(done, pk, deal) {
  $modal.classList.add("on");
  const pickup = pk || null;
  const cost   = deal ? deal.cost
               : pickup ? pickupCost(pickup) : RULE.pullCost;
  const rate   = pickup ? (typeof pickup.rate === "number" ? pickup.rate : 0.5) : 0;

  /* 1성도 포함 — 1성은 전원 보유 상태라 중복으로 나와 환급된다 */
  const pool = [];
  for (const who in SINNERS)
    SINNERS[who].ids.forEach(id => { if (!id.todo) pool.push({ who, id }); });

  const pct = x => (x * 100).toFixed(x * 100 % 1 ? 1 : 0) + "%";

  const draw = (result) => {
    let h = '<h2>' + (deal ? '기 념 배 정' : pickup ? '특 정 배 정' : '인 격 배 정') + '</h2>';
    if (deal) {
      h += '<div class="pkline pic" style="background-image:url(\'' +
             assetURL(deal.banner) + '\')"><span>' + deal.line + '</span></div>' +
           '<div class="hint" style="color:#d8b26a">' + deal.name + '　·　' + deal.desc + '</div>';
    }
    if (pickup) {
      /* 이 판의 광고 문구 — data/pickup.js 의 line·banner 에서 갈아 끼웁니다 */
      if (pickup.line) h += pkBannerHTML(pickup);
      h += '<div class="hint" style="color:#d8b26a">' + pickup.name +
           '　·　' + pickup.desc + '<br>' +
           '같은 성급 안에서 ' + pct(rate) + ' 확률로 대상이 먼저 나옵니다. ' +
           '성급 확률은 일반 배정과 같습니다.</div>';
    }
    h +=    '<div class="hint">' +
            (deal ? deal.pulls + '회 묶음 ' + cost + ' ' + CURRENCY +
                    '　·　남은 횟수 <b>' + newbieLeft() + '</b> / ' + deal.limit
                  : '1회 ' + cost + ' ' + CURRENCY) +
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
         (deal
           ? '<button id="gdeal" class="primary"' +
               ((S.money < cost || newbieLeft() <= 0) ? ' disabled' : '') + '>' +
               deal.pulls + '회 배정　(' + cost + ' ' + CURRENCY + ')</button>'
           : '<button id="g1" class="primary"' + (S.money < cost ? ' disabled' : '') + '>1회 배정</button>' +
             '<button id="g10"' + (S.money < cost * RULE.guaranteePulls ? ' disabled' : '') + '>' +
               RULE.guaranteePulls + '회 배정</button>') +
         '<button id="gclose" class="ghost">닫기</button></div>';
    $sheet.innerHTML = h;

    /* 특정 배정이면, 정해진 확률로 대상 안에서만 고른다 */
    const narrow = (list, get) => {
      if (!pickup || Math.random() >= rate) return list;
      const only = list.filter(x => pickupHit(pickup, get(x)));
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
        if (!advisorOnList().length) { S.advisorOn = [k]; S.advisor = k; }
      } else S.money += dupRefund(a.star);
      return { kind: "adv", key: k, adv: a, isNew };
    };

    const pull = (n) => {
      const out = [];
      const guaranteed = n >= RULE.guaranteePulls;      // 이 묶음에 확정 칸이 있는가
      let gotHigh = false;

      /* 묶음 배정은 값을 한 번만 받고, 참여 횟수를 보관함에 새깁니다 */
      if (deal) {
        if (S.money < cost || newbieLeft() <= 0) return;
        S.money -= cost;
        S.newbie = (S.newbie || 0) + 1;
      }

      for (let i = 0; i < n; i++) {
        if (!deal) {
          if (S.money < cost) break;
          S.money -= cost;
        }

        const last = (i === n - 1);
        const force = guaranteed && last && !gotHigh;   // 마지막까지 안 나왔으면 확정
        const tier = rollTier(force);

        if (tier !== 1) gotHigh = true;
        out.push(tier === "adv" ? pullAdvisor() : pullIdentity(tier));
      }
      saveVault();
      render();
      /* 처음 얻은 ★★★ 이 섞여 있으면 한 번 빛낸 뒤에 펼친다.
       * 그것이 이 특정 배정의 대상이면 초록빛으로 터집니다. */
      const onBanner = bigWinOn(out, pickup);
      const win = onBanner || bigWin(out);
      if (win) starFlash(3, bigWinLine(win), () => draw(out), !!onBanner);
      else draw(out);
    };

    const gd = document.getElementById("gdeal");
    if (gd && !gd.disabled) gd.onclick = () => pull(deal.pulls);

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
  if (vaultLocked()) { say("보관함이 잠겨 있어 기록하지 않았습니다.", "todo"); return; }
  try {
    /* «자리» 만 적습니다. 모은 것은 보관함이 임자입니다 (load 의 주석 참고) */
    const c = {};
    SAVE_KEEPS.forEach(k => { if (S[k] !== undefined) c[k] = S[k]; });
    Store.set(SAVE_KEY, JSON.stringify(JSON.parse(JSON.stringify(c))));
    saveVault();                     // 기록할 때 모은 것도 함께 굳혀 둡니다
    say("기록했다. (" + curChapter().no + ")", "sys");
  } catch (e) { say("기록 실패.", "todo"); }
}
/* 기록(이어하기)에는 «어디까지 읽었나» 만 들어 있어야 합니다.
 * 모은 것은 보관함이 임자입니다.
 *
 *  예전에는 기록을 통째로 S 에 덮어썼습니다. 그러면 기록해 둔 뒤에 얻은 것이
 *  — 업적·인격·기프트·우편·원고료 — 이어하기 한 번에 옛것으로 되돌아갔고,
 *  그다음 saveVault() 가 그 옛것을 보관함에 도로 써 넣어 아주 사라졌습니다.
 *  「새로고침하면 업적이 없어진다」던 것이 이것입니다.
 *
 *  이제 보관함에서 새로 읽은 것 위에 «자리» 만 얹습니다.
 */
const SAVE_KEEPS = ["ch", "sc", "flags", "hp", "party", "equip",
                    "mirror", "mirrorHard", "mirrorTier", "ended",
                    "partyStack", "battleForced"];

function load() {
  const raw = readSave();
  if (!raw) return false;
  try {
    const spot = JSON.parse(raw);
    S = newState();                       // 모은 것은 보관함에서
    SAVE_KEEPS.forEach(k => { if (spot[k] !== undefined) S[k] = spot[k]; });
    /* 인격을 잃었거나 이름이 바뀌었으면 기록해 둔 장착은 버립니다 */
    for (const w in (S.equip || {}))
      if (S.equip[w] && !S.owned[S.equip[w]]) S.equip[w] = firstOwned(w, S.owned);
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
             slotStrip(open ? chapterBanner(c) : null) +
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
             (canGo ? ' ' + attr : '') + '>' +
             /* 이름은 띠 안에 넣습니다 — 「익스트림 거울 던전 산산이 부서진…」이
              * 한 줄에 안 들어가 줄이 갈리던 것을 없애려는 것입니다. */
             slotStrip(open ? mirrorBG(rule) : null, rule.name) +
             '<div class="' + (canGo ? 'nm' : 'lock') + '">' + rule.sub + '</div>' +
             '<div class="sub">' + (open
               /* 나오는 수는 «만나 본 적» 만큼입니다. 적게 만났으면 그만큼만 섭니다. */
               ? ('이미 만난 적 ' + countWord(Math.min(rule.count, metCount())) + ' 연달아 상대합니다. ' +
                  '본편의 ' + rule.scale + '배 세기입니다.' +
                  (rule.maxBoss >= rule.count ? ' 셋 다 보스일 수 있습니다.'
                   : rule.maxBoss > 1 ? ' 보스가 ' + rule.maxBoss + '까지 섞입니다.' : ''))
               : ('본편을 ' + rule.needCleared + '장 마치면 열립니다')) + '</div>' +
             '<div class="sub">완주 보상 ' + CURRENCY + ' ' + rule.bonus +
               '　·　황금교본 ' + rule.codex + '</div>' +
             '<div class="sub"' + (canGo ? '' : ' style="color:#c8403a"') + '>' +
               '입장 ' + ENK_RULE.name + ' ' + rule.cost +
               (open && !canGo ? '　— ' + ENK_RULE.name + '이 모자랍니다' : '') + '</div>' +
           '</div>';
  };

  h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">거울</div>' +
       '<div class="grid">' +
         MIRROR_TIERS.map(r => slot(r, 'data-mirror="' + r.key + '"')).join('') +
       '</div>' +
       '<div style="margin:10px 0 0">' + enkBarHTML() + '</div>';

  h += '<div class="modalfoot"><button id="csclose" class="ghost">닫기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".slot[data-i]").forEach(el => {
    el.onclick = () => { closeModal(); startChapter(+el.dataset.i); };
  });
  const rs = $sheet.querySelector(".slot[data-resume]");
  if (rs) rs.onclick = () => { closeModal(); if (!load()) { glass(); say("기록이 손상되었다.", "todo"); } };
  $sheet.querySelectorAll(".slot[data-mirror]").forEach(el => {
    el.onclick = () => { closeModal(); startMirror(el.dataset.mirror); };
  });
  document.getElementById("csclose").onclick = () => { closeModal(); if (back) back(); };
}

/* ── 거울 던전 ────────────────────────────────────────────────
 *  유리창에 비친 것들과 싸운다. 이미 만난 적들 중 셋이 무작위로 나오고,
 *  본편보다 scale 만큼 강해져 있습니다. 쉬지 않고 이어집니다.
 *
 *  세 갈래가 있습니다.
 *    MIRROR_RULE     보통   — 30% 강함. 보스 하나까지.
 *    MIRROR_HARD     하드   — 2배.  보스 둘까지.
 *    MIRROR_EXTREME  익스트림 — 3배. 셋 다 보스일 수 있습니다.
 *  전부 들어갈 때 엔케팔린을 씁니다 (ENK_RULE 참고).
 *
 *  완주 보상 원고료는 고정값입니다 — RULE.moneyGain 을 타지 않고
 *  아래 bonus 에 적은 수가 그대로 들어옵니다. 상점 칸에 적힌 수와 실제로 받는 수가
 *  어긋나지 않게 하려는 것입니다.
 *
 *  갈래를 늘리려면 MIRROR_TIERS 에 한 덩이 더 얹으면 됩니다.
 *  칸·손잡이·업적 조건은 전부 그 배열을 보고 스스로 늘어납니다.
 *
 *  누가 나올지는 들어가기 전에 알려 주지 않습니다. 부딪쳐 봐야 압니다.
 */
/* 거울 던전 배경 — 갈래마다 다른 그림입니다.
 * 갈래에 bg 를 적지 않으면 이 그림으로 갑니다. */
const MIRROR_BG = "assets/scene/거울던전.jpg";
function mirrorBG(rule) { return (rule && rule.bg) || MIRROR_BG; }

const MIRROR_RULE = {
  key:  "mirror",
  name: "거울 던전",
  sub:  "유리창에 비친 것들",
  prefix: "거울의 ",   // 비쳐 나온 적 이름 앞에 붙는 말
  count:  3,      // 몇 명과 연달아 싸우는가
  scale:  1.3,    // 본편 대비 강화 배수 (1.3 = 30% 강함)
  bonus:  150,    // 완주 보상 (원고료) — 고정값. moneyGain 을 타지 않습니다
  codex:  1,      // 완주 보상 (황금교본) — 돌 때마다 받습니다
  maxBoss: 1,     // 한 번에 나올 수 있는 보스 수
  bossChance: 0.65, // 보스가 섞여 나올 확률
  needCleared: 1, // 본편을 몇 장 마쳐야 열리는가
  cost: ENK_RULE.cost   // 입장에 드는 엔케팔린
};

const MIRROR_HARD = {
  key:  "mirrorHard",
  name: "하드 거울 던전",
  sub:  "깨진 유리창에 비친 것들",
  bg:   "assets/scene/하드거울던전.jpg",
  prefix: "깨진 거울의 ",
  count:  3,
  scale:  2.0,    // 본편의 2배
  bonus:  250,
  codex:  3,
  maxBoss: 2,     // 보스가 둘까지 섞인다
  bossChance: 0.90,
  needCleared: 3, // 본편을 세 장 마쳐야 열립니다
  cost: ENK_RULE.costHard
};

const MIRROR_EXTREME = {
  key:  "mirrorExtreme",
  name: "익스트림 거울 던전",
  sub:  "산산이 부서진 유리창에 비친 것들",
  bg:   "assets/scene/익스트림거울던전.jpg",
  prefix: "조각난 거울의 ",
  count:  5,      // 다섯을 연달아 상대합니다
  scale:  3.0,    // 본편의 3배 — 가운데 회복이 있어 견딜 만합니다
  bonus:  900,
  codex:  7,
  maxBoss: 3,     // 보스는 셋까지 섞입니다
  bossChance: 1.0,  // 보스가 반드시 섞입니다
  needCleared: 5, // 본편을 다섯 장 마쳐야 열립니다
  cost: ENK_RULE.costExtreme,

  /* 셋을 넘기면 길잡이가 한 번 들릅니다.
   * 다섯을 쉬지 않고 붙는 것은 사람이 할 짓이 아니라, 가운데에 숨 돌릴 자리를 둔 것입니다. */
  rest: {
    after: 3,
    who:  "베르렐리우스",
    say:  "이런 곳에서 시간만 죽이고 있었나...",
    text: "길잡이가 관리력과 체력을 전부 회복시켰다."
  }
};

/* 갈래를 늘리려면 여기에 얹으면 됩니다. 순서가 곧 화면에 서는 순서입니다. */
const MIRROR_TIERS = [MIRROR_RULE, MIRROR_HARD, MIRROR_EXTREME];

/* 갈래를 어떻게 부르든 받아 줍니다 — 번호, key 문자열, 규칙 그 자체,
 * 그리고 예전에 쓰던 참/거짓(하드인가 아닌가)까지. */
function mirrorTier(t) {
  if (t == null || t === false) return MIRROR_RULE;
  if (t === true) return MIRROR_HARD;                  // 옛 startMirror(true)
  if (typeof t === "number") return MIRROR_TIERS[t] || MIRROR_RULE;
  if (typeof t === "string")
    return MIRROR_TIERS.find(r => r.key === t) || MIRROR_RULE;
  return t;
}

function mirrorRuleNow() {
  if (!S) return MIRROR_RULE;
  /* 옛 보관함에는 mirrorTier 가 없고 mirrorHard 참/거짓만 있습니다 */
  return mirrorTier(S.mirrorTier != null ? S.mirrorTier : !!S.mirrorHard);
}

function mirrorUnlocked(rule) {
  const r = rule || MIRROR_RULE;
  return Object.keys(S.cleared || {}).length >= r.needCleared;
}

/* ── 방어에는 배수를 덜 먹입니다 ────────────────────────────────
 *  피해가 «공격 − 방어» 라, 방어에 배수를 그대로 곱하면 어느 지점부터
 *  갑자기 한 대에 1씩밖에 안 들어갑니다. 벽이 서 버리는 것입니다.
 *
 *  체력과 공격은 배수를 그대로 받습니다 — 오래 버티고 아프게 때립니다.
 *  방어만 완만하게 올려서, 세진 것이 «단단해서 못 뚫는 것» 이 아니라
 *  «질겨서 오래 걸리는 것» 이 되도록 합니다.
 *
 *    DEF_SCALE = 0.4 일 때
 *      ×1.3 → 방어 ×1.12      ×2 → 방어 ×1.4      ×3 → 방어 ×1.8
 *
 *  숫자를 0 으로 두면 방어는 본편 그대로, 1 로 두면 예전처럼 똑같이 곱합니다.
 */
const DEF_SCALE = 0.4;
function defK(k) { return 1 + (k - 1) * DEF_SCALE; }

/* 본편 적을 강화해 임시 적으로 만든다 */
/* ── 만나 본 적 ────────────────────────────────────────────────
 *  거울은 «유리창에 비친 것» 입니다. 아직 보지도 못한 것이 비칠 수는 없습니다.
 *  그래서 «클리어한 장에 나왔던 적» 만 뽑습니다 — 앞으로 나올 이야기의 보스가
 *  거울에서 먼저 튀어나와 스포일러가 되던 것을 막으려는 것이기도 합니다.
 */
function metFoes() {
  const m = {};
  const walk = list => (list || []).forEach(s => {
    if (!s) return;
    if (s.t === "recall") return walk(s.scenes);
    if (s.t === "battle" && s.foe) m[s.foe] = true;
  });
  CHAPTERS.forEach(c => { if (S.cleared && S.cleared[c.id]) walk(c.scenes); });
  return m;
}
function metCount() { return Object.keys(metFoes()).length; }

function buildMirrorFoes(rule) {
  const r = rule || MIRROR_RULE;
  const k = r.scale;
  const met = metFoes();
  /* 거울에 세울 수 있는 적인가.
   *
   *  noMirror 를 단 적은 뺍니다. 각본 전투(lose:"story")로만 쓰는 적이 그렇습니다 —
   *  그런 적은 «못 이긴다는 느낌» 을 주려고 체력을 크게 잡아 두는데,
   *  거울에서 배수까지 곱하면 혼자만 터무니없이 길어집니다.
   *  hp 를 안 적은 적(난입 전용)도 뺍니다 — 곱하면 NaN 이 됩니다. */
  const 설수있나 = x =>
    x.indexOf("__mirror_") !== 0 && !FOES[x].noMirror && typeof FOES[x].hp === "number";

  let keys = Object.keys(FOES).filter(x => 설수있나(x) && met[x]);
  /* 만나 본 것이 하나도 없으면(있을 수 없는 일이지만) 옛 방식대로 전부에서 뽑습니다 */
  if (!keys.length) keys = Object.keys(FOES).filter(설수있나);

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

  /* 만나 본 것이 count 보다 적으면 그만큼만 나옵니다.
   * 같은 것을 두 번 세우기보다 짧게 끝나는 편이 낫습니다 —
   * 안내 글월도 실제로 나오는 수를 말합니다. */

  /* 약한 것부터 나오도록 — 보스가 있으면 자연히 마지막이 된다 */
  picked.sort((a, b) => FOES[a].hp - FOES[b].hp);

  return picked.map((src, i) => {
    const f = FOES[src];
    const id = "__mirror_" + i;
    FOES[id] = {
      name: (r.prefix || "거울의 ") + f.name,
      hp:  Math.round(f.hp  * k),
      atk: Math.round(f.atk * k),
      def: Math.round(f.def * defK(k)),
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

function startMirror(tier) {
  const rule = mirrorTier(tier);
  const hard = rule !== MIRROR_RULE;   // 「보통이 아니다」— 글월에만 씁니다

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
  const 첫줄 = rule === MIRROR_EXTREME
    ? "유리창이 터진다. 조각 하나하나가 저마다 다른 것을 비추고 있다."
    : rule === MIRROR_HARD
      ? "유리창에 금이 간다. 갈라진 틈마다 다른 것이 서 있다."
      : "메카고질라의 유리창이 흐려지더니, 비친 것들이 걸어 나온다.";
  const scenes = [{ t: "place", img: mirrorBG(rule), name: rule.name },
                  { t: "n", text: 첫줄 },
                  { t: "n", text: "쉴 틈은 없다. " + countWord(ids.length) + " 연달아 상대해야 한다." }];
  ids.forEach((id, i) => {
    if (i) scenes.push({ t: "n", text: "숨을 고를 새도 없이, 다음 것이 유리를 밀고 나온다." });
    scenes.push({ t: "battle", foe: id });
    /* 정해진 수를 넘기면 길잡이가 한 번 들러 세워 놓고 갑니다 */
    if (rule.rest && i + 1 === rule.rest.after && i + 1 < ids.length)
      scenes.push({ t: "rest", who: rule.rest.who, say: rule.rest.say, text: rule.rest.text });
  });
  scenes.push({ t: "mirrorClear" });

  MIRROR = {
    id: rule.key, no: rule.name, title: "",
    subtitle: rule.sub, scenes: scenes
  };

  S.mirror = true;
  S.mirrorTier = MIRROR_TIERS.indexOf(rule);
  S.mirrorHard = hard;              // 옛 보관함과 맞추려고 함께 둡니다
  S.sc = 0;
  S.ended = false;
  SCENES = buildScenes(MIRROR);
  S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
  setBackdrop(mirrorBG(rule), null);
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
  divider();
  say(rule === MIRROR_EXTREME ? "흩어진 조각들이 하나씩 제자리를 찾아 간다."
    : rule === MIRROR_HARD    ? "깨진 유리가 도로 맞물린다."
    :                           "유리창이 다시 맑아진다.", "good");
  /* 고정값입니다 — earn() 을 타지 않으므로 상점 칸에 적힌 수가 그대로 들어옵니다 */
  const mb = rule.bonus;
  S.money += mb;
  say(CURRENCY + " " + mb + " 획득.", "gain");
  if (rule.codex) {
    S.codex += rule.codex;
    say("비친 것들이 남기고 간 황금교본 " + rule.codex + "권.  (보유 " + S.codex + ")", "gain");
  }
  /* 완주 업적은 여기서 봅니다. S.mirror 를 내리기 전에 불러야
   * 편성·시너지 조건이 아직 거울 안의 것으로 읽힙니다. */
  checkAchievements(null, rule.key);
  saveVault();
  S.mirror = false;
  S.mirrorTier = null;
  S.mirrorHard = false;
  MIRROR = null;
  S.ended = true;
  render();
  const again = enkCount() >= rule.cost;
  buttons([
    { label: again ? "한 번 더" : "한 번 더 (" + ENK_RULE.name + " 부족)",
      cls: "primary", disabled: !again, fn: () => startMirror(rule.key) },
    { label: "유리창", fn: () => glass() },
    { label: "상점", cls: "ghost", fn: () => openShop(() => {}) }
  ]);
  showEnkBar(true);
}

/* ── 기록 (진행 저장 + 보관함 파일 내보내기) ───────────────── */
/* ── 내보낸 파일에 붙는 «판이 바뀌며 잃은 것» ────────────────────
 *
 *  떠 둔 백업과 지금 보관함을 견줘, 없어진 열쇠를 글로 적어 둡니다.
 *  「업데이트했더니 뭐가 없어졌다」는 말을 이 줄만 보면 바로 확인할 수 있습니다.
 *
 *  게임은 이 부분을 읽지 않습니다. 사람이 읽으라고 붙이는 것입니다.
 */
function vaultDiffText() {
  const parse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
  const now  = parse(Store.get(VAULT_KEY)) || (S ? vaultToObject() : null);
  const back = vaultBackups();
  const L = [];

  L.push("/* ── 이 파일을 만든 때 ──────────────────────────────");
  L.push(" *  판       " + VERSION + " (" + VERSION_NAME + ")");
  L.push(" *  시각     " + new Date().toISOString());
  L.push(" *  브라우저 " + ((navigator && navigator.userAgent) || "").slice(0, 120));
  L.push(" *  저장소   " + (Store.ok ? "쓸 수 있음" : "막혀 있음 — 창을 닫으면 사라집니다"));
  L.push(" *  손댄 흔적 " + (vaultTouched(now) ? "★ 있음 — 요약값이 내용과 안 맞습니다"
                            : (now && now.sig) ? "없음" : "알 수 없음 (요약값이 없는 옛 판)"));

  /* 지금 자료로 아무것도 가리키지 못하는 열쇠 */
  if (now) {
    const dead = []
      .concat((now.ids      || []).filter(k => !idByKey(k)).map(k => "인격 " + k))
      .concat((now.advisors || []).filter(k => !advisorById(k)).map(k => "교육위원 " + k))
      .concat((now.gifts    || []).filter(k => !giftById(k)).map(k => "기프트 " + k))
      .concat((now.supports || []).filter(k => !supportBy(k)).map(k => "지원 " + k));
    L.push(" *");
    L.push(" *  못 알아보는 열쇠 " + dead.length + "개" +
           (dead.length ? "" : " — 없습니다"));
    dead.forEach(k => L.push(" *    " + k));
    if (dead.length)
      L.push(" *    (지워졌거나 이름이 바뀐 것입니다. was 를 적어 주면 되살아납니다)");
  }

  /* ★ 백업에는 있었는데 지금은 없는 것 */
  L.push(" *");
  if (!back.length) {
    L.push(" *  떠 둔 백업이 없습니다 — 이 기기에서는 아직 판이 안 바뀌었습니다.");
  } else back.forEach(b => {
    const o = parse(b.raw);
    L.push(" *  " + b.ver + " → " + b.to + "  (" + new Date(b.at).toISOString().slice(0, 16) + ")");
    if (!o) { L.push(" *    백업을 읽지 못했습니다"); return; }
    let any = false;
    [["ids", "인격"], ["advisors", "교육위원"], ["gifts", "기프트"],
     ["supports", "지원"], ["achieved", "업적"], ["cleared", "클리어"]].forEach(([f, 이름]) => {
      const after = (now && now[f]) || [];
      const miss  = (o[f] || []).filter(k => after.indexOf(k) < 0);
      if (!miss.length) return;
      /* 이름이 바뀌어 «옮겨간» 것과 아주 «잃은» 것을 갈라 적습니다.
       * 둘을 한 덩이로 세면 멀쩡히 옮겨간 것까지 사고로 보입니다. */
      const moved = [], lostK = [];
      miss.forEach(k => {
        const c = (f === "ids") ? canonIdKey(k) : k;
        if (c !== k && after.indexOf(c) >= 0) moved.push(k + "  →  " + c);
        else lostK.push(k);
      });
      if (moved.length) {
        L.push(" *    옮겨감 · " + 이름 + " " + moved.length + "개 (이름이 바뀐 것 — 잃지 않았습니다)");
        moved.forEach(k => L.push(" *      " + k));
      }
      if (lostK.length) {
        any = true;
        L.push(" *    잃음 · " + 이름 + " " + lostK.length + "개");
        lostK.forEach(k => L.push(" *      " + k));
      }
    });
    if (o.money != null && now && now.money != null && now.money !== o.money)
      L.push(" *    " + CURRENCY + " " + o.money + " → " + now.money);
    if (!any) L.push(" *    잃은 것 없음");
  });
  L.push(" * ------------------------------------------------- */");
  return L.join("\n");
}

function openRecord(back) {
  save();
  saveVault();
  $modal.classList.add("on");
  const t = vaultStats();
  const total = t[1][0] + t[2][0] + t[3][0];
  const adv = Object.keys(S.advisorsOwned || {}).length;
  const cl  = Object.keys(S.cleared || {}).length;
  let touched = false;
  try { touched = vaultTouched(JSON.parse(Store.get(VAULT_KEY))); } catch (e) {}

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
    (touched
      ? '<div class="hint" style="color:#d9705f;margin-top:14px">' +
          '<b>손댄 흔적이 있습니다.</b> 저장된 내용이 요약값과 맞지 않습니다. ' +
          '파일을 손으로 고치셨다면 그 때문입니다.</div>'
      : '') +
    '<div class="hint" style="margin-top:16px">' +
      '<b>내보내기</b> 를 누르면 <code>vault.js</code> 파일이 ' +
      '브라우저가 쓰는 <b>내려받기 폴더</b>에 떨어집니다 (보통 «다운로드»).' +
    '</div>' +
    '<div class="hint">' +
      '<b>다시 읽히려면</b> 그 파일을 게임 폴더의 <code>data/vault.js</code> 에 덮어쓰고 ' +
      '새로고침하십시오. <code>index.html</code> 이 있는 곳 아래의 <code>data</code> 폴더입니다.<br>' +
      '<span class="dim">브라우저에 저장된 것이 먼저 읽힙니다. 파일 쪽으로 되돌리려면 ' +
      '[보관함 비우기] 를 한 번 하고 새로고침하세요.</span>' +
    '</div>' +
    '<div class="hint">' +
      '<span class="dim">판이 바뀌기 <b>전</b>의 보관함도 이 파일에 함께 담깁니다. ' +
      '무언가 없어진 것 같으면 고칠 것 없이 그대로 보내 주시면 됩니다.' +
      (vaultBackups().length
        ? '　(떠 둔 것 ' + vaultBackups().length + '벌)'
        : '　(아직 떠 둔 것은 없습니다 — 이 기기에서는 판이 안 바뀌었습니다)') + '</span>' +
    '</div>' +
    '<div class="hint">' +
      '<b>가져오기</b> 는 다른 곳(오프라인 완전판 등)에서 내보낸 <code>vault.js</code> 를 ' +
      '파일 그대로 골라 <b>이 브라우저</b>에 바로 옮겨 담습니다 — data 폴더를 만질 필요가 없습니다. ' +
      '지금 이 브라우저에 있던 보관함은 그 자리에서 덮어써집니다.' +
    '</div>' +
    '<div class="modalfoot">' +
      '<a id="vdl" class="dl" download="vault.js">내보내기</a>' +
      '<button id="vimp" class="ghost">가져오기</button>' +
      '<input id="vimpfile" type="file" accept=".js,text/javascript,text/plain" style="display:none">' +
      '<button id="rclose">닫기</button>' +
    '</div>';

  const a = document.getElementById("vdl");
  a.href = "data:text/javascript;charset=utf-8," + encodeURIComponent(vaultExportText());
  const impFile = document.getElementById("vimpfile");
  document.getElementById("vimp").onclick = () => impFile.click();
  impFile.onchange = () => { if (impFile.files && impFile.files[0]) importVaultFile(impFile.files[0]); };
  document.getElementById("rclose").onclick = () => { closeModal(); if (back) back(); };
}

/* ── 업적 ────────────────────────────────────────────────────
 *  제목·조건·보상을 그대로 보여 줍니다.
 *  보상으로 받는 사람의 수치와 설명은 손에 넣기 전까지 가립니다.
 */
/* ── 우편함 ────────────────────────────────────────────────────
 *  내용은 data/mail.js 의 MAILS 에 적습니다.
 *  받은 것은 보관함에 id 로 남아, 판이 올라가도 다시 받히지 않습니다.
 *
 *  기간은 «보낸 날 0시 ~ days 일 뒤 0시» 입니다. 기기 시계를 봅니다.
 */
function mailList() { return (typeof MAILS !== "undefined" && MAILS) ? MAILS : []; }
function mailRule() { return (typeof MAIL_RULE !== "undefined" && MAIL_RULE)
                             ? MAIL_RULE : { name: "우편함", days: 7 }; }
function mailTaken(m) { return !!(S && S.mailTaken && S.mailTaken[m.id]); }

/* 그 우편이 열려 있는 마지막 순간 (밀리초). 넘기면 닫힙니다. */
function mailUntil(m) {
  const p = String(m.from || "").split("-").map(Number);
  if (p.length !== 3 || p.some(isNaN)) return Infinity;   // 날짜가 없으면 늘 열어 둡니다
  const days = (typeof m.days === "number") ? m.days : mailRule().days;
  return new Date(p[0], p[1] - 1, p[2]).getTime() + days * 24 * 60 * 60 * 1000;
}
function mailLive(m)   { return Date.now() < mailUntil(m); }
function mailOpen(m)   { return !mailTaken(m) && mailLive(m); }
function mailWaiting() { return mailList().filter(mailOpen).length; }

/* 얼마나 남았는지 — 「3일 남음」 / 「오늘까지」 */
function mailLeftText(m) {
  const ms = mailUntil(m) - Date.now();
  if (ms === Infinity) return "기한 없음";
  if (ms <= 0) return "기간이 지났습니다";
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (d >= 1) return d + "일 남음";
  const h = Math.floor(ms / (60 * 60 * 1000));
  return h >= 1 ? h + "시간 남음" : "오늘까지";
}

/* 무엇을 주는지 한 줄로 */
function mailGiveText(m) {
  const g = m.give || {}, out = [];
  if (g.money) out.push(CURRENCY + " " + g.money);
  if (g.codex) out.push("황금교본 " + g.codex);
  if (g.enk)   out.push(ENK_RULE.name + " " + g.enk);
  if (g.support) {
    const sp = supportBy(SUP_PREFIX + g.support);
    out.push("지원 작성위원 " + (sp ? stars(sp.star) + " " + sp.title + " " + sp.name
                                   : g.support.replace("|", " ")));
  }
  return out.join("　·　") || "—";
}

/* 지금 받으면 헛되이 버려지는가.
 * 엔케팔린은 보유 상한이 있어, 가득 찬 채로 받으면 한 개도 안 남고 우편만 사라집니다.
 * 그래서 «받을 것이 하나도 없는» 우편은 아예 열지 않고 돌려보냅니다. */
function mailWasted(m) {
  const g = m.give || {};
  if (g.money || g.codex || g.support) return false;   // 다른 것이 있으면 버려질 일 없습니다
  if (!g.enk) return false;
  enkSync();
  return enkCount() >= ENK_RULE.max;
}

/* 받아 봅니다. 돌려주는 것은 창에 그대로 적을 한 줄입니다 —
 * { ok, msg }. 받은 뒤 유리창으로 돌아가면 로그가 지워지므로,
 * 결과는 반드시 창 안에서 보여 주어야 합니다. */
function mailTake(m) {
  if (!mailOpen(m))
    return { ok: false, msg: "기간이 지난 우편입니다." };
  if (mailWasted(m))
    return { ok: false, msg: ENK_RULE.name + "이 이미 가득 차 있습니다 (" +
             enkCount() + " / " + ENK_RULE.max + "). 한 개도 받지 못하고 우편만 사라지므로, " +
             "조금 쓰신 뒤에 받으십시오." };
  const g = m.give || {};
  if (!S.mailTaken) S.mailTaken = {};
  S.mailTaken[m.id] = true;

  const got = [];
  if (g.money) { S.money += g.money; got.push(CURRENCY + " " + g.money); }
  if (g.codex) { S.codex += g.codex; got.push("황금교본 " + g.codex + "권"); }
  if (g.enk) {
    enkSync();
    const before = enkCount();
    S.enk.n = Math.min(ENK_RULE.max, before + g.enk);
    const n = enkCount() - before;
    got.push(ENK_RULE.name + " " + n +
             (n < g.enk ? " (상한 " + ENK_RULE.max + " 을 넘겨 받지는 못했습니다)" : ""));
  }
  if (g.support) {
    const sp = supportBy(SUP_PREFIX + g.support);
    if (sp) {
      if (!S.supportsOwned) S.supportsOwned = {};
      S.supportsOwned[SUP_PREFIX + g.support] = true;
      got.push("지원 작성위원 " + stars(sp.star) + " " + sp.title + " " + sp.name);
    } else got.push("(보상 지원 작성위원을 찾지 못했습니다: " + g.support + ")");
  }
  saveVault();

  /* 로그에도 남깁니다 — 창을 닫은 뒤에도 무엇을 받았는지 되짚을 수 있게 */
  divider();
  say("우편을 받았다 — " + m.title, "gain");
  got.forEach(x => say(x + " 획득.", "gain"));

  return { ok: true, msg: "받았습니다 — " + got.join("　·　") };
}

/* note 를 넘기면 창 위에 한 줄로 붙습니다 — 방금 받은 결과나 못 받은 까닭. */
function openMail(back, note) {
  $modal.classList.add("on");
  const all = mailList();
  const 기다림 = mailWaiting();

  let h = '<h2>우 편 함</h2>' +
    (note ? '<div class="mailnote' + (note.ok ? ' ok' : ' no') + '">' + note.msg + '</div>' : '') +
          '<div class="hint">불편을 끼쳤을 때 얹어 드리는 자리입니다. ' +
          '하나에 한 번씩만 받습니다.' +
          (기다림 ? '　<b style="color:#d8b26a">받지 않은 우편 ' + 기다림 + '통</b>' : '') +
          '</div>';

  const live = all.filter(m => mailLive(m) || mailTaken(m));
  if (!live.length) h += '<div class="box dim">온 우편이 없습니다.</div>';

  /* 우편은 줄글이 들어가므로 한 줄에 하나씩, 창 너비를 다 씁니다 */
  h += '<div class="grid one">';
  live.forEach((m, i) => {
    const got = mailTaken(m), open = mailOpen(m);
    h += '<div class="slot' + (got ? ' sel' : '') + '"' +
           (open ? ' data-mail="' + i + '"' : '') + '>' +
           '<div class="' + (open || got ? 'nm' : 'lock') + '">' +
             (got ? '✓ ' : open ? '● ' : '') + m.title + '</div>' +
           (m.body ? '<div class="sub">' + m.body + '</div>' : '') +
           '<div class="sub"><span class="star">보상</span> ' + mailGiveText(m) + '</div>' +
           /* 남은 날과 받는 손잡이는 오른쪽으로 몰아 둡니다 — 눈이 가는 자리라 */
           '<div class="sub mailfoot"' + (open ? ' style="color:#d8b26a"' : '') + '>' +
             (got ? '받았습니다'
                  : open ? mailLeftText(m) + '　·　<b>눌러서 받기</b>'
                         : '기간이 지났습니다') + '</div>' +
         '</div>';
  });
  h += '</div>';

  h += '<div class="hint" style="margin-top:14px">' +
       '받을 수 있는 기간은 보낸 날부터 ' + mailRule().days + '일입니다. ' +
       '기간이 지난 우편은 받을 수 없습니다.</div>' +
       '<div class="modalfoot"><button id="mlclose">닫기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".slot[data-mail]").forEach(el => {
    el.onclick = () => {
      const m = live[+el.dataset.mail];
      /* 창을 닫지 않고 그 자리에서 다시 그립니다 — 유리창으로 돌아가면
       * 로그가 지워져 무엇을 받았는지 못 보게 됩니다. */
      const r = mailTake(m);
      render();
      openMail(back, r);
    };
  });
  document.getElementById("mlclose").onclick = () => {
    closeModal(); render(); if (back) back();
  };
}

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

/* ── 저장해 둔 편성 ────────────────────────────────────────────
 *  작성위원 셋과 그들이 낀 인격, 지닌 기프트, 세운 교육위원을 통째로 담아 둡니다.
 *  세 칸이고, 누르면 그 자리에서 그대로 갈아 끼웁니다.
 *
 *  칸 이름은 «가장 많이 공명하는 시너지» 를 씁니다 — 수가 같으면 가나다 순으로 앞선 것.
 *  이름을 직접 적게 하지 않는 것은, 편성을 바꾸면 이름도 따라 바뀌는 편이
 *  무엇을 담아 두었는지 알아보기 쉽기 때문입니다.
 *
 *  기프트·교육위원 칸이 나중에 늘어나도 그대로 삽니다 — 배열로 담아 두고,
 *  불러올 때 그때의 칸 수만큼만 끼웁니다.
 */
const PRESET_MAX = 3;

function presetList() {
  if (!S.presets || !Array.isArray(S.presets)) S.presets = [];
  while (S.presets.length < PRESET_MAX) S.presets.push(null);
  return S.presets;
}

/* 지금 편성을 그대로 담아 낸다 */
function presetSnapshot() {
  const equip = {};
  ownParty().forEach(w => { if (w && !isSupport(w)) equip[w] = S.equip[w] || null; });
  return {
    party:     ownParty().slice(),
    equip:     equip,
    giftOn:    giftOnList().slice(),
    advisorOn: advisorOnList().slice()
  };
}

/* 담아 둔 편성에서 «가장 많이 공명하는 시너지» 이름을 찾는다.
 * 지금 편성이 아니라 그 편성 기준이어야 하므로, S 를 잠깐 바꿔 끼웠다 되돌립니다. */
function presetLabel(p) {
  if (!p) return null;
  const 켠 = { party: S.party, equip: S.equip, giftOn: S.giftOn, advisorOn: S.advisorOn };
  let best = null;
  try {
    presetApplyRaw(p);
    const list = activeSynergies();
    /* 사람 수가 많은 것 우선, 같으면 가나다 순 */
    list.sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name, "ko"));
    best = list[0] || null;
  } catch (e) { best = null; }
  S.party = 켠.party; S.equip = 켠.equip; S.giftOn = 켠.giftOn; S.advisorOn = 켠.advisorOn;
  return best ? best.name : null;
}

/* 담아 둔 것을 S 에 얹기만 합니다 (저장도, 다시 그리기도 안 합니다) */
function presetApplyRaw(p) {
  if (!p) return;
  S.party = (p.party || []).slice();
  S.equip = Object.assign({}, S.equip);
  for (const w in (p.equip || {})) if (p.equip[w]) S.equip[w] = p.equip[w];
  /* 그때보다 칸이 줄었으면 앞에서부터 그만큼만.
   * 교육위원은 같은 사람이 두 번 서지 않게 이름으로도 걸러 냅니다. */
  S.giftOn = (p.giftOn || []).slice(0, giftSlots());
  const 선 = {}, adv = [];
  (p.advisorOn || []).forEach(k => {
    const a = advisorById(k);
    if (!a || 선[a.name] || adv.length >= advisorSlots()) return;
    선[a.name] = true;
    adv.push(k);
  });
  S.advisorOn = adv;
  S.gift    = S.giftOn[0]    || null;
  S.advisor = S.advisorOn[0] || null;
}

/* 담아 둔 것 중 지금 못 쓰는 것이 있는가 (인격을 잃었다든지) */
function presetBroken(p) {
  if (!p) return null;
  const bad = [];
  (p.party || []).forEach(w => {
    if (!w) return;
    if (isSupport(w)) { if (!(S.supportsOwned && S.supportsOwned[w])) bad.push(memberName(w)); return; }
    if (!SINNERS[w]) { bad.push(w); return; }
    const k = (p.equip || {})[w];
    if (k && !S.owned[k]) bad.push(SINNERS[w].name);
  });
  (p.giftOn    || []).forEach(k => { if (!(S.giftsOwned && S.giftsOwned[k])) bad.push(k); });
  (p.advisorOn || []).forEach(k => { if (!(S.advisorsOwned && S.advisorsOwned[k])) bad.push(k.split("|").pop()); });
  return bad.length ? bad : null;
}

function presetApply(p) {
  presetApplyRaw(p);
  S.party.forEach(w => { if (w) S.hp[w] = Math.min(curHp(w), maxHp(w)); });
  saveVault(); render();
}

function presetSave(i) {
  presetList()[i] = presetSnapshot();
  saveVault();
}
function presetClear(i) {
  presetList()[i] = null;
  saveVault();
}

/* 편성 화면 맨 위에 서는 세 칸 */
function presetBarHTML() {
  const ps = presetList();
  let h = '<div style="margin:2px 0 6px;color:#e8e4de;font-weight:700">저장해 둔 편성</div>' +
          '<div class="hint">눌러서 그대로 갈아 끼웁니다. 아래 [편성 저장] 으로 담아 둡니다.</div>' +
          '<div class="grid">';
  ps.forEach((p, i) => {
    if (!p) {
      h += '<div class="slot"><div class="lock">' + (i + 1) + '　비어 있음</div>' +
             '<div class="sub">아직 담아 둔 것이 없습니다</div></div>';
      return;
    }
    const 이름 = presetLabel(p);
    const 깨짐 = presetBroken(p);
    const names = (p.party || []).filter(Boolean).map(memberName).join("　");
    h += '<div class="slot' + (깨짐 ? '' : ' sel') + '"' +
           (깨짐 ? '' : ' data-preset="' + i + '"') + '>' +
           '<div class="' + (깨짐 ? 'lock' : 'nm') + '">' + (i + 1) + '　' +
             (이름 || '시너지 없음') + '</div>' +
           '<div class="sub">' + names + '</div>' +
           '<div class="sub">' +
             (깨짐 ? '<span style="color:#c8403a">지금 쓸 수 없습니다 — ' + 깨짐.join(", ") + '</span>'
                   : '기프트 ' + (p.giftOn || []).length + '　·　교육위원 ' + (p.advisorOn || []).length) +
           '</div>' +
         '</div>';
  });
  h += '</div>';
  return h;
}

/* [편성 저장] 을 누르면 어느 칸에 담을지 고릅니다 */
function openPresetSave(back) {
  $modal.classList.add("on");
  const ps = presetList();
  const 지금 = presetSnapshot();
  const 지금이름 = presetLabel(지금);

  let h = '<h2>편 성 저 장</h2>' +
          '<div class="hint">지금 편성을 어느 칸에 담을지 고르십시오. ' +
          '이미 담긴 칸을 고르면 덮어씁니다.<br>지금 편성 — <b>' +
          (지금이름 || '시너지 없음') + '</b>　' +
          (지금.party || []).filter(Boolean).map(memberName).join("　") + '</div>' +
          '<div class="grid one">';
  ps.forEach((p, i) => {
    const 이름 = p ? presetLabel(p) : null;
    h += '<div class="slot" data-save="' + i + '">' +
           '<div class="nm">' + (i + 1) + '　' + (p ? (이름 || '시너지 없음') : '비어 있음') + '</div>' +
           '<div class="sub">' + (p ? (p.party || []).filter(Boolean).map(memberName).join("　")
                                    : '여기에 담습니다') + '</div>' +
           '<div class="sub mailfoot">' + (p ? '<b>덮어쓰기</b>' : '<b>담기</b>') +
             (p ? '　·　<span data-wipe="' + i + '" style="color:#c8403a;cursor:pointer">비우기</span>' : '') +
           '</div>' +
         '</div>';
  });
  h += '</div><div class="modalfoot"><button id="psclose">돌아가기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll("[data-wipe]").forEach(el => {
    el.onclick = ev => { ev.stopPropagation(); presetClear(+el.dataset.wipe); openPresetSave(back); };
  });
  $sheet.querySelectorAll(".slot[data-save]").forEach(el => {
    el.onclick = () => { presetSave(+el.dataset.save); if (back) back(); };
  });
  document.getElementById("psclose").onclick = () => { if (back) back(); else { closeModal(); render(); } };
}

/* ── 보조 교육위원 편성 ────────────────────────────────────── */
function openAdvisor(back) {
  $modal.classList.add("on");
  const all = advisorList();
  const mine = all.filter(a => S.advisorsOwned && S.advisorsOwned[advisorId(a)]);

  const cap = advisorSlots();
  const nowOn = advisorOnList();
  const 다음 = nextSlotChapter("advisor");

  let h = '<h2>보 조 교 육 위 원</h2>' +
          '<div class="hint">관리자 옆에 <b>' + cap + '명</b>까지 세울 수 있습니다. 직접 싸우지는 않고, ' +
          '편성된 작성위원 전원에게 상시 효과를 겁니다.　세운 ' + nowOn.length + ' / ' + cap +
          '　·　보유 ' + mine.length + ' / ' + all.length +
          (다음 ? '<br>' + 다음 + '을 마치면 한 명 더 세울 수 있습니다.' : '') +
          '</div><div class="grid">';

  h += '<div class="slot' + (!nowOn.length ? ' sel' : '') + '" data-pick="">' +
         '<div class="nm">모두 내리기</div><div class="sub">아무도 세우지 않습니다</div></div>';

  all.forEach(a => {
    const k = advisorId(a);
    const has = !!(S.advisorsOwned && S.advisorsOwned[k]);
    const on  = advisorIsOn(k);
    /* 같은 사람을 이미 세웠으면 못 고릅니다 — N사 이형우와 L사 이형우처럼 */
    const 겹침 = has && !on && advisorNameTaken(k);
    const 고를수있나 = has && !겹침;
    h += '<div class="slot' + (on ? ' sel' : '') + '"' +
           (고를수있나 ? ' data-pick="' + k + '"' : '') + '>' +
           '<div class="' + (고를수있나 || on ? 'nm' : 'lock') + '">' +
             '<span class="star">' + stars(a.star) + '</span> ' + a.title + ' ' + a.name +
             (on ? ' <span class="sub">· 배치</span>' : '') + '</div>' +
           '<div class="sub">' + (has ? a.desc : '미보유') + '</div>' +
           (겹침 ? '<div class="sub" style="color:#c8403a">' + withJosa(a.name, "을") +
                   ' 이미 세웠습니다. 한 사람은 한 번만 설 수 있습니다.</div>' : '') +
           (has && a.note ? '<div class="sub">' + a.note + '</div>' : '') +
         '</div>';
  });
  h += '</div><div class="modalfoot"><button id="aclose">돌아가기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".slot[data-pick]").forEach(el => {
    el.onclick = () => {
      const k = el.dataset.pick;
      /* 빈 손잡이는 «모두 내리기» */
      if (!k) S.advisorOn = [];
      else if (advisorIsOn(k)) S.advisorOn = advisorOnList().filter(x => x !== k);
      else if (advisorNameTaken(k)) return;      // 같은 사람은 둘 세울 수 없습니다
      else {
        const list = advisorOnList();
        /* 칸이 다 찼으면 «맨 먼저 세운 사람» 이 물러납니다 */
        if (list.length >= advisorSlots()) list.shift();
        list.push(k);
        S.advisorOn = list;
      }
      S.advisor = advisorOnList()[0] || null;   // 옛 이름도 맞춰 둡니다
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

  const cap = giftSlots();
  const nowOn = giftOnList();
  const 다음 = nextSlotChapter("gift");

  let h = '<h2>E . G . O   기 프 트</h2>' +
          '<div class="hint"><b>' + cap + '개</b>까지 지닐 수 있습니다. 편성된 작성위원 전원에게 걸립니다.　' +
          '지닌 ' + nowOn.length + ' / ' + cap +
          '　·　보유 ' + mine.length + ' / ' + (typeof GIFTS !== "undefined" ? GIFTS.length : 0) +
          (다음 ? '<br>' + 다음 + '을 마치면 하나 더 지닐 수 있습니다.' : '') +
          '</div><div class="grid">';

  h += '<div class="slot' + (!nowOn.length ? ' sel' : '') + '" data-pick="">' +
         '<div class="nm">모두 내려놓기</div><div class="sub">아무것도 지니지 않습니다</div></div>';

  (typeof GIFTS !== "undefined" ? GIFTS : []).forEach(g => {
    const has = !!(S.giftsOwned && S.giftsOwned[giftId(g)]);
    const on  = giftIsOn(giftId(g));
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
      const k = el.dataset.pick;
      if (!k) S.giftOn = [];
      else if (giftIsOn(k)) S.giftOn = giftOnList().filter(x => x !== k);
      else {
        const list = giftOnList();
        if (list.length >= giftSlots()) list.shift();   // 다 찼으면 먼저 든 것을 내려놓습니다
        list.push(k);
        S.giftOn = list;
      }
      S.gift = giftOnList()[0] || null;
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
  if (!advisorOnList().length) { S.advisorOn = [k]; S.advisor = k; }
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
  document.getElementById("vreset").onclick = () => openReset(() => openVault(back));
}

/* ── 보관함 비우기 — 되돌릴 수 없는 자리 ────────────────────────
 *  창 하나 띄우고 「예/아니오」로 끝낼 일이 아닙니다.
 *  무엇이 사라지는지 수를 세어 보여 주고, 손잡이를 «두 번» 거치게 했습니다.
 *  기본 손잡이는 「그만두기」쪽입니다 — 잘못 눌러 날리는 일이 없도록.
 */
function openReset(back) {
  $modal.classList.add("on");

  const t = vaultStats();
  const ids  = t[1][0] + t[2][0] + t[3][0];
  const adv  = Object.keys(S.advisorsOwned || {}).length;
  const gif  = Object.keys(S.giftsOwned || {}).length;
  const sup  = Object.keys(S.supportsOwned || {}).length;
  const ach  = Object.keys(S.achieved || {}).length;
  const done = mainChapters().filter(c => S.cleared && S.cleared[c.id]).length;

  const row = (a, b) => '<div class="slot"><div class="nm">' + a + '</div>' +
                        '<div class="sub">' + b + '</div></div>';

  const draw = (sure) => {
    let h = '<h2>보 관 함 비 우 기</h2>' +
            '<div class="hint" style="color:#c8403a">' +
              '<b>되돌릴 수 없습니다.</b> 아래 것이 모두 사라지고 맨 처음으로 돌아갑니다.</div>' +
            '<div class="grid">' +
              row("인격", ids + "종") +
              row("보조 교육위원", adv + "명") +
              row("지원 작성위원", sup + "명") +
              row("E.G.O 기프트", gif + "개") +
              row("업적", ach + "개") +
              row("클리어한 장", done + "/" + mainChapters().length + "장") +
              row(CURRENCY, S.money) +
              row("황금교본", S.codex + "권") +
            '</div>' +
            '<div class="hint">' +
              "읽던 자리도 함께 지워집니다. " +
              NEWBIE_RULE.name + "은 <b>다시 열립니다</b>." +
              (typeof VAULT_SEED !== "undefined" && VAULT_SEED
                ? "<br>data/vault.js 에 적어 둔 자리가 있어 <b>그 지점</b>으로 돌아갑니다."
                : "") +
            '</div>';

    if (!sure) {
      h += '<div class="hint">먼저 <b>내보내기</b>로 지금 것을 받아 두면 나중에 되돌릴 수 있습니다.</div>' +
           '<div class="modalfoot">' +
             '<button id="rcancel" class="primary">그만두기</button>' +
             '<button id="rexport">먼저 내보내기</button>' +
             '<button id="rnext" class="ghost">비우겠습니다</button></div>';
    } else {
      h += '<div class="hint" style="color:#c8403a">' +
             '<b>정말 비울까요?</b> 이 손잡이를 누르면 그대로 사라집니다.</div>' +
           '<div class="modalfoot">' +
             '<button id="rcancel" class="primary">아니오, 그만두겠습니다</button>' +
             '<button id="rdo" class="ghost">예, 비웁니다</button></div>';
    }
    $sheet.innerHTML = h;

    document.getElementById("rcancel").onclick = () => { closeModal(); if (back) back(); };
    const ex = document.getElementById("rexport");
    if (ex) ex.onclick = () => openRecord(() => openReset(back));
    const nx = document.getElementById("rnext");
    if (nx) nx.onclick = () => draw(true);
    const dv = document.getElementById("rdo");
    if (dv) dv.onclick = () => {
      clearVault();
      closeModal();
      render();
      title();
      say("보관함을 비웠다. 맨 처음으로 돌아간다.", "sys");
    };
  };
  draw(false);
}

/* ── 유리창 ────────────────────────────────────────────────────
 *  메인 화면. 장을 고르고, 작성위원을 편성하고, 보관함을 여는 곳.
 *  메카고질라 안에서 밖을 내다보는 자리다.
 */
/* 뒤에서 온 보관함을 열었을 때 — 여기서 멈춥니다.
 * 손잡이는 「다시 확인」 하나뿐입니다. 새 판으로 열면 그대로 이어집니다. */
function vaultLockScreen() {
  const n = VAULT_LOCK;
  clearLog();
  showCard(null);
  setBackdrop(false, null);
  say("보 관 함 이 잠 겼 습 니 다", "place");
  divider();
  say("이 보관함은 v" + n.from + " 에서 저장한 것입니다. " +
      "지금 돌아가는 것은 v" + n.to + " 입니다.", "bad");
  say("나중 판에서 만든 보관함에는 이 판이 모르는 것이 들어 있을 수 있습니다. " +
      "그대로 열어 두면 모르는 것을 지운 채 덮어쓰게 됩니다.", "n");
  divider();
  say("그래서 아무것도 쓰지 않고 멈췄습니다. 모아 두신 것은 그대로 있습니다.", "sys");
  say("v" + n.from + " 이상으로 열어 주십시오. " +
      "온라인 판을 쓰고 계시면 새로고침 한 번으로 최신 판이 됩니다.", "sys");
  divider();
  render();
  buttons([
    { label: "다시 확인", cls: "primary", fn: () => glass() },
    { label: "보관함 내보내기", fn: () => openRecord(() => glass()) }
  ]);
}

function glass() {
  VAULT_LOCK = null;       // 다시 읽으므로 판단도 다시 합니다
  S = newState();          // 보관함에서 다시 읽어 온다
  SCENES = [];
  if (vaultLocked()) return vaultLockScreen();
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

  /* 처음 오신 분께 — 어디를 눌러야 하는지 일러 둡니다.
   * 한 장이라도 마쳤으면 나오지 않습니다. 아는 사람에게는 잔소리이니. */
  if (!done && !sides) {
    divider();
    say("처음이시라면 —", "place");
    say("아래 [운전석] 을 누르고 «0장 왕지성» 을 고르면 이야기가 시작됩니다.", "good");
    say("[편성] 에서 누구를 데려갈지, [상점] 에서 새 인격을 뽑을 수 있습니다. " +
        "무엇을 눌러야 할지 모르겠으면 [운전석] 부터 누르십시오.", "sys");
  }
  /* 이번 판에 새로 들어온 것들을 한 번 알려 줍니다.
   * 유리창을 다 그린 뒤에 덮어씌우므로, 닫으면 바로 유리창이 보입니다. */
  if (noticeDue()) {
    render();
    buttons([{ label: "…", cls: "primary", disabled: true }]);
    return openNotice(() => { closeModal(); glass(); });
  }

  /* 받지 않은 우편이 있으면 눈에 띄게 알려 줍니다 */
  if (mailWaiting()) {
    divider();
    say(MAIL_RULE.name + "에 받지 않은 우편이 " + mailWaiting() + "통 있습니다.", "gain");
  }

  render();
  buttons([
    { label: "운전석", cls: "primary", fn: () => openChapterSelect(() => glass()) },
    { label: "편성",   fn: () => openParty(() => glass()) },
    { label: "상점",   fn: () => openShop(() => glass()) },
    { label: "노트",   fn: () => openNote(() => glass()) },
    { label: "업적",   fn: () => openAchieve(() => glass()) },
    /* 받지 않은 우편이 있으면 몇 통인지 손잡이에 적습니다 */
    { label: MAIL_RULE.name + (mailWaiting() ? " (" + mailWaiting() + ")" : ""),
      cls: mailWaiting() ? "" : "ghost", fn: () => openMail(() => glass()) },
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

/* ── wip 확장 자리 ────────────────────────────────────────────
 *  특정 장·전투만을 위해 엔진을 손봐야 할 때, 매번 여기 engine.js 를
 *  직접 고치는 대신 wip 꾸러미의 package.js 에 이렇게 적으면 이 줄
 *  바로 뒤에 새 함수로 옮겨 붙습니다 (tools/wip-merge.js 참고).
 *
 *      /* @wip into: engine.js · EXT *\/
 *      SCENE_EXT.무엇 = function(s) { ... say(s.text, "n"); return next(); };
 *      /* @wip end *\/
 *
 *  그러면 그 장의 데이터에 { t: "무엇", … } 라고 적어 새 장면 종류를 씁니다 —
 *  switch 문 자체를 늘리지 않고도(짜깁기라 wip 로는 못 합니다) 이야기 쪽에서
 *  새 t 를 부를 수 있는 이유입니다. SCENE_EXT 정의는 위 「play()」 바로 앞에 있습니다.
 *
 *  두루 쓰일 만한 것(강제 편성처럼)은 옮겨 붙이지 말고 위쪽 제자리에
 *  바로 넣으십시오 — 여기는 «그 장 하나만을 위한» 자리입니다.
 */
/* @wip anchor: EXT */

boot();   // 코드를 통과하면 유리창부터
