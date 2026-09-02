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
const VERSION = "1.11.0";
const VERSION_NAME = "작성위원 균형 조정";

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
  /* 중복으로 나왔을 때 돌려주는 값 — 성급마다 다릅니다.
   * 여기 적은 값이 그대로 나갑니다 (아래 moneyGain 을 타지 않습니다).
   * 교육위원·E.G.O 기프트는 원고료로, 인격은 그 인격의 주인(작성위원) 파편으로
   * 이 표를 그대로 씁니다 — dupRefund() · addFrag() 참고. */
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
  stockMulti:  5,       // 기프트·교육위원 배정에서 묶음으로 뽑는 개수 (확정 없이 그냥 5개)
  fragExchange: 400,    // 인격 교환(정가)에 드는 그 사람 몫 파편 개수 — 뽑기와 달리 무엇을 얻을지 고른다
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
  gachaFxMs:   900,    // 배정에서 ★★★ 이 나왔을 때 빛이 터지는 시간(ms).
                       // 그 뒤로는 누를 때까지 머뭅니다. 0 이면 연출을 아예 안 합니다
  /* 보스 등장 연출(startBossCine) — 맨 처음 만날 때만 자동으로 흐릅니다.
   * cineBlackoutMs   암전으로 머무는 시간
   * cineVoiceMaxMs   등장 음성이 안 들리거나(막힌 자동재생) 아주 길 때를 대비한 최대 대기 —
   *                  음성이 먼저 끝나면(ended) 그쪽을 따릅니다.
   * cineNoVoiceMs    애초에 등장 음성이 없는 보스(데이비드 피터스처럼)가 머무는 시간.
   *                  기다릴 소리가 없는데 cineVoiceMaxMs 를 그대로 쓰면, 등장 대사 한 줄을
   *                  띄워 놓고 손잡이가 잠긴 채 15초를 서 있게 됩니다. */
  cineBlackoutMs: 1000,
  cineVoiceMaxMs: 15000,
  cineNoVoiceMs:  2200
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
  costExtreme: 2,                 // 익스트림 거울 던전 1회 입장에 드는 양
  costRail:    3                  // 거울굴절철도 1회 입장에 드는 양
};

/* ── 엔케팔린 캡슐 ─────────────────────────────────────────────
 *  보관함에 개수로 쌓아 두는 소모품입니다. 한 개 쓰면 엔케팔린이
 *  상한(ENK_RULE.max)까지 «한 번에» 찹니다.
 *
 *  가득 찬 채로 쓰면 한 개도 늘지 않고 캡슐만 사라지므로,
 *  가득일 때는 아예 쓰지 못하게 막습니다 — 우편(mailWasted)과 같은 결입니다.
 */
const ENK_CAPSULE = {
  name: "엔케팔린 캡슐",
  desc: "쓰면 " + ENK_RULE.name + "이 상한(" + ENK_RULE.max + "개)까지 한 번에 찹니다. " +
        "이미 가득 차 있으면 쓸 수 없습니다."
};

/* ── 판이 올라갔을 때 ──────────────────────────────────────────
 *  보관함에는 저장할 때의 판 번호가 함께 찍힙니다.
 *  옛 판에서 만든 보관함을 열면, 모아 둔 원고료가 절반만 넘어옵니다.
 *  (인격·교육위원·기프트·황금교본·클리어 기록은 그대로입니다)
 *
 *    compare: "minor"  0.13.x → 0.14.0 처럼 가운뎃자리가 달라질 때만
 *             "patch"  0.13.1 → 0.13.2 처럼 뒷자리만 달라져도
 *             "major"  앞자리가 달라질 때만
 *
 *  compare 가 "major" 일 때는 인격 파편도 절반(버림)으로 줄어듭니다 — newState() 참고.
 *  다른 값으로 바꾸면 파편은 그대로 두고 원고료만 깎입니다.
 */
const VERSION_RULE = {
  on:        true,
  compare:   "major",
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
const $foehp   = document.getElementById("foehp");

/* ── 상태 ─────────────────────────────────────────────────── */
let S = null;
let SCENES = [];       // 평탄화된 현재 장의 장면들
let MIRROR = null;      // 거울 던전을 돌 때만 채워지는 임시 장

const STARTING_PARTY = ["kim_duhyeon", "lee_hanbeom", "kim_taeseong"];

/* ── 저장소 ────────────────────────────────────────────────────
 *  보통은 브라우저 localStorage 를 씁니다.
 *  파일을 특이한 방식으로 열어 저장소가 막힌 경우(미리보기 창 등)에는
 *  메모리에만 담아 두어, 창을 닫기 전까지는 정상 동작하게 합니다.
 *
 *  ■ 쓰기가 «도중에» 막히는 경우 — 이것 때문에 한 번 고쳤습니다
 *    예전에는 ok 를 파일 읽을 때 딱 한 번만 재 보고 그 뒤로는 믿었습니다.
 *    그런데 사파리는 처음엔 되다가 도중에 막히는 일이 있습니다(용량이 차거나,
 *    저장 권한이 도로 걷히거나). 그러면 set 은 catch 로 빠져 mem 에 담는데
 *    get 은 ok 가 참이니 여전히 localStorage 만 보고 «옛 값» 을 돌려주었습니다.
 *    「기록했다」고 적혀 놓고 새로고침하면 옛것이 나오던 것이 이것입니다.
 *
 *    이제 한 번이라도 막히면 ok 를 거짓으로 내려 mem 으로 옮겨 갑니다.
 *    set 은 언제나 mem 에도 함께 남겨 두므로, 어느 쪽으로 넘어가든
 *    바로 앞에 쓴 값을 읽을 수 있습니다.
 */
const Store = {
  ok: (function () {
    try { localStorage.setItem("__probe", "1"); localStorage.removeItem("__probe"); return true; }
    catch (e) { return false; }
  })(),
  mem: {},
  get(k) {
    if (this.ok) {
      try { const v = localStorage.getItem(k); if (v !== null) return v; }
      catch (e) { this.ok = false; }
    }
    return this.mem[k] || null;
  },
  set(k, v) {
    this.mem[k] = v;                    // 손안에도 언제나 남겨 둔다
    if (this.ok) { try { localStorage.setItem(k, v); } catch (e) { this.ok = false; } }
  },
  del(k) {
    if (this.ok) { try { localStorage.removeItem(k); } catch (e) { this.ok = false; } }
    delete this.mem[k];
  }
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
    /* 완주한 거울 갈래 — 원고료는 갈래마다 «처음 완주할 때만» 나오므로,
     * 어느 갈래를 이미 돌았는지 남겨 두어야 합니다. */
    mirrorDone: Object.keys(S.mirrorDone || {}),
    /* 이야기에서 인격을 받은 자리 — 중복 파편은 자리마다 «처음 한 번만» 나오므로,
     * 어느 자리를 이미 거쳤는지 남겨 두어야 합니다. 열쇠는 그 인격의 열쇠입니다. */
    storyGain: Object.keys(S.storyGain || {}),
    equip:    S.equip,
    party:    ownParty(),          /* 조력자는 «내 것» 이 아니라 담지 않습니다 */
    money:    S.money,
    codex:    S.codex,
    /* 인격 파편 — 뽑기에서 중복이 나오면 원고료 대신 그 인격의 주인 이름이 붙은
     * 파편을 받는다. { who: 개수 }. 쓰임은 차차 늘어날 자리다. */
    frags:    S.frags || {},
    /* 동기화 — 작성위원마다 파편을 태워 올리는 단계. { who: 단계 }. 0단계(안 적힘)는
     * 담지 않는다 — vaultValueText 가 어차피 null·undefined 를 걸러 낸다. */
    sync:     S.sync || {},
    /* 인격 파편 상자 — 보관함에서 바로 쓰는 소모품. { select: 개수, random: 개수 } */
    fragBox:  S.fragBox || { select: 0, random: 0 },
    /* 엔케팔린 캡슐 — 보관함에서 바로 쓰는 소모품. 개수 하나만 남깁니다. */
    enkCap:   enkCapCount(),
    /* 이벤트 재화 — 남은 개수와 «어느 기간 것인가»(eventId)를 함께 적습니다.
     * 다음에 열 때 eventId 가 지금 기간과 다르면, 새 이야기가 나온 것으로 보고
     * 0으로 지웁니다. eventBuy(교환소에서 몇 개 바꿨는가)도 함께 비워 한도가 다시 찹니다. */
    event:    S.event || 0,
    eventId:  S.eventId || null,
    eventBuy: S.eventBuy || {},
    newbie:   S.newbie || 0,   // 신입 관리자 기념 배정을 몇 번 썼는가
    enk:      S.enk || null,
    /* 이미 받은 우편. 이것을 빠뜨리면 받은 표시가 안 남아 무한정 다시 받힙니다. */
    mailTaken: Object.keys(S.mailTaken || {}),
    /* 거울굴절철도(등) 체크포인트 이어하기 — 완주하면 지워지는 임시 데이터입니다.
     * 편성은 담지 않습니다(resumeMirror 참고). vaultSig() 에는 일부러 안 넣습니다 —
     * 손댐 검사가 아니라 그냥 진행 상황이라서요. */
    railSave: S.railSave || null,
    /* 거울굴절철도 결과 카드 — 최근 세 판까지. 손댐 검사(vaultSig)에는 일부러
     * 안 넣습니다 — 업적처럼 지키려는 값이 아니라 그냥 지난 기록이라서요. */
    mirrorRecords: S.mirrorRecords || [],
    /* 본편 편성 자리(case "party")에서 남기는 이어하기 — 위 railSave와 같은
     * 논리이되 서로 겹치지 않는 별도 자리입니다. 장을 새로 시작하거나
     * 마치면 지워지는 임시 데이터입니다(startChapter/chapterEnd 참고). */
    storySave: S.storySave || null,
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
    mirrorDone: toMap(v.mirrorDone),
    /* 옛 보관함에는 이 칸이 아예 없습니다 — newState 가 클리어한 장에서 되짚어 보탭니다 */
    storyGain: toMap(v.storyGain),
    equip:    v.equip || {},
    party:    v.party || null,
    money:    v.money,
    codex:    v.codex,
    frags:    v.frags || {},
    sync:     v.sync || {},
    fragBox:  v.fragBox || { select: 0, random: 0 },
    enkCap:   (+v.enkCap) || 0,
    event:    (+v.event) || 0,
    eventId:  v.eventId || null,
    eventBuy: v.eventBuy || {},
    newbie:   typeof v.newbie === "number" ? v.newbie : 0,
    enk:      v.enk || null,
    railSave: v.railSave || null,
    storySave: v.storySave || null,
    mirrorRecords: v.mirrorRecords || [],
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
  /* frags · sync 는 배열이 아니라 { who: 값 } 표입니다 — 키로 정렬해 문자열로 폅니다. */
  const jm = m => Object.keys(m || {}).sort().map(k => k + ":" + m[k]).join(",");
  return codeHash([
    j(o.ids), j(o.advisors), j(o.gifts), j(o.supports),
    j(o.achieved), j(o.cleared),
    /* 한 번만 받는 것들. 여기 들지 않으면 손으로 지워 놓고 다시 받아도 티가 안 납니다.
     * mirrorDone 도 같은 결입니다 — 거울 원고료가 처음 완주할 때만 나오므로. */
    j(o.mailTaken), o.newbie, j(o.mirrorDone),
    /* 이야기 인격 지급 자리도 같은 결입니다 — 중복 파편이 자리마다 한 번뿐이므로 */
    j(o.storyGain),
    o.money, o.codex, jm(o.frags), jm(o.sync), jm(o.fragBox), (o.enkCap || 0),
    /* 이벤트 재화 — 남은 개수, 어느 기간 것인가, 교환소에서 몇 개 바꿨는가 */
    (o.event || 0), (o.eventId || ""), jm(o.eventBuy),
    o.ver
  ].join("|"));
}
/* storyGain 이 생기기 «전» 의 셈법입니다. 그때 나간 보관함에는 그 칸이
 * 아예 없으므로, 이것을 남겨 두지 않으면 판을 올렸다는 이유만으로 손댐으로 뜹니다. */
function vaultSigOld5(o) {
  if (!o) return "";
  const j = a => (a || []).slice().sort().join(",");
  const jm = m => Object.keys(m || {}).sort().map(k => k + ":" + m[k]).join(",");
  return codeHash([
    j(o.ids), j(o.advisors), j(o.gifts), j(o.supports),
    j(o.achieved), j(o.cleared),
    j(o.mailTaken), o.newbie, j(o.mirrorDone),
    o.money, o.codex, jm(o.frags), jm(o.sync), jm(o.fragBox), (o.enkCap || 0),
    (o.event || 0), (o.eventId || ""), jm(o.eventBuy),
    o.ver
  ].join("|"));
}
/* 이벤트 재화가 생기기 «전» 의 셈법입니다. 그때 나간 보관함에는 event 칸이
 * 아예 없으므로, 이것을 남겨 두지 않으면 판을 올렸다는 이유만으로 손댐으로 뜹니다. */
function vaultSigOld4(o) {
  if (!o) return "";
  const j = a => (a || []).slice().sort().join(",");
  const jm = m => Object.keys(m || {}).sort().map(k => k + ":" + m[k]).join(",");
  return codeHash([
    j(o.ids), j(o.advisors), j(o.gifts), j(o.supports),
    j(o.achieved), j(o.cleared),
    j(o.mailTaken), o.newbie,
    o.money, o.codex, jm(o.frags), jm(o.sync), jm(o.fragBox), (o.enkCap || 0), o.ver
  ].join("|"));
}
/* 엔케팔린 캡슐이 생기기 «전» 의 셈법입니다. 그때 나간 보관함에는 enkCap 칸이
 * 아예 없으므로, 이것을 남겨 두지 않으면 판을 올렸다는 이유만으로 손댐으로 뜹니다. */
function vaultSigOld3(o) {
  if (!o) return "";
  const j = a => (a || []).slice().sort().join(",");
  const jm = m => Object.keys(m || {}).sort().map(k => k + ":" + m[k]).join(",");
  return codeHash([
    j(o.ids), j(o.advisors), j(o.gifts), j(o.supports),
    j(o.achieved), j(o.cleared),
    j(o.mailTaken), o.newbie,
    o.money, o.codex, jm(o.frags), jm(o.sync), jm(o.fragBox), o.ver
  ].join("|"));
}
/* v1.0.13 까지 쓰던 셈법입니다 (frags·sync 가 생기기 전 것). 그때 나간
 * 보관함이 «판을 올렸다» 는 이유만으로 손댐으로 뜨면 안 되므로 남겨 둡니다.
 * frags 는 sync 와 같은 판(아직 안 나간 패치) 안에서 생겼으므로 따로 얼려 두지 않습니다 —
 * frags 만 있고 sync 는 없는 보관함이 실제로 나간 적이 없습니다. */
function vaultSigOld2(o) {
  if (!o) return "";
  const j = a => (a || []).slice().sort().join(",");
  return codeHash([
    j(o.ids), j(o.advisors), j(o.gifts), j(o.supports),
    j(o.achieved), j(o.cleared),
    j(o.mailTaken), o.newbie,
    o.money, o.codex, o.ver
  ].join("|"));
}
/* v1.0.11 까지 쓰던 셈법입니다. 그때 나간 보관함이 «판을 올렸다» 는 이유만으로
 * 손댐으로 뜨면 안 되므로 남겨 둡니다. */
function vaultSigOld(o) {
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
  return o.sig !== vaultSig(o) && o.sig !== vaultSigOld5(o) && o.sig !== vaultSigOld4(o) &&
         o.sig !== vaultSigOld3(o) && o.sig !== vaultSigOld2(o) && o.sig !== vaultSigOld(o);
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
    " *    보관함에 남는 것 «전부» 입니다 — 인격 · 인격 파편 · 동기화 · 교육위원 · 기프트 · 지원 작성위원 ·\n" +
    " *    업적 · 클리어한 장 · 편성 3칸 · 받은 우편 · 원고료 · 황금교본 · 엔케팔린 · 엔케팔린 캡슐.\n" +
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

/* ── 한 번만 받는 것은 되돌리기로 도로 열리지 않습니다 ────────
 *
 *  받기 «전» 에 내보내 둔 파일을 받은 «뒤» 에 도로 읽으면, 그 파일에는 아직
 *  안 받은 것으로 적혀 있으니 우편이 다시 열립니다. 원고료까지 그때로 돌아가니
 *  보통은 남는 것이 없지만, 파일을 손으로 고쳐 원고료만 지금 것으로 두면
 *  같은 우편을 몇 번이고 받을 수 있습니다.
 *
 *  그래서 «이미 받았다» 는 표시만은 덮어쓰지 않고 «합칩니다».
 *  받은 적 없는 것을 받은 것으로 만들지는 않으니, 기기를 옮기는 분은 손해가 없습니다.
 *  신입 관리자 기념 배정은 쓴 횟수라, 둘 중 많은 쪽을 남깁니다.
 */
function vaultMergeOnce(seed) {
  let now = null;
  try { now = JSON.parse(Store.get(VAULT_KEY)); } catch (e) { now = null; }
  if (!now) return seed;

  const union = (a, b) => {
    const m = {};
    (a || []).forEach(k => m[k] = true);
    (b || []).forEach(k => m[k] = true);
    return Object.keys(m);
  };
  seed.mailTaken = union(seed.mailTaken, now.mailTaken);
  seed.achieved  = union(seed.achieved,  now.achieved);
  /* 이야기 인격 지급 자리도 한 번만 받는 것입니다 — 옛 파일을 들여와도 되살아나지 않게 */
  seed.storyGain = union(seed.storyGain, now.storyGain);
  seed.newbie    = Math.max(Number(seed.newbie) || 0, Number(now.newbie) || 0);
  return seed;
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
                 "지금 것은 되돌릴 수 없습니다 — 계속하기 전에 걱정되면 먼저 [내보내기] 로 받아 두십시오.\n\n" +
                 "이미 받으신 우편과 이미 달성한 업적은 지워지지 않고 그대로 남습니다.\n\n계속할까요?")) return;

    /* 들어온 파일이 «이미» 어긋나 있었는가. 합치기 전에 봐 두어야 합니다. */
    const 어긋남 = vaultTouched(seed);
    /* 한 번만 받는 것은 합칩니다 — 되돌리기로 다시 받히지 않도록 */
    const merged = vaultMergeOnce(seed);
    /* 합치면서 내용이 달라졌으니 요약값도 다시 찍습니다. 그냥 두면 «손댐» 으로 뜨는데,
     * 손댄 것은 이용자가 아니라 이 코드니까요.
     * 다만 들어올 때 «이미» 어긋나 있던 파일은 그대로 둡니다 —
     * 여기서 새로 찍어 주면 손댄 자국을 이쪽이 지워 주는 꼴이 됩니다. */
    if (!어긋남) merged.sig = vaultSig(merged);

    Store.set(VAULT_KEY, JSON.stringify(merged));
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

/* ── 이야기에서 인격을 받은 자리 되짚기 ────────────────────────
 *
 *  storyGain 이 없던 판에서 넘어온 보관함을 위한 몫입니다.
 *  이미 마친 장이라면 그 장의 인격 지급 자리도 당연히 거친 것이므로,
 *  장을 훑어 { t:"gain" } 자리를 찾아 «받은 것» 으로 적어 둡니다.
 *  이것을 안 하면, 마친 장을 한 번씩 더 돌며 파편을 한 번 더 받을 수 있습니다.
 */
function storyGainFromCleared(cleared) {
  const m = {};
  if (typeof CHAPTERS === "undefined" || !cleared) return m;
  CHAPTERS.forEach(c => {
    if (!cleared[c.id]) return;
    (c.scenes || []).forEach(sc => {
      if (!sc || sc.t !== "gain") return;
      const g = sc.starter ? (typeof STARTER_ID !== "undefined" ? STARTER_ID : null) : sc;
      if (!g || !SINNERS[g.who]) return;
      const id = SINNERS[g.who].ids.find(i => i.star === g.star && i.title === g.title);
      if (id) m[idKey(g.who, id)] = true;
    });
  });
  return m;
}

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

  /* 인격 파편 · 동기화 — who 는 SINNERS 의 고정 키라(제목과 달리 안 바뀝니다)
   * 옮겨 담을 것 없이 지금 있는 사람 것만 골라 받습니다. */
  const frags = {};
  if (v && v.frags) for (const who in v.frags) if (SINNERS[who]) frags[who] = v.frags[who];
  const sync = {};
  if (v && v.sync) for (const who in v.sync) if (SINNERS[who]) sync[who] = v.sync[who];
  const fragBox = {
    select: (v && v.fragBox && +v.fragBox.select) || 0,
    random: (v && v.fragBox && +v.fragBox.random) || 0
  };

  /* 받은 우편 — 기간이 지난 것은 저장소에서도 지운다. mailLive() 가 이미 시간으로
   * 화면을 가리므로 «막으려는» 목적은 아니고, 다 지난 열쇠를 언제까지고 안고 갈
   * 까닭이 없어서다. 우편 정의 자체가 사라졌으면(먼 훗날 data/mail.js 에서 뺀 경우)
   * 기간을 잴 수 없으니 손대지 않는다 — 못 알아보는 열쇠를 버리지 않는 것과 같은 결이다. */
  const mailTaken = {};
  if (v && v.mailTaken) for (const id in v.mailTaken) {
    const m = mailList().find(x => x.id === id);
    if (m && !mailLive(m)) continue;
    mailTaken[id] = true;
  }

  /* 이벤트 재화 — 보관함에 «어느 기간 것인가»(eventId)가 함께 적혀 있습니다.
   * 그것이 지금 기간과 다르면 새 이야기가 나온 것이므로, 남은 개수를 0으로 지우고
   * 교환소에서 몇 개를 바꿨는지도 함께 비웁니다 (한도가 다시 찹니다).
   * 지운 사실은 eventNote 에 담아, 유리창에서 한 번 알립니다. */
  const evId  = curEventId();
  let event    = (v && +v.event) || 0;
  let eventBuy = (v && v.eventBuy) || {};
  let eventNote = null;
  if (evId && (!v || v.eventId !== evId)) {
    /* 보관함이 아예 없는 분(처음 오신 분)께는 알리지 않습니다 — 지울 것이 없습니다 */
    if (v) eventNote = { cur: eventCurName(), before: event };
    event = 0;
    eventBuy = {};
  }

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

    /* compare 가 "major" 일 때만 — 인격 파편도 절반(버림)으로 줄인다.
     * frags 는 바로 위에서 이미 채워 둔 것을 여기서 고쳐 쓴다. */
    if (VERSION_RULE.compare === "major") {
      let fBefore = 0, fAfter = 0;
      for (const who in frags) {
        fBefore += frags[who];
        frags[who] = Math.floor(frags[who] / 2);
        fAfter += frags[who];
      }
      if (fBefore > 0) verNote.frags = { before: fBefore, after: fAfter };

      /* 인격 파편 상자도 같은 자리에서 절반(버림)으로 줄인다 — 사용자 지침 */
      const bxBefore = fragBox.select + fragBox.random;
      fragBox.select = Math.floor(fragBox.select / 2);
      fragBox.random = Math.floor(fragBox.random / 2);
      const bxAfter = fragBox.select + fragBox.random;
      if (bxBefore > 0) verNote.fragBox = { before: bxBefore, after: bxAfter };
    }
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
    frags,
    sync,
    fragBox,
    enkCap: (v && +v.enkCap) || 0,   // 엔케팔린 캡슐 — 보관함에 남는 소모품
    /* 이벤트 재화 — 이름은 기간마다 갈리고(eventCurName), 개수는 이 한 칸입니다 */
    event,
    eventId: evId,
    eventBuy,
    eventNote,              // 기간이 갈려 0으로 지웠을 때 한 번 알릴 내용
    mailTaken,
    hp: {},                 // who -> 현재 체력 (없으면 최대)
    money,
    verNote,                // 판이 올라갔을 때 한 번 알려 줄 내용
    codex: v && typeof v.codex === "number" ? v.codex : 0,   // 황금교본 — 보관함에 남는다
    newbie: v && typeof v.newbie === "number" ? v.newbie : 0, // 신입 관리자 기념 배정을 쓴 횟수
    enk: (v && v.enk && typeof v.enk.n === "number") ? v.enk : null,  // 엔케팔린 — enkSync() 가 채운다
    cleared: v && v.cleared ? v.cleared : {},
    mirrorDone: (v && v.mirrorDone) ? v.mirrorDone : {},   // 이미 완주한 거울 갈래
    /* 이야기에서 인격을 이미 받은 자리. 적힌 것에 «이미 마친 장» 몫을 보탭니다 —
     * 옛 보관함에는 이 칸 자체가 없고, 장을 마쳤다면 그 자리는 이미 거친 것이니까요. */
    storyGain: Object.assign(storyGainFromCleared((v && v.cleared) || {}),
                             (v && v.storyGain) || {}),
    flags: {},
    battle: null,
    waiting: false,
    ended: false,
    mirror: false,
    mirrorHard: false,
    mirrorTier: null,
    /* 거울굴절철도 체크포인트 이어하기 — 완주하면 지워지는 임시 데이터.
     * { key, picked, checkpoint } (순환 없는 갈래) 또는
     * { key, rail2:{bosses,done,picks}, checkpoint } (2호선류). */
    railSave: (v && v.railSave) || null,
    /* 본편 편성 자리(case "party") 이어하기 — 위 railSave와 같은 논리이되
     * 겹치지 않는 별도 자리. { chId, sc, party, equip, hp, flags,
     * partyStack, partyBan, battleForced }. */
    storySave: (v && v.storySave) || null,
    mirrorRecords: (v && v.mirrorRecords) || [],   // 거울굴절철도 결과 카드 — 최근 세 판
    partyStack: [],          // 강제 편성 — forcePartyPush/Pop 이 씁니다
    partyBan: [],            // 지금은 편성할 수 없는 사람 — banParty/unbanParty 가 씁니다
    battleForced: false,
    /* 「이번 갈래」 — 광신(처치 수)·보복(아군 사망 수, 작성위원별) 이 쌓이는 자리.
     * 거울 던전 들어갈 때(startMirror) 0으로 리셋됩니다. 본편 연전에도 쌓이게
     * 정했지만, 본편 쪽은 아직 "갈래가 여기서 끊긴다"는 지점이 정해져 있지
     * 않아 — 지금은 거울 던전 진입 때 말고는 리셋하지 않습니다. */
    arc: { kills: 0, retribution: {} }
  };
}

/* ── 패치 노트 ────────────────────────────────────────────────
 *  내용은 data/patch.js 의 PATCH_NOTES 에 적습니다.
 *  「다음부터 표시하지 않음」을 누르면 그 판에 한해 유리창의 손잡이가 사라지고,
 *  판이 새로 올라가면 다시 나타납니다.
 */
const PATCH_SEEN_KEY = "rash_company_patch_seen";
/* 판이 쌓일수록 목록이 계속 길어지므로, 최근 것만 바로 보여 주고
 * 그보다 오래된 것은 <details> 로 접어 기본값을 «숨김»으로 둡니다.
 * 새로 나온 판(patchIsNew)은 이 수보다 적어도 항상 다 보입니다. */
const PATCH_RECENT = 6;

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

/* 패치 항목 하나를 그린다 — 최근 목록과 <details> 안의 옛 목록이 함께 씁니다. */
function patchEntryHtml(p, i, 새것) {
  return '<div class="patch' + (i === 0 ? ' now' : '') + (새것 ? '' : ' folded') +
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
}

function openPatch(back) {
  $modal.classList.add("on");
  const list = patchList();
  const news = list.filter(patchIsNew);
  /* 최근 것(새로 나온 판 포함)은 바로 보여 주고, 그보다 오래된 것은
   * <details> 뒤로 접어 기본으로 숨겨 둡니다 — 목록이 길어질수록 여기서 갈립니다. */
  const cut  = Math.max(PATCH_RECENT, news.length);
  const recent = list.slice(0, cut);
  const older  = list.slice(cut);

  let h = '<button id="pttopclose" class="modaltopclose" title="닫기">×</button>' +
          '<h2>패 치 노 트</h2>' +
          '<div class="hint">지금 판은 <b>v' + VERSION + ' «' + VERSION_NAME + '»</b> 입니다.' +
          (LAST_VER
            ? (news.length
                ? '　지난번에 보신 <b>v' + LAST_VER + '</b> 뒤로 <b style="color:#d8b26a">' +
                  news.length + '개</b>가 새로 나왔습니다. 그것만 펼쳐 두었습니다.'
                : '　지난번 <b>v' + LAST_VER + '</b> 뒤로 새로 나온 것은 없습니다.')
            : '　머리를 누르면 접었다 펼 수 있습니다.') +
          '</div>';

  if (!list.length) h += '<div class="hint">아직 적어 둔 것이 없습니다.</div>';
  recent.forEach((p, i) => { h += patchEntryHtml(p, i, patchIsNew(p, i)); });
  if (older.length) {
    h += '<details class="patchold"><summary>지난 판 더 보기 (' + older.length + '개)</summary>';
    older.forEach((p, i0) => {
      const i = cut + i0;
      h += patchEntryHtml(p, i, patchIsNew(p, i));
    });
    h += '</details>';
  }

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

  const doClose = () => { closeModal(); if (back) back(); };
  document.getElementById("ptclose").onclick = doClose;
  document.getElementById("pttopclose").onclick = doClose;
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
  if (n.frags)
    say("인격 파편도 절반으로 줄었습니다 — " + n.frags.before + " → " + n.frags.after, "bad");
  if (n.fragBox)
    say("인격 파편 상자도 절반으로 줄었습니다 — " + n.fragBox.before + " → " + n.fragBox.after, "bad");
  divider();
}

/* 새 이야기가 나와 이벤트 재화가 갈렸을 때 — 유리창에서 한 번만 알립니다.
 * versionNotice() 와 같은 방식으로, 알리고 나면 지우고 곧바로 보관함에 적습니다. */
function eventNotice() {
  if (!S || !S.eventNote) return;
  const n = S.eventNote;
  S.eventNote = null;
  saveVault();
  divider();
  say('새로운 이벤트 재화가 출시되었습니다 "' + n.cur + '"! 기존 재화는 0으로 초기화됩니다.', "gain");
  divider();
}


/* ── 저장이 미덥잖은 환경 알림 ─────────────────────────────────
 *  유리창에서 알립니다. 두 가지를 갈라서 봅니다.
 *
 *   1) 저장소가 아예 막힌 경우 (Store.ok 가 거짓)
 *      사파리로 파일을 곧장(file://) 열면 이렇게 됩니다 — 주요 브라우저 가운데
 *      사파리만 file:// 에서 저장을 막습니다. 창을 닫으면 다 사라집니다.
 *
 *   2) 저장은 되는데 브라우저가 지워 버리는 경우
 *      사파리(맥·아이폰)는 «7일» 동안 안 들르면 저장해 둔 것을 통째로 지웁니다.
 *      이때 Store.ok 는 참이라 1) 로는 잡히지 않습니다 — 「저장이 잘 안된다」던
 *      제보가 이것입니다. 게임 쪽에서 막을 길이 없으니, 미리 일러 두고
 *      내보내기를 권하는 것이 지금 할 수 있는 전부입니다.
 *
 *  2) 는 판마다 한 번만 알립니다. 그런데 정작 지워지고 나면 «봤다» 는 표시도
 *  함께 지워져 다시 뜹니다 — 알려야 할 사람에게 다시 뜨는 것이니 그대로 둡니다.
 */
const STORAGE_SEEN_KEY = "rash_company_storage_seen";

/* 사파리 계열인가. 크롬·엣지도 UA 에 Safari 를 달고 다니므로 걸러 냅니다.
 * 아이폰·아이패드는 어느 브라우저를 쓰든 속이 웹킷이라 함께 걸립니다. */
function isWebKit() {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/.test(ua) ||
         (/Safari/.test(ua) && !/Chrom(e|ium)|Edg\/|OPR\/|Android/.test(ua));
}

function storageNotice() {
  if (!Store.ok) {
    divider();
    say("이 환경은 브라우저 저장이 막혀 있습니다.", "place");
    say("창을 닫으면 지금까지 한 것이 모두 사라집니다. " +
        "파일을 곧장 열지 마시고 http 로 시작하는 주소로 들어오시거나, " +
        "[보관함 내보내기] 로 vault.js 를 받아 두십시오.", "bad");
    divider();
    return;
  }
  if (!isWebKit() || Store.get(STORAGE_SEEN_KEY) === VERSION) return;
  Store.set(STORAGE_SEEN_KEY, VERSION);
  divider();
  say("사파리로 열고 계십니다 — 한 가지만 일러 둡니다.", "place");
  say("사파리는 7일 넘게 이쪽에 들르지 않으면 저장해 둔 것을 통째로 지웁니다. " +
      "게임이 잘못된 것이 아니라 브라우저가 하는 일이라, 이쪽에서 막을 수가 없습니다.", "sys");
  say("오래 쉬실 것 같으면 [보관함 내보내기] 로 vault.js 를 받아 두십시오. " +
      "홈 화면(맥이라면 독)에 추가해 두고 그쪽으로 여시면 지워지지 않습니다.", "good");
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

  /* 기프트가 자원을 그냥 더해 주는 경우 — 교육위원과 무관합니다.
   * manageMax 를 함께 올리지 않으면 beginTurn() 의 첫 턴 클램프에서
   * 늘려 준 시작 관리력이 그대로 깎여 나갑니다(교육위원 manage/manageMax 짝과 같은 사정). */
  gifts.forEach(g => {
    if (!g.effect) return;
    if (g.effect.manage)    out.manage    += g.effect.manage;
    if (g.effect.manageMax) out.manageMax += g.effect.manageMax;
  });
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
/* 화면에 적을 때, 숫자만 — 「★ 3　★★ 15　★★★ 50」 */
function dupAmountText() {
  const t = RULE.dupRefund;
  if (typeof t === "number") return String(t);
  return [1, 2, 3].filter(s => t[s] != null)
                  .map(s => stars(s) + " " + t[s]).join("　");
}
/* 화면에 적을 때 — 「★ 3　★★ 15　★★★ 50 환급」.
 * 교육위원·기프트 중복은 지금도 원고료로 돌려주므로 그 자리에서 씁니다. */
function dupRefundText() { return dupAmountText() + " 환급"; }

/* ── 인격 파편 ─────────────────────────────────────────────────
 *  뽑기에서 이미 가진 인격이 또 나오면, 원고료 대신 그 인격의 주인(작성위원)
 *  이름이 붙은 파편을 받는다. 12명 각자의 파편이라 따로 센다.
 *  개수는 dupRefund() 와 같은 표를 그대로 쓴다 — 이전에 원고료로 나가던 값 그대로다.
 *  쓰임은 아직 없다. 나중에 무엇과 바꿀지는 차차 정한다. */
function fragName(who) { return SINNERS[who].name + " 파편"; }
function fragCount(who) { return (S.frags && S.frags[who]) || 0; }
function addFrag(who, n) {
  if (!n) return;
  if (!S.frags) S.frags = {};
  S.frags[who] = (S.frags[who] || 0) + n;
}

/* ── 인격 파편 상자 ────────────────────────────────────────────
 *  보관함에서 바로 쓰는 소모품. 열면 인격 파편이 나온다.
 *    select  — 쓸 개수를 고른 뒤, «누구» 몫으로 받을지도 고른다. 그 한 명에게 몰아 준다.
 *    random  — 쓸 개수만 고르면, 12명에게 임의로 흩어 나눠 준다.
 *  둘 다 실제로는 «쓴 개수의 2배» 만큼 파편이 나오는 고정값이다.
 *  화면에는 "1개당 1~3개" 라고만 적어 정확한 배율을 감춘다 — 사용자 지침.
 *  무작위는 낱개(1개)씩 임의의 사람에게 얹는 방식으로 나누므로, 몫은 늘 자연수이고
 *  합은 언제나 (쓴 개수 × 2) 와 정확히 같다. */
const FRAGBOX_RULE = {
  mult: 2,
  desc: "상자 1개당 1~3개의 파편이 들어있습니다.",
  /* 보관함에서 desc 바로 아랫줄에 붙습니다 — 파편을 어디에 쓰는지 일러 두는 자리.
   * 숫자 둘은 SYNC_UNLOCK_CH(동기화가 열리는 장)와 PRICES.fragExchange 를 따라갑니다. */
  desc2: "3장 이후부터 동기화에 사용할 수 있습니다. " +
         "400개의 파편을 모으면 원하는 인격과 교환할 수 있습니다."
};
const FRAGBOX_KINDS = [
  { key: "select", name: "인격 파편 상자 (선택)" },
  { key: "random", name: "인격 파편 상자 (무작위)" }
];
function fragBoxCount(kind) { return (S.fragBox && S.fragBox[kind]) || 0; }
function addFragBox(kind, n) {
  if (!n) return;
  if (!S.fragBox) S.fragBox = { select: 0, random: 0 };
  S.fragBox[kind] = (S.fragBox[kind] || 0) + n;
}

/* ── 엔케팔린 캡슐 ────────────────────────────────────────────
 *  개수는 S.enkCap 하나로 셉니다. 보관함에 그대로 담겨, 회차를 새로
 *  시작해도 남습니다 (vaultBody · loadVault · newState 참고). */
function enkCapCount() { return (S && +S.enkCap) || 0; }
function addEnkCap(n) {
  if (!n) return;
  S.enkCap = enkCapCount() + n;
}
/* 지금 쓸 수 있는가 — 가지고 있고, 엔케팔린이 «가득 차 있지 않을» 때만입니다.
 * 가득일 때 쓰면 한 개도 안 늘고 캡슐만 사라지므로 여기서 막습니다. */
function enkCapUsable() { return enkCapCount() > 0 && enkCount() < ENK_RULE.max; }
/* 한 개 씁니다. 그래서 «몇 개나 찼는지» 를 돌려줍니다. 못 쓰면 0 */
function enkCapUse() {
  if (!enkCapUsable()) return 0;
  const e = enkSync();
  const before = e.n;
  e.n = ENK_RULE.max;
  e.at = Date.now();          // 가득에서 다시 줄어들 때부터 재도록
  S.enkCap = enkCapCount() - 1;
  saveVault();
  return e.n - before;
}

/* ── 동기화 ────────────────────────────────────────────────────
 *  작성위원마다 그 사람 몫의 파편을 태워 «동기화» 단계를 올린다.
 *  0단계(안 적힘)에서 1단계로 올리는 값이 base, 단계가 하나 오를 때마다 step 만큼 늘어난다.
 *  전투에서는 statPct 만큼 — 단계 1당 모든 능력치(공·방·체)가 그 비율만큼 강해진다. */
/* ── 이벤트 재화 ──────────────────────────────────────────────
 *  원고료·황금교본과 같은 급의 재화입니다. 다만 «이름이 고정이 아닙니다» —
 *  지금 서 있는 이벤트에 따라 화면에 적히는 이름이 바뀝니다.
 *  괴수살인괴수 기간에는 「칼날이빨」, 부산행 기간에는 「열차티켓」입니다.
 *  속으로는 늘 S.event 한 칸이고, 기간이 갈리면 0으로 지워집니다.
 *
 *  지금 서 있는 이벤트 = CHAPTERS «맨 마지막 장» 몫으로 data/event.js 에
 *  적어 둔 줄입니다. 본편이든 .5장이든 가리지 않습니다.
 *  물건·값·이름은 모두 data/event.js 에서 고칩니다.
 */
function eventRule() {
  return (typeof EVENT_RULE !== "undefined" && EVENT_RULE)
    ? EVENT_RULE : { shop: "이벤트 교환소", noCur: "이벤트 재화", bonusPct: 20,
                     gain: { story: { first: 50, again: 10 },
                             latest: { first: 100, again: 30 } } };
}
function eventList() { return (typeof EVENTS !== "undefined" && EVENTS) ? EVENTS : []; }
/* 가장 마지막에 나온 이야기 — 맨 뒤에 붙은 것이 곧 최신 스토리입니다 */
function lastStory() {
  return (typeof CHAPTERS !== "undefined" && CHAPTERS.length)
    ? CHAPTERS[CHAPTERS.length - 1] : null;
}
/* 지금 서 있는 이벤트. 맨 마지막 장 몫을 안 적어 두었으면 «이벤트 없음»(null) 입니다 —
 * 그때는 상점에 교환소 손잡이가 아예 나오지 않습니다. */
function curEvent() {
  const c = lastStory();
  if (!c) return null;
  return eventList().find(e => e && e.chapter === c.title) || null;
}
function curEventId()   { const e = curEvent(); return e ? e.id : null; }
/* 기간 — 우편함과 «같은 방식» 입니다. from 을 안 적었으면 기한이 없습니다.
 * 기간이 지나면 상점의 교환소 손잡이가 사라집니다. 모아 둔 재화는 그대로 남고,
 * 다음 이야기가 나올 때 비로소 0으로 갈립니다. */
function eventUntil(e) {
  const p = String((e && e.from) || "").split("-").map(Number);
  if (p.length !== 3 || p.some(isNaN)) return Infinity;
  const days = (e && typeof e.days === "number") ? e.days : eventRule().days;
  return new Date(p[0], p[1] - 1, p[2]).getTime() + days * 24 * 60 * 60 * 1000;
}
function eventLive(e) { return !!e && Date.now() < eventUntil(e); }
/* 지금 «열려 있는» 이벤트. 상점 손잡이와 교환소는 이것을 봅니다 */
function openEvent() { const e = curEvent(); return eventLive(e) ? e : null; }
/* 얼마나 남았는지 — 우편의 mailLeftText 와 같은 말투로 */
function eventLeftText(e) {
  const ms = eventUntil(e) - Date.now();
  if (ms === Infinity) return "기한 없음";
  if (ms <= 0) return "기간이 끝났습니다";
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (d >= 1) return d + "일 남음";
  const h = Math.floor(ms / (60 * 60 * 1000));
  return h >= 1 ? h + "시간 남음" : "오늘까지";
}
/* 화면에 적을 재화 이름 — CURRENCY(원고료) 자리에 대응합니다 */
function eventCurName() { const e = curEvent(); return e ? e.cur : eventRule().noCur; }
function eventCount()   { return (S && +S.event) || 0; }
function addEvent(n) {
  if (!n) return;
  S.event = eventCount() + n;
}
function eventGoods()   { const e = curEvent(); return (e && e.goods) || []; }

/* ── 이벤트 재화가 들어오는 자리 ──────────────────────────────
 *  스토리 장을 마칠 때(chapterEnd)와 거울 갈래를 완주할 때(mirrorClear)입니다.
 *  얼마를 주는지는 data/event.js 의 EVENT_RULE.gain 과, 거울 쪽은
 *  MIRROR_TIERS 각 갈래의 event 에 적혀 있습니다.
 *
 *  ■ 얹어 주는 몫
 *    «가장 새로 선 특정 배정»(pickupList()[0] — 지금은 G사) 의 대상 인격을
 *    편성에 세우고 있으면, 한 명당 EVENT_RULE.bonusPct % 를 더 받습니다.
 *    셋을 다 세우면 60% 더입니다. 지원 작성위원도 제목으로 함께 봅니다.
 */
function eventLatestPickup() { return pickupList()[0] || null; }
function eventBonusCount() {
  const p = eventLatestPickup();
  if (!p || !S || !S.party) return 0;
  let n = 0;
  S.party.forEach(w => {
    if (!w) return;
    /* 지원 작성위원은 자기 인격을 갈아 끼우지 않으므로 제 제목을 그대로 봅니다 */
    const t = isSupport(w) ? (supportBy(w) || {}).title
                           : (idByKey(S.equip[w]) || {}).title;
    if (t && pickupHit(p, t)) n++;
  });
  return n;
}
/* 얹어 주는 몫까지 더한 값. 나머지는 버립니다 (다른 셈과 같은 결). */
function eventGainWithBonus(base) {
  base = +base || 0;
  const n = eventBonusCount();
  const extra = n ? Math.floor(base * (eventRule().bonusPct / 100) * n) : 0;
  return { base, n, extra, total: base + extra };
}
/* 실제로 넣어 주고 화면에 한 줄 적습니다. 넣은 값을 돌려줍니다.
 * 이벤트가 서 있지 않거나 기간이 끝났으면 아무것도 하지 않습니다 —
 * 쓸 곳(교환소)이 닫힌 뒤에 모아 봐야 쓸 데가 없기 때문입니다. */
function gainEvent(base) {
  if (!openEvent() || !base) return 0;
  const g = eventGainWithBonus(base);
  addEvent(g.total);
  say(eventCurName() + " " + g.total + " 획득." +
      (g.n ? "　(" + eventLatestPickup().name + " 인격 " + g.n + "명 — " +
             (eventRule().bonusPct * g.n) + "% 더 받았다)" : ""), "gain");
  return g.total;
}
/* 스토리 장을 마쳤을 때 줄 몫 — 맨 마지막 장이면 더 줍니다 */
function eventStoryGain(c, first) {
  const g = eventRule().gain || {};
  const last = lastStory();
  const t = (last && c && c.id === last.id) ? g.latest : g.story;
  if (!t) return 0;
  return first ? t.first : t.again;
}
/* 이 기간에 그 물건을 몇 개 바꿨는가 */
function eventBought(id) { return (S && S.eventBuy && +S.eventBuy[id]) || 0; }
/* 몇 개 더 바꿀 수 있는가. limit 이 없거나 0 이면 무제한입니다 */
function eventLeft(g) {
  if (!g || !g.limit) return Infinity;
  return Math.max(0, g.limit - eventBought(g.id));
}
/* 교환 물건이 무엇을 주는지 한 줄로 — 우편(mailGiveText)과 «같은 말» 을 씁니다 */
/* 물건이 인격을 준다면 그 인격 줄을 찾아 돌려줍니다. 못 찾으면 null —
 * 제목을 고쳤을 때 조용히 사라지지 않게, 화면에서 그대로 일러 줍니다. */
function eventGiveId(g) {
  const k = g && g.id;
  if (!k || !k.who) return null;
  const s = SINNERS[k.who];
  if (!s) return null;
  const id = s.ids.find(i => i.star === k.star && i.title === k.title);
  return id ? { who: k.who, id, key: idKey(k.who, id) } : null;
}
function eventGiveText(g) {
  g = g || {};
  const out = [];
  const p = eventGiveId(g);
  if (p) out.push(stars(p.id.star) + " " + p.id.title + " " + SINNERS[p.who].name);
  else if (g.id) out.push("(인격을 찾지 못했습니다: " + [g.id.who, g.id.star, g.id.title].join(" / ") + ")");
  if (g.money) out.push(CURRENCY + " " + g.money);
  if (g.codex) out.push("황금교본 " + g.codex + "권");
  if (g.enk)   out.push(ENK_RULE.name + " " + g.enk);
  if (g.enkCap) out.push(ENK_CAPSULE.name + " " + g.enkCap + "개");
  if (g.fragBoxSelect) out.push("인격 파편 상자(선택) " + g.fragBoxSelect + "개");
  if (g.fragBoxRandom) out.push("인격 파편 상자(무작위) " + g.fragBoxRandom + "개");
  return out.join("　·　") || "—";
}
/* 물건에 딸리는 설명 — 인격 파편 상자는 «보관함에 적힌 것과 똑같은 글» 을 씁니다.
 * 글을 여기 옮겨 적지 않고 FRAGBOX_RULE 을 그대로 봅니다. 한 곳만 고치면
 * 보관함과 교환소가 늘 같은 말을 하게 되는 몫입니다. */
function eventGoodsNote(g) {
  g = g || {};
  if (g.fragBoxSelect || g.fragBoxRandom)
    return FRAGBOX_RULE.desc + " " + FRAGBOX_RULE.desc2;
  /* 인격을 이미 지녔으면 «무엇을 대신 받는지» 를 사기 전에 알려 둡니다 */
  const p = eventGiveId(g);
  if (p && S.owned[p.key])
    return "이미 지닌 인격입니다 — 바꾸면 " + SINNERS[p.who].name +
           " 인격 파편 " + dupRefund(p.id.star) + "개로 돌려받습니다.";
  if (p && p.id.note) return "“" + p.id.note + "”";
  return "";
}
/* 실제로 넣어 줍니다. 받은 것을 한 줄로 돌려줍니다. */
function eventGiveApply(g) {
  g = g || {};
  const got = [];
  /* 인격 — 없으면 넣어 주고, 이미 지녔으면 뽑기에서 겹쳤을 때와 «똑같이»
   * 그 사람 몫 인격 파편으로 돌려줍니다 (dupRefund 표를 그대로 씁니다). */
  const p = eventGiveId(g);
  if (p) {
    if (!S.owned[p.key]) {
      S.owned[p.key] = true;
      /* 뽑기와 같은 규칙 — 지금 세운 것보다 성급이 높으면 갈아 끼웁니다 */
      const cur = idByKey(S.equip[p.who]);
      if (!cur || cur.star < p.id.star) {
        S.equip[p.who] = p.key;
        if (S.party.indexOf(p.who) >= 0) S.hp[p.who] = maxHp(p.who);
      }
      got.push(stars(p.id.star) + " " + p.id.title + " " + SINNERS[p.who].name);
    } else {
      const n = dupRefund(p.id.star);
      addFrag(p.who, n);
      got.push("이미 지닌 인격이라 " + SINNERS[p.who].name + " 인격 파편 " + n + "개");
    }
  }
  if (g.money) { S.money += g.money; got.push(CURRENCY + " " + g.money); }
  if (g.codex) { S.codex += g.codex; got.push("황금교본 " + g.codex + "권"); }
  if (g.fragBoxSelect) { addFragBox("select", g.fragBoxSelect); got.push("인격 파편 상자(선택) " + g.fragBoxSelect + "개"); }
  if (g.fragBoxRandom) { addFragBox("random", g.fragBoxRandom); got.push("인격 파편 상자(무작위) " + g.fragBoxRandom + "개"); }
  if (g.enkCap) { addEnkCap(g.enkCap); got.push(ENK_CAPSULE.name + " " + g.enkCap + "개"); }
  if (g.enk) {
    enkSync();
    const before = enkCount();
    S.enk.n = Math.min(ENK_RULE.max, before + g.enk);
    const n = enkCount() - before;
    got.push(ENK_RULE.name + " " + n +
             (n < g.enk ? " (상한 " + ENK_RULE.max + " 을 넘겨 받지는 못했습니다)" : ""));
  }
  return got.join("　·　");
}

/* 동기화가 열리는 장 — 유리창의 [동기화] 손잡이와 장 종료 알림이 이것을 함께 봅니다.
 * 이 장을 마치기 전에는 손잡이 자체가 유리창에 나오지 않습니다. */
const SYNC_UNLOCK_CH = "ch3";
function syncUnlocked() { return !!(S && S.cleared && S.cleared[SYNC_UNLOCK_CH]); }

const SYNC_RULE = {
  base: 100,     // 0 → 1단계에 드는 파편
  step: 20,      // 단계가 하나 오를 때마다 늘어나는 값
  statPct: 0.05, // 단계 1당 능력치 상승 비율 (5%)
  /* 상한 — SLOT_RULE(기프트·교육위원 칸 수)과 같은 모양입니다.
   * needCleared 를 안 적은 줄이 기본값이고, 본편을 그 장까지 마치면 그 max 로 올라갑니다.
   * 지금은 여기까지만 정했습니다 — 더 늘리려면 줄만 얹으면 됩니다. */
  tiers: [
    { max: 4 },
    { max: 8,  needCleared: "ch7" },
    { max: 12, needCleared: "ch8" }
  ]
};
function syncLevel(who) { return (S.sync && S.sync[who]) || 0; }
function syncCost(level) { return SYNC_RULE.base + SYNC_RULE.step * level; }
function syncMax() {
  let n = 0;
  SYNC_RULE.tiers.forEach(r => {
    if (!r.needCleared || (S && S.cleared && S.cleared[r.needCleared])) n = Math.max(n, r.max);
  });
  return n;
}
/* 다음 상한이 몇 장을 마치면 열리는가 — 화면에 일러 주려고 씁니다. 다 열렸으면 null.
 * nextSlotChapter() 와 같은 모양입니다. */
function nextSyncChapter() {
  const now = syncMax();
  const r = SYNC_RULE.tiers.filter(x => x.max > now).sort((a, b) => a.max - b.max)[0];
  if (!r || !r.needCleared) return null;
  const c = CHAPTERS.find(x => x.id === r.needCleared);
  if (c) return c.no;
  /* 아직 안 만든 장이면 id 에서 번호만 뽑아 적습니다 — ch7 → 7장, ch5_5 → 5.5장 */
  const m = String(r.needCleared).match(/^ch(\d+)(?:_(\d+))?$/);
  return m ? (m[1] + (m[2] ? "." + m[2] : "") + "장") : r.needCleared;
}
/* 전투에서 이 사람에게 적용할 동기화 단계.
 * 작성위원 본인은 자기 단계를 그대로 쓴다. 지원 작성위원은 자기 단계가 없으므로,
 * 함께 편성된 다른 두 작성위원 중 «낮은 쪽»을 빌려 쓴다 — 사용자 지침.
 * (편성 3칸 중 지원은 셋째 칸에만 서므로, 나머지 둘은 늘 작성위원입니다.) */
function effSyncLevel(who) {
  if (SINNERS[who]) return syncLevel(who);
  if (isSupport(who)) {
    const levels = S.party.filter(w => w && w !== who && SINNERS[w]).map(syncLevel);
    return levels.length ? levels.reduce((a, b) => Math.min(a, b)) : 0;
  }
  return 0;   // 조력자 등 — 아직 동기화가 없는 자리
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

/* ── 작성위원 고유 능력 — 패시브 (광신·격노·배임·보복) ─────────────
 *  atk 는 effStats() 의 다른 배수들과 같은 자리에 더하는 배수(0.05 = +5%),
 *  def 는 배임만 쓰는 정수 플랫 보정(방어 +n)입니다. 액티브(흡혈·반격·회피·
 *  도발·갑주·강공·책임·겹살)는 손잡이로 직접 고르는 것이라 resolveTurn()
 *  쪽에 있습니다 (skillAvailable, useUniqueSkill 참고).
 *
 *  effHp 는 이 사람의 지금 최대 체력(effStats 안에서 이미 구한 값)을 그대로
 *  받습니다 — 여기서 maxHp()를 다시 부르면 effStats가 자기 자신을 부르는
 *  순환이 생기기 때문입니다. */
function passiveSkillBonus(who, effHp) {
  const out = { atk: 0, def: 0 };
  const skill = UNIQUE_SKILLS[who];
  if (!skill || skill.kind !== "passive") return out;
  const level = syncLevel(who);
  if (level < 1) return out;
  const v = skillTierValue(skill, level);
  const curRaw = S.hp[who] != null ? S.hp[who] : effHp;
  const lostPct = Math.max(0, (1 - curRaw / effHp) * 100);

  switch (who) {
    case "kim_taeseong":                          // 광신 — 이번 갈래 처치 수만큼 누적
      out.atk = ((S.arc && S.arc.kills) || 0) * v / 100;
      break;
    case "yu_ain":                                // 보복 — 아군 사망마다, 자신이 죽으면 초기화
      out.atk = ((S.arc && S.arc.retribution[who]) || 0) * v / 100;
      break;
    /* 격노·배임 — 스택 하나당 얻는 몫을 3배로 올림(사용자 지침 2026-09-02
     * — 원래 스택당 +1%·+1이던 것을 +3%·+3으로). 스택 수 자체(표시용
     * passiveStackCount)는 그대로이고, 스택 하나가 주는 몫만 세졌습니다. */
    case "lee_hanbeom":                           // 격노 — 잃은 체력 v%마다 추가 피해 3%
      out.atk = Math.floor(lostPct / v) * 0.03;
      break;
    case "lee_sojeong":                           // 배임 — 잃은 체력 v%마다 방어 +3 (플랫)
      out.def = Math.floor(lostPct / v) * 3;
      break;
  }
  return out;
}

/* 파티 카드에 「광신 n」 처럼 보일 스택 수 — 표시 전용이라 curHp/maxHp를
 * 그대로 씁니다(effStats 밖에서 부르므로 순환 걱정이 없습니다). 해당 없으면
 * null (능력이 없거나, 패시브가 아니거나, 아직 1단계가 안 됐거나). */
function passiveStackCount(who) {
  const skill = UNIQUE_SKILLS[who];
  if (!skill || skill.kind !== "passive") return null;
  const level = syncLevel(who);
  if (level < 1) return null;
  const v = skillTierValue(skill, level);
  if (who === "kim_taeseong") return (S.arc && S.arc.kills) || 0;
  if (who === "yu_ain") return (S.arc && S.arc.retribution.yu_ain) || 0;
  if (who === "lee_hanbeom" || who === "lee_sojeong") {
    const lostPct = Math.max(0, (1 - curHp(who) / maxHp(who)) * 100);
    return Math.floor(lostPct / v);
  }
  return null;
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
  const rl = railBonus();                      // 거울굴절철도 2호선 순환 보너스 (밖에서는 전부 0)
  const sy = effSyncLevel(who) * SYNC_RULE.statPct;   // 동기화 — 단계 1당 능력치 전부 +5%
  const hp  = Math.max(1, Math.round(s.hp  * (1 + b.hp  + a.hp  + gf.hp  + af.hp  + sy + rl.hp)));
  /* 작성위원 고유 능력(패시브) — 광신·격노·보복은 공격력에 얹는 배수,
   * 배임만 방어에 정수를 더하는 플랫 보정이라 따로 더한다. hp는 이미
   * 위에서 구했으므로 그걸 넘겨 준다 (maxHp()를 다시 부르면 effStats가
   * 자기 자신을 부르는 순환이 생긴다). */
  const pv = passiveSkillBonus(who, hp);
  /* 깎는 기프트가 있어 배수가 0 아래로 갈 수 있습니다. 바닥을 둡니다 —
   * 공격과 체력은 1, 방어는 0 까지. */
  const atk = Math.max(1, Math.round(s.atk * (1 + b.atk + a.atk + gf.atk + af.atk + sy + pv.atk + rl.atk)));
  /* 제1발톱 「지령」— 이번 차례에 방어를 골랐고, 그게 턴 머리에서 무작위로
   * 내려온 지령 그대로였다면 방어력을 그 자리에서 더 올려 준다.
   * claw1SynergyBonus() 참고. 전투 밖(S.battle 없음)이면 그냥 1이다. */
  const claw1Def = (S.battle && S.battle.cmds && S.battle.cmds[who] === "guard" &&
                    S.battle.mods && S.battle.mods[who + "_claw1Order"] === "guard")
                   ? (1.5 + claw1SynergyBonus()) : 1;
  const def = Math.max(0, Math.round(s.def * (1 + b.def + a.def + gf.def + af.def + sy + rl.def) * claw1Def) + pv.def);
  /* 방어의 일부를 공격으로 옮기는 기프트 */
  const conv = giftConvertFor(who);
  return { atk: atk + Math.round(def * conv), def: def, hp: hp };
}

/* 제1발톱 시너지가 지금 발동 중이면 claw1Bonus 를 돌려준다 — 그 시너지는
 * 일반 atk/def/hp 필드를 안 쓰므로 activeSynergies() 로는 못 읽는다.
 * data/characters.js 의 SYNERGIES 「제1발톱」 항목 머리말 참고. */
function claw1SynergyBonus() {
  if (typeof SYNERGIES === "undefined") return 0;
  const sy = SYNERGIES.find(x => (Array.isArray(x.tag) ? x.tag : [x.tag]).indexOf("제1발톱") >= 0);
  if (!sy || !sy.claw1Bonus) return 0;
  const n = synergyNames().filter(t => t.indexOf("제1발톱") >= 0).length;
  return n >= sy.need ? sy.claw1Bonus : 0;
}

/* 지령을 따랐을 때 그 사람이 하는 한마디 — 인격(또는 지원 작성위원)
 * 줄에 적힌 claw1Line 을 그대로 읽습니다. 사람마다 다르게 적을 수
 * 있도록 데이터 쪽(id/SUPPORTS 항목)에 두었습니다 — 없으면 그냥
 * 아무 말도 안 합니다. */
function claw1LineFor(who) {
  if (isAlly(who)) return null;
  if (isSupport(who)) { const s = supportBy(who); return s ? s.claw1Line : null; }
  const id = idByKey(S.equip[who]);
  return id ? id.claw1Line : null;
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
function setHp(who, v) {
  const wasAlive = curHp(who) > 0;
  S.hp[who] = Math.max(0, Math.min(maxHp(who), Math.round(v)));
  if (wasAlive && S.hp[who] <= 0) onAllyDown(who);
}
function alive(who) { return curHp(who) > 0; }

/* 유리창(newState)·상점·편성처럼 «전투에서 완전히 벗어난» 자리로 돌아오면
 * 「이번 갈래」 스택(광신·보복)을 지운다 — 던전·전투 도중(defeat 뒤의 「편성
 * 바꾸기」처럼 S.mirror·S.battle 이 아직 서 있는 자리)에는 지우면 안 되므로
 * 거기서는 그냥 둔다. */
function resetArcIfIdle() {
  if (!S.battle && !S.mirror) {
    S.arc = { kills: 0, retribution: {} };
    /* 2호선을 도중에 빠져나온 자리이기도 합니다 — 순환 보너스도 여기서 함께 걷습니다.
     * 「굴레」로 늘어나 있던 체력 상한이 도로 줄어드니 넘치는 몫을 깎아 맞춥니다. */
    if (S.rail2) {
      S.rail2 = null;
      S.party.forEach(w => { if (w) S.hp[w] = Math.min(curHp(w), maxHp(w)); });
    }
  }
}

/* 유아인의 「보복」— 아군이 죽을 때마다 스택, 자신이 죽으면 초기화.
 * setHp()가 살아있음→쓰러짐으로 바뀌는 순간에만 부르므로, 어느 경로로
 * 죽든(단일 표적·광역·강타 다 setHp를 거칩니다) 한 곳에서 잡힙니다. */
function onAllyDown(who) {
  if (!S.arc) S.arc = { kills: 0, retribution: {} };
  if (!S.arc.retribution) S.arc.retribution = {};
  if (who === "yu_ain") S.arc.retribution.yu_ain = 0;
  else if (S.party.indexOf("yu_ain") >= 0)
    S.arc.retribution.yu_ain = (S.arc.retribution.yu_ain || 0) + 1;
}
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
  /* 여러 줄이면 차례로. 그냥 글이 아니라 { text, caption:true } 로 적으면
   * 그 줄만 무대 가운데에 큰 글씨로도 띄웁니다(showBattleCaption 참고). */
  (Array.isArray(a.line) ? a.line : (a.line ? [a.line] : [])).forEach(t => {
    const text = (typeof t === "object") ? t.text : t;
    speak(id, text);
    if (typeof t === "object" && t.caption) showBattleCaption(text);
  });
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

/* ── 편성 금지 ────────────────────────────────────────────────────
 *  이야기 안에서 그 사람 자신이 적으로 돌아서는 등, 잠깐 함께 싸울 수 없게
 *  되는 자리에 씁니다(7장 「호감이 끝나는」, 차민준). forceParty(반대로
 *  «이 사람만»)와 달리 이쪽은 «이 사람은 빼고»입니다.
 *
 *      { t:"party", ban: ["cha_minjun"], text:"…" }     지금 편성에서 빼고, 다시 못 고르게
 *      { t:"party", unban: ["cha_minjun"], text:"…" }   다시 고를 수 있게
 *
 *  금지된 사람은 chapterNeeds(장의 require)에서도 잠깐 빠집니다 — 그래야
 *  「이 장은 ○○이 없이는 진행할 수 없다」는 확정 검사에 걸리지 않습니다.
 *  openParty() 의 작성위원 칸·확정 손잡이가 S.partyBan 을 함께 봅니다. */
function banParty(list) {
  const arr = (Array.isArray(list) ? list : [list]).filter(Boolean);
  arr.forEach(w => { if (S.partyBan.indexOf(w) < 0) S.partyBan.push(w); });
  const left = [];
  S.party = S.party.filter(w => {
    if (arr.indexOf(w) < 0) return true;
    left.push(w);
    return false;
  });
  if (left.length) { divider(); say(withJosa(nameList(left), "이") + " 전열에서 빠진다.", "sys"); }
}
function unbanParty(list) {
  const arr = Array.isArray(list) ? list : [list];
  S.partyBan = S.partyBan.filter(w => arr.indexOf(w) < 0);
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

/* 실명과 코드네임이 CREW(승무원 목록)에 함께 적힌 사람은 같은 사람으로 봅니다 —
 * 이정빈(교육위원)과 하축론(지원 작성위원)처럼, 자리는 달라도 결국 한 사람이라
 * 둘을 같이 세우면 안 됩니다. CREW 에 없는 이름은 그 이름 자체가 열쇠가 됩니다. */
function personKey(name) {
  for (const k in CREW) if (CREW[k].name === name || CREW[k].codename === name) return k;
  return name;
}
function samePerson(a, b) { return !!a && !!b && personKey(a) === personKey(b); }

/* 교육위원 k 를 세우려는데, 그 사람이 이미 지원 작성위원으로 편성에 있는가.
 * 있으면 그 지원의 이름을(예: "하축론") 돌려주고, 없으면 null. */
function advisorBlockedBySupport(k) {
  const a = advisorById(k);
  if (!a) return null;
  const hit = S.party.find(w => w && isSupport(w) && samePerson(memberName(w), a.name));
  return hit ? memberName(hit) : null;
}
/* 지원 작성위원 sp 를 편성하려는데, 그 사람이 이미 교육위원으로 서 있는가. */
function supportBlockedByAdvisor(sp) {
  const hit = equippedAdvisors().find(x => samePerson(x.name, sp.name));
  return hit ? hit.name : null;
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
  /* 이야기가 같은 사람을 어떤 데선 영문 열쇠로, 어떤 데선 한글 이름으로 부릅니다 —
   * who:"kim_taeseong" 과 who:"김태성" 이 함께 있습니다. 이름으로도 찾아 줍니다.
   * 보조 교육위원보다 «먼저» 봐야 합니다. 저쪽은 초상이 전부 null 이라,
   * 이름이 겹치면 그 자리에서 null 을 돌려주고 멈춰 버립니다. */
  for (const k in SINNERS) if (SINNERS[k].name === who) return SINNERS[k].portrait;
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
/* 굵게 한 줄 — 해금 알림처럼 «놓치면 안 되는» 한 줄에만 씁니다.
 * say() 와 같되 글자만 굵습니다. 본문은 그대로 글자로 넣으므로 안전합니다. */
function sayBold(text, cls) {
  const el = document.createElement("p");
  el.className = cls || "n";
  const b = document.createElement("b");
  b.textContent = text;
  el.appendChild(b);
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

/* fig   : 배경 위에 얹을 그림 (없으면 배경만)
 * side  : "left" 대사하는 사람 · "mid" 적
 * tag   : 그림에 붙일 이름 (지금은 화면에 쓰지 않고 alt 로만)
 * scale : 그림만 이 배수로 키운다 (자리는 그대로 — 바닥 가운데를 축으로 키운다).
 *         원본 그림 안에서 몸집이 작게 잡혀 있는 적(FOES 의 imgScale)에만 씁니다.  */
function drawStage(fig, side, tag, scale) {
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
  if (fig) {
    /* --imgscale 로 넘깁니다(직접 transform 을 박지 않습니다) — 맞을 때·쓰러질 때
     * 애니메이션도 이 값을 keyframes 안에서 함께 곱하게 index.html 쪽에 맞춰 뒀습니다.
     * 그래야 맞는 순간 확대가 풀렸다 돌아오는 깜빡임이 없습니다. */
    const big = !!(scale && scale !== 1);
    const st = big ? ' style="--imgscale:' + scale + '"' : '';
    /* 키워 세우는 그림은 바닥이 아니라 «칸 한가운데» 에 답니다 — 바닥을 축으로
     * 키우면 위로만 자라 머리가 화면 밖으로 넘칩니다. scaled 가 그 몫입니다. */
    html += '<div class="figwrap ' + (side === "mid" ? "mid" : "left") +
              (big ? " scaled" : "") + '">' +
              '<img id="figure" src="' + assetURL(fig) + '" alt="' + (tag || "") + '"' + st + ' ' +
              'onerror="this.style.display=\'none\'"></div>';
  }
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
function showFoe(src, tag, scale) { drawStage(src, "mid", tag, scale); }

/* 전투 중 대사를 적이 선 자리(무대 가운데)에 큰 글씨로 얹는다 — battleSay 전용.
 * drawStage 를 다시 부르지 않고 지금 그려진 칸에 얹기만 하므로, 초상·적 그림은
 * 그대로 둔 채 글씨만 갈아 끼웁니다. 다음에 drawStage 가 무대를 다시 그리면
 * (다음 장면·다음 초상 등) 함께 지워집니다. */
function showBattleCaption(text) {
  const box = $stage.querySelector(".scenebox");
  if (!box) return;
  let cap = box.querySelector(".battlecap");
  if (cap) cap.remove();          // 같은 대사가 이어져도 애니메이션이 다시 걸리게
  cap = document.createElement("div");
  cap.className = "battlecap";
  cap.textContent = text;
  box.appendChild(cap);
}

/* ── 소리 ─────────────────────────────────────────────────────
 *  브라우저는 «사용자가 튼 소리» 만 허락합니다. 그런데 허락의 잣대가 둘입니다 —
 *    한 번이라도 눌렀으면 됨   : 크롬·엣지 데스크톱
 *    누른 그 순간이어야 함     : 사파리(아이폰은 전부, 맥은 기본값), 파이어폭스 일부
 *  보스 등장 연출은 암전 1초 뒤 setTimeout 안에서 소리를 틉니다. 뒤쪽 잣대를 쓰는
 *  브라우저에서는 «누른 그 순간» 이 이미 끝나 있어, 손도 못 대 보고 거부당합니다.
 *
 *  그래서 화면을 처음 누르는 순간에 소리를 미리 «틀었다 멈춰» 둡니다. 그 순간은
 *  틀림없이 사용자가 누른 때이므로 허락이 떨어지고, 한 번 허락이 떨어진 Audio 는
 *  그 뒤로 아무 때나 다시 틀 수 있습니다. 연출 자리에서는 그 객체를 다시 씁니다.
 */
const SOUND_CACHE = {};        // 경로 → 미리 쥐어 둔 Audio (연출 때마다 새로 만들지 않는다)
let   SOUND_UNLOCKED = false;  // 첫 조작으로 허락을 받아 두었는가

/* 이 경로의 Audio 를 하나만 만들어 두고 계속 씁니다.
 * assetURL 을 거칩니다 — 완전판처럼 파일을 통째로 품은 판을 대비해서. */
function soundEl(src) {
  if (!SOUND_CACHE[src]) {
    const a = new Audio(assetURL(src));
    a.preload = "auto";
    SOUND_CACHE[src] = a;
  }
  return SOUND_CACHE[src];
}

/* 미리 쥐어 둘 소리 목록 — FOES 에 sound 를 적어 둔 적의 것 전부 */
function soundsToUnlock() {
  const out = [];
  if (typeof FOES !== "undefined")
    for (const k in FOES) if (FOES[k] && FOES[k].sound) out.push(FOES[k].sound);
  return out;
}

/* 첫 조작 때 딱 한 번. 소리 나지 않게 muted 로 틀었다 곧바로 멈춥니다 —
 * 허락은 play() 를 부른 «때» 로 판가름 나지, 소리가 실제로 났는지로 나지 않습니다. */
function unlockSounds() {
  if (SOUND_UNLOCKED) return;
  SOUND_UNLOCKED = true;
  soundsToUnlock().forEach(src => {
    try {
      const a = soundEl(src);
      a.muted = true;
      const stop = () => { try { a.pause(); a.currentTime = 0; } catch (e) {} a.muted = false; };
      const p = a.play();
      if (p && p.then) p.then(stop, () => { a.muted = false; });
      else stop();
    } catch (e) { /* 못 쥐어 두면 그만 — 연출 자리에서 손잡이로 받습니다 */ }
  });
}
document.addEventListener("pointerdown", unlockSounds, true);
document.addEventListener("keydown",     unlockSounds, true);

/* 효과음을 한 번 재생한다. assets/sound/ 의 파일을 씁니다.
 * 그래도 막히면 onBlocked 를 부릅니다 — 부르는 쪽이 손잡이를 내어 주도록.
 * 쓴 Audio 를 돌려줍니다 — «끝나면» 을 기다려야 하는 자리(startBossCine)에서 씁니다.
 * 다시 쓰는 객체이므로, 듣는 쪽은 반드시 { once: true } 로 답니다. */
function playSound(src, onBlocked) {
  if (!src) return null;
  try {
    const a = soundEl(src);
    a.pause();
    a.muted = false;
    try { a.currentTime = 0; } catch (e) {}   // 다시 만나도 처음부터
    const p = a.play();
    if (p && p.catch) p.catch(() => { if (onBlocked) onBlocked(); });
    return a;
  } catch (e) { if (onBlocked) onBlocked(); return null; }
}

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
  /* 이벤트 재화는 여기 적지 않습니다 — 상점과 이벤트 교환소 안에서만 보입니다 */
  /* 관리력은 머리에 숫자로 적지 않고, 아래쪽 눈금으로 보여 줍니다 (renderManage) */
  $wallet.innerHTML = right;
}

/* 적이 나타났을 때만 뜨는 체력바 — 이름은 왼쪽 아래, 공·방은 오른쪽 아래.
 * S.battle 이 없으면(전투 밖) 아예 감춥니다. */
function renderFoeBar() {
  const b = S.battle;
  if (!b) { $foehp.classList.remove("on"); $foehp.innerHTML = ""; return; }
  $foehp.classList.add("on");
  const pct = Math.max(0, Math.round(b.hp / b.maxhp * 100));
  /* ── 순환/차례 눈금 (거울굴절철도) ──────────────────────────────
   *  열 몇 판을 내리 붙는 갈래라, 지금이 «몇 번째» 인지 화면에 없으면
   *  금세 길을 잃습니다. 장면에 붙여 둔 rail 을 그대로 읽어 적습니다.
   *  2호선은 {cycle,no,k}(railCycleScenes·railFinalScenes), 순환이 없는
   *  갈래(거울 던전·하드·익스트림·1호선)는 {no,total,k}(buildMirrorRunScenes)
   *  — 둘을 갈라 다르게 적습니다. rail 이 없으면(본편 등) 아예 안 뜹니다. */
  const rl = b.scene && b.scene.rail;
  const 눈금 = !rl ? "" :
    ' <i class="railtag">' +
      (rl.final ? "종착역" :
       rl.cycle != null ? (rl.cycle + "순환 · " + rl.no + "번째") :
       (rl.no + " / " + rl.total + "번째")) +
      '　' + railScaleText(rl.k) +
    '</i>';
  $foehp.innerHTML =
    '<div class="hpbar"><i style="width:' + pct + '%"></i></div>' +
    '<div class="row">' +
      '<span class="nm">' + b.name + 눈금 + '</span>' +
      '<span class="stat">공 ' + b.atk + '　방 ' + b.def + '</span>' +
    '</div>';
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
    /* 광역 공격 턴은 노려지는 한 사람이 없고 전원이 맞으므로, 전원에게 노려짐을 켠다 */
    const aimed  = !!(b && hp > 0 && (b.aoe || b.aim === who));
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
    const stack = passiveStackCount(who);
    if (stack !== null) mark += ' <span class="stacktag">' + UNIQUE_SKILLS[who].name + ' ' + stack + '</span>';
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

/* ── 화면이 한 번 크게 빛나는 연출 ───────────────────────────────
 *  결과를 바로 보여주지 않고, 한 번 크게 빛낸 뒤에 펼칩니다.
 *  길이는 RULE.gachaFxMs 에서 고칩니다. 0 으로 두면 그냥 넘어갑니다.
 *  cls 로 색을 고릅니다 — 비우면 금빛, "green"/"red" 등 flashfx 변형 클래스. */
function flashFx(headlineHTML, line, after, cls) {
  if (!RULE.gachaFxMs) { if (after) after(); return; }
  const el = document.createElement("div");
  el.className = "flashfx" + (cls ? " " + cls : "");
  el.innerHTML = '<div class="ring"></div>' +
                 '<div class="beam"></div>' +
                 '<div class="txt"><span class="star">' + headlineHTML + '</span>' +
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

/* 배정에서 ★★★ 이 나왔을 때. green 을 켜면 금빛 대신 초록빛 — 특정 배정의 대상이 나왔을 때 */
function starFlash(star, line, after, green) {
  flashFx(stars(star), line, after, green ? "green" : null);
}

/* 동기화 단계가 올랐을 때 — 붉게 빛나며 오른 단계와 그 작성위원의 대표 대사를 보여준다 */
function syncFlash(level, quote, after) {
  flashFx("동기화 " + level + "단계", quote, after, "red");
}

/* 동기화 1·4·8·12단계 — 고유 능력이 해금되거나 강화되는 자리라, 이번엔 붉은빛
 * 대신 흰빛 하나로 뜨고, "동기화 n단계"는 큰 글자 아래 작은 글자로 붙는다.
 * 대사(quote)는 그대로 유지 — flashFx 의 line 자리(따옴표로 감싸는 자리)에 둔다.
 * (UNIQUE_SKILL_TIERS, UNIQUE_SKILLS 는 data/skills.js 에 있습니다) */
function uniqueSkillFlash(level, quote, skillName, after) {
  const big = "「" + skillName + "」 " + (level === 1 ? "해금" : "강화");
  const headlineHTML = big +
    '<span style="display:block;font-size:15px;letter-spacing:.18em;opacity:.75;margin-top:12px;">' +
    '동기화 ' + level + '단계</span>';
  flashFx(headlineHTML, quote, after, "white");
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

function render() {
  renderMood(); renderHeader(); renderFoeBar(); renderParty(); renderSynergy(); renderManage();
  /* 고유 능력 설명 칸은 askNext()가 그 차례에만 채운다 — 전투 밖에서는 비워 둔다 */
  if (!S.battle) { const box = document.getElementById("uniqueskills"); if (box) box.innerHTML = ""; }
}

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
  S.partyBan = [];    // 앞 장에서 걸린 편성 금지(banParty)도 뿌리까지 되돌린다

  /* 새로 들어서는 자리이므로, 이 장이든 다른 장이든 저장해 둔 이어하기 자리가
   * 있었다면 여기서 버립니다 — startMirror() 가 S.railSave 를 버리는 것과
   * 같은 논리입니다. 「저장해 둔 자리에서 이어하기」는 resumeStorySave() 가
   * 따로 맡습니다. */
  S.storySave = null;

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
                    /* caption:true — 이 줄만 무대 가운데에 큰 글씨로도 띄웁니다
                     * (showBattleCaption 참고). 특히 강조하고 싶은 대사에만 답니다. */
                    if (s.caption) showBattleCaption(x.text);
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

    /* ── 테마팩 하나를 다 깼다 ────────────────────────────────
     *  { t:"mirrorPackDone", packId }. buildPackRunScenes()가 팩마다
     *  끝에 붙입니다. 이번 판(packRounds)에 라운드가 남았으면 체크포인트
     *  (S.railSave)를 다음 라운드로 다시 저장하고 선택 화면을 다시 엽니다.
     *  다 돌았으면 mirrorClear() 로 넘어갑니다(다른 갈래와 같은 마무리). */
    case "mirrorPackDone": {
      const rule = mirrorRuleNow();
      const cleared = ((S.railSave && S.railSave.clearedPacks) || []).slice();
      cleared.push(s.packId);
      const nextRound = ((S.railSave && S.railSave.round) || 1) + 1;
      /* 마지막 라운드까지 다 깼어도 방금 깬 팩을 S.railSave 에 먼저 실어 둡니다 —
       * mirrorClear() 가 결과 카드(고른 테마팩 목록)를 지을 때 이걸 읽습니다. */
      S.railSave = { key: rule.key, round: nextRound, clearedPacks: cleared, arc: S.arc };
      if (nextRound > rule.packRounds) return mirrorClear();
      saveVault();
      openPackGate(rule, nextRound, cleared);
      return;
    }

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
      /* 거울굴절철도(1호선 등) 체크포인트에 실제로 닿은 자리입니다 — 보관함에도
       * 남겨서, 창을 닫았다 다시 열어도 여기서부터 이어할 수 있게 합니다.
       * 편성은 담지 않습니다(사용자 지침) — mirrorClear() 에서 지웁니다. */
      if (S.mirror && S.mirrorCheckpoint != null && !mirrorRuleNow().loop) {
        S.railSave = { key: mirrorRuleNow().key, picked: (MIRROR.foeSrc || []).slice(),
                        checkpoint: S.mirrorCheckpoint, turns: S.mirrorRunTurns || 0, arc: S.arc };
        saveVault();
      }
      render();
      return cont();
    }

    case "advisor":
      grantAdvisor(s);
      return cont();

    /* s.ban / s.unban — banParty/unbanParty 참고. s.require 를 적으면
     * (배열 또는 한 명) 그 사람이 편성에 들 때까지 "이대로 진행"을 감추고
     * 편성 창을 다시 띄웁니다 — 장 전체의 require 와 달리 이 장면 하나만
     * 겨눈 검사입니다(7장 「호감이 끝나는」, G안 최종전 앞). */
    case "party": {
      if (s.ban) banParty(s.ban);
      if (s.unban) unbanParty(s.unban);
      /* 장이 길어질수록(7장부터) 편성을 고치는 자리마다 조용히 이어할 자리를
       * 남겨 둡니다 — 거울굴절철도의 체크포인트(S.railSave, resumeMirror
       * 참고)와 같은 논리이되, 서로 뒤섞이지 않도록 별도 자리(S.storySave)에
       * 둡니다. 운전석의 "다음으로 추천" 자리에서 이 장의 이어하기 버튼으로
       * 들어갑니다(resumeStorySave). */
      if (!S.mirror) {
        const c = curChapter();
        if (c) {
          S.storySave = {
            chId: c.id, sc: S.sc - 1,
            party: S.party.slice(), equip: Object.assign({}, S.equip),
            hp: Object.assign({}, S.hp), flags: Object.assign({}, S.flags),
            partyStack: S.partyStack.slice(), partyBan: S.partyBan.slice(),
            battleForced: S.battleForced
          };
          saveVault();
        }
      }
      say(s.text || "편성을 조정하십시오.", "sys");
      S.waiting = true;
      const need = s.require ? (Array.isArray(s.require) ? s.require : [s.require]) : [];
      const satisfied = () => !need.filter(w => S.party.indexOf(w) < 0).length;
      const openThenCheck = () => openParty(() => {
        if (!satisfied()) {
          say(withJosa(nameList(need.filter(w => S.party.indexOf(w) < 0)), "이") +
              " 없이는 이대로 나설 수 없다.", "bad");
          return askParty();
        }
        S.waiting = false; next();
      });
      const askParty = () => buttons([
        { label: "편성", cls: "primary", fn: openThenCheck },
        satisfied() ? { label: "이대로 진행", fn: () => { S.waiting = false; next(); } } : null
      ].filter(Boolean));
      return askParty();
    }

    /* 조력자 — 이야기에서만 옆에 서 주는 사람 (data/allies.js) */
    case "ally":
      if (s.join) allyJoin(s.join);
      if (s.leave) allyLeave(s.leave);
      return cont();

    case "camera":  return doCamera(s);
    case "cook":    return doCook(s);
    case "choice":  return doChoice(s);
    case "battle":  return startBattle(s);
    case "bossCine": return startBossCine(s);

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

/* ── 인격 지급 ───────────────────────────────────────────────
 *
 *  이야기에서 인격을 주는 자리입니다. 이미 가진 인격이면 그 사람 몫 파편으로
 *  돌려주는데, 그 몫은 «그 자리에서 처음 한 번만» 나옵니다 — 황금교본과 같은 결입니다.
 *  이렇게 두지 않으면 마친 장을 다시 돌기만 해도 파편이 끝없이 나옵니다.
 *  받은 자리는 S.storyGain 에 인격 열쇠로 적히고, 보관함에 함께 남습니다.
 */
function grant(who, star, title) {
  const s = SINNERS[who];
  if (!s) { say("(지급 실패: " + who + ")", "todo"); return; }
  const id = s.ids.find(i => i.star === star && i.title === title);
  if (!id) { say("(지급 실패: " + title + ")", "todo"); return; }
  const key = idKey(who, id);
  if (!S.storyGain) S.storyGain = {};
  const took = !!S.storyGain[key];
  S.storyGain[key] = true;
  divider();
  if (S.owned[key]) {
    if (took) {
      say("이미 가진 인격이다. 이 자리의 몫은 이미 받아 갔다.", "sys");
    } else {
      const rf = dupRefund(star);
      addFrag(who, rf);
      say("이미 가진 인격이다. " + fragName(who) + " " + rf + " 획득.  (보유 " + fragCount(who) + ")", "sys");
    }
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

/* ── 보스 등장 연출 ────────────────────────────────────────────
 *  { t:"bossCine", foe:"ju3pino" }   — 거울굴절철도 1호선 종점처럼
 *  «만나 봐야 아는» 보스를 극적으로 들이려는 자리에 씁니다.
 *
 *  진입 → 암전(1초, 깜빡임) → 등장 대사 + 등장 음성(FOES 의 sound) →
 *  음성이 끝나면 화면이 흔들리며 보스가 서고 바로 전투가 시작됩니다.
 *
 *  이 판(save)에서 처음 만나는 것이면 위 흐름이 그대로 자동으로 흐르고,
 *  S.flags 에 «봤다» 표를 남깁니다. 그 뒤로 같은 보스를 다시 만나면(패배 후
 *  재도전 등) 기다리는 대신 「계속」을 눌러 그때그때 넘어갈 수 있습니다. */
function startBossCine(s) {
  const f = FOES[s.foe];
  if (!f) { say("(적 데이터 없음: " + s.foe + ")", "todo"); return cont(); }
  if (!S.flags) S.flags = {};
  const flag = "cine_" + s.foe;
  const seen = !!S.flags[flag];

  S.waiting = true;
  clearLog();
  $log.classList.remove("recalling");

  const blackout = () => {
    $stage.className = "on";
    $stage.innerHTML = '<div class="scenebox blackout"></div>';
  };

  /* 배경을 도로 보이며 등장 대사를 적고 음성을 튼다.
   * onDone 은 음성이 끝나거나(ended), 넘기거나, 너무 길 때(cineVoiceMaxMs) 한 번만 불린다.
   *
   * canAsk 를 세우면, 그래도 자동재생이 막혔을 때 조용히 넘기는 대신 손잡이를 내어
   * 줍니다 — 손잡이를 누르는 것 자체가 사용자 조작이라 그 자리에서는 소리가 납니다.
   * 「계속」을 눌러 들어온 자리(이미 본 보스)에서는 손잡이가 필요 없습니다.        */
  const showVoice = (onDone, canAsk) => {
    drawStage(null, null, null);              // 배경만 도로 보인다. 보스 그림은 아직 안 낸다
    if (f.intro && f.intro !== "TODO") say(f.intro, "bad");
    let done = false;
    let timer = 0;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); onDone(); };
    const listen = a => {
      if (!a) return;
      a.addEventListener("ended", finish, { once: true });   // 다시 쓰는 객체라 once 로 답니다
      a.addEventListener("error", finish, { once: true });
    };
    /* 기다릴 소리가 있으면 넉넉히, 애초에 소리가 없는 보스면 짧게 머물고 넘어갑니다 */
    const wait = () => {
      clearTimeout(timer);
      timer = setTimeout(finish, f.sound ? RULE.cineVoiceMaxMs : RULE.cineNoVoiceMs);
    };

    /* 막혔을 때 — 기다리기를 멈추고, 눌러서 듣거나 넘기게 한다 */
    const ask = () => {
      clearTimeout(timer);
      buttons([
        { label: "▶ 등장 음성 듣기", cls: "primary", fn: () => {
            buttons([{ label: "…", cls: "primary", disabled: true }]);
            listen(playSound(f.sound, finish));   // 이번에도 막히면 그냥 넘어갑니다
            wait();
          } },
        { label: "넘기기", fn: finish }
      ]);
    };

    listen(playSound(f.sound, canAsk ? ask : finish));
    wait();
  };

  const reveal = () => {
    S.flags[flag] = true;
    shakeScreen(true);
    S.waiting = false;
    startBattle(Object.assign({}, s, { t: "battle", cineDone: true }));
  };

  if (!seen) {
    blackout();
    render();
    buttons([{ label: "…", cls: "primary", disabled: true }]);   // 처음 보는 동안은 손잡이를 잠근다
    setTimeout(() => showVoice(reveal, true), RULE.cineBlackoutMs);
  } else {
    blackout();
    render();
    buttons([{ label: "계속", cls: "primary", fn: () => {
      showVoice(() => {}, false);   // 「계속」을 누른 그 순간이라 소리는 그대로 납니다
      render();
      buttons([{ label: "계속", cls: "primary", fn: reveal }]);
    } }]);
  }
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
    /* 고유 능력(액티브) 사용 횟수 — 이 전투(=이 적 개체) 동안만 삽니다.
     * 매번 새 S.battle 을 만드므로, 같은 적이 다시 나오면(거울 던전 반복 등장
     * 등) 자연히 0부터 다시 셉니다 — "개체 단위" 리셋을 그냥 얻는 셈입니다. */
    skillUsed: {},
    /* 회피처럼 "다음 공격"에 걸리는 것 — b.mods 와 달리 턴이 넘어가도
     * (beginTurn 이 b.mods 를 비워도) 그대로 남습니다. */
    persist: {},
    scene: scene
  };
  S.restManage = false;
  const b = S.battle;            // 딜레이가 끝났을 때 같은 전투인지 확인용

  /* startBossCine 을 거쳐 온 전투는 등장 연출에서 이미 판을 비우고 등장 대사·음성까지
   * 냈습니다 — 여기서 또 지우거나 되풀이하면 방금 본 대사가 사라지거나 음성이 겹칩니다. */
  if (!scene.cineDone) {
    /* 전투에 들어서면 판을 한 번 비운다 —
     * 앞서 이야기하던 사람의 초상과 그때까지의 대화록이 남아 있으면 정신이 없다. */
    clearLog();
    $log.classList.remove("recalling");
    drawStage(null, null, null);

    if (f.desc) say(f.desc, "sys");
    if (f.quote) say("“" + f.quote + "”", "d");
    if (f.intro && f.intro !== "TODO") say(f.intro, "bad");
    else if (f.intro === "TODO") say("(등장 대사 미작성)", "todo");
    playSound(f.sound);                    // 등장할 때 한 번 — FOES 에 sound 를 적어 둔 적만
  }
  showFoe(f.img || null, f.name, f.imgScale || null);   // 적은 배경 가운데에 선다
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
  /* ── 이번 턴에 적이 무엇을 하는가 ──────────────────────────────
   *  셋 중 하나입니다. 겹치면 위에 적은 것이 이깁니다.
   *
   *    광역   aoeEvery 턴마다. aoeFrom 을 적으면 그 턴부터 셉니다 —
   *           aoeEvery:6, aoeFrom:3 이면 3 · 9 · 15 …  안 적으면 예전처럼
   *           aoeEvery 의 배수(9 턴마다면 9 · 18 …)입니다.
   *    회복   healEvery / healFrom 도 같은 셈. 그 턴에는 때리지 않고 저를 되붙입니다.
   *    강타   3턴마다. noHeavy 를 단 적은 아예 쓰지 않습니다.
   *
   *  광역과 회복은 겨누는 데가 «전원» 이거나 «저 자신» 이라 노려지는 사람이
   *  없습니다. 그래서 aim 을 비웁니다. */
  const fnow = FOES[b.id] || {};
  const 주기 = (every, from) => {
    if (!every) return false;
    const f = (from != null) ? from : every;
    return b.turn >= f && (b.turn - f) % every === 0;
  };
  const aoeEvery = b.aoeEvery || fnow.aoeEvery || 0;
  const aoeFrom  = (b.aoeFrom != null) ? b.aoeFrom : fnow.aoeFrom;
  const hEvery   = b.healEvery || fnow.healEvery || 0;
  const hFrom    = (b.healFrom != null) ? b.healFrom : fnow.healFrom;
  b.aoe     = !!(b.boss && 주기(aoeEvery, aoeFrom));
  b.foeHeal = !b.aoe && !!(b.boss && 주기(hEvery, hFrom));
  b.heavy   = !b.aoe && !b.foeHeal &&
              !(b.noHeavy || fnow.noHeavy) && !!(b.boss && b.turn % 3 === 0);
  b.aim     = (b.aoe || b.foeHeal) ? null
                                   : (standing.length ? standing[rnd(standing.length)] : null);

  /* 강타를 준비하는 턴에는 그림이 바뀝니다.
   * data/story.js 의 FOES 에 heavyImg 로 적습니다. 안 적은 적은 그대로 서 있습니다.
   * 크게 휘두를 자세라는 말과 함께 모습이 달라지도록 한 것입니다. */
  {
    const f = FOES[b.id] || {};
    /* 난입한 것이 있으면 그쪽 그림이 이깁니다 (b.img · b.heavyImg · b.imgScale) */
    const nowImg   = b.img      || f.img      || null;
    const nowHeavy = b.heavyImg || f.heavyImg || null;
    const nowScale = b.imgScale || f.imgScale || null;
    const want = ((b.heavy || b.aoe) && nowHeavy) ? nowHeavy : nowImg;
    if (want !== b.shown) { b.shown = want; showFoe(want, b.name, nowScale); }
  }
  if (b.foeHeal) {
    /* 이번 턴엔 때리지 않고 저를 되붙입니다 — 그 전에 얼마든 깎아 두라는 뜻으로
     * 미리 알립니다. 노려지는 사람은 없습니다. */
    const f = FOES[b.id] || {};
    say("▷ " + withJosa(b.name, "이") + " " + (b.healWarn || f.healWarn ||
        "흩어진 것을 그러모은다.  스스로를 되붙이려는 듯하다."), "bad");
  } else if (b.aoe) {
    /* 노려지는 사람이 없으므로 «누구를 노린다» 대신 판 전체를 겨눈다고 알립니다.
     * 미리 알려 주어야 방어를 깔든 교정을 걸든 손쓸 자리가 생깁니다. */
    const f = FOES[b.id] || {};
    say("▷ " + withJosa(b.name, "이") + " " + (b.aoeWarn || f.aoeWarn ||
        "숨을 크게 들이쉰다.  광역 공격을 준비하는 듯하다."), "bad");
  } else if (b.aim)
    say("▷ " + withJosa(b.name, "이") + " " + withJosa(memberName(b.aim), "을") + " 노리고 있다!" +
        (b.heavy ? "  크게 휘두를 자세다." : ""), "bad");

  /* 보스가 강타·광역·회복을 준비하는 턴에는 한마디 한다.
   * data/story.js 의 FOES 에 heavyLine · aoeLine · healLine 으로 적습니다.
   * 여럿이면 배열로 — 그중 하나가 무작위로 나옵니다. */
  if (b.aoe || b.foeHeal || (b.heavy && b.aim)) {
    const f = FOES[b.id] || {};
    /* 난입한 것이 있으면 그쪽 대사가 이깁니다 (b.heavyLine) */
    let line = b.foeHeal ? (b.healLine || f.healLine)
             : b.aoe     ? (b.aoeLine  || f.aoeLine)
             :             (b.heavyLine || f.heavyLine);
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

  checkLinkSkills();

  /* ── 설득 전투 ──────────────────────────────────────────────────
   *  scene.persuade 를 단 전투는 체력을 깎아 이기는 대신, 정해진 턴수를
   *  버티면 설득이 성공한 것으로 치고 끝납니다(persuadeEnd 참고). 그
   *  턴이 오기 전까지는 그냥 보통 전투처럼 지고 이길 수 있습니다 — 다만
   *  이 전투는 lose:"story"가 아니므로 전멸하면 보통 패배(재도전)입니다.
   *
   *      { t:"battle", foe:"…",
   *        persuade: { turns: 4, lines: { 1:[…], 2:[…], 3:[…], 4:[…] } } }
   *
   *  lines 의 각 턴 배열 원소는 { who, text }(대사, battleSay 로) 또는
   *  { text }(who 없이 — 지문, say 로) 입니다. 전투 화면 중간에 대사를
   *  끼워 넣는 자리가 이걸로 처음 생겼습니다(7장 「호감이 끝나는」).
   *  caption:true 를 더 달면 그 줄만 무대 가운데에 큰 글씨로도 띄웁니다
   *  (showBattleCaption 참고) — 특히 강조하고 싶은 대사에만 답니다. */
  const persuadeLines = b.scene.persuade && b.scene.persuade.lines && b.scene.persuade.lines[b.turn];
  if (persuadeLines) {
    divider();
    persuadeLines.forEach(line => {
      if (line.who) battleSay(line.who, line.text);
      else say(line.text, "sys");
      if (line.caption) showBattleCaption(line.text);
    });
  }

  askNext();
}

/* ── 연계 효과 ──────────────────────────────────────────────────
 *  data/skills.js 의 LINK_SKILLS 를 매 턴 검사합니다. 조건이 맞으면
 *  who 가 한마디 선창하고, 같은 태그(pickTag) 를 두른 편성원 중 하나를
 *  무작위로 뽑아 그 차례 공격력을 올립니다 — 실제 배율은 b.mods 의
 *  "_linkMult"/"_linkLabel" 에 남겨 resolveTurn() 의 swing() 이 읽습니다.
 *  who 자신이 뽑히면 selfLine, 아니면 otherLine 으로 대답합니다.
 */
function linkSkillList() {
  return (typeof LINK_SKILLS !== "undefined" && LINK_SKILLS) ? LINK_SKILLS : [];
}
function battleSay(who, text) {
  const w = document.createElement("p");
  w.className = "who";
  w.textContent = nameOf(who);
  $log.appendChild(w);
  say(text, "d");
  /* 지금 화면에 이미 적으로 떠 있는 상대(S.battle.id)는 초상을 다시
   * 띄우지 않습니다 — 각본 전투(설득전 등) 중 적 본인의 대사에
   * 겹쳐 그리지 않기 위함입니다. */
  if (who !== S.battle.id) {
    const pt = portraitOf(who);
    if (pt) showSpeaker(pt, nameOf(who));
  }
}
function checkLinkSkills() {
  const b = S.battle;
  linkSkillList().forEach(ls => {
    if (S.party.indexOf(ls.who) < 0 || !alive(ls.who)) return;
    if (memberTitle(ls.who).indexOf(ls.needTitle) < 0) return;
    if (!activeSynergies().some(sy => sy.name === ls.synergyName)) return;

    const giftBoosted = ls.giftName && equippedGifts().some(g => g.name === ls.giftName);
    const every = giftBoosted ? (ls.giftEvery || ls.every) : ls.every;
    const start = ls.startTurn != null ? ls.startTurn : every;
    if (b.turn < start || (b.turn - start) % every !== 0) return;

    const pool = S.party.filter(w => w && alive(w) && memberTitle(w).indexOf(ls.pickTag) >= 0);
    if (!pool.length) return;
    const target = pool[rnd(pool.length)];

    /* 보조 교육위원 강화 — advisorName 을 세우고 있으면 atkMult 대신
     * advisorMult 를 씁니다. giftName/giftEvery(주기 단축)와는 독립된
     * 자리라 함께 적용됩니다. */
    const advisorBoosted = ls.advisorName && equippedAdvisors().some(a => a.name === ls.advisorName);
    b.mods[target + "_linkMult"] = advisorBoosted ? (ls.advisorMult || ls.atkMult) : ls.atkMult;
    b.mods[target + "_linkLabel"] = ls.label || "연계";

    const call = Array.isArray(ls.callLines) ? ls.callLines[rnd(ls.callLines.length)] : ls.callLines;
    if (call) battleSay(ls.who, call);
    const reply = (target === ls.who) ? ls.selfLine : ls.otherLine;
    if (reply) battleSay(target, reply);
  });
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

/* ── 작성위원 고유 능력 — 액티브 손잡이 ─────────────────────────
 *  같은 적에게 한 번(갑주만 8·12단계에서 두 번·세 번까지 — v.uses 참고).
 *  b.skillUsed 는 이 전투(=이 적 개체) 동안만 살아, 새 전투마다 0부터
 *  다시 셉니다 — "개체 단위" 리셋을 그대로 얻는 자리입니다. */
function skillUsesAllowed(v) {
  return (v && typeof v === "object" && v.uses) ? v.uses : 1;
}
function skillAvailable(who) {
  const skill = UNIQUE_SKILLS[who];
  const b = S.battle;
  if (!skill || skill.kind !== "active" || !b) return null;
  const level = syncLevel(who);
  if (level < 1) return null;
  /* 도발은 이번 턴이 광역이면 노려지는 대상 자체가 없어 쓸 수 없다 */
  if (who === "song_hamin" && b.aoe) return null;
  const v = skillTierValue(skill, level);
  const used = (b.skillUsed && b.skillUsed[who]) || 0;
  if (used >= skillUsesAllowed(v)) return null;
  return { skill, level, v };
}

/* who 가 손잡이를 눌러 고유 능력을 쓴다. 손해 볼 일이 없는(교정·독촉 같은)
 * 관리력과 달리 이건 그 사람의 이번 차례를 대신하는 명령이라, 고르고 나면
 * 바로 askNext() 로 다음 사람에게 넘어갑니다(공격·방어와 같은 자리). */
function useUniqueSkill(who) {
  const b = S.battle;
  const avail = skillAvailable(who);
  if (!avail) return askNext();
  const { skill, v } = avail;
  b.skillUsed[who] = (b.skillUsed[who] || 0) + 1;

  switch (who) {
    case "cha_minjun":                     // 흡혈 — 공격으로 치고, 준 피해의 v% 회복
      b.cmds[who] = "attack";
      b.mods[who + "_vamp"] = v;
      break;
    case "kim_haju":                       // 반격 — 맞고 살아 있으면 ×v 확정 치명타로 반격
      b.cmds[who] = "counter";
      b.mods[who + "_counter"] = v;
      break;
    case "park_suo":                       // 회피 — 이번 공격 완전 회피, 다음 공격 ×v 확정 치명타
      b.cmds[who] = "evade";
      b.mods[who + "_evadeActive"] = v;
      break;
    case "song_hamin":                     // 도발 — 표적을 자신으로, 받는 피해 v% 감소
      b.cmds[who] = "taunt";
      b.mods[who + "_taunt"] = v;
      b.aim = who;
      break;
    case "chu_minsu":                      // 책임 — 아군 전체 피해를 대신, v% 경감
      b.cmds[who] = "sacrifice";
      b.mods._sacrificeBy = who;
      b.mods._sacrificePct = v;
      break;
    case "lee_gyeongwon":                  // 겹살 — 공격 두 번, 공격력은 v%(음수)만큼 반영
      b.cmds[who] = "attack";
      b.mods[who + "_double"] = true;
      b.mods[who + "_atkMult"] = 1 + v / 100;
      break;
    case "kim_duhyeon":                    // 강공 — 공격력 ×v, 받는 피해는 늘 ×2.0
      b.cmds[who] = "attack";
      b.mods[who + "_atkMult"] = v;
      b.mods[who + "_fragile"] = 2.0;
      break;
    case "seong_siyun":                    // 갑주 — 받는 피해 v.pct 만큼 감소(1이면 완전 무효)
      b.cmds[who] = "shield";
      b.mods[who + "_immune"] = v.pct;
      break;
  }
  say(withJosa(memberName(who), "이") + " 「" + skill.name + "」을 쓴다.", "good");
  askNext();
}

/* 손잡이보다 아래, 화면 맨 아래 — 지금 차례인 사람의 고유 능력 설명만
 * (회색 바탕에 흰 글자, .uskill). 전투 밖이거나 그 사람에게 능력이 없거나
 * 아직 1단계가 안 됐으면 아예 비운다. */
function renderUniqueSkillInfo(who) {
  const box = document.getElementById("uniqueskills");
  if (!box) return;
  const skill = who && UNIQUE_SKILLS[who];
  const level = who ? syncLevel(who) : 0;
  if (!S.battle || !skill || level < 1) { box.innerHTML = ""; return; }
  const v = skillTierValue(skill, level);
  box.innerHTML = '<span class="uskill"><b>' + skill.name + '</b> ' + skill.desc(v) + '</span>';
}

function askNext() {
  const b = S.battle;
  const pending = S.party.filter(w => w && alive(w) && !b.cmds[w]);
  if (!pending.length) { resolveTurn(); return; }
  b.cur = pending[0];
  render();

  const who = b.cur;
  renderUniqueSkillInfo(who);
  /* 손잡이는 늘 같은 자리에 섭니다 — 남은 사람 수에 따라 사라지지 않도록 */
  const list = [];

  /* 제1발톱 「지령」— 이 인격을 장착한 사람 차례가 열리는 순간, 공격·
   * 방어 중 하나가 무작위로 지령으로 내려와 그 손잡이를 연두색으로
   * 짚어 줍니다. 그대로 따르면 그 행동만 강화됩니다(swing()·effStats()
   * 참고) — 실제 배율은 claw1SynergyBonus() 가 얹힙니다. b.mods 는
   * beginTurn() 마다 비므로, 한 턴에 한 번만 무작위로 내려오고 그 뒤로는
   * 그대로 유지됩니다. */
  let claw1Order = null;
  if (memberTitle(who).indexOf("제1발톱") >= 0) {
    const key = who + "_claw1Order";
    if (!b.mods[key]) b.mods[key] = rnd(2) ? "guard" : "attack";
    claw1Order = b.mods[key];
  }

  /* '전원 공격' 은 늘 첫 손잡이입니다. 한 사람만 남았어도 자리를 지킵니다.
   * P 로도 눌립니다. */
  list.push({ label: "전원 공격", cls: "primary", key: "p",
              fn: () => { pending.forEach(w => b.cmds[w] = "attack"); askNext(); } });

  list.push({ label: "공격", cls: claw1Order === "attack" ? "claw1" : "",
              fn: () => { b.cmds[who] = "attack"; askNext(); } });
  list.push({ label: "방어", cls: claw1Order === "guard" ? "claw1" : "", fn: () => {
      b.cmds[who] = "guard";
      b.manage = Math.min(manageCap(), b.manage + RULE.guardManage);
      askNext();
    } });

  /* 작성위원 고유 능력 — 방어 바로 옆, 편성된 그 사람에게만 뜬다 */
  const skillNow = skillAvailable(who);
  if (skillNow) {
    list.push({ label: skillNow.skill.name, cls: "skill",
                fn: () => useUniqueSkill(who) });
  }

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

  /* 첫 전투의 첫 턴 — 명령 손잡이가 다 선 뒤에 한 번만 덮습니다 */
  if (b.turn <= 1) tutorOnce("battle");
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

  if (w.clear) {
    /* where 처럼 배열로도 적을 수 있습니다 — clear: ["mirrorHard", "mirrorExtreme"] */
    const want = Array.isArray(w.clear) ? w.clear : [w.clear];
    if (want.indexOf(cleared) < 0) return false;
  }
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
    if (g.event) { addEvent(g.event); say(eventCurName() + " " + g.event + " 획득.", "gain"); }
    saveVault();
  });
}

/* 「3을」이 아니라 「셋을」로 — 세는 말은 우리말 수사로 */
function countWord(n) {
  const w = { 1: "하나를", 2: "둘을", 3: "셋을", 4: "넷을", 5: "다섯을",
              6: "여섯을", 7: "일곱을", 8: "여덟을", 9: "아홉을", 10: "열을" };
  return w[n] || (n + "을");
}

/* 조사도 세는 말도 안 붙는 맨 꼴 — 「보스가 셋까지 섞입니다」의 그 «셋» */
function countBare(n) {
  const w = { 1: "하나", 2: "둘", 3: "셋", 4: "넷", 5: "다섯",
              6: "여섯", 7: "일곱", 8: "여덟", 9: "아홉", 10: "열" };
  return w[n] || String(n);
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
    if (f2.img) { b.img = f2.img; showFoe(f2.img, f2.name, f2.imgScale || null); b.shown = f2.img; }
    if (f2.heavyImg) b.heavyImg = f2.heavyImg;
    if (f2.imgScale) b.imgScale = f2.imgScale;
    say("체력 " + b.hp + " / " + b.maxhp + "　공격 " + b.atk + "　방어 " + b.def, "sys");
    shakeScreen(true);
  };

  /* ── 연계 추가타 ──────────────────────────────────────────────
   *  data/skills.js 의 LINK_BONUS_ATTACKS — 위 「연계 효과」와 달리
   *  who 의 «다음 차례» 대신, who 가 방금 자기 공격을 마친 자리에서
   *  곧바로 다른 편성원 하나를 뽑아 추가 공격을 한 번 더 꽂습니다.
   *  뽑힌 사람의 이번 차례 행동과는 무관한 «덤» 입니다. swing() 이
   *  who 의 공격(과 겹살까지)을 다 끝낸 뒤 한 번만 부릅니다.
   *  적이 이 추가타로 쓰러지면 afterAllies() 로, 아니면 next() 로 이어갑니다. */
  const linkBonusList = () =>
    (typeof LINK_BONUS_ATTACKS !== "undefined" && LINK_BONUS_ATTACKS) ? LINK_BONUS_ATTACKS : [];
  const checkLinkBonus = (who, next) => {
    const ls = linkBonusList().find(x => x.who === who);
    if (!ls || S.party.indexOf(ls.who) < 0 || !alive(ls.who) ||
        memberTitle(ls.who).indexOf(ls.needTitle) < 0 ||
        !activeSynergies().some(sy => sy.name === ls.synergyName))
      return next();

    const start = ls.startTurn != null ? ls.startTurn : ls.every;
    if (b.turn < start || (b.turn - start) % ls.every !== 0) return next();

    const pool = S.party.filter(w =>
      w && w !== ls.who && alive(w) && memberTitle(w).indexOf(ls.pickTag) >= 0);
    if (!pool.length) return next();
    const target = pool[rnd(pool.length)];

    const call = Array.isArray(ls.callLines) ? ls.callLines[rnd(ls.callLines.length)] : ls.callLines;
    if (call) battleSay(ls.who, call);
    const reply = (ls.replyLines && ls.replyLines[target]) || ls.defaultReply;
    if (reply) battleSay(target, reply);

    setTimeout(() => {
      if (!same()) return;
      const st = effStats(target);
      const arrestCut = Math.min(0.9, RULE.arrestCut + advisorEffect().arrest);
      const fdef = b.mods.arrest ? Math.round(b.def * (1 - arrestCut)) : b.def;
      let dmg = st.atk + rnd(4) - fdef;
      const crit = Math.random() < critRate();
      if (crit) dmg *= critMult();
      dmg = Math.max(1, Math.floor(dmg));
      b.hp -= dmg;
      say((crit ? (memberName(target) + "의 치명적인 공격! — " + dmg + " 피해")
                : (memberName(target) + "의 공격 — " + dmg + " 피해")) +
          " (" + (ls.label || "연계") + ")", crit ? "crit" : "hit");
      foeHit(0);
      checkJoinIn();
      render();
      if (b.hp <= 0) return setTimeout(afterAllies, RULE.turnGapMs);
      next();
    }, RULE.allyStepMs);
  };

  /* ① 아군이 하나씩 때린다 */
  const swing = () => {
    if (!same()) return;
    if (i >= hitters.length) return setTimeout(afterAllies, RULE.foePauseMs);

    const who = hitters[i];
    const st = effStats(who);
    /* 체포는 이번 턴 «적 방어» 를 깎습니다. 뺄셈 피해라 방어 한 점이 크게 먹히므로,
     * 방어가 두꺼운 상대에게 걸수록 효과가 큽니다. */
    const arrestCut = Math.min(0.9, RULE.arrestCut + advisorEffect().arrest);
    const fdef = b.mods.arrest
      ? Math.round(b.def * (1 - arrestCut))
      : b.def;
    /* 강공·겹살 — 공격력 배율. 연계 효과 — LINK_SKILLS 가 건 별도 배율.
     * 제1발톱 — 이번 차례에 공격을 골랐고, 그게 턴 머리에서 무작위로
     * 내려온 지령 그대로였다면 이 공격에만 배율이 붙는다(claw1SynergyBonus
     * 참고). 셋 다 걸리면 곱해집니다. 회피 보상 — 지난 턴에 걸어 둔
     * 확정 치명타 */
    const skillMult = b.mods[who + "_atkMult"] || 1;
    const linkMult  = b.mods[who + "_linkMult"] || 1;
    /* 흡혈로 넘친 회복(다 찬 뒤로도 남은 몫)을 다음 공격력에 플랫로 얹는다 —
     * 그 공격 한 번에만 쓰고 지운다(아래 evadeBonus와 같은 결). */
    const vampBonus = b.persist[who + "_vampBonus"] || 0;
    const claw1Mult = (b.mods[who + "_claw1Order"] === "attack") ? (1.5 + claw1SynergyBonus()) : 1;
    const atkMult = skillMult * linkMult * claw1Mult;
    /* 지령을 따랐을 때, 그 인격을 낀 사람 몫의 한마디를 공격 직전에
     * 한 번 보여 준다 — data/characters.js 의 id(또는 SUPPORTS 항목)
     * 에 적힌 claw1Line 을 그대로 읽는다(claw1LineFor 참고). */
    if (claw1Mult !== 1) {
      const line = claw1LineFor(who);
      if (line) battleSay(who, line);
    }
    const evadeBonus = b.persist[who + "_evadeBonus"];
    let dmg = st.atk * atkMult + vampBonus + rnd(4) - fdef;
    if (b.mods[who + "_push"]) dmg *= RULE.pushMult + advisorEffect().push;
    const crit = evadeBonus ? true : Math.random() < critRate();
    if (crit) dmg *= evadeBonus || critMult();
    dmg = Math.max(1, Math.floor(dmg));
    b.hp -= dmg;
    say((crit ? (memberName(who) + "의 치명적인 공격! — " + dmg + " 피해")
              : (memberName(who) + "의 공격 — " + dmg + " 피해")) +
        (b.mods[who + "_push"] ? " (독촉)" : "") +
        (b.mods.arrest ? " (체포)" : "") +
        (skillMult !== 1 ? " (" + UNIQUE_SKILLS[who].name + ")" : "") +
        (linkMult !== 1 ? " (" + b.mods[who + "_linkLabel"] + ")" : "") +
        (claw1Mult !== 1 ? " (지령)" : "") +
        (vampBonus ? " (흡혈 과잉회복 +" + vampBonus + ")" : "") +
        (evadeBonus ? " (회피 보상)" : ""), crit ? "crit" : "hit");
    if (evadeBonus) delete b.persist[who + "_evadeBonus"];
    if (vampBonus) delete b.persist[who + "_vampBonus"];

    /* 흡혈 — 자신 최대 체력의 v% 만큼 회복(사용자 지침 2026-09-02 — 준 피해
     * 기준에서 자신 체력 기준으로 바꿈). 다 찬 뒤로 넘친 만큼은 흘리지 않고
     * b.persist 에 얹어 두어, 다음 자기 공격 한 번에 플랫 공격력으로 씁니다. */
    if (b.mods[who + "_vamp"]) {
      const heal = Math.round(maxHp(who) * b.mods[who + "_vamp"] / 100);
      const before = curHp(who);
      setHp(who, before + heal);
      const overheal = Math.max(0, before + heal - maxHp(who));
      say(memberName(who) + " — " + (heal - overheal) + " 회복 (흡혈)" +
          (overheal ? "　·　넘친 " + overheal + "은 다음 공격력으로" : ""), "good");
      if (overheal > 0) b.persist[who + "_vampBonus"] = (b.persist[who + "_vampBonus"] || 0) + overheal;
    }

    foeHit(0);
    checkJoinIn();                 // 체력이 내려가면 난입할 것이 있는지 본다
    render();

    if (b.hp <= 0) return setTimeout(afterAllies, RULE.turnGapMs);

    /* 겹살 — 같은 사람이 한 번 더 친다(공격력은 이미 깎인 채로) */
    if (b.mods[who + "_double"] && !b.mods[who + "_doubleDone"]) {
      b.mods[who + "_doubleDone"] = true;
      return setTimeout(swing, RULE.allyStepMs);   // i는 그대로 — 같은 사람을 다시
    }
    checkLinkBonus(who, () => { i++; setTimeout(swing, RULE.allyStepMs); });
  };

  /* ② 다 때렸으면 결판을 본다 */
  const afterAllies = () => {
    if (!same()) return;
    if (b.hp <= 0) return victory();
    if (b.loseOk && b.hp <= b.maxhp * RULE.scriptedOut) return scriptedEnd();
    if (b.scene.persuade && b.turn >= b.scene.persuade.turns) return persuadeEnd();

    const targets = S.party.filter(w => w && alive(w));
    if (!targets.length) return defeat();
    foeTurn(targets);
  };

  /* ③ 적이 되받아친다 — 이때 화면이 흔들린다 */
  const foeTurn = (targets) => {
    if (!same()) return;

    /* 책임 — 이번 턴 누가 맞든 추민수가 대신 받는다(경감까지) */
    const hero = (b.mods._sacrificeBy && alive(b.mods._sacrificeBy)) ? b.mods._sacrificeBy : null;
    const heroPct = b.mods._sacrificePct || 0;

    /* ── 광역 공격 ─────────────────────────────────────────────
     *  한 사람이 아니라 서 있는 «전원» 을 칩니다. 한 대씩은 강타보다 가볍게(1.2배)
     *  잡았습니다 — 셋이 한꺼번에 맞으므로 강타와 같은 배수를 쓰면 그 자리에서 끝납니다.
     *  방어와 교정은 사람마다 그대로 쳐 줍니다. 도발·회피·반격은 "노려진 한 사람"이
     *  전제라 광역에는 걸리지 않습니다(도발은 애초에 광역 턴엔 손잡이가 안 뜹니다). */
    /* ── 회복 ─────────────────────────────────────────────────
     *  때리는 대신 저를 되붙입니다. 회복량은 수를 박지 않고 «제 공격력의
     *  몇 배»(healAtk)로 적습니다 — 거울·철도가 공격력에 배수를 곱하므로,
     *  배수가 오르면 회복량도 저절로 따라 오릅니다.
     *  최대 체력을 넘겨 차지는 않습니다. */
    if (b.foeHeal) {
      const f = FOES[b.id] || {};
      const k = b.healAtk || f.healAtk || 0;
      const heal = Math.max(1, Math.round(b.atk * k));
      const before = b.hp;
      b.hp = Math.min(b.maxhp, b.hp + heal);
      const 오른몫 = b.hp - before;
      say("▶ " + withJosa(b.name, "이") + " 스스로를 되붙였다 — " +
          (오른몫 > 0 ? "체력 " + 오른몫 + " 회복" : "더 채울 곳이 없다") +
          "　(" + b.hp + " / " + b.maxhp + ")", 오른몫 > 0 ? "heavy" : "sys");
      render();
      return setTimeout(() => { if (same()) beginTurn(); }, RULE.turnGapMs);
    }

    if (b.aoe) {
      shakeScreen(true);
      say("▶ " + b.name + "의 광역 공격!", "heavy");

      const hitOne = t => {
        const st = effStats(t);
        let dmg = b.atk * 1.2 + rnd(4) - st.def;
        if (b.cmds[t] === "guard") dmg *= RULE.guardCut;
        if (b.mods[t + "_guard"]) dmg *= Math.max(0.05, RULE.correctCut - advisorEffect().correct);
        if (b.mods[t + "_immune"]) dmg *= (1 - b.mods[t + "_immune"]);
        if (b.mods[t + "_fragile"]) dmg *= b.mods[t + "_fragile"];
        return Math.max(1, Math.floor(dmg));
      };

      if (hero) {
        /* 각자 몫을 계산해 경감한 뒤, 전부 추민수 한 명에게 몬다 */
        let total = 0;
        targets.forEach(t => {
          const dmg = heroPct ? Math.max(1, Math.floor(hitOne(t) * (1 - heroPct / 100))) : hitOne(t);
          total += dmg;
        });
        setHp(hero, curHp(hero) - total);
        say("　" + memberName(hero) + "이 전원의 몫을 대신 받았다 — " + total + " 피해 (책임)", "heavy");
        if (!alive(hero)) say(withJosa(memberName(hero), "이") + " 쓰러졌다.", "bad");
      } else {
        targets.forEach(t => {
          const dmg = hitOne(t);
          setHp(t, curHp(t) - dmg);
          say("　" + memberName(t) + "에게 " + dmg + " 피해" +
              (b.cmds[t] === "guard" ? " (방어)" : "") +
              (b.mods[t + "_guard"] ? " (교정)" : "") +
              (b.mods[t + "_immune"] ? " (갑주)" : "") +
              (b.mods[t + "_fragile"] ? " (강공)" : ""), "heavy");
          if (!alive(t)) say(withJosa(memberName(t), "이") + " 쓰러졌다.", "bad");
        });
      }
      render();
      if (!S.party.some(alive)) return setTimeout(defeat, RULE.turnGapMs);
      return setTimeout(() => { if (same()) beginTurn(); }, RULE.turnGapMs);
    }

    /* 턴 머리에서 예고한 그 표적을 그대로 친다.
     * 그 사이 쓰러졌다면(첨삭 전이라면) 서 있는 사람 중에서 다시 고른다. */
    const heavy = !!b.heavy;
    let t = (b.aim && targets.indexOf(b.aim) >= 0) ? b.aim : targets[rnd(targets.length)];

    /* 책임 — 노려진 게 누구든 추민수가 대신 받는다 */
    if (hero && t !== hero) t = hero;

    /* 회피 — 노려진 사람이 회피를 골랐으면 이번 공격은 완전히 피한다.
     * 다음 공격에 걸릴 확정 치명타는 b.persist 에 넣어 턴이 넘어가도 남긴다. */
    if (b.mods[t + "_evadeActive"]) {
      say(memberName(t) + " — 완전히 피했다! (회피)", "good");
      b.persist[t + "_evadeBonus"] = b.mods[t + "_evadeActive"];
      render();
      if (!S.party.some(alive)) return setTimeout(defeat, RULE.turnGapMs);
      return setTimeout(() => { if (same()) beginTurn(); }, RULE.turnGapMs);
    }

    const st = effStats(t);
    let dmg = (heavy ? b.atk * 1.7 : b.atk) + rnd(4) - st.def;
    /* 반격(김하주) 몫의 바탕 — 방어·교정·도발·갑주·강공 등 «경감»이 걸리기
     * 전의 값입니다(사용자 지침 2026-09-02 — 원래는 자기 공격력 기반의
     * 확정 치명타였다가, 실제로 맞은 피해를 되돌려주는 것으로 바뀜). */
    const rawDmg = Math.max(1, Math.floor(dmg));
    if (b.cmds[t] === "guard") dmg *= RULE.guardCut;
    if (b.mods[t + "_guard"]) dmg *= Math.max(0.05, RULE.correctCut - advisorEffect().correct);
    if (b.mods[t + "_taunt"]) dmg *= (1 - b.mods[t + "_taunt"] / 100);
    if (b.mods[t + "_immune"]) dmg *= (1 - b.mods[t + "_immune"]);
    if (b.mods[t + "_fragile"]) dmg *= b.mods[t + "_fragile"];
    if (t === hero && heroPct) dmg *= (1 - heroPct / 100);
    dmg = Math.max(1, Math.floor(dmg));
    setHp(t, curHp(t) - dmg);

    shakeScreen(heavy);

    /* 강타는 보통 공격과 한눈에 갈리도록 따로 적습니다 */
    say((heavy ? "▶ " + b.name + "의 강타! — " : b.name + "의 공격 — ") +
        memberName(t) + "에게 " + dmg + " 피해" +
        (b.cmds[t] === "guard" ? " (방어)" : "") +
        (b.mods[t + "_guard"] ? " (교정)" : "") +
        (b.mods[t + "_taunt"] ? " (도발)" : "") +
        (b.mods[t + "_immune"] ? " (갑주)" : "") +
        (b.mods[t + "_fragile"] ? " (강공)" : "") +
        (t === hero && heroPct ? " (책임)" : ""), heavy ? "heavy" : "bad");

    if (!alive(t)) say(withJosa(memberName(t), "이") + " 쓰러졌다.", "bad");
    render();

    /* 반격 — 맞고도 살아 있으면, 방금 «경감되기 전» 받은 피해(rawDmg)에
     * ×v 를 곱해 그대로 되돌려준다(사용자 지침 2026-09-02). */
    if (b.mods[t + "_counter"] && alive(t)) {
      const cdmg = Math.max(1, Math.floor(rawDmg * b.mods[t + "_counter"]));
      b.hp -= cdmg;
      say(memberName(t) + "의 반격! — " + cdmg + " 피해", "crit");
      foeHit(0);
      checkJoinIn();
      render();
      if (b.hp <= 0) return setTimeout(victory, RULE.turnGapMs);
    }

    if (!S.party.some(alive)) return setTimeout(defeat, RULE.turnGapMs);
    setTimeout(() => { if (same()) beginTurn(); }, RULE.turnGapMs);
  };

  if (!hitters.length) setTimeout(afterAllies, RULE.foePauseMs);
  else swing();
}

function victory() {
  const b = S.battle;
  /* 거울굴절철도 결과 카드에 적을 총 턴수 — 이긴 전투의 턴만 더합니다.
   * 지고 다시 도전하면 b.turn 이 0부터 다시 세므로(startBattleFight), 그 턴은 안 셉니다. */
  if (S.mirror) S.mirrorRunTurns = (S.mirrorRunTurns || 0) + b.turn;
  if (!S.arc) S.arc = { kills: 0, retribution: {} };
  /* 광신 — 이번 갈래 처치 수. 「우생회」 시너지가 발동 중이면 50% 더
   * 받습니다(사용자 지침 2026-09-02 — "광신 스택이 소수점 받도록") —
   * 그래서 정수로 내림하지 않고 소수점까지 그대로 쌓고, 그대로 보여 줍니다
   * (passiveStackCount·파티 카드 배지 모두 이 값을 그대로 읽습니다). */
  const arcGain = activeSynergies(S.party).some(sy => sy.name === "우생회") ? 1.5 : 1;
  S.arc.kills = (S.arc.kills || 0) + arcGain;
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

/* 설득으로 끝나는 전투 — 정해진 턴수를 버텨 이긴 것으로 칩니다.
 * scriptedEnd 와 달리 foeFalls() 를 부르지 않습니다 — 적이 쓰러져 사라지는
 * 연출 없이, 화면에 그대로 선 채로 다음 이야기(설득 성공 대사 자체가
 * persuade.lines 마지막 턴에 이미 나온 뒤입니다)로 곧장 이어집니다. */
function persuadeEnd() {
  const b = S.battle;
  healParty(RULE.winHeal, null);
  if (b.scene.party) { forcePartyPop(); S.battleForced = false; }
  S.battle = null;
  S.waiting = false;
  render();
  cont();
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

  /* 익스트림 거울 던전·거울굴절철도처럼 길잡이가 중간에 들르는 갈래는, 그 자리를
   * 지난 뒤에 지면 그 보스만 다시 하는 대신 «길잡이를 다시 만나는 자리»로 돌아갑니다
   * — 체력·관리력을 다시 채우고(case "rest") 편성도 다시 손볼 수 있게(rest.party).
   * 아직 그 자리를 지나지 않았으면(앞쪽 보스에서 졌으면) 예전처럼 그 보스만 다시 합니다. */
  const mrule = S.mirror ? mirrorRuleNow() : null;
  /* 2호선은 순환마다 이형우의 베이스캠프가 그 자리를 합니다 (SCENE_EXT.railCamp).
   * 1순환 안에서 지면 아직 캠프가 없으므로, 다른 갈래처럼 그 보스만 다시 합니다. */
  const 쉼표 = mrule && (mrule.rest || (mrule.loop && mrule.camp));
  const cp = (쉼표 && S.mirrorCheckpoint != null && S.sc - 1 > S.mirrorCheckpoint)
    ? S.mirrorCheckpoint : null;
  const 쉼표주인 = cp == null ? null : (mrule.rest ? mrule.rest.who : mrule.camp.who);

  /* 테마팩 갈래(사용자 지침 2026-09-02) — 편성을 다시 짤 수 없고, 팩을
   * 고르기 전 자리(테마팩 선택 화면)로 그대로 돌아갑니다. 이번 라운드에서
   * 깬 팩이 없으므로 S.railSave 는 손대지 않은 그대로이고, resumeMirror()
   * 가 그 자리를 다시 짓습니다. */
  const packCP = !!(mrule && mrule.packRounds && S.railSave && S.railSave.key === mrule.key);

  buttons([
    packCP
      ? { label: "테마팩 선택으로", cls: "primary", fn: () => {
          S.waiting = false;
          resumeMirror();
        } }
      : cp != null
      ? { label: 쉼표주인 + "에게로", cls: "primary", fn: () => {
          S.waiting = false;
          S.sc = cp;
          next();
        } }
      : { label: "다시 도전", cls: "primary", fn: () => {
          S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
          S.waiting = false; startBattle(scene);
        } },
    /* 이 전투가 정해진 인원으로만 돌아가는 것이거나, 돌아갈 자리(cp·팩)에서
     * 편성을 다시 손볼 수 없으면, 패배 후 편성을 바꿔 강제를 우회하지
     * 못하도록 이 손잡이 자체를 감춘다 (forcePartyPush 참고) */
    (packCP || cp != null || scene.party) ? null : { label: "편성 바꾸기", fn: () => openParty(() => {
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
  /* 완주했으므로 저장해 둔 이어하기 자리는 이제 필요 없습니다 — mirrorClear()가
   * S.railSave 를 지우는 것과 같은 논리입니다. */
  S.storySave = null;
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
  /* 이벤트 재화 — 원고료와 달리 «다시 마쳐도» 들어옵니다 (적게).
   * 맨 마지막 장이면 더 많이 줍니다. 얹어 주는 몫은 gainEvent 가 셈합니다. */
  gainEvent(eventStoryGain(c, first));
  saveVault();
  save();
  const hasNext = S.ch + 1 < CHAPTERS.length;

  /* 첫 장을 처음 마쳤을 때만 — 다음에 무엇을 하면 되는지 일러 둡니다.
   * 여기서 상점을 한 번 열어 보지 않으면 인격이 하나도 없는 채로 1장에 갑니다. */
  /* 동기화가 열리는 장을 «처음» 마쳤을 때만 한 번 알립니다.
   * 이미 마쳤던 장을 다시 밟으면 first 가 거짓이라 두 번 나오지 않습니다. */
  if (first && c.id === SYNC_UNLOCK_CH) {
    divider();
    sayBold("'동기화' 기능이 해금되었습니다!", "good");
    say("유리창의 [동기화] 에서 인격 파편으로 작성위원의 동기화 단계를 올릴 수 있습니다.", "sys");
  }

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
  resetArcIfIdle();
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
         '<div class="grid" data-tut="party-advisor">';
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
         '<div class="grid" data-tut="party-sinners">';
    Object.keys(SINNERS).forEach(who => {
      const s = SINNERS[who];
      /* 지금 편성할 수 없는 사람 — banParty 참고. 고를 수 없도록
       * data-who 를 아예 달지 않습니다(아래 클릭 손잡이가 못 찾습니다). */
      if (S.partyBan && S.partyBan.indexOf(who) >= 0) {
        h += '<div class="slot">' +
               '<div class="lock">' + s.name + '</div>' +
               '<div class="sub">지금은 함께할 수 없습니다</div>' +
             '</div>';
        return;
      }
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
          /* 이미 교육위원으로 서 있는 사람이면(예: 이정빈=하축론) 지원으로 못 세웁니다 */
          const advBlock = sel < 0 && supportBlockedByAdvisor(sp);
          if (advBlock) {
            h += '<div class="slot"><div class="lock">' + sp.name + '</div>' +
                 '<div class="sub">' + withJosa(advBlock, "을") +
                 ' 교육위원으로 세운 동안은 지원으로 함께할 수 없습니다.</div></div>';
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
       * 예전에는 들어갈 때만 봤습니다 — 5장 도중에 성시윤을 빼도 그냥 넘어갔습니다.
       * 다만 지금 편성 금지된 사람(banParty — 예: 스스로 적으로 돌아선 차민준)은
       * 이 검사에서 잠깐 빼 줍니다. 안 그러면 금지 자체가 불가능해집니다. */
      const c = curChapter();
      if (c && !S.mirror) {
        const miss = chapterNeeds(c).filter(w =>
          chosen.indexOf(w) < 0 && !(S.partyBan && S.partyBan.indexOf(w) >= 0));
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
  tutorOnce("party");   /* 편성에 처음 들어왔을 때 한 번 */
}

/* 인격 장착 — 사람이 많고 인격은 더 많아서, 접어 둔 채로 엽니다.
 *  · 사람 이름줄을 누르면 그 사람만 펴지고 접힙니다.
 *  · 「보유한 것만」 을 끄면 아직 없는 인격도 함께 보입니다.
 *  펴 둔 사람과 이 설정은 창을 닫아도 그대로 남습니다. */
let EQUIP_OPEN = {};        // who -> 펴 두었나
let EQUIP_OWNED_ONLY = true;

function openEquip(back) {
  /* 강제 편성 중이면(장 강제·전투 강제 — forcePartyPush 참고) 알려 준다.
   * 아래 각 줄도 지금 편성에 든 사람만 금테를 둘러 눈에 띄게 한다. */
  const forced = S.partyStack && S.partyStack.length > 0;
  const forcedNames = forced ? S.party.filter(Boolean).map(w =>
    isSupport(w) ? (supportBy(w) || {}).name || w :
    isAlly(w)    ? (allyBy(w)    || {}).name || w :
    SINNERS[w]   ? SINNERS[w].name : w
  ).join('・') : '';

  let h = '<h2>인 격 장 착</h2>' +
          '<div class="hint">사람 이름을 누르면 그 사람의 인격이 펴집니다. ' +
          '장착 중인 인격은 이름줄에 함께 적힙니다.</div>' +
          (forced ? '<div class="hint" style="color:#d8b26a">' +
            '지금은 <b>' + forcedNames + '</b> 으로만 전투에 나갑니다. ' +
            '인격만 골라 두면, 편성 자체는 이미 짜여 있습니다.</div>' : '') +
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
    const inParty = forced && S.party.indexOf(who) >= 0;

    h += '<div class="eqhead' + (open ? ' open' : '') + (inParty ? ' inparty' : '') +
         '" data-open="' + who + '">' +
           '<span class="arrow">' + (open ? '▾' : '▸') + '</span>' +
           '<b>' + s.name + '</b>' +
           (inParty ? '<span class="partytag">편성 중</span>' : '') +
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

/* ── 튜토리얼 ─────────────────────────────────────────────────
 *  안내 글과 「어디를 짚을 것인가」는 전부 data/tutorial.js 에 있습니다.
 *  이 아래는 그것을 화면에 덮어 보여 주는 몫만 합니다.
 *
 *  ■ 본 것은 보관함이 «아니라» 따로 둡니다 (TUTORIAL_RULE.key).
 *    보관함에 넣으면 내보내기·손댐 검사(vaultSig)에 함께 얽혀서,
 *    안내를 봤다는 이유만으로 보관함이 「손댄 것」으로 뜹니다.
 *    패치 노트·상점 공지가 이미 같은 방식으로 따로 서 있습니다.
 *
 *  ■ 한 줄씩 보여 주고, 화면 아무 데나 누르면 다음으로 넘어갑니다.
 */
function tutorRule() {
  return (typeof TUTORIAL_RULE !== "undefined" && TUTORIAL_RULE)
       ? TUTORIAL_RULE : { name: "튜토리얼", key: "rash_company_tutorial_v1" };
}
function tutorList() { return (typeof TUTORIALS !== "undefined" && TUTORIALS) ? TUTORIALS : []; }
function tutorBy(id) { return tutorList().find(t => t.id === id) || null; }

/* 본 것 — { id: 본 때(ms) } */
function tutorSeen() {
  try { return JSON.parse(Store.get(tutorRule().key)) || {}; } catch (e) { return {}; }
}
function tutorSaw(id)   { return !!tutorSeen()[id]; }
function tutorSawCount() { return tutorList().filter(t => tutorSaw(t.id)).length; }
function tutorMark(id) {
  const m = tutorSeen(); m[id] = Date.now();
  Store.set(tutorRule().key, JSON.stringify(m));
}
/* id 를 안 주면 «전부» 안 본 것으로 되돌립니다 (노트 → 튜토리얼) */
function tutorForget(id) {
  if (!id) { Store.del(tutorRule().key); return; }
  const m = tutorSeen(); delete m[id];
  Store.set(tutorRule().key, JSON.stringify(m));
}

/* 지금 안내가 흐르는 중인가 — 둘이 겹쳐 뜨는 것을 막습니다 */
let TUT_ON = false;

/* 짚을 곳 찾기. 못 찾으면 null 이고, 그때는 화면 가운데에 띄웁니다. */
function tutorTarget(at) {
  if (!at) return null;
  let el = null;
  /* 손잡이는 이름 «앞부분» 으로 찾습니다 — 「첨삭 (2)」 는 "첨삭" 으로 잡힙니다 */
  if (at.btn) {
    const want = at.btn;
    el = Array.prototype.slice.call($actions.querySelectorAll("button"))
              .find(b => b.textContent.indexOf(want) === 0) || null;
  }
  if (!el && at.sel) { try { el = document.querySelector(at.sel); } catch (e) { el = null; } }
  /* 숨어 있는 것(접힌 칸 등)은 짚지 않습니다 */
  if (el && !el.getClientRects().length) el = null;
  return el;
}

/* 아직 안 봤으면 한 번 보여 줍니다. 이미 봤으면 아무 일도 하지 않습니다. */
function tutorOnce(id, after) {
  if (tutorSaw(id)) { if (after) after(); return false; }
  return tutorPlay(id, after);
}

/* 보여 주기 — 봤든 안 봤든 무조건 흐릅니다 (노트에서 다시 볼 때) */
function tutorPlay(id, after) {
  const t = tutorBy(id);
  if (!t || !t.steps || !t.steps.length || TUT_ON) { if (after) after(); return false; }
  const rule = tutorRule();
  TUT_ON = true;
  /* 열자마자 본 것으로 적어 둡니다 — 도중에 새로고침해도 다시 붙들지 않게 */
  tutorMark(id);

  const wrap = document.createElement("div");
  wrap.id = "tut";
  document.body.appendChild(wrap);

  let i = 0;
  let curEl = null;
  let shownAt = 0;      // 방금 뜬 줄을 앞선 누름이 그대로 넘겨 버리지 않게

  const place = () => {
    const box = wrap.querySelector(".tutbox");
    if (!box) return;
    const ring  = wrap.querySelector(".tutring");
    const arrow = box.querySelector(".tutarrow");
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const bw = box.offsetWidth, bh = box.offsetHeight;

    /* 짚을 곳이 없으면 가운데에 */
    if (!curEl || !curEl.getClientRects().length) {
      if (ring)  ring.style.display = "none";
      if (arrow) arrow.style.display = "none";
      box.classList.remove("below", "above");
      box.style.left = Math.round((vw - bw) / 2) + "px";
      box.style.top  = Math.round((vh - bh) / 2) + "px";
      return;
    }

    const r = curEl.getBoundingClientRect();
    /* 두를 자리 — 짚을 곳이 화면보다 길면(좁은 화면에서 한 줄씩 늘어선 목록 등)
     * 위쪽 일부만 두릅니다. 다 두르면 테두리가 위아래로 화면 밖에 나가
     * 「구멍」도 화살표도 보이지 않고 막만 걷힌 꼴이 됩니다. */
    const pad   = 5;
    const gap   = 14;
    const maxH  = vh - (bh + gap + 40);          // 상자와 여백 몫은 남겨 둡니다
    let hTop    = r.top - pad;
    let hHeight = r.height + pad * 2;
    if (hHeight > maxH) { hTop = Math.max(8, hTop); hHeight = Math.max(60, maxH); }
    const hBot = hTop + hHeight;

    ring.style.display = "";
    ring.style.left   = Math.round(r.left - pad) + "px";
    ring.style.top    = Math.round(hTop) + "px";
    ring.style.width  = Math.round(r.width + pad * 2) + "px";
    ring.style.height = Math.round(hHeight) + "px";

    /* 아래에 자리가 있으면 아래, 없으면 위. 둘 다 좁으면 넓은 쪽으로. */
    let below = (hBot + gap + bh <= vh - 8);
    if (!below && (hTop - gap - bh < 8)) below = (vh - hBot) >= hTop;

    let top  = below ? hBot + gap : hTop - gap - bh;
    top = Math.max(8, Math.min(top, vh - bh - 8));
    let left = r.left + r.width / 2 - bw / 2;
    left = Math.max(12, Math.min(left, vw - bw - 12));

    box.classList.toggle("below", below);
    box.classList.toggle("above", !below);
    box.style.left = Math.round(left) + "px";
    box.style.top  = Math.round(top)  + "px";

    /* 화살촉 — 짚는 곳 한가운데를 겨눕니다. 상자가 두른 자리에 겹칠 만큼
     * 자리가 없을 때는(위아래 어디에도 안 들어갈 때) 화살촉을 감춥니다. */
    const fits = below ? (top >= hBot) : (top + bh <= hTop);
    arrow.style.display = fits ? "" : "none";
    let ax = r.left + r.width / 2 - left;
    ax = Math.max(14, Math.min(ax, bw - 14));
    arrow.style.left = Math.round(ax - 9) + "px";
  };
  /* 짚을 곳을 화면 안으로 끌어온 뒤 자리를 잡습니다.
   *  그림이 늦게 뜨면(유리창의 단체 그림처럼) 안내가 뜬 뒤에 문서가 길어져
   *  scrollIntoView 로 끌어온 자리가 그대로 어긋납니다. 그래서 아래
   *  ResizeObserver 로 문서가 자랄 때마다 이 몫을 다시 부릅니다. */
  const fit = () => {
    if (curEl && curEl.getClientRects().length) {
      const r  = curEl.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      /* 화면보다 긴 것은 «머리» 를 화면 위에 맞춥니다 — 가운데로 맞추면
       * 위아래가 다 잘려 어디를 가리키는지 알 수 없게 됩니다. */
      if (r.height > vh - 120) {
        if (r.top > 60 || r.top < -20) {
          try { curEl.scrollIntoView({ block: "start", inline: "nearest" }); }
          catch (e) { curEl.scrollIntoView(); }
        }
      } else if (r.top < 8 || r.bottom > vh - 8) {
        try { curEl.scrollIntoView({ block: "center", inline: "nearest" }); }
        catch (e) { curEl.scrollIntoView(); }
      }
    }
    place();
  };

  const onMove = () => place();

  let RO = null;
  const end = () => {
    TUT_ON = false;
    window.removeEventListener("resize", onMove);
    window.removeEventListener("scroll", onMove, true);
    if (RO) { RO.disconnect(); RO = null; }
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    if (after) after();
  };

  const draw = () => {
    const st = t.steps[i];
    curEl = tutorTarget(st.at);
    const last = (i === t.steps.length - 1);
    wrap.classList.toggle("plain", !curEl);
    wrap.innerHTML =
      (curEl ? '<div class="tutring"></div>' : "") +
      '<div class="tutbox"><i class="tutarrow"></i>' +
        '<div class="tuttext">' + st.text + '</div>' +
        '<div class="tutfoot"><span>' + (last ? rule.end : rule.tap) + '</span>' +
          (t.steps.length > 1
            ? '<span class="tutnum">' + (i + 1) + ' / ' + t.steps.length + '</span>' : "") +
        '</div>' +
      '</div>' +
      (last || t.steps.length < 2 ? "" : '<div class="tutskip">' + rule.skip + '</div>');

    const sk = wrap.querySelector(".tutskip");
    if (sk) sk.onclick = e => { e.stopPropagation(); end(); };

    /* 짚을 곳이 화면 밖이면(창 안에서 스크롤이 내려가 있을 때) 먼저 끌어옵니다.
     * 늦게 뜨는 그림 때문에 문서가 자라는 것을 감안해 몇 번 더 다잡습니다. */
    fit();
    requestAnimationFrame(fit);
    setTimeout(fit, 120);
    setTimeout(fit, 400);
    shownAt = Date.now();
  };

  wrap.onclick = () => {
    if (Date.now() - shownAt < 200) return;   // 손이 미끄러져 두 줄이 지나가지 않게
    i++;
    if (i >= t.steps.length) end(); else draw();
  };

  draw();
  window.addEventListener("resize", onMove);
  window.addEventListener("scroll", onMove, true);
  /* 늦게 뜨는 그림 때문에 문서 길이가 바뀌면 짚는 자리를 다시 잡습니다 */
  if (typeof ResizeObserver !== "undefined") {
    RO = new ResizeObserver(() => fit());
    RO.observe(document.body);
  }
  return true;
}

/* ── 편성 시너지 — 큰 갈래로 묶어 보여주는 순서 (사용자 지침 2026-08-31) ──
 *  노트 화면과 교육위원 고르기(「시너지 순」 정렬) 둘 다 이 순서를 씁니다.
 *  synergyGroupOf() 가 SYNERGIES 항목 하나를 받아 이 배열의 하나로 갈라 줍니다 —
 *  이름이 어느 names 배열에도 없으면 자동으로 맨 끝 "기타"에 들어가므로,
 *  SYNERGIES 에 새 항목을 더할 때 여기를 안 고쳐도 안전합니다(다만 알맞은
 *  자리에 넣고 싶으면 그 이름을 아래 배열 중 하나에 적어 주십시오). */
const SYNERGY_GROUPS = [
  { id: "wings", name: "날개", names: [
      "N사 파견", "군 복무", "우주정복의 의지", "가상생물학자", "G사 프로덕션",
      "Y사 연구실", "P사 저지선", "남부협회", "북부 총기 협회"
    ] },
  { id: "lsync", name: "L사 및 LST", names: ["신생 L사", "LST 시절"] },
  { id: "event", name: "이벤트", names: ["공룡의 날", "영덕의 요리사"] },
  { id: "etc",   name: "기타", names: null }   // 위 어디에도 안 걸리면 여기로
];
function synergyGroupOf(sy) {
  return SYNERGY_GROUPS.find(g => g.names && g.names.indexOf(sy.name) >= 0) ||
         SYNERGY_GROUPS[SYNERGY_GROUPS.length - 1];
}
/* SYNERGIES 를 SYNERGY_GROUPS 순서대로 한 줄로 편 목록 — 교육위원 「시너지
 * 순」 정렬이 "이 사람이 몇 번째 시너지에 걸리는가"로 등수를 매길 때 씁니다. */
function synergySortedList() {
  if (typeof SYNERGIES === "undefined") return [];
  const out = [];
  SYNERGY_GROUPS.forEach(g => {
    SYNERGIES.filter(sy => synergyGroupOf(sy) === g).forEach(sy => out.push(sy));
  });
  return out;
}
/* 시너지 하나에 걸리는 사람 전부 — 인격은 미보유도 이름만 보여주고,
 * 지원 작성위원은 «미보유면 아예 안 보여줍니다» (사용자 지침 —
 * 지원 작성위원은 얻기 전엔 이름도 가려지는 게 원래 규칙이라 그대로 따름). */
function synergyMembers(sy) {
  const tags = Array.isArray(sy.tag) ? sy.tag : [sy.tag];
  const match = t => tags.some(tg => t.indexOf(tg) >= 0);
  const out = [];
  for (const w in SINNERS) {
    SINNERS[w].ids.forEach(id => {
      if (id.todo || !match(id.title)) return;
      out.push({ sup: false, owned: !!S.owned[idKey(w, id)], who: SINNERS[w].name, star: id.star, title: id.title });
    });
  }
  /* 교육위원도 봅니다 — 「Y사」·「대륵도」처럼 인격이 하나도 없이 교육위원
   * 제목끼리만 걸리는 시너지가 있어(activeSynergies·synergyNames 는 이미
   * 교육위원 제목도 셉니다), 여기서 빠지면 실제로는 걸리는데도 화면에는
   * «아무도 안 걸린다» 로 잘못 보입니다. 인격과 같은 결로, 미보유도 이름은
   * 보여줍니다(지원 작성위원과 달리 얻기 전에도 제목·이름이 가려지지 않는
   * 기존 규칙을 그대로 따릅니다 — openNote() 의 교육위원 목록 참고). */
  advisorList().forEach(a => {
    if (!match(a.title)) return;
    out.push({ sup: false, adv: true, owned: !!(S.advisorsOwned && S.advisorsOwned[advisorId(a)]),
               who: a.name, star: a.star, title: a.title });
  });
  (typeof SUPPORTS !== "undefined" ? SUPPORTS : []).forEach(sp => {
    if (!match(sp.title) || !supportOwned(sp)) return;   // 미보유 지원 작성위원은 표시하지 않는다
    out.push({ sup: true, owned: true, who: sp.name, star: sp.star, title: sp.title });
  });
  out.sort((a, b) => (b.owned - a.owned) || (b.star - a.star));
  return out;
}
function synergyMembersHTML(sy) {
  const list = synergyMembers(sy);
  if (!list.length) return '<div class="synmembers"><div class="sub">아직 걸리는 사람이 없습니다</div></div>';
  return '<div class="synmembers">' + list.map(m =>
    '<div class="synmem' + (m.owned ? '' : ' un') + '">' +
      '<span class="star">' + stars(m.star) + '</span> ' +
      (m.owned ? (m.who + ' · ' + m.title) : m.title) +
      (m.sup ? ' <i>지원</i>' : '') +
      (m.adv ? ' <i>교육위원</i>' : '') +
    '</div>'
  ).join('') + '</div>';
}

/* ── 노트 ─────────────────────────────────────────────────────
 *  수감자 신상과 설정을 모아 보는 곳. 스토리는 담지 않습니다.
 *  내용은 전부 data/characters.js 에서 그대로 읽어옵니다.
 */
function noteTag(t) { return '<span class="tag2">' + t + '</span>'; }
/* 시너지 무리(csec)가 접혔는지, 어느 시너지 하나가 펴져 있는지 — 판이
 * 도는 동안만 기억합니다(운전석의 CS_OPEN과는 다른 자리 — 화면마다 따로 둡니다). */
let NOTE_SYN_OPEN = {};
let NOTE_SYN_DETAIL = null;

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

  /* ── 튜토리얼 ──
   *  안내를 한 줄씩 펴 놓고, 누르면 그 안내를 다시 흐르게 합니다.
   *  「어디를 짚을 것인가」는 그 화면에 들어가야 맞으므로, 다시 볼 때는
   *  창을 닫고 유리창으로 나간 뒤에 흐릅니다 — 짚을 곳을 못 찾은 줄은
   *  화살표 없이 가운데에 뜹니다 (tutorTarget 참고). */
  const tutorView = () => {
    const rule = tutorRule();
    let h = '<h2>' + rule.name + '</h2>' +
            '<div class="hint">' + rule.hint + '</div>' +
            '<div class="grid one">';
    tutorList().forEach(t => {
      const saw = tutorSaw(t.id);
      h += '<div class="slot tutrow' + (saw ? ' done' : '') + '" data-tut-play="' + t.id + '">' +
             '<div class="nm">' + t.name +
               ' <span class="sub">' + (saw ? '본 것' : '아직 안 봄') + '</span></div>' +
             '<div class="tutwhen">' + t.where + '　·　' + t.steps.length + '줄</div>';
      t.steps.forEach((s, k) => {
        h += '<div class="tutline"><b>' + (k + 1) + '.</b> ' + s.text + '</div>';
      });
      h += '</div>';
    });
    h += '</div>';
    h += '<div class="modalfoot">' +
           '<button id="tback">목록으로</button>' +
           '<button id="treset" class="ghost">모두 안 본 것으로</button>' +
           '<button id="tclose" class="ghost">닫기</button>' +
         '</div>';
    $sheet.innerHTML = h;

    $sheet.querySelectorAll(".slot[data-tut-play]").forEach(el => {
      el.onclick = () => {
        const id = el.dataset.tutPlay;
        closeModal(); render();
        if (back) back();
        /* 유리창을 다 그린 뒤에 덮습니다 */
        setTimeout(() => tutorPlay(id), 0);
      };
    });
    document.getElementById("tback").onclick  = () => index();
    document.getElementById("treset").onclick = () => { tutorForget(); tutorView(); };
    document.getElementById("tclose").onclick = () => { closeModal(); render(); if (back) back(); };
  };

  /* ── 목록 ── */
  const index = () => {
    let h = '<h2>노 트</h2>' +
            '<div class="hint">수감자 신상과 설정을 모아 둔 곳입니다. 이야기 내용은 담기지 않습니다.</div>';

    /* 게임 구조 안내 — 처음 그 화면에 들어섰을 때 저절로 한 번 나오고,
     * 여기서 언제든 다시 볼 수 있습니다. */
    h += '<div style="margin:10px 0 6px;color:#e8e4de;font-weight:700">' +
           tutorRule().name + '</div>' +
         '<div class="grid one"><div class="slot" data-tut-open="1">' +
           '<div class="nm">' + tutorRule().name + ' 다시 보기</div>' +
           '<div class="sub">게임 구조 안내　·　' +
             tutorSawCount() + ' / ' + tutorList().length + ' 봄　—　눌러서 목록으로</div>' +
         '</div></div>';

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
     *  큰 갈래(SYNERGY_GROUPS)로 접어 두고, 시너지 한 줄을 누르면 거기
     *  걸리는 사람을 펼쳐 보여줍니다(synergyMembersHTML 참고). */
    const syAll = (typeof SYNERGIES !== "undefined" && SYNERGIES) ? SYNERGIES : [];
    if (syAll.length) {
      const nowTitles = synergyNames();
      h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">편성 시너지 ' +
           '<span class="sub" style="font-weight:400">모두 ' + syAll.length + '가지</span></div>' +
           '<div class="hint">파티 셋이 <b>장착한 인격</b>이나 <b>세워 둔 교육위원</b>의 제목에 같은 말이 ' +
           '들어가면 발동합니다(간혹 인격 없이 교육위원끼리만 걸리는 시너지도 있습니다). ' +
           '몇 명부터 발동하는지는 시너지마다 다르고, 3명이면 1.75배, 보조 교육위원까지 넷이면 2배가 됩니다. ' +
           '무리 이름을 누르면 접히고 펴집니다. 시너지 한 줄을 누르면 거기 걸리는 사람을 보여줍니다.</div>';

      SYNERGY_GROUPS.forEach(g => {
        const list = syAll.filter(sy => synergyGroupOf(sy) === g);
        if (!list.length) return;
        const secId = "syn_" + g.id;
        const gOpen = !!NOTE_SYN_OPEN[secId];
        h += '<div class="csec' + (gOpen ? ' on' : '') + '" data-sec="' + secId + '">' +
               '<div class="csechead"><b>' + g.name + '</b><span>' + list.length + '가지</span><i></i></div>' +
               '<div class="csecbody"><div class="grid">';
        list.forEach(sy => {
          const tags = Array.isArray(sy.tag) ? sy.tag : [sy.tag];
          /* 지금 편성으로 몇 명이 걸려 있는가 */
          const now = nowTitles.filter(t => tags.some(tg => t.indexOf(tg) >= 0)).length;
          /* 보관함에 이 말이 든 인격·교육위원이 몇 종이나 있는가.
           * 인격만 세면 「Y사」·「대륵도」처럼 교육위원끼리만 걸리는 시너지가
           * totalN=0 으로 나와, 실제로는 걸리는데도 「모자라 발동할 수 없다」
           * 고 잘못 뜹니다 — 교육위원도 함께 셉니다. */
          let ownedN = 0, totalN = 0;
          for (const w in SINNERS) SINNERS[w].ids.forEach(id => {
            if (id.todo || !tags.some(tg => id.title.indexOf(tg) >= 0)) return;
            totalN++; if (S.owned[idKey(w, id)]) ownedN++;
          });
          advisorList().forEach(a => {
            if (!tags.some(tg => a.title.indexOf(tg) >= 0)) return;
            totalN++; if (S.advisorsOwned && S.advisorsOwned[advisorId(a)]) ownedN++;
          });
          const eff = [];
          if (sy.atk) eff.push("공 +" + Math.round(sy.atk * 100) + "%");
          if (sy.def) eff.push("방 +" + Math.round(sy.def * 100) + "%");
          if (sy.hp)  eff.push("체 +" + Math.round(sy.hp  * 100) + "%");
          const on = now >= sy.need;
          const detailOpen = NOTE_SYN_DETAIL === sy.name;
          h += '<div class="slot' + (on ? ' sel' : '') + '" data-syn="' + sy.name + '">' +
                 '<div class="nm">' + sy.name +
                   (on ? ' <span class="synon">발동 중 ' + now + '명</span>' : '') + '</div>' +
                 '<div class="sub">찾는 말 「' + tags.join("」 「") + '」　·　' + sy.need + '명부터</div>' +
                 '<div class="sub" style="color:#d8b26a">' + eff.join("　") + '</div>' +
                 (sy.desc ? '<div class="sub">' + sy.desc + '</div>' : '') +
                 '<div class="sub">걸리는 인격·교육위원 ' + ownedN + ' / ' + totalN + ' 보유' +
                   (totalN < sy.need ? '　— 모자라 발동할 수 없습니다' : '') + '</div>' +
                 (detailOpen ? synergyMembersHTML(sy) : '') +
               '</div>';
        });
        h += '</div></div></div>';
      });
    }

    h += '<div class="modalfoot"><button id="nclose">닫기</button></div>';
    $sheet.innerHTML = h;

    $sheet.querySelectorAll(".slot[data-who]").forEach(el => {
      el.onclick = () => detail(el.dataset.who);
    });
    const tutOpen = $sheet.querySelector(".slot[data-tut-open]");
    if (tutOpen) tutOpen.onclick = () => tutorView();
    /* 시너지 무리 접기/펴기 */
    $sheet.querySelectorAll(".csec .csechead").forEach(el => {
      el.onclick = () => {
        const id = el.closest(".csec").dataset.sec;
        NOTE_SYN_OPEN[id] = !NOTE_SYN_OPEN[id];
        index();
      };
    });
    /* 시너지 한 줄을 누르면 거기 걸리는 사람이 펼쳐집니다 — 다시 누르면 접힙니다 */
    $sheet.querySelectorAll(".slot[data-syn]").forEach(el => {
      el.onclick = () => {
        const name = el.dataset.syn;
        NOTE_SYN_DETAIL = (NOTE_SYN_DETAIL === name) ? null : name;
        index();
      };
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
    (n.groups || [{ lines: n.lines || [] }]).map(g => {
      /* showEventCountdown — 데이터(data/notice.js)에는 날짜를 그대로 안 적고
       * 이 표시만 해 둡니다. 몇 일 남았는지는 늘 «지금»을 봐야 맞으므로,
       * 여기서 eventLeftText()로 그때그때 새로 계산해 한 줄 얹습니다
       * (사용자 지침 2026-09-02 — 이벤트 교환소 알림에 남은 날을 강조). */
      const ev = g.showEventCountdown ? openEvent() : null;
      const countdownLine = ev
        ? (() => {
            const until = new Date(eventUntil(ev));
            const untilText = until.getMonth() + 1 + "월 " + until.getDate() + "일";
            return '<div class="slot"><div class="sub">' +
              '<b style="color:#d8b26a;font-size:14px">' + ev.cur + ' — ' + eventLeftText(ev) + '</b>　' +
              '(' + untilText + '까지)' +
            '</div></div>';
          })()
        : "";
      return (g.head ? '<div style="margin:14px 0 6px;color:#e8e4de;font-weight:700">' + g.head + '</div>' : "") +
      '<div class="grid one">' +
        (g.lines || []).map(x => '<div class="slot"><div class="sub">' + x + '</div></div>').join("") +
        countdownLine +
      '</div>';
    }).join("") +
    (n.tail ? '<div class="mailnote ok" style="margin-top:12px">' + n.tail + '</div>' : '') +
    '<div class="modalfoot">' +
      '<button id="ntgo" class="primary">상점으로</button>' +
      '<button id="nthide" class="ghost">이번 판에서는 다시 보지 않음</button>' +
    '</div>';
  document.getElementById("ntgo").onclick   = () => then();
  document.getElementById("nthide").onclick = () => { noticeHide(); then(); };
}

function openShop(back) {
  resetArcIfIdle();
  $modal.classList.add("on");

  const draw = (msg) => {
    let h = '<h2>상 점</h2>' +
            '<div class="hint">보유 ' + CURRENCY + ' <b>' + S.money + '</b>' +
            '　·　황금교본 <b>' + S.codex + '</b>' +
            (curEvent() ? '　·　' + eventCurName() + ' <b>' + eventCount() + '</b>' : '') +
            '</div>';

    if (msg) h += '<div class="hint" style="color:#d8b26a">' + msg + '</div>';

    /* ── 맨 위 한 자리 — 가로로 통째 ─────────────────────────────
     *  두 가지가 이 자리를 «번갈아» 씁니다. 겹쳐 서지 않게 한 번에 하나만입니다.
     *    1. 신입 관리자 기념 배정 — 두 번 다 쓸 때까지
     *    2. 이벤트 교환소        — 기념 배정을 마친 뒤부터, 이벤트 기간 동안만
     *  기간이 끝나면(eventLive 가 거짓) 이 자리는 그냥 비워집니다.
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
    } else {
      const ev = openEvent();
      if (ev) {
        const cur = eventCurName();
        const bg  = ev.banner
          ? ' style="background-image:url(\'' + assetURL(ev.banner) + '\')"' : "";
        h += '<div class="grid">' +
               '<div class="slot pk wide" data-event="1">' +
                 (ev.line
                   ? '<div class="pkline' + (ev.banner ? ' pic' : '') + '"' + bg + '>' +
                       '<span>' + ev.line + '</span></div>'
                   : "") +
                 '<div class="nm">' + eventRule().shop + '</div>' +
                 '<div class="sub" style="color:#d8b26a">' +
                   "'" + cur + "'" + josa(cur, "을") +
                   ' 다양한 보상과 교환해보세요!</div>' +
                 '<div class="sub">보유 ' + cur + ' <b>' + eventCount() + '</b>' +
                   '　·　' + eventLeftText(ev) + '</div>' +
               '</div>' +
             '</div>';
      }
    }

    h += '<div style="margin:10px 0 6px;color:#e8e4de;font-weight:700">인격 배정</div>' +
         '<div class="grid">' +
           '<div class="slot" data-gacha="1" data-tut="shop-gacha">' +
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
    /* 파편이 그 사람 몫으로 RULE.fragExchange 개를 넘고, 아직 못 가진(그리고 지금
     * 특정 배정 중이 아닌) 인격이 있는 사람이 하나라도 있으면 눌러 볼 수 있습니다 —
     * 구체적인 대상 고르기는 openExchange() 안에서. */
    const exCan = Object.keys(SINNERS).some(w =>
      fragCount(w) >= RULE.fragExchange &&
      SINNERS[w].ids.some(id => !S.owned[idKey(w, id)] && !pickupOnTitle(id.title)));
    const aTotal = advisorList().length;
    const aMine  = Object.keys(S.advisorsOwned || {}).length;

    /* ── 기프트 · 인격 교환 · 교육위원 — 한 줄에 셋 ────────────────
     *  셋 다 «한 칸짜리» 덩이라, 저마다 제목을 이고 한 줄씩 내려가면
     *  상점이 쓸데없이 길어집니다. 제목 하나 아래로 모아 나란히 세웁니다.
     *  .grid.three 가 셋을 붙들어 줍니다 — 좁은 화면에서는 다시 한 줄씩입니다. */
    h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">' +
           'E.G.O 기프트　·　인격 교환　·　보조 교육위원</div>' +
         '<div class="grid three">' +
           '<div class="slot"' + (S.codex >= GIFT_RULE.cost ? ' data-gift="1"' : '') + '>' +
             '<div class="' + (S.codex >= GIFT_RULE.cost ? 'nm' : 'lock') + '">기프트 배정소</div>' +
             '<div class="sub">1회 황금교본 ' + GIFT_RULE.cost + '　·　보유 ' + gMine + ' / ' + gTotal + '</div>' +
             '<div class="sub">★ ' + Math.round(GIFT_RULE.rate1 * 100) + '%　★★ ' +
               Math.round(GIFT_RULE.rate2 * 100) + '%　★★★ ' + Math.round(GIFT_RULE.rate3 * 100) + '%</div>' +
             '<div class="sub">' + (S.codex >= GIFT_RULE.cost
               ? '중복이면 ' + CURRENCY + ' ' + dupRefundText()
               : '황금교본이 모자랍니다') + '</div>' +
           '</div>' +
           '<div class="slot"' + (exCan ? ' data-exchange="1"' : '') + '>' +
             '<div class="' + (exCan ? 'nm' : 'lock') + '">인격 교환</div>' +
             '<div class="sub">그 사람 몫 파편 ' + RULE.fragExchange + '개로 미보유 인격 하나를 정가로 바꿉니다</div>' +
             '<div class="sub">' + (exCan
               ? '뽑기와 달리 무엇을 얻을지 직접 고릅니다'
               : '파편이 모자라거나, 이미 전부 지녔습니다') + '</div>' +
           '</div>' +
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

    const evb = $sheet.querySelector(".slot[data-event]");
    if (evb) evb.onclick = () => openEventShop(() => draw(null));

    const g = $sheet.querySelector(".slot[data-gacha]");
    if (g) g.onclick = () => openGacha(() => draw(null));

    $sheet.querySelectorAll(".slot[data-pickup]").forEach(el => {
      const p = pickupList()[+el.dataset.pickup];
      if (p) el.onclick = () => openGacha(() => draw(null), p);
    });

    const gp = $sheet.querySelector(".slot[data-gift]");
    if (gp) gp.onclick = () => openStockGacha("gift", () => draw(null));

    const ex = $sheet.querySelector(".slot[data-exchange]");
    if (ex) ex.onclick = () => openExchange(() => draw(null));

    const ap = $sheet.querySelector(".slot[data-adv]");
    if (ap) ap.onclick = () => openStockGacha("adv", () => draw(null));

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
  tutorOnce("shop");    /* 상점에 처음 들어왔을 때 한 번 */
}

/* ── 이벤트 교환소 ────────────────────────────────────────────
 *  상점 맨 위의 띠로 들어옵니다.
 *  이곳에서는 «오직 이벤트 재화로만» 바꿉니다 — 원고료도 황금교본도 쓰이지
 *  않습니다. 물건·값·한도는 data/event.js 의 EVENTS[].goods 에 적습니다.
 *
 *  기간이 끝나면 들어오는 길(상점 띠)이 사라지므로 여기까지 오지 못합니다.
 *  그래도 혹시 몰라 들머리에서 한 번 더 봅니다.
 */
function openEventShop(back) {
  const ev = openEvent();
  if (!ev) { if (back) back(); return; }
  $modal.classList.add("on");

  const draw = (msg) => {
    const cur = eventCurName();
    let h = '<h2>' + eventRule().shop + '</h2>' +
      /* 맨 위 알림 — 어떻게 하면 재화가 더 들어오는지 일러 두는 자리입니다.
       * 비율은 EVENT_RULE.bonusPct 한 곳에서 고칩니다. */
      '<div class="mailnote ok"><b>특정 배정 인격을 가지고 클리어하면 ' +
        eventRule().bonusPct + '%의 추가 재화를 획득합니다!</b></div>' +
      '<div class="hint">이곳에서는 오직 <b>' + cur + '</b>' +
      josa(cur, "로") + '만 바꿉니다. ' +
      CURRENCY + '도 황금교본도 쓰이지 않습니다.<br>' +
      '보유 ' + cur + ' <b>' + eventCount() + '</b>　·　' + eventLeftText(ev) + '</div>';
    if (ev.desc) h += '<div class="hint" style="color:#d8b26a">' + ev.desc + '</div>';
    if (msg)     h += '<div class="mailnote ok">' + msg + '</div>';

    const goods = eventGoods();
    if (!goods.length) {
      h += '<div class="hint">아직 내놓은 물건이 없습니다.</div>';
    } else {
      h += '<div class="grid">';
      goods.forEach(g => {
        const left = eventLeft(g);
        const out  = left <= 0;                    // 이 기간에 살 만큼 다 샀다
        const poor = eventCount() < g.cost;        // 재화가 모자라다
        const ok   = !out && !poor;
        h += '<div class="slot"' + (ok ? ' data-goods="' + g.id + '"' : '') + '>' +
               '<div class="' + (ok ? 'nm' : 'lock') + '">' + g.name + '</div>' +
               '<div class="sub">' + cur + ' <b>' + g.cost + '</b>' +
                 (g.limit ? '　·　남은 횟수 ' + left + ' / ' + g.limit
                          : '　·　횟수 제한 없음') + '</div>' +
               '<div class="sub">받는 것 — ' + eventGiveText(g.give) + '</div>' +
               (g.desc ? '<div class="sub" style="color:#d8b26a">' + g.desc + '</div>' : '') +
               /* 보관함과 똑같은 설명 — 파편 상자처럼 «쓰는 법이 따로 있는» 것에 붙습니다 */
               (eventGoodsNote(g.give)
                 ? '<div class="sub">' + eventGoodsNote(g.give) + '</div>' : '') +
               /* 못 누르는 까닭은 스스로 말합니다 — 「모자랍니다」로 뭉뚱그리면
                * 이미 다 바꾼 경우에 거짓말이 됩니다. */
               (out  ? '<div class="sub" style="color:#c8403a">이 기간에 바꿀 만큼 다 바꿨습니다</div>'
                : poor ? '<div class="sub" style="color:#c8403a">' +
                           cur + josa(cur, "이") + " 모자랍니다</div>" : "") +
             '</div>';
      });
      h += '</div>';
    }

    h += '<div class="modalfoot"><button id="evclose">닫기</button></div>';
    $sheet.innerHTML = h;

    $sheet.querySelectorAll(".slot[data-goods]").forEach(el => {
      el.onclick = () => {
        const g = eventGoods().find(x => x.id === el.dataset.goods);
        if (!g) return;
        /* 그리고 난 뒤에 사정이 바뀌었을 수 있으니 치르기 직전에 한 번 더 봅니다 */
        if (eventCount() < g.cost || eventLeft(g) <= 0) return;
        S.event = eventCount() - g.cost;
        if (!S.eventBuy) S.eventBuy = {};
        S.eventBuy[g.id] = eventBought(g.id) + 1;
        const got = eventGiveApply(g.give);
        saveVault(); render();
        draw(cur + " " + g.cost + " → " + (got || g.name) +
             josa(got || g.name, "을") + " 받았습니다.");
      };
    });
    /* 닫으면 «상점으로» 돌아옵니다 — 창을 닫지 않고 그 자리에 상점을 다시 그립니다.
     * (배정소·인격 교환 쪽은 창째로 닫고 나갑니다. 그쪽 버릇은 손대지 않았습니다.) */
    document.getElementById("evclose").onclick = () => {
      if (back) back(); else closeModal();
      render();
    };
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
/* 지금 서 있는 특정 배정 중 하나라도 그 인격을 대상으로 삼고 있는가.
 * 인격 교환(정가)에서 씁니다 — 뽑기로 끌어야 할 인격을 파편으로 지름길 삼지 못하게. */
function pickupOnTitle(title) { return pickupList().some(p => pickupHit(p, title)); }

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
            '　·　중복이면 인격은 그 인격 파편을, 교육위원은 ' + CURRENCY + '을 돌려받습니다 (' +
              dupAmountText() + ')　·　보유 ' + CURRENCY + ' ' + S.money + '<br>' +
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
      } else addFrag(pick.who, dupRefund(pick.id.star));
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

/* ── 기프트 · 교육위원 배정 ────────────────────────────────────
 *  인격 배정과 같은 틀입니다 — 1회 / RULE.stockMulti 회를 고르고
 *  한 판에 펼칩니다. 다만 여기엔 확정 칸이 없습니다(보조 교육위원이 섞이는
 *  인격 배정과 달리, 성급 확률이 이미 낮지 않아 굳이 보장할 필요가 없습니다).
 *  kind 는 "gift"(E.G.O 기프트) 또는 "adv"(보조 교육위원).
 */
function pullGiftOnce() {
  const r = Math.random();
  const star = r < GIFT_RULE.rate3 ? 3
             : r < GIFT_RULE.rate3 + GIFT_RULE.rate2 ? 2 : 1;
  let cand = GIFTS.filter(x => x.star === star && !(S.giftsOwned && S.giftsOwned[giftId(x)]));
  if (!cand.length) cand = GIFTS.filter(x => x.star === star);
  if (!cand.length) cand = GIFTS;
  const pick = cand[rnd(cand.length)];
  const isNew = !(S.giftsOwned && S.giftsOwned[giftId(pick)]);
  if (isNew) {
    if (!S.giftsOwned) S.giftsOwned = {};
    S.giftsOwned[giftId(pick)] = true;
    if (!giftOnList().length) { S.giftOn = [giftId(pick)]; S.gift = giftId(pick); }
  } else S.money += dupRefund(pick.star);
  return { star: pick.star, name: pick.name, desc: pick.desc, isNew };
}

function pullAdvisorOnce() {
  const all = advisorList();
  if (!all.length) return null;
  const star = Math.random() < ADVISOR_RULE.rate3 ? 3 : 2;
  let cand = all.filter(a => a.star === star && !(S.advisorsOwned && S.advisorsOwned[advisorId(a)]));
  if (!cand.length) cand = all.filter(a => a.star === star);
  if (!cand.length) cand = all;
  const pick = cand[rnd(cand.length)];
  const key = advisorId(pick);
  const isNew = !(S.advisorsOwned && S.advisorsOwned[key]);
  if (isNew) {
    if (!S.advisorsOwned) S.advisorsOwned = {};
    S.advisorsOwned[key] = true;
    if (!advisorOnList().length) { S.advisorOn = [key]; S.advisor = key; }
  } else S.money += dupRefund(pick.star);
  return { star: pick.star, name: pick.title + " " + pick.name, desc: pick.note || pick.desc, isNew };
}

function openStockGacha(kind, done) {
  $modal.classList.add("on");
  const isGift = kind === "gift";
  const rule   = isGift ? GIFT_RULE : ADVISOR_RULE;
  const cost   = rule.cost;
  const multi  = RULE.stockMulti;
  const pct    = x => (x * 100).toFixed(x * 100 % 1 ? 1 : 0) + "%";

  const draw = (result) => {
    const total = isGift ? GIFTS.length : advisorList().length;
    const mine  = Object.keys((isGift ? S.giftsOwned : S.advisorsOwned) || {}).length;

    let h = '<h2>' + (isGift ? '기 프 트 배 정' : '교 육 위 원 파 견') + '</h2>' +
            '<div class="hint">1회 황금교본 ' + cost + '　·　보유 황금교본 ' + S.codex +
              '　·　보유 ' + mine + ' / ' + total + '<br>' +
            (isGift
              ? '★ ' + pct(rule.rate1) + '　★★ ' + pct(rule.rate2) + '　★★★ ' + pct(rule.rate3)
              : '★★ ' + pct(rule.rate2) + '　★★★ ' + pct(rule.rate3)) +
            '　·　중복이면 ' + CURRENCY + ' ' + dupRefundText() + '</div>';

    if (result) {
      h += '<div class="grid">';
      result.forEach(r => {
        h += '<div class="slot' + (r.isNew ? ' sel' : '') + '">' +
               '<div class="nm"><span class="star">' + stars(r.star) + '</span> ' + r.name + '</div>' +
               '<div class="sub">' + (r.isNew ? '신규 — ' + r.desc : '중복') + '</div>' +
             '</div>';
      });
      h += '</div>';
    }

    h += '<div class="modalfoot">' +
         '<button id="s1" class="primary"' + (S.codex < cost ? ' disabled' : '') + '>1회 배정</button>' +
         '<button id="s5"' + (S.codex < cost * multi ? ' disabled' : '') + '>' +
           multi + '회 배정</button>' +
         '<button id="sclose" class="ghost">닫기</button></div>';
    $sheet.innerHTML = h;

    const pull = (n) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        if (S.codex < cost) break;
        if (!isGift && !advisorList().length) break;   // 교육위원이 하나도 없으면 멈춥니다
        S.codex -= cost;
        out.push(isGift ? pullGiftOnce() : pullAdvisorOnce());
      }
      saveVault();
      render();
      /* 중복은 축하할 일이 아니니 연출을 넣지 않습니다.
       * 이름은 알리지 않습니다 — 눌러 봐야 무엇을 얻었는지 알도록. */
      const win = out.find(r => r.isNew && r.star >= 3) || null;
      if (win) starFlash(3, win.desc || null, () => draw(out));
      else draw(out);
    };

    const s1 = document.getElementById("s1");
    const s5 = document.getElementById("s5");
    if (s1 && !s1.disabled) s1.onclick = () => pull(1);
    if (s5 && !s5.disabled) s5.onclick = () => pull(multi);
    document.getElementById("sclose").onclick = () => { closeModal(); if (done) done(); };
  };
  draw(null);
}

/* ── 인격 교환 (정가) ──────────────────────────────────────────
 *  뽑기와 달리 무엇을 얻을지 직접 고릅니다. 그 사람 몫 파편을
 *  RULE.fragExchange 개 내면, 아직 못 가진 그 사람의 인격 하나를 받습니다.
 *  다른 게임에서 흔히 «정가» 라 부르는 것 — 확률에 기대지 않고 값을 다 치릅니다.
 *
 *  먼저 사람 12명이 파편 보유량과 함께 죽 나오고(openExchange),
 *  한 사람을 누르면 그 사람의 미보유 인격 목록이 펼쳐집니다(openExchangePick).
 */
function openExchange(back) {
  $modal.classList.add("on");
  let h = '<h2>인 격 교 환</h2>' +
          '<div class="hint">그 사람 몫 인격 파편 <b>' + RULE.fragExchange + '개</b>로, ' +
          '아직 못 가진 그 사람의 인격 하나를 정가로 바꿉니다. 무엇을 받을지는 다음 화면에서 직접 고릅니다.</div>' +
          '<div class="grid">';

  Object.keys(SINNERS).forEach(who => {
    const s = SINNERS[who];
    const have = fragCount(who);
    const missing = s.ids.filter(id => !S.owned[idKey(who, id)]);
    const exchangeable = missing.filter(id => !pickupOnTitle(id.title));
    const can = have >= RULE.fragExchange && exchangeable.length > 0;
    h += '<div class="slot"' + (can ? ' data-who="' + who + '"' : '') + '>' +
           '<div class="' + (can ? 'nm' : 'lock') + '">' + s.name + '</div>' +
           '<div class="sub">보유 파편 <b>' + have + '</b> / ' + RULE.fragExchange + '</div>' +
           '<div class="sub">' + (exchangeable.length ? '교환 가능한 인격 ' + exchangeable.length + '개'
                                  : missing.length ? '미보유 인격이 지금 전부 특정 배정 중입니다'
                                  : '모든 인격을 이미 지녔습니다') + '</div>' +
         '</div>';
  });

  h += '</div><div class="modalfoot"><button id="exclose" class="ghost">닫기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll(".slot[data-who]").forEach(el => {
    el.onclick = () => openExchangePick(el.dataset.who, () => openExchange(back));
  });
  document.getElementById("exclose").onclick = () => { closeModal(); if (back) back(); };
}

function openExchangePick(who, back) {
  $modal.classList.add("on");
  const s = SINNERS[who];

  const draw = (msg) => {
    const have = fragCount(who);
    let h = '<h2>' + s.name + ' — 인 격 교 환</h2>' +
            '<div class="hint">보유 파편 <b>' + have + '</b>　·　1회 ' + RULE.fragExchange + '개</div>';
    if (msg) h += '<div class="hint" style="color:#d8b26a">' + msg + '</div>';

    const missing = s.ids.filter(id => !S.owned[idKey(who, id)]);
    if (!missing.length) {
      h += '<div class="hint">더 바꿀 인격이 없습니다 — 이미 전부 지녔습니다.</div>';
    } else {
      h += '<div class="grid">';
      missing.forEach(id => {
        const key = idKey(who, id);
        const pickedUp = pickupOnTitle(id.title);
        const can = have >= RULE.fragExchange && !pickedUp;
        h += '<div class="slot"' + (can ? ' data-id="' + key + '"' : '') + '>' +
               '<div class="' + (can ? 'nm' : 'lock') + '">' +
                 '<span class="star">' + stars(id.star) + '</span> ' + id.title + '</div>' +
               (id.note ? '<div class="sub">' + id.note + '</div>' : '') +
               (pickedUp ? '<div class="sub" style="color:#d8b26a">지금 특정 배정 중인 인격입니다 — 정가로는 못 바꿉니다</div>'
                : can ? '' : '<div class="sub" style="color:#c8403a">파편이 모자랍니다</div>') +
             '</div>';
      });
      h += '</div>';
    }

    h += '<div class="modalfoot"><button id="expback" class="ghost">뒤로</button></div>';
    $sheet.innerHTML = h;

    $sheet.querySelectorAll(".slot[data-id]").forEach(el => {
      el.onclick = () => {
        const key = el.dataset.id;
        const id = idByKey(key);
        if (!id || S.owned[key] || fragCount(who) < RULE.fragExchange || pickupOnTitle(id.title)) return;

        S.frags[who] -= RULE.fragExchange;
        S.owned[key] = true;
        /* 뽑기와 같은 규칙 — 지금 장착한 것보다 성급이 높으면 갈아 끼웁니다 */
        const cur = idByKey(S.equip[who]);
        if (!cur || cur.star < id.star) {
          S.equip[who] = key;
          if (S.party.indexOf(who) >= 0) S.hp[who] = maxHp(who);
        }
        saveVault();
        render();
        draw(stars(id.star) + " " + withJosa(id.title, "을") + " 정가로 얻었다.");
      };
    });
    document.getElementById("expback").onclick = () => { closeModal(); if (back) back(); };
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

/* ── 본편 편성 자리 이어하기 ────────────────────────────────────
 *  case "party"(편성을 고칠 수 있는 자리)를 지날 때마다 S.storySave 에
 *  자리를 남겨 둡니다. 거울굴절철도의 체크포인트(S.railSave, resumeMirror
 *  참고)와 같은 논리이되, 본편은 procedurally 다시 짓지 않고 CHAPTERS[].scenes
 *  를 그대로 쓰므로 scene index 하나면 충분합니다 — 다만 이 자리 즈음엔
 *  banParty 등으로 편성이 장 도중 바뀌어 있을 수 있어 party/partyBan/
 *  partyStack 도 함께 담아 둡니다. 장을 새로 시작하면(startChapter) 버리고,
 *  마치면(chapterEnd) 지웁니다 — 그 전까지만 사는 임시 데이터입니다.
 *  위 SAVE_KEY 기반 기록(save/load)과는 아주 다른 자리입니다 — 그쪽은 손으로
 *  「기록」을 눌러야 하는 어디서나 한 자리뿐인 이어하기이고, 이쪽은 편성을
 *  고치는 자리마다 조용히 자동으로 남깁니다. */
function resumeStorySave() {
  if (!S.storySave) return;
  const save = S.storySave;
  const i = CHAPTERS.findIndex(c => c.id === save.chId);
  if (i < 0) { S.storySave = null; return; }

  S.ch = i; S.ended = false;
  S.mirror = false; MIRROR = null;
  SCENES = buildScenes(CHAPTERS[i]);
  S.party = save.party.slice();
  S.equip = Object.assign({}, save.equip);
  S.hp = Object.assign({}, save.hp);
  S.flags = Object.assign({}, save.flags);
  S.partyStack = (save.partyStack || []).slice();
  S.partyBan = (save.partyBan || []).slice();
  S.battleForced = !!save.battleForced;
  S.sc = save.sc;
  S.battle = null; S.waiting = false;
  allyClear();
  clearLog();
  $log.classList.remove("recalling");
  showCard(CHAPTERS[i].img || null, CHAPTERS[i].no + "  " + CHAPTERS[i].title);
  divider();
  say("저장해 둔 자리에서 이어합니다.", "sys");
  divider();
  render();
  next();
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

/* ── 운전석의 접힌 무리 ────────────────────────────────────────
 *  갈래가 늘면서 운전석이 한 화면에 안 들어가게 됐습니다. 그래서 무리를 접어 두고,
 *  맨 위의 「다음으로 추천」만 펴 둡니다 — 대개 거기 있는 것을 누르러 오니까요.
 *
 *  편 무리는 이 판이 도는 동안 기억합니다(보관함에는 담지 않습니다).
 *  운전석을 닫았다 다시 열어도 방금 펴 둔 자리가 그대로 있게 하려는 것입니다.
 */
let CS_OPEN = {};

/* 지금 «다음으로 할 만한» 것 셋. 없는 자리는 건너뜁니다.
 *
 *    본편        아직 안 마친 첫 본편
 *    그밖의 이야기 아직 안 마친 곁가지 중 «가장 나중 것»
 *    거울·철도    한 번도 완주하지 않은 갈래 중 «가장 낮은 급»
 *
 *  셋 다 «지금 들어갈 수 있는 것» 만 고릅니다. 잠긴 것을 추천 자리에 세우면
 *  눌러도 아무 일이 안 일어나, 추천이라기보다 약 올리는 것이 됩니다.
 *
 *  이렇게 걸러도 「추천할 것이 없다」는 말은 «정말로 다 마쳤을 때» 만 나옵니다 —
 *  아직 안 마친 본편이 있으면 그것은 반드시 열려 있고(앞 장을 마쳐야 열리므로),
 *  본편을 다 마쳤으면 곁가지도 거울도 남김없이 열려 있기 때문입니다.
 */
function chapterPicks() {
  const 마쳤나 = c => !!(S.cleared && S.cleared[c.id]);
  const out = { main: -1, side: -1, mirror: null };

  CHAPTERS.forEach((c, i) => {
    if (마쳤나(c) || !chapterUnlocked(i)) return;
    if (isSide(c)) out.side = i;                      // 곁가지는 «가장 나중 것»
    else if (out.main < 0) out.main = i;              // 본편은 «가장 이른 것»
  });

  out.mirror = MIRROR_TIERS.find(r =>
    !(S.mirrorDone && S.mirrorDone[r.key]) && mirrorUnlocked(r)) || null;
  return out;
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

  /* 접히는 무리 하나. 눌러서 펴고 접습니다 — 펴 둔 자리는 CS_OPEN 이 기억합니다.
   * 접혀 있을 때는 이름만 보이므로, 무엇이 든 무리인지 한 줄로 곁들입니다. */
  const sec = (id, title, note, body) =>
    '<div class="csec' + (CS_OPEN[id] ? ' on' : '') + '" data-sec="' + id + '">' +
      '<div class="csechead"><b>' + title + '</b>' +
        (note ? '<span>' + note + '</span>' : '') + '<i></i></div>' +
      '<div class="csecbody">' + body + '</div>' +
    '</div>';

  /* rich 를 세우면 그 장의 소개(data/story.js 의 pitch 세 줄, 없으면 summary 한 줄)를
   * 함께 답니다. 「다음으로 추천」에서만 씁니다 — 거기서는 이야기 칸이 거울 칸과
   * 나란히 서는데, 이야기 쪽이 두 줄뿐이라 옆이 허전해 보이던 것을 메우는 몫입니다.
   * 접어 둔 「본편」 목록에서는 달지 않습니다. 열 몇 칸이 한꺼번에 길어집니다. */
  const chapPitch = c =>
    (c.pitch && c.pitch.length) ? c.pitch : (c.summary ? [c.summary] : []);
  const chapSlot = (c, i, rich) => {
    const done  = S.cleared && S.cleared[c.id];
    const open  = chapterUnlocked(i);
    const needs = chapterNeeds(c);
    const miss  = chapterMissing(c);
    return '<div class="slot' + (done ? ' sel' : '') + '"' + (open ? ' data-i="' + i + '"' : '') + '>' +
             slotStrip(open ? chapterBanner(c) : null) +
             '<div class="' + (open ? 'nm' : 'lock') + '">' + c.no +
               (c.subtitle ? '　' + c.subtitle : (c.title ? '　' + c.title : '')) + '</div>' +
             '<div class="sub">' + (open ? (done ? '클리어' : '진행 가능') : '잠김') + '</div>' +
             (rich && chapPitch(c).length
               ? '<div class="csum">' +
                   chapPitch(c).map(x => '<span>' + x + '</span>').join('') +
                 '</div>'
               : '') +
             (c.note ? '<div class="sub">' + c.note + '</div>' : '') +
             (needs.length
               ? '<div class="sub"' + (miss.length ? ' style="color:#c8403a"' : '') + '>' +
                   nameList(needs) + ' 편성 필요' +
                   (miss.length ? '　— 지금은 빠져 있습니다' : '　— 확인됨') + '</div>'
               : '') +
           '</div>';
  };

  /* 거울 던전 — 보통과 하드가 나란히 섭니다 */
  const enkNow = enkCount();
  const slot = (rule, attr) => {
    const open  = mirrorUnlocked(rule);
    const canGo = open && enkNow >= rule.cost;
    const f = mirrorFacts(rule);

    /* 잠긴 갈래는 «무엇을 해야 열리는가» 한 줄이면 됩니다.
     * 세기도 보상도, 열기 전에는 고를 수 없는 것이라 적어 봐야 눈만 어지럽습니다. */
    if (!open)
      return '<div class="slot">' +
               slotStrip(null, rule.name) +
               '<div class="lock">' + mirrorNeedText(rule) + '</div>' +
             '</div>';

    const chip = (label, value, bad) =>
      '<b' + (bad ? ' class="bad"' : '') + '><i>' + label + '</i>' + value + '</b>';

    return '<div class="slot mslot' + (canGo ? '' : ' sel') + '"' +
             (canGo ? ' ' + attr : '') + '>' +
             /* 이름은 띠 안에 넣습니다 — 「익스트림 거울 던전 산산이 부서진…」이
              * 한 줄에 안 들어가 줄이 갈리던 것을 없애려는 것입니다. */
             slotStrip(mirrorBG(rule), rule.name) +
             '<div class="msub">' + rule.sub + '</div>' +
             /* 갈래를 «고를 때» 필요한 것만 눈금 셋으로. 자세한 것은 들어가기 전 화면이 말합니다 */
             '<div class="mstats">' +
               chip("세기", f.세기) +
               chip(f.상대라벨, f.상대) +
               chip("입장", ENK_RULE.name + ' ' + rule.cost, !canGo) +
             '</div>' +
             '<div class="mrew">' + f.보상 +
               (f.첫몫 ? '<em' + (f.첫몫받음 ? ' class="done"' : '') + '>' +
                         f.첫몫 + '</em>' : '') + '</div>' +
             (canGo ? '' :
               '<div class="mwarn">' + ENK_RULE.name + '이 모자랍니다</div>') +
           '</div>';
  };

  const mirrorOnly = MIRROR_TIERS.filter(r => r.group !== "rail");
  const railOnly   = MIRROR_TIERS.filter(r => r.group === "rail");
  const sideList   = CHAPTERS.filter(isSide);

  /* ── 다음으로 추천 ────────────────────────────────────────────
   *  펴 둔 채로 맨 위에 섭니다. 접힌 무리를 일일이 펴 보지 않아도
   *  «지금 할 만한 것» 이 바로 눈에 들어오게 하려는 것입니다. */
  const pick = chapterPicks();
  /* 본편 추천 장에 편성 자리 이어하기(storySave)가 있으면, 그 장 바로
   * 옆에 «-장 이어하기» 카드를 하나 더 세웁니다 — resumeStorySave 참고. */
  const mainChap = pick.main >= 0 ? CHAPTERS[pick.main] : null;
  const storyResume = (mainChap && S.storySave && S.storySave.chId === mainChap.id)
    ? S.storySave : null;
  const rec = []
    .concat(mainChap ? [chapSlot(mainChap, pick.main, true)] : [])
    .concat(storyResume
      ? ['<div class="slot" data-storyresume="1">' +
           '<div class="nm">' + mainChap.no + ' 이어하기</div>' +
           '<div class="sub">편성을 고치던 자리에서 이어서 읽습니다</div>' +
         '</div>']
      : [])
    .concat(pick.side >= 0 ? [chapSlot(CHAPTERS[pick.side], pick.side, true)] : [])
    .concat(pick.mirror ? [slot(pick.mirror, 'data-mirror="' + pick.mirror.key + '"')] : []);

  h += '<div class="csrec">' +
         '<div class="csrechead">다음으로 추천</div>' +
         (rec.length
           ? '<div class="grid">' + rec.join('') + '</div>'
           : '<div class="csnone">추천할 것이 없습니다<br>' +
             '출시된 모든 컨텐츠를 충실하게 즐기셨군요!</div>') +
       '</div>';

  h += sec("main", "본편", "라슈 컴퍼니의 메인 여정을 따라가 보세요",
           '<div class="grid">' +
             CHAPTERS.map((c, i) => isSide(c) ? "" : chapSlot(c, i)).join('') +
           '</div>');

  /* 곁가지 이야기 — 본편 아래에 따로 섭니다 */
  if (sideList.length)
    h += sec("side", "그밖의 이야기", "본편 곁에서 벌어진 짧은 이야기들을 만나 보세요",
             '<div class="grid">' +
               CHAPTERS.map((c, i) => isSide(c) ? chapSlot(c, i) : "").join('') +
             '</div>');

  h += sec("mirror", "거울 던전", "더 세져서 돌아온 것들과 겨뤄 보세요",
           '<div class="grid">' +
             mirrorOnly.map(r => slot(r, 'data-mirror="' + r.key + '"')).join('') +
           '</div>');

  /* 거울굴절철도 — 거울 아래 제 줄에 섭니다. 호선이 늘면 이 줄이 그대로 늘어납니다. */
  if (railOnly.length)
    h += sec("rail", "거울굴절철도", "종점까지 내리 달리는 가장 긴 갈래에 오르세요",
             '<div class="grid">' +
               railOnly.map(r => slot(r, 'data-mirror="' + r.key + '"')).join('') +
             '</div>');

  h += '<div style="margin:14px 0 0">' + enkBarHTML() + '</div>';

  h += '<div class="modalfoot"><button id="csclose" class="ghost">닫기</button></div>';
  $sheet.innerHTML = h;

  /* 무리 이름을 누르면 접혔다 펴집니다. 편 자리는 CS_OPEN 이 기억하므로,
   * 운전석을 닫았다 다시 열어도 그대로 있습니다. */
  $sheet.querySelectorAll(".csec .csechead").forEach(el => {
    el.onclick = () => {
      const box = el.parentNode;
      const id  = box.dataset.sec;
      CS_OPEN[id] = !CS_OPEN[id];
      box.classList.toggle("on", !!CS_OPEN[id]);
    };
  });

  $sheet.querySelectorAll(".slot[data-i]").forEach(el => {
    el.onclick = () => { closeModal(); startChapter(+el.dataset.i); };
  });
  const rs = $sheet.querySelector(".slot[data-resume]");
  if (rs) rs.onclick = () => { closeModal(); if (!load()) { glass(); say("기록이 손상되었다.", "todo"); } };
  const srs = $sheet.querySelector(".slot[data-storyresume]");
  if (srs) srs.onclick = () => { closeModal(); resumeStorySave(); };
  $sheet.querySelectorAll(".slot[data-mirror]").forEach(el => {
    el.onclick = () => { openMirrorGate(el.dataset.mirror, () => openChapterSelect(back)); };
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

/* ⚠ 「테마팩」 개편(2026-09-02, 사용자 지침) — 노말·하드·익스트림 셋은
 * 더는 buildMirrorFoes() 로 무작위 적을 직접 뽑지 않습니다. 대신
 * data/mirrorpacks.js 의 MIRROR_PACKS 에서 「잡졸1+보스2」 묶음(팩)을
 * packRounds 번 고르는 방식으로 바뀌었습니다 — 자세한 흐름은
 * 「테마팩 선택」 절(openPackGate 부터)의 머리말을 읽으십시오.
 * count/maxBoss/bossChance/maxNormal 은 이 셋에서는 이제 안 씁니다
 * (buildMirrorFoes 는 여전히 아래 거울굴절철도 갈래가 씁니다). */
const MIRROR_RULE = {
  key:  "mirror",
  name: "거울 던전",
  sub:  "유리창에 비친 것들",
  prefix: "거울의 ",   // 비쳐 나온 적 이름 앞에 붙는 말
  packRounds: 1,  // 테마팩을 몇 번 고르는가
  scale:  2.0,    // 본편 대비 강화 배수 (테마팩 개편, 2026-09-02 — 1.3배에서 올림)
  bonus:  150,    // 완주 보상 (원고료) — «처음 완주할 때만» 나옵니다. moneyGain 을 타지 않습니다
  codex:  1,      // 완주 보상 (황금교본) — 돌 때마다 받습니다
  event:  20,     // 완주 보상 (이벤트 재화) — 이벤트가 서 있는 동안만 들어옵니다
  fragBoxSelect: 3,   // 완주 보상 (인격 파편 상자 선택) — 돌 때마다 받습니다
  needCleared: 3, // 본편을 몇 장 마쳐야 열리는가 (테마팩 개편, 2026-09-02 — 1장에서 올림)
  cost: ENK_RULE.cost   // 입장에 드는 엔케팔린
};

const MIRROR_HARD = {
  key:  "mirrorHard",
  name: "하드 거울 던전",
  sub:  "깨진 유리창에 비친 것들",
  bg:   "assets/scene/하드거울던전.jpg",
  prefix: "깨진 거울의 ",
  packRounds: 2,  // 테마팩을 두 번 연달아 고릅니다
  scale:  2.5,    // 테마팩 개편, 2026-09-02 — 2.0배에서 올림
  bonus:  250,
  codex:  3,
  event:  30,
  fragBoxSelect: 5,
  needCleared: 5, // 본편을 다섯 장 마쳐야 열립니다 (테마팩 개편, 2026-09-02 — 3장에서 올림)
  cost: ENK_RULE.costHard
};

const MIRROR_EXTREME = {
  key:  "mirrorExtreme",
  name: "익스트림 거울 던전",
  sub:  "산산이 부서진 유리창에 비친 것들",
  bg:   "assets/scene/익스트림거울던전.jpg",
  prefix: "조각난 거울의 ",
  packRounds: 3,  // 테마팩을 세 번 연달아 고릅니다
  scale:  3.0,    // 본편의 3배 (그대로)
  bonus:  900,
  codex:  7,
  event:  100,
  fragBoxSelect: 15,
  /* 테마팩 개편, 2026-09-02 — needCleared(장 수) 대신 「거울굴절철도 1호선을
   * 완주했는가」로 문을 겁니다(mirrorUnlocked 참고). 마지막 라운드에서
   * 거울굴절철도 팩(1호선·2호선)이 반드시 섞이니, 적어도 1호선은 미리
   * 완주해 봐야 그 팩이 스포일러 없이 자연스럽게 다가옵니다. */
  needMirrorDone: "railLine1",
  cost: ENK_RULE.costExtreme,

  /* 마지막(세 번째) 테마팩 선택에서는, 보여 주는 셋 중 하나가 반드시
   * 거울굴절철도 팩(1호선·2호선 중 무작위)입니다 — drawPackChoices 참고. */
  guaranteeRailPackOnFinalRound: true
};

/* ── 거울굴절철도 ──────────────────────────────────────────────
 *  거울 던전과 같은 틀을 쓰되 «선» 으로 이어지는 갈래입니다.
 *  group: "rail" 을 달면 운전석에서 거울 아래 제 줄에 따로 섭니다.
 *  2호선·3호선을 늘릴 때는 이 덩이를 본떠 MIRROR_TIERS 에 얹으면 됩니다.
 *
 *  거울과 다른 점 셋
 *    maxNormal  잡졸은 맨 앞 한 번만. 나머지는 전부 보스입니다
 *    finalFoe   종점은 정해져 있습니다 — 세기와 상관없이 맨 뒤에 섭니다
 *    defScale   3.5배에서 방어가 벽이 되지 않도록 공통값보다 낮게 잡았습니다
 *               (데스리퍼가 하드에서 46턴 걸리던 그 일을 되풀이하지 않으려는 것)
 */
const MIRROR_RAIL1 = {
  key:  "railLine1",
  group: "rail",
  name: "거울굴절철도 1호선",
  sub:  "굴절되어 이어지는 선로",
  bg:   "assets/scene/거울굴절철도1호선.jpg",
  prefix: "굴절된 ",
  count:  7,        // 일곱을 연달아 상대합니다 (종점 포함)
  scale:  3.5,      // 본편의 3.5배
  defScale: 0.25,   // 방어에만 덜 먹입니다 — ×3.5 일 때 방어 ×1.625
  bonus:  1000,
  codex:  10,
  event:  300,
  fragBoxSelect: 25,
  maxBoss: 5,       // 종점을 뺀 여섯 중 다섯까지 보스
  maxNormal: 1,     // 잡졸은 맨 앞 한 번만
  bossChance: 1.0,  // 보스가 반드시 섞입니다
  finalFoe: "ju3pino",   // 종점 — 만나 봐야 압니다
  needCleared: 5,
  cost: ENK_RULE.costRail,

  /* 들어가기 전(openMirrorGate) 맨 위에 붉게 뜨는 경고. 값을 안 적으면 아무것도 안 뜬다 —
   * 다른 갈래에는 없는 것이 정상입니다. defScale 로 덜어내도 3.5배는 여전히 세서,
   * 편성이 안 갖춰지면 종점까지 가기 전에 막힐 수 있습니다. */
  warn: "본편보다 훨씬 강한 갈래입니다. 동기화 단계와 시너지를 충분히 갖추지 않으면 버티기 어렵습니다.",

  /* 넷을 넘기면 길잡이가 들릅니다. 체력·관리력을 채우고, 편성도 손볼 수 있습니다 —
   * 앞의 넷을 겪어 보고 뒤의 셋을 다시 짤 자리를 주려는 것입니다.
   * 이 자리가 «패배해도 돌아오는 자리»(defeat() 의 mirrorCheckpoint)이기도 합니다. */
  rest: {
    after: 4,
    who:  "베르렐리우스",
    say:  "여기서부터는 선로가 굽어 있습니다. 준비를 고치십시오.",
    text: "길잡이가 관리력과 체력을 전부 회복시켰다.",
    party: true
  }
};

/* ── 거울굴절철도 2호선 · 순환 ─────────────────────────────────
 *  1호선이 «한 줄로 늘어선 선로» 라면 2호선은 «돌아오는 선로» 입니다.
 *  수도권 도시철도 2호선이 그렇듯, 같은 자리를 몇 번이고 다시 지납니다.
 *
 *  ■ 어떻게 도는가
 *    들어올 때 보스 셋을 뽑아 «못박습니다». 그 셋을 순환마다 다시 만나되,
 *    만날 때마다 세기만 올라갑니다.
 *
 *      1순환 ×3.0 → 2순환 ×3.5 → 3순환 ×4.0 → 4순환 ×4.5 → …  (loop.step 씩)
 *
 *    한 순환을 마칠 때마다 이형우가 베이스캠프에서 맞아 줍니다 —
 *    체력과 관리력을 채우고, 편성을 고치고, 보너스를 하나 고릅니다.
 *    loop.free 순환(셋)을 넘기면 그 자리에서 갈림길이 섭니다 —
 *    종착역으로 갈 것인가, 한 순환 더 돌 것인가.
 *
 *  ■ 종착역
 *    돌기만 해서는 끝나지 않습니다. 클리어는 종착역을 잡아야 성립합니다.
 *    종착역에 서는 것은 «마지막으로 돈 순환과 같은 배수» 입니다 —
 *    오래 돌면 보너스가 쌓이는 만큼 종착역도 함께 세집니다.
 *
 *  ■ 1호선과 다른 점
 *    count · scale · maxBoss 를 적지 않습니다. 그 자리를 loop 가 대신합니다.
 *    잡졸은 서지 않습니다 — 순환은 처음부터 끝까지 보스뿐입니다.
 */
const MIRROR_RAIL2 = {
  key:  "railLine2",
  group: "rail",
  name: "거울굴절철도 2호선",
  sub:  "돌아오고, 돌아오고, 또 돌아오는 선로",
  bg:   "assets/scene/거울굴절철도2호선.jpg",
  prefix: "굴절된 ",
  defScale: 0.25,      // 1호선과 같게 — 배수가 클수록 방어가 벽이 되기 쉽습니다

  /* 입장과 보상은 1호선과 같습니다 (사용자 지침).
   * 다만 「행운의 부적」을 고른 만큼 여기 적힌 수보다 더 받습니다 — mirrorClear 참고. */
  bonus:  1000,
  codex:  10,
  event:  300,
  fragBoxSelect: 25,
  cost: ENK_RULE.costRail,

  /* 종착역 — 만나 봐야 압니다 */
  finalFoe: "david_peters",
  finalBg:  "assets/scene/거울굴절철도2호선종착역.jpg",
  finalName: "거울굴절철도 2호선 종착역",

  /* 본편 6장을 마쳐야 열립니다. 다른 갈래처럼 «몇 장을 마쳤나» 로 세지 않고
   * 그 장을 콕 집습니다 — 곁가지(.5장)도 클리어 수에 들어가기 때문입니다. */
  needChapter: "ch6",

  warn: "1호선보다 길고 셉니다. 순환을 셋 돌아야 종착역이 열리고, 그 사이 쉼표는 " +
        "순환과 순환 사이뿐입니다. 도중에 유리창으로 나가면 처음부터입니다.",

  loop: {
    foes:  3,     // 한 순환에 세우는 보스 수
    free:  3,     // 이만큼 돌아야 종착역으로 갈 수 있습니다
    scale: 3.0,   // 1순환 배수
    step:  0.5    // 순환마다 오르는 몫
  },

  /* 순환과 순환 사이 — 이형우의 베이스캠프 */
  camp: { who: "이형우" }
};

/* 순환을 마칠 때마다 하나씩 고르는 것.
 * 이 2호선 한 판 안에서만 살고, 유리창으로 돌아가면 사라집니다.
 * 같은 것을 여러 번 골라도 됩니다 — 그때는 더해집니다 (0.2 + 0.2 = +40%). */
const RAIL2_BONUS_PCT = 0.20;
const RAIL2_BONUSES = [
  { key: "atk",    name: "충전식 장갑",   desc: "모든 아군의 공격력 +20%" },
  { key: "def",    name: "별자리의 가호", desc: "모든 아군의 방어 +20%" },
  { key: "hp",     name: "굴레",         desc: "모든 아군의 체력 +20%" },
  { key: "reward", name: "행운의 부적",   desc: "클리어 보상 +20%" }
];

/* 지금 걸려 있는 순환 보너스. 2호선 밖에서는 전부 0 입니다 —
 * S.mirror 가 내려가는 순간 저절로 꺼지므로, 편성 화면이나 본편에는 새어 나가지 않습니다. */
function railBonus() {
  const z = { atk: 0, def: 0, hp: 0, reward: 0 };
  if (!S || !S.mirror || !S.rail2) return z;
  (S.rail2.picks || []).forEach(k => { if (z[k] != null) z[k] += RAIL2_BONUS_PCT; });
  return z;
}

function railCycleScale(r, cycle) { return r.loop.scale + r.loop.step * (cycle - 1); }
function railDefK(r, k) {
  return 1 + (k - 1) * (r.defScale != null ? r.defScale : DEF_SCALE);
}
/* 배수를 「×3.5」처럼 적습니다 — 3.0 이 「3」으로 줄어들지 않게 소수 한 자리로 못박습니다 */
function railScaleText(k) { return "×" + k.toFixed(1); }

/* 한 순환에 설 것들을 그 순환의 세기로 빚습니다.
 * 열쇠를 「__mirror_」로 시작하게 지은 것은 일부러입니다 —
 * 다음에 뽑을 때 «비친 것을 또 비추는» 일이 없도록 buildMirrorFoes 가 거르는 이름입니다. */
function railCycleFoes(r, cycle, srcs) {
  const k = railCycleScale(r, cycle), dk = railDefK(r, k);
  return srcs.map((src, i) =>
    mirrorFoeCopy("__mirror_r2_" + cycle + "_" + i, src, r, k, dk));
}
function railFinalFoe(r, cycle) {
  const k = railCycleScale(r, cycle), dk = railDefK(r, k);
  return mirrorFoeCopy("__mirror_r2_final", r.finalFoe, r, k, dk);
}

/* 뽑아 둔 보스 셋의 «본래 열쇠». 순환마다 배수를 갈아 다시 빚어야 하므로,
 * 빚어 놓은 것이 아니라 본래 열쇠를 들고 있어야 합니다.
 * MIRROR_SCOUT 과 마찬가지로 보관함에는 담기지 않습니다. */
let RAIL2_PICK = null;   // { tier, bosses:[열쇠 셋] }

function buildLoopFoes(r) {
  const met = metFoes();
  const 설수있나 = x =>
    x.indexOf("__mirror_") !== 0 && !FOES[x].noMirror && typeof FOES[x].hp === "number";
  let keys = Object.keys(FOES).filter(x => 설수있나(x) && met[x]);
  if (!keys.length) keys = Object.keys(FOES).filter(설수있나);

  let bag = keys.filter(x => FOES[x].boss && x !== r.finalFoe);
  /* 만나 본 보스가 셋이 못 되면 잡졸로 채웁니다 — 같은 것을 두 번 세우지는 않습니다 */
  if (bag.length < r.loop.foes) bag = bag.concat(keys.filter(x => !FOES[x].boss));

  const picked = [];
  while (picked.length < r.loop.foes && bag.length)
    picked.push(bag.splice(rnd(bag.length), 1)[0]);
  picked.sort((a, b) => FOES[a].hp - FOES[b].hp);   // 약한 것부터

  RAIL2_PICK = { tier: r.key, bosses: picked };
  /* 관측 화면에 보일 몫입니다 — 1번째·2번째·3번째 보스와, 종착역에 설 것.
   * 세기는 여기서 상관이 없습니다(intro 만 보여 주므로) 1순환 몫으로 빚습니다. */
  return railCycleFoes(r, 1, picked).concat([railFinalFoe(r, 1)]);
}

/* 갈래를 늘리려면 여기에 얹으면 됩니다. 순서가 곧 화면에 서는 순서입니다. */
const MIRROR_TIERS = [MIRROR_RULE, MIRROR_HARD, MIRROR_EXTREME, MIRROR_RAIL1, MIRROR_RAIL2];

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
  /* needChapter 를 적은 갈래는 «그 장을 마쳤는가» 만 봅니다.
   * 클리어 수로 세면 곁가지(.5장)까지 함께 세어 버려, 본편 여섯 장을 마치지 않고도
   * 열리는 일이 생깁니다. 콕 집어야 하는 갈래는 이쪽을 씁니다. */
  if (r.needChapter) return !!(S.cleared && S.cleared[r.needChapter]);
  /* needMirrorDone 을 적은 갈래는 «그 갈래를 완주해 봤는가»(S.mirrorDone) 만
   * 봅니다 — 익스트림(사용자 지침 2026-09-02)이 이 자리입니다. 마지막
   * 라운드에서 거울굴절철도 팩(1호선·2호선)이 반드시 섞이니, 적어도
   * 1호선은 완주해 봐야 그 팩들이 스포일러 없이 자연스럽습니다. */
  if (r.needMirrorDone) return !!(S.mirrorDone && S.mirrorDone[r.needMirrorDone]);
  return Object.keys(S.cleared || {}).length >= r.needCleared;
}

/* ── 갈래 한 벌을 한 곳에서 짓습니다 ──────────────────────────
 *  운전석의 칸(고르는 자리)과 들어가기 전 화면(준비하는 자리)이 같은 말을 하되,
 *  «어디까지 적을 것인가» 는 다릅니다.
 *
 *    칸    고를 때 필요한 것만 — 세기 · 상대 · 입장 · 보상. 눈금 꼴로.
 *    문턱  고르고 난 뒤에 알면 되는 것 — 보스가 몇까지 섞이는지, 순환이 어떻게 도는지.
 *
 *  둘을 한 함수에서 지어야, 한쪽만 고쳐 놓고 다른 쪽이 옛말을 하는 일이 없습니다.
 */
function mirrorFacts(rule) {
  const r = rule || MIRROR_RULE;
  const 몫 = ['황금교본 ' + r.codex]
    .concat(r.fragBoxSelect ? ['파편 상자 ' + r.fragBoxSelect] : [])
    .concat((openEvent() && r.event) ? [eventCurName() + ' ' + r.event] : []);

  const 받았나 = !!(S.mirrorDone && S.mirrorDone[r.key]);
  const o = {
    상대라벨: '상대',
    보상: 몫.join('　·　'),
    첫몫: r.bonus ? (받았나 ? CURRENCY + ' ' + r.bonus + ' 받음'
                            : '첫 완주 ' + CURRENCY + ' ' + r.bonus) : "",
    첫몫받음: 받았나
  };

  if (r.loop) {
    /* 눈금은 좁습니다. 값을 늘리는 대신 이름표를 갈래에 맞게 바꿉니다 —
     * 「한 순환 / 보스 3」이 「상대 / 보스 3 × 순환」보다 좁고 또렷합니다. */
    o.세기 = railScaleText(r.loop.scale) + '부터';
    o.상대라벨 = '한 순환';
    o.상대 = '보스 ' + r.loop.foes;
    o.자세히 = '이미 만난 보스 ' + countWord(r.loop.foes) + ' 한 순환으로 묶어, ' +
               '순환마다 다시 만납니다. 세기는 순환마다 ' + r.loop.step.toFixed(1) + '씩 올라, ' +
               countBefore(r.loop.free) + ' 순환을 돌면 종착역으로 가는 문이 열립니다. ' +
               '그 뒤로는 순환을 더 돌지 종착역으로 갈지 고를 수 있습니다.';
    return o;
  }

  /* 테마팩 갈래(노말·하드·익스트림) — packRounds 번, 매번 셋 중 하나를 고릅니다 */
  if (r.packRounds) {
    o.세기 = railScaleText(r.scale);
    o.상대라벨 = '테마팩';
    o.상대 = countBare(r.packRounds) + '번';
    o.자세히 = '들어가면 「테마팩」(잡졸 하나·보스 둘) 셋을 보여 주고, 그중 하나를 골라' +
               ' 상대합니다. ' + (r.packRounds > 1 ? countBefore(r.packRounds) +
               ' 번 연달아 고릅니다 — 한 번 고른 자리부터 다시 이어할 수 있습니다.'
               : '') +
               (r.guaranteeRailPackOnFinalRound
                 ? ' 마지막 선택에서는 거울굴절철도 팩(1호선·2호선 중 하나)이 반드시 섞입니다.'
                 : '');
    return o;
  }

  /* 나오는 수는 «만나 본 적» 만큼입니다. 적게 만났으면 그만큼만 섭니다. */
  const n = Math.min(r.count, metCount());
  o.세기 = railScaleText(r.scale);
  o.상대 = '적 ' + n;
  o.자세히 = '이미 만난 적 ' + countWord(n) + ' 연달아 상대합니다.' +
             (r.maxNormal === 1 ? ' 맨 앞 하나를 빼면 모두 보스이고, 맨 뒤는 종점입니다.'
              : r.maxBoss >= r.count ? ' 모두 보스일 수 있습니다.'
              : r.maxBoss > 1 ? ' 보스가 ' + countBare(r.maxBoss) + '까지 섞입니다.' : '') +
             (r.rest ? ' ' + countBefore(r.rest.after) + ' 번째를 넘기면 ' +
                       withJosa(r.rest.who, "이") + ' 한 번 들러 체력과 관리력을 채워 줍니다.' : '');
  return o;
}

/* 아직 안 열린 갈래의 잠금 문구 — 화면과 startMirror 가 같은 말을 하도록 한 군데서 짓습니다 */
function mirrorNeedText(rule) {
  const r = rule || MIRROR_RULE;
  if (r.needChapter) {
    const c = CHAPTERS.find(x => x.id === r.needChapter);
    return "본편 " + (c ? c.no : r.needChapter) + "을 마치면 열립니다";
  }
  if (r.needMirrorDone) {
    const dr = MIRROR_TIERS.find(x => x.key === r.needMirrorDone);
    return (dr ? dr.name : r.needMirrorDone) + "을 완주하면 열립니다";
  }
  return "본편을 " + r.needCleared + "장 마치면 열립니다";
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
  /* 순환 갈래(2호선)는 뽑는 방식이 아주 다릅니다 — 셋을 못박고 순환마다 다시 빚습니다 */
  if (r.loop) return buildLoopFoes(r);
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

  const bosses  = keys.filter(x => FOES[x].boss && x !== r.finalFoe);
  const normals = keys.filter(x => !FOES[x].boss);
  const picked = [];

  /* 마지막을 정해 둔 갈래(finalFoe)는 그 한 자리를 빼고 뽑습니다 —
   * 뽑기가 끝난 뒤 맨 뒤에 그것을 붙입니다. */
  const want = r.finalFoe ? Math.max(0, r.count - 1) : r.count;
  /* 잡졸을 몇까지 세울 것인가. 안 적으면 상한 없음(예전 그대로). */
  const maxNormal = (r.maxNormal != null) ? r.maxNormal : want;

  /* 보스는 최대 maxBoss 명까지만 */
  if (bosses.length && Math.random() < r.bossChance) {
    const bag = bosses.slice();
    for (let i = 0; i < r.maxBoss && bag.length && picked.length < want; i++)
      picked.push(bag.splice(rnd(bag.length), 1)[0]);
  }
  /* 나머지는 보스가 아닌 적으로 채운다 — 다만 maxNormal 까지만 */
  const bag = normals.slice();
  let nUsed = 0;
  while (picked.length < want && bag.length && nUsed < maxNormal) {
    picked.push(bag.splice(rnd(bag.length), 1)[0]);
    nUsed++;
  }
  /* 잡졸 상한에 걸려 아직 모자라면 남은 보스로 더 채웁니다 */
  if (picked.length < want) {
    const more = bosses.filter(x => picked.indexOf(x) < 0);
    while (picked.length < want && more.length)
      picked.push(more.splice(rnd(more.length), 1)[0]);
  }

  /* 만나 본 것이 count 보다 적으면 그만큼만 나옵니다.
   * 같은 것을 두 번 세우기보다 짧게 끝나는 편이 낫습니다 —
   * 안내 글월도 실제로 나오는 수를 말합니다. */

  /* 약한 것부터 나오도록 — 보스가 있으면 자연히 마지막이 된다 */
  picked.sort((a, b) => FOES[a].hp - FOES[b].hp);

  /* 마지막을 정해 둔 갈래는 여기서 붙입니다 — 세기와 상관없이 «종점» 이라야 하므로
   * 정렬 뒤에 얹습니다. */
  if (r.finalFoe && FOES[r.finalFoe]) picked.push(r.finalFoe);

  /* 방어에 먹이는 배수는 갈래마다 따로 정할 수 있습니다 (defScale).
   * 안 적으면 공통값(DEF_SCALE)을 씁니다 — 배수가 클수록 방어가 벽이 되기 쉬워,
   * 배수가 큰 갈래일수록 이 값을 낮춰 잡습니다. */
  const dk = (r.defScale != null) ? (1 + (k - 1) * r.defScale) : defK(k);

  return picked.map((src, i) => mirrorFoeCopy("__mirror_" + i, src, r, k, dk));
}

/* ── 비친 것 하나를 빚는다 ────────────────────────────────────
 *  본편 적 하나를 배수만큼 세워 임시 적(FOES[id])으로 만듭니다.
 *  거울 던전도, 굴절철도도, 순환마다 배수가 달라지는 2호선도 전부 여기를 씁니다 —
 *  한 군데서만 베끼므로, 적에게 새 성질이 생기면 이 함수에만 한 줄 더하면 됩니다.
 *
 *    id  만들어 넣을 열쇠 (거울은 "__mirror_0", 2호선은 "__rail2_1_0" 처럼)
 *    src 본래 적의 열쇠      r  갈래 규칙 (prefix 를 봅니다)
 *    k   체력·공격에 곱할 배수      dk  방어에 곱할 배수
 */
function mirrorFoeCopy(id, src, r, k, dk) {
  const f = FOES[src];
  FOES[id] = {
    /* 원래 열쇠를 남겨 둡니다 — 거울굴절철도 저장 이어하기(railSave)가
     * "무엇을 비췄었는지" 되짚을 때 씁니다. 다른 곳에서는 안 읽습니다. */
    src: src,
    name: f.mirrorName || ((r && r.prefix) || "거울의 ") + f.name,
    hp:  Math.round(f.hp  * k),
    atk: Math.round(f.atk * k),
    def: Math.round(f.def * dk),
    boss: !!f.boss,
    img: f.img || null,
    /* 그림을 키워 세우는 적(타나콘다처럼 원본 안에서 몸집이 작게 잡힌 것)은
     * 거울에서도 «같은 크기» 로 서야 합니다. 이것을 빠뜨리면 본편에서는 크고
     * 거울 던전에서만 작게 나옵니다. */
    imgScale: f.imgScale || 0,
    /* 등장 대사와 강타 대사는 본래 것을 그대로 가져옵니다.
     * 빠뜨리면 거울 던전 보스가 강타를 준비하며 아무 말도 안 하게 됩니다. */
    intro: f.intro || null,
    quote: f.quote || null,
    heavyLine: f.heavyLine || null,
    heavyImg: f.heavyImg || null,
    noHeavy: !!f.noHeavy,
    /* 등장 연출과 등장 음성 — 종점·종착역처럼 «만나 봐야 아는» 것이 여기 걸립니다.
     * 빠뜨리면 암전 없이 그냥 서 버립니다 (startMirror 가 cineEntrance 를 봅니다). */
    cineEntrance: !!f.cineEntrance,
    sound: f.sound || null,
    /* 광역·회복도 함께 옮깁니다 — 빠뜨리면 거울에서만 이 짓을 안 합니다 */
    aoeEvery: f.aoeEvery || 0,
    aoeFrom: f.aoeFrom != null ? f.aoeFrom : null,
    aoeLine: f.aoeLine || null,
    aoeWarn: f.aoeWarn || null,
    healEvery: f.healEvery || 0,
    healFrom: f.healFrom != null ? f.healFrom : null,
    healAtk: f.healAtk || 0,
    healLine: f.healLine || null,
    healWarn: f.healWarn || null,
    desc: "유리창에 비쳐 나온 것. 본래보다 " +
          Math.round((k - 1) * 100) + "% 강하다."
  };
  return id;
}

/* ── 거울 던전에 들어가기 전 ──────────────────────────────────
 *  엔케팔린을 쓰기 «전» 에 할 수 있는 일들입니다. 여기서 무엇을 해도
 *  아직 던전에 들어간 것이 아니므로 엔케팔린은 그대로입니다.
 *
 *  늘리려면 MIRROR_PREP_ACTIONS 에 한 덩이 더 얹으면 됩니다.
 *  can·need·give 를 갖춘 덩이 하나가 할 일 하나이고, 화면(openMirrorGate)은
 *  그 배열을 그냥 훑어 그리므로 새로 늘어도 화면 쪽은 손댈 것이 없습니다. */
const MIRROR_SCOUT_COST = 3;    // 적 관측에 드는 황금교본

/* 관측해 둔 상대. 갈래(rule.key)마다 하나씩만 남습니다 — 갈래를 바꾸면
 * 그 갈래를 다시 관측해야 합니다. MIRROR 처럼 보관함에는 담기지 않는
 * 값이라, 새로고침하면 사라집니다 (다시 관측하면 됩니다). */
let MIRROR_SCOUT = null;   // { tier: rule.key, ids: [...] }

function mirrorScouted(rule) {
  return (MIRROR_SCOUT && MIRROR_SCOUT.tier === rule.key) ? MIRROR_SCOUT.ids : null;
}

/* ⚠ 일단 꺼 둡니다(사용자 지침, 2026-09-02) — 「테마팩」 개편(입장하면
 * 적을 무작위로 셋 보여주고 고르는 방식)이 들어오면 「관측」이 무엇을
 * 하는 자리인지부터 다시 정해야 합니다. 아래 함수·변수(MIRROR_SCOUT_COST·
 * MIRROR_SCOUT·mirrorScouted)는 다시 쓸 수 있게 그대로 남겨 뒀고,
 * MIRROR_PREP_ACTIONS 만 비웠습니다 — openMirrorGate()가 이 배열을 그냥
 * 훑어 그리므로, 비우면 "할 수 있는 일" 손잡이 자체가 안 뜹니다. */
const MIRROR_PREP_ACTIONS = [
];

function openMirrorGate(tier, back) {
  const rule = mirrorTier(tier);
  $modal.classList.add("on");

  const draw = (msg) => {
    const scouted = mirrorScouted(rule);
    const canGo = enkCount() >= rule.cost;
    /* 저장해 둔 이어하기 자리 — 체크포인트를 실제로 밟았을 때만 생깁니다
     * (case "rest" · SCENE_EXT.railCamp 참고). 완주하면 사라집니다. */
    const saved = (S.railSave && S.railSave.key === rule.key) ? S.railSave : null;

    const f = mirrorFacts(rule);
    let h = '<h2>' + rule.name + ' — 들어가기 전</h2>' +
      /* 갈래가 어떻게 굴러가는지는 여기서 다 말합니다. 운전석 칸에는 눈금만 서고,
       * 풀어 쓴 말은 이 자리 몫입니다 (mirrorFacts 의 주석 참고). */
      '<div class="hint">' + rule.sub + '.　' + f.자세히 + '</div>' +
      '<div class="hint"><b>세기</b> ' + f.세기 + '　·　<b>' + f.상대라벨 + '</b> ' + f.상대 +
        '　·　<b>완주 보상</b> ' + f.보상 + (f.첫몫 ? '　(' + f.첫몫 + ')' : '') + '</div>';

    if (saved)
      h += '<div class="hint" style="color:#d8b26a">저장해 둔 자리가 있습니다. ' +
           '<b>이어하기</b>를 누르면 엔케팔린 없이 그 자리부터, <b>입장</b>을 누르면 ' +
           '처음부터 다시 시작합니다 — 이때 저장해 둔 자리는 사라집니다.</div>';

    /* 갈래에 warn 을 적어 두었으면 여기, 관측(적 관측)보다 먼저 보이는 자리에 붉게 띄웁니다. */
    if (rule.warn)
      h += '<div class="hint" style="color:#c8403a;font-weight:700">' + rule.warn + '</div>';

    if (msg) h += '<div class="hint" style="color:#d8b26a">' + msg + '</div>';

    if (MIRROR_PREP_ACTIONS.length) {
      h += '<div style="margin:10px 0 6px;color:#e8e4de;font-weight:700">할 수 있는 일</div>' +
           '<div class="grid">';
      MIRROR_PREP_ACTIONS.forEach(a => {
        const ok = a.can(rule);
        h += '<div class="slot"' + (ok ? ' data-act="' + a.id + '"' : '') + '>' +
               '<div class="' + (ok ? 'nm' : 'lock') + '">' + a.name + '</div>' +
               '<div class="sub">' + a.desc + '</div>' +
               '<div class="sub"' + (ok ? '' : ' style="color:#c8403a"') + '>' + a.need(rule) + '</div>' +
             '</div>';
      });
      h += '</div>';
    }

    if (scouted) {
      /* 누구인지는 알려 주지 않습니다 — 이름·수치 대신 «새어나오는 소리»(intro) 만 들려줍니다.
       * intro 가 없는 잡졸은 그만큼 낌새도 흐릿하다는 뜻으로 둡니다. */
      h += '<div style="margin:18px 0 6px;color:#e8e4de;font-weight:700">새어나오는 소리</div>' +
           '<div class="grid one">' +
           scouted.map((id, i) => {
             const f = FOES[id];
             const line = f.intro || "낌새가 흐릿하다. 대단한 것은 아닌 듯하다.";
             /* 순환 갈래는 맨 끝이 «순환에서 만나는 것» 이 아니라 종착역에 서는 것입니다.
              * 그냥 「4번째」라고 적으면 순환에 넷이 나오는 줄로 읽힙니다. */
             const 이름 = (rule.loop && i === scouted.length - 1)
               ? '종착역' : ((i + 1) + '번째');
             return '<div class="slot sel">' +
                      '<div class="nm">' + 이름 + '</div>' +
                      '<div class="sub">' + line + '</div>' +
                    '</div>';
           }).join('') +
           '</div>';
    }

    h += '<div class="modalfoot">' +
           '<button id="mgback" class="ghost">돌아가기</button>' +
           (saved ? '<button id="mgresume" class="primary">이어하기</button>' : '') +
           '<button id="mgenter"' + (saved ? ' class="ghost"' : ' class="primary"') +
             (canGo ? '' : ' disabled') + '>' +
             '입장　(' + ENK_RULE.name + ' ' + rule.cost + (canGo ? '' : '　— 모자랍니다') + ')</button>' +
         '</div>';
    $sheet.innerHTML = h;

    $sheet.querySelectorAll(".slot[data-act]").forEach(el => {
      el.onclick = () => {
        const a = MIRROR_PREP_ACTIONS.find(x => x.id === el.dataset.act);
        if (!a || !a.can(rule)) return;
        const said = a.give(rule);
        saveVault(); render();
        draw(said);
      };
    });
    document.getElementById("mgback").onclick = () => { if (back) back(); else { closeModal(); render(); } };
    const enterBtn = document.getElementById("mgenter");
    if (canGo) enterBtn.onclick = () => { closeModal(); startMirror(rule.key, scouted); };
    if (saved) document.getElementById("mgresume").onclick = () => { closeModal(); resumeMirror(); };
  };
  draw(null);
}

/* 순환하지 않는 갈래(거울 던전·하드·익스트림·거울굴절철도 1호선)의 장면을
 * ids 로부터 짓습니다. startMirror() 와 resumeMirror() 둘 다 이걸 씁니다 —
 * 「저장해 둔 것으로 이어하기」가 처음 들어갈 때와 «정확히 같은 모양»으로
 * 다시 지어야 체크포인트 자리(scene index)가 어긋나지 않습니다.
 *
 *  rail:{no,total,k} 를 전투 장면마다 붙여 둡니다 — 「몇 번째 상대인지」를
 *  전투 화면에 보여주려는 것입니다(renderFoeBar 참고, 2호선의 rail:{cycle,no,k}
 *  와 같은 자리를 씁니다). */
function buildMirrorRunScenes(rule, ids) {
  const 첫줄 = rule === MIRROR_EXTREME
    ? "유리창이 터진다. 조각 하나하나가 저마다 다른 것을 비추고 있다."
    : rule === MIRROR_HARD
      ? "유리창에 금이 간다. 갈라진 틈마다 다른 것이 서 있다."
      : "메카고질라의 유리창이 흐려지더니, 비친 것들이 걸어 나온다.";
  const scenes = [{ t: "place", img: mirrorBG(rule), name: rule.name },
                  { t: "n", text: 첫줄 },
                  { t: "n", text: "쉴 틈은 없다. " + countWord(ids.length) + " 연달아 상대해야 한다." }];
  /* 길잡이가 들르는 자리(있으면) — 그 뒤로 지면 이 자리로 돌아옵니다. defeat() 참고. */
  let checkpoint = null;
  ids.forEach((id, i) => {
    if (i) scenes.push({ t: "n", text: "숨을 고를 새도 없이, 다음 것이 유리를 밀고 나온다." });
    const rail = { no: i + 1, total: ids.length, k: rule.scale };
    /* cineEntrance 를 단 적(쥬3피노 등)은 그냥 세우는 대신 등장 연출을 거칩니다 */
    scenes.push(FOES[id] && FOES[id].cineEntrance
      ? { t: "bossCine", foe: id, rail: rail } : { t: "battle", foe: id, rail: rail });
    /* 정해진 수를 넘기면 길잡이가 한 번 들러 세워 놓고 갑니다 */
    if (rule.rest && i + 1 === rule.rest.after && i + 1 < ids.length) {
      checkpoint = scenes.length;   // 이 rest 장면이 설 자리
      scenes.push({ t: "rest", who: rule.rest.who, say: rule.rest.say, text: rule.rest.text });
      /* 편성까지 손볼 수 있는 자리라면 쉬는 김에 한 번 물어봅니다 —
       * 앞의 것들을 겪어 보고 뒤를 다시 짜라는 뜻입니다. */
      if (rule.rest.party)
        scenes.push({ t: "party", text: "여기서 편성을 고칠 수 있습니다." });
    }
  });
  scenes.push({ t: "mirrorClear" });
  return { scenes: scenes, checkpoint: checkpoint };
}

/* ── 테마팩 선택 (2026-09-02, 사용자 지침) ──────────────────────
 *  노말·하드·익스트림이 들어서면(startMirror/resumeMirror의 packRounds
 *  갈래) 곧장 전투로 들어가는 대신 이 화면부터 거칩니다.
 *
 *  ■ 화면
 *    이형우가 "이번 거울에서는 길이 갈려 있습니다." 라고 말하고, 왼쪽·
 *    가운데·오른쪽 세 갈래(각각 data/mirrorpacks.js 의 테마팩 하나)를
 *    보여 줍니다. 손잡이 넷:
 *      경로 셋 중 하나 — 그 팩으로 들어갑니다(전투 시작).
 *      소리 듣기(황금교본 1) — 먼저 이 손잡이를 누르고 경로 하나를
 *        고르면, 그 팩 적 셋의 intro 대사만 보여 줍니다(들어가지는
 *        않습니다). 이 화면 한 번(=지금 보여 준 셋)에 딱 한 번만 씁니다.
 *      다른 길로(황금교본 2) — 지금 보여 준 셋을 통째로 다시 뽑습니다.
 *        같은 팩이 다시 나올 수 있습니다(사용자 지침 — 겹쳐도 됨). 다시
 *        뽑으면 「소리 듣기」를 다시 한 번 쓸 수 있습니다.
 *      유리창으로 나가기 — glass(). 아래 체크포인트 덕분에 언제든
 *        나갔다가 이어할 수 있습니다.
 *
 *  ■ 체크포인트 — S.railSave 를 그대로 재활용합니다
 *    { key, round, clearedPacks, arc }. arc 는 광신(김태성)·보복(유아인)
 *    같은 「이번 갈래」 스택입니다(사용자 지침 2026-09-02 — 중간 저장에서
 *    빠져 있던 것을 고침) — resumeMirror() 가 이걸로 되짚어 살립니다.
 *    이 화면이 뜰 때(맨 처음 포함) 곧바로
 *    저장됩니다 — 엔케팔린을 이미 쓰고 들어온 자리라 사용자 지침대로
 *    "첫 번째 선택 구간에서도 저장이 만들어집니다". 팩 하나를 다 깨면
 *    clearedPacks 에 더하고 다음 round 로 다시 저장합니다.
 *
 *    한 판(라운드 packRounds개) 안에서는 이미 깬 팩이 다음 뽑기 풀에서
 *    아예 빠집니다(clearedPacks) — drawPackChoices 참고.
 *
 *  ■ 패배하면
 *    편성을 다시 짤 수 없습니다(사용자 지침) — defeat() 이 packRounds
 *    갈래를 따로 갈라, "다시 도전"/"편성 바꾸기" 대신 "테마팩 선택으로"
 *    하나만 보여 주고 resumeMirror() 를 그대로 부릅니다. 이번 라운드에서
 *    깬 팩이 없으므로(아직 안 끝났으므로) S.railSave 는 손대지 않은
 *    그대로이고, 결국 지금 이 화면으로 돌아오는 것과 같습니다 — 다만
 *    새로 뽑으므로 보여 주는 셋은 달라질 수 있습니다.
 *
 *  ■ 익스트림 마지막 라운드
 *    guaranteeRailPackOnFinalRound 가 있으면, 보여 주는 셋 중 하나는
 *    무조건 거울굴절철도 팩(1호선·2호선 중 무작위, 열려 있는 쪽만)입니다.
 */
const MIRROR_SOUND_COST  = 1;   // 소리 듣기에 드는 황금교본
const MIRROR_REROLL_COST = 2;   // 다른 길로에 드는 황금교본
const PACK_PATH_NAME = ["왼쪽 길", "가운데 길", "오른쪽 길"];

/* 팩 하나가 지금 뽑기 풀에 들어갈 수 있는가.
 * 본편 적과 같은 원칙입니다 — «클리어한 장에 나왔던 적» 만 (metFoes 참고).
 * 다만 noMirror 를 단 적(쥬3피노·데이비드 피터스처럼 이야기에 안 나오고
 * 거울에서만 만나는 «종점» 부류)은 이 검사에서 뺍니다 — 애초에 metFoes 에
 * 잡힐 일이 없는 적이라, 그대로 두면 영영 못 뽑습니다. */
/* 본편 적과 같은 원칙 — «클리어한 장에 나왔던 적» 만(metFoes 참고).
 * noMirror 를 단 적(쥬3피노·데이비드 피터스처럼 이야기에 안 나오고 거울
 * 에서만 만나는 «종점» 부류)은 이 검사에서 뺍니다 — metFoes 에 잡힐 일이
 * 없는 적이라, 그대로 두면 영영 못 뽑습니다.
 *
 * ⚠ 처음엔 이렇게 짰다가, 노말의 문턱이 1장이던 때는 «어느 팩도 못 뽑는»
 * 사태가 났습니다(사용자 지침 2026-09-02) — 팩 하나가 여러 장에 걸친
 * 적을 묶은 경우(pack02 = 1장+3.5장)가 있어서입니다. 문턱을 노말 3장·
 * 하드 5장·익스트림 「1호선 완주」로 올리면서(mirrorUnlocked 참고) 다시
 * met 검사를 걸었습니다 — 문턱이 이만큼 높아지면 그때는 자연히 그 장
 * 근처의 팩 몇 개는 이미 met 상태일 걸로 보입니다. 그래도 특정 배수
 * 조합에서 풀이 셋보다 적게 남을 수 있습니다(그러면 화면에 둘만 뜹니다
 * — drawPackChoices 참고, 막힌 건 아니지만 확인이 필요할 수 있습니다). */
function packUnlocked(pack) {
  const met = metFoes();
  return pack.foes.every(f => met[f] || (FOES[f] && FOES[f].noMirror));
}

/* 지금 라운드에 보여 줄 테마팩 셋을 뽑습니다.
 * clearedPacks — 이번 판(여러 라운드) 안에서 이미 깬 팩 id 목록. 뽑기
 * 풀에서부터 뺍니다(사용자 지침 — 애초에 안 보여 줌). */
function drawPackChoices(rule, round, clearedPacks) {
  const pool = MIRROR_PACKS.filter(p =>
    !p.railOnly && packUnlocked(p) && clearedPacks.indexOf(p.id) < 0);
  const bag = pool.slice();
  const picks = [];

  /* 익스트림 마지막 라운드 — 한 자리는 거울굴절철도 팩으로 고정.
   * 그 갈래(1호선·2호선)가 열려 있고, met 검사도 통과해야 합니다 —
   * 익스트림 자체가 1호선 완주를 요구하지만(needMirrorDone), 그렇다고
   * 6장·6.5장까지 반드시 다 마쳤다는 보장은 아니라서(needCleared 는
   * «아무 5장»을 셉니다) 그대로 둡니다. 둘 다 못 뽑으면 그냥 평소
   * 풀에서 셋을 채웁니다. */
  if (rule.guaranteeRailPackOnFinalRound && round === rule.packRounds) {
    const railBag = MIRROR_PACKS.filter(p => p.railOnly && packUnlocked(p) &&
      mirrorUnlocked(MIRROR_TIERS.find(r => r.key === (p.id === "rail1pack" ? "railLine1" : "railLine2"))));
    if (railBag.length) picks.push(railBag[rnd(railBag.length)]);
  }
  while (picks.length < 3 && bag.length) picks.push(bag.splice(rnd(bag.length), 1)[0]);
  /* 순서를 다시 섞습니다 — 거울굴절철도 팩이 늘 첫 자리에만 서지 않게 */
  for (let i = picks.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    const t = picks[i]; picks[i] = picks[j]; picks[j] = t;
  }
  return picks;
}

/* 테마팩 하나의 전투 셋을 배수만큼 세워 장면으로 짓습니다.
 * buildMirrorRunScenes 와 같은 결이지만, 팩은 늘 정확히 셋이고 끝에
 * mirrorClear 대신 mirrorPackDone(그 팩 id를 실어)을 붙입니다 —
 * 다음 라운드로 이을지, 이걸로 판이 끝인지는 그 장면이 갈라 정합니다. */
function buildPackRunScenes(rule, pack) {
  const k = rule.scale;
  const dk = (rule.defScale != null) ? (1 + (k - 1) * rule.defScale) : defK(k);
  const ids = pack.foes.map((src, i) => mirrorFoeCopy("__mirror_" + i, src, rule, k, dk));
  const scenes = [];
  ids.forEach((id, i) => {
    if (i) scenes.push({ t: "n", text: "숨을 고를 새도 없이, 다음 것이 유리를 밀고 나온다." });
    const rail = { no: i + 1, total: ids.length, k: k };
    scenes.push(FOES[id] && FOES[id].cineEntrance
      ? { t: "bossCine", foe: id, rail: rail } : { t: "battle", foe: id, rail: rail });
  });
  scenes.push({ t: "mirrorPackDone", packId: pack.id });
  return scenes;
}

/* 고른 팩으로 실제로 들어갑니다 — startMirror() 의 뒷부분과 같은 결입니다. */
function enterPack(rule, pack) {
  MIRROR = { id: rule.key, no: rule.name, title: "", subtitle: rule.sub,
             scenes: buildPackRunScenes(rule, pack) };
  S.sc = 0;
  S.ended = false;
  SCENES = buildScenes(MIRROR);
  S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
  /* 팩에 들어가 있는 동안(테마팩 선택 화면으로 돌아올 때까지)은 그 팩의
   * 배경(사용자 지침 2026-09-02) — 안 적힌 팩은 그냥 거울 던전 기본 배경. */
  setBackdrop(pack.bg || mirrorBG(rule), null);
  clearLog();
  $log.classList.remove("recalling");
  showCard(null);
  divider();
  say(rule.name + " — " + pack.name, "place");
  say("쉴 틈은 없다. 이 팩의 셋을 연달아 상대해야 한다.", "sys");
  divider();
  render();
  next();
}

/* 모달(가짜 「거울 던전 준비」 화면)이 아니라, 거울굴절철도 베이스캠프
 * (SCENE_EXT.railCamp)와 같은 결의 «장면»입니다(사용자 지침 2026-09-02 —
 * "왜 거울던전 준비화면을 변형해서 만든 거야" 지적으로 고쳤습니다).
 * 이형우가 로그에 직접 나와 말을 걸고, 아래 손잡이 줄(buttons)로 경로를
 * 고릅니다 — 팩 안에서 돌아온 것일 수 있으므로 배경은 늘 기본 배경으로
 * 되돌립니다. */
function openPackGate(rule, round, clearedPacks) {
  setBackdrop(mirrorBG(rule), rule.name);
  S.waiting = true;
  divider();
  say((round > 1 ? round + "번째 갈림길입니다." : "길이 갈려 있습니다.") +
      (rule.packRounds > 1 ? "　(" + round + " / " + rule.packRounds + ")" : ""), "sys");
  speak("이형우", "\"이번 거울에서는 길이 갈려있습니다.\"");
  speak("이형우", "\"어느 쪽으로 가시겠습니까?\"");
  render();
  packGateChoices(rule, round, clearedPacks, drawPackChoices(rule, round, clearedPacks), null, false);
}

/* shown — 지금 보여 주는 세 갈래. heardId — 이 셋에서 「소리 듣기」로 이미
 * 들어 본 팩 id(한 번만). picking — 「소리 듣기」를 누르고 어느 경로의
 * 소리를 들을지 고르는 중인가. 다른 길로/소리 듣기는 처음의 이형우 대사를
 * 다시 읊지 않고, 이 함수만 다시 불러 손잡이 줄만 새로 그립니다. */
function packGateChoices(rule, round, clearedPacks, shown, heardId, picking) {
  S.waiting = true;
  if (picking) say("소리를 들을 경로를 고르십시오.", "sys");
  const canSound  = !picking && !heardId && S.codex >= MIRROR_SOUND_COST;
  const canReroll = !picking && S.codex >= MIRROR_REROLL_COST;

  const pathButtons = shown.map((p, i) => {
    if (!p) return null;
    return {
      label: PACK_PATH_NAME[i] + "　" + p.name + (heardId === p.id ? "　(들어 봄)" : ""),
      fn: () => {
        if (picking) {
          if (S.codex < MIRROR_SOUND_COST) return;
          S.codex -= MIRROR_SOUND_COST;
          say("→ " + p.name + "에서 새어 나오는 소리 —", "sys");
          p.foes.forEach(f => say((FOES[f] && FOES[f].intro) || "낌새가 흐릿하다.", "d"));
          saveVault();
          render();
          packGateChoices(rule, round, clearedPacks, shown, p.id, false);
          return;
        }
        S.waiting = false;
        say("→ " + p.name, "sys");
        enterPack(rule, p);
      }
    };
  });

  buttons(pathButtons.concat([
    { label: "소리 듣기　(황금교본 " + MIRROR_SOUND_COST + ")", cls: "ghost", disabled: !canSound,
      fn: () => { say("→ 소리 듣기.", "sys"); packGateChoices(rule, round, clearedPacks, shown, heardId, true); } },
    { label: "다른 길로　(황금교본 " + MIRROR_REROLL_COST + ")", cls: "ghost", disabled: !canReroll,
      fn: () => {
        S.codex -= MIRROR_REROLL_COST;
        saveVault();
        say("→ 다른 길로.", "sys");
        render();
        packGateChoices(rule, round, clearedPacks, drawPackChoices(rule, round, clearedPacks), null, false);
      } },
    { label: "유리창으로", cls: "ghost", fn: () => { S.waiting = false; glass(); } }
  ]));
}

function startMirror(tier, preIds) {
  const rule = mirrorTier(tier);
  const hard = rule !== MIRROR_RULE;   // 「보통이 아니다」— 글월에만 씁니다

  if (!mirrorUnlocked(rule)) {
    say(rule.name + "은 " + mirrorNeedText(rule).replace("면 열립니다", "야 열립니다") + ".", "sys");
    return;
  }
  if (!enkSpend(rule.cost)) {
    say(ENK_RULE.name + "이 모자랍니다. (" + enkCount() + " / " + ENK_RULE.max + ")　" +
        enkNextText(), "bad");
    render();
    return;
  }

  /* 새로 들어서는 자리이므로, 이 갈래든 다른 갈래든 저장해 둔 이어하기 자리가
   * 있었다면 여기서 버립니다 — 지금 막 새로 만드는 진행과 뒤섞이면 안 됩니다.
   * 「저장해 둔 자리에서 이어하기」는 resumeMirror() 가 따로 맡습니다. */
  S.railSave = null;

  /* 거울 던전에 들어서는 자리라 「이번 갈래」를 새로 엽니다 — 광신·보복 스택 리셋 */
  S.arc = { kills: 0, retribution: {} };

  /* 테마팩 갈래(노말·하드·익스트림) — 곧장 전투를 짓지 않고 테마팩 선택
   * 화면부터 엽니다(openPackGate 머리말 참고). 엔케팔린은 이미 위에서
   * 냈으므로, 여기서 곧바로 첫 체크포인트(S.railSave)를 남깁니다. */
  if (rule.packRounds) {
    S.mirrorCheckpoint = null;
    MIRROR = { id: rule.key, no: rule.name, title: "", subtitle: rule.sub, scenes: [] };
    S.mirror = true;
    S.mirrorTier = MIRROR_TIERS.indexOf(rule);
    S.mirrorHard = hard;
    S.mirrorRunTurns = 0;
    S.ended = false;
    S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
    S.railSave = { key: rule.key, round: 1, clearedPacks: [], arc: S.arc };
    saveVault();
    clearLog();
    $log.classList.remove("recalling");
    showCard(null);
    divider();
    say(rule.name, "place");
    say("— " + rule.sub + " —", "sys");
    say(ENK_RULE.name + " " + rule.cost + " 소모.  (남은 것 " + enkCount() +
        " / " + ENK_RULE.max + ")", "sys");
    divider();
    render();
    openPackGate(rule, 1, []);
    return;
  }

  /* 관측해 둔 것이 있으면 그대로 씁니다 — 다시 뽑으면 관측한 것과 달라져 버립니다.
   * 관측 없이 바로 들어왔으면(preIds 없음) 여기서 새로 뽑습니다 — 예전처럼 부딪쳐 봐야 압니다. */
  const ids = (preIds && preIds.length) ? preIds : buildMirrorFoes(rule);
  if (MIRROR_SCOUT && MIRROR_SCOUT.tier === rule.key) MIRROR_SCOUT = null;

  /* 순환 갈래(2호선)는 여기서부터 길이 아주 갈립니다 — 장면을 한꺼번에 짓지 않고
   * 한 순환씩 이어 붙이며 갑니다. 위에서 뽑은 것(RAIL2_PICK)을 그대로 물려 줍니다. */
  if (rule.loop) return startRailLoop(rule);

  const built = buildMirrorRunScenes(rule, ids);
  S.mirrorCheckpoint = built.checkpoint;

  MIRROR = {
    id: rule.key, no: rule.name, title: "",
    subtitle: rule.sub, scenes: built.scenes,
    /* 이어하기(railSave)가 되짚어 다시 지을 때 쓰는 원본 열쇠 목록 */
    foeSrc: ids.map(id => FOES[id].src)
  };

  S.mirror = true;
  S.mirrorTier = MIRROR_TIERS.indexOf(rule);
  S.mirrorHard = hard;              // 옛 보관함과 맞추려고 함께 둡니다
  S.mirrorRunTurns = 0;             // 결과 카드용 총 턴수 — 이 갈래에 새로 들어서므로 0부터
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

/* ── 거울굴절철도 저장 이어하기 ────────────────────────────────
 *  긴 갈래(1호선·2호선 등)를 하다가 창을 닫아도, 체크포인트(길잡이가 들르는
 *  자리 · 2호선 베이스캠프)를 실제로 밟은 시점에 S.railSave 를 보관함에도
 *  같이 남겨 둡니다(《rest》장면·SCENE_EXT.railCamp 참고). 이 함수는 그
 *  자리로 «다시 지어» 곧장 돌아갑니다 — 엔케팔린은 처음 들어올 때 이미
 *  치렀으므로 다시 받지 않습니다. 편성은 저장하지 않으므로(사용자 지침)
 *  지금 짜여 있는 편성 그대로 들어갑니다.
 *  완주하면(mirrorClear) 지워집니다 — 그 전까지만 사는 임시 데이터입니다. */
function resumeMirror() {
  if (!S.railSave) return;
  /* mirrorTier() 는 못 알아보는 열쇠면 MIRROR_RULE 로 슬쩍 넘어가므로,
   * 여기서는 직접 찾아 «정말 그 갈래가 맞는지» 확인합니다. */
  const rule = MIRROR_TIERS.find(r => r.key === S.railSave.key);
  if (!rule) { S.railSave = null; return; }   // 갈래 자체가 없어졌으면 포기

  /* 광신(김태성)·보복(유아인) 같은 「이번 갈래」 스택은 저장해 둔 자리에
   * 함께 실려 있으면 그대로 이어받습니다(사용자 지침 2026-09-02 — 중간
   * 저장에서 빠져 있던 것을 고침). 옛 저장(이 칸이 없던 판)은 0부터. */
  S.arc = S.railSave.arc ? { kills: S.railSave.arc.kills || 0,
                              retribution: Object.assign({}, S.railSave.arc.retribution) }
                          : { kills: 0, retribution: {} };

  /* 테마팩 갈래 — 저장해 둔 라운드·이미 깬 팩만 들고 선택 화면으로
   * 바로 돌아갑니다. 전투 장면을 다시 지을 게 없습니다(팩을 고르지
   * 않은 채로 나갔던 자리이므로). defeat() 도 여기로 그대로 옵니다. */
  if (rule.packRounds) {
    const round = S.railSave.round || 1;
    const cleared = (S.railSave.clearedPacks || []).slice();
    S.mirrorCheckpoint = null;
    MIRROR = { id: rule.key, no: rule.name, title: "", subtitle: rule.sub, scenes: [] };
    S.mirror = true;
    S.mirrorTier = MIRROR_TIERS.indexOf(rule);
    S.mirrorHard = rule !== MIRROR_RULE;
    S.mirrorRunTurns = S.railSave.turns || 0;
    S.ended = false;
    S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
    render();
    openPackGate(rule, round, cleared);
    return;
  }

  if (rule.loop) {
    const saved = S.railSave.rail2;
    if (!saved || !saved.bosses || !saved.bosses.length) { S.railSave = null; return; }
    S.rail2 = { bosses: saved.bosses.slice(), done: saved.done || 0, picks: (saved.picks || []).slice() };
    let scenes = [
      { t: "place", img: mirrorBG(rule), name: rule.name },
      { t: "n", text: "유리창이 둥글게 휜다. 끝이 있어야 할 자리에 다시 출발점이 있다." },
      { t: "n", text: "셋을 넘기면 한 순환이다. " + countBefore(rule.loop.free) +
                      " 순환을 돌아야 종착역으로 가는 문이 열린다." }
    ];
    for (let n = 1; n <= S.rail2.done; n++) scenes = scenes.concat(railCycleScenes(rule, n));
    MIRROR = { id: rule.key, no: rule.name, title: "", subtitle: rule.sub, scenes: scenes };
    S.mirrorHard = true;
  } else {
    const picked = S.railSave.picked || [];
    if (!picked.length) { S.railSave = null; return; }
    const k = rule.scale;
    const dk = (rule.defScale != null) ? (1 + (k - 1) * rule.defScale) : defK(k);
    const ids = picked.map((src, i) => mirrorFoeCopy("__mirror_" + i, src, rule, k, dk));
    const built = buildMirrorRunScenes(rule, ids);
    MIRROR = { id: rule.key, no: rule.name, title: "", subtitle: rule.sub,
               scenes: built.scenes, foeSrc: picked.slice() };
    S.mirrorHard = rule !== MIRROR_RULE;
  }

  S.mirror = true;
  S.mirrorTier = MIRROR_TIERS.indexOf(rule);
  S.mirrorRunTurns = S.railSave.turns || 0;   // 저장해 둔 자리까지 이미 쌓인 턴수를 이어받습니다
  S.mirrorCheckpoint = S.railSave.checkpoint;
  S.sc = S.railSave.checkpoint;
  S.ended = false;
  SCENES = buildScenes(MIRROR);
  S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
  setBackdrop(mirrorBG(rule), null);
  clearLog();
  $log.classList.remove("recalling");
  showCard(null);
  divider();
  say(rule.name, "place");
  say("— 저장해 둔 자리에서 이어합니다 —", "sys");
  divider();
  render();
  next();
}

/* ── 순환을 도는 갈래 (거울굴절철도 2호선) ─────────────────────
 *  다른 갈래는 들어설 때 장면을 통째로 지어 놓고 그 위를 걷습니다.
 *  2호선은 그럴 수가 없습니다 — 몇 순환을 돌지가 도는 사람 손에 달려 있어서,
 *  들어설 때는 1순환만 지어 두고 베이스캠프에서 그때그때 이어 붙입니다.
 *
 *  이어 붙이기 전에 MIRROR.scenes 를 캠프 자리까지 «잘라» 냅니다.
 *  져서 캠프로 돌아온 사람이 지난번과 다른 쪽을 고를 수 있어야 하는데,
 *  자르지 않으면 지난번에 붙인 순환 뒤에 새 순환이 또 붙습니다.
 */
function startRailLoop(rule) {
  /* 관측한 것이 있으면 그 셋이 그대로 섭니다. 없으면 여기서 뽑습니다. */
  if (!RAIL2_PICK || RAIL2_PICK.tier !== rule.key) buildLoopFoes(rule);
  S.rail2 = { bosses: RAIL2_PICK.bosses.slice(), done: 0, picks: [] };
  RAIL2_PICK = null;

  MIRROR = {
    id: rule.key, no: rule.name, title: "", subtitle: rule.sub,
    scenes: [
      { t: "place", img: mirrorBG(rule), name: rule.name },
      { t: "n", text: "유리창이 둥글게 휜다. 끝이 있어야 할 자리에 다시 출발점이 있다." },
      { t: "n", text: "셋을 넘기면 한 순환이다. " + countBefore(rule.loop.free) +
                      " 순환을 돌아야 종착역으로 가는 문이 열린다." }
    ].concat(railCycleScenes(rule, 1))
  };

  S.mirror = true;
  S.mirrorTier = MIRROR_TIERS.indexOf(rule);
  S.mirrorHard = true;              // 옛 보관함과 맞추려고 함께 둡니다
  S.mirrorRunTurns = 0;             // 결과 카드용 총 턴수 — 이 갈래에 새로 들어서므로 0부터
  S.mirrorCheckpoint = null;
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
  say("무엇이 비쳐 나올지는 부딪쳐 봐야 안다.", "sys");
  say(ENK_RULE.name + " " + rule.cost + " 소모.  (남은 것 " + enkCount() +
      " / " + ENK_RULE.max + ")", "sys");
  divider();
  render();
  next();
}

/* 한 순환치 장면 — 머리말 · 보스 셋 · 베이스캠프 */
function railCycleScenes(rule, n) {
  const k = railCycleScale(rule, n);
  const ids = railCycleFoes(rule, n, S.rail2.bosses);
  const out = [{ t: "railCycleHead", cycle: n, k: k }];
  ids.forEach((id, i) => {
    if (i) out.push({ t: "n", text: "선로가 다시 휜다. 다음 것이 그 자리에 서 있다." });
    /* rail 은 전투 화면 눈금에 적을 것입니다 — 몇 순환의 몇 번째인가 (renderFoeBar) */
    out.push({ t: "battle", foe: id, rail: { cycle: n, no: i + 1, k: k } });
  });
  out.push({ t: "railCamp", cycle: n });
  return out;
}

/* 종착역치 장면 — 배경이 갈리고, 정해진 것 하나가 섭니다 */
function railFinalScenes(rule, cycle) {
  const k  = railCycleScale(rule, cycle);
  const id = railFinalFoe(rule, cycle);
  const rail = { final: true, k: k };
  return [
    { t: "n", text: "선로가 처음으로 곧게 뻗는다. 돌아오지 않는 쪽이다." },
    { t: "place", img: rule.finalBg, name: rule.finalName },
    { t: "n", text: "승강장 벽을 따라 그림이 걸려 있다. 어느 하나도 같은 손에서 나오지 않았다." },
    FOES[id] && FOES[id].cineEntrance
      ? { t: "bossCine", foe: id, rail: rail }
      : { t: "battle",   foe: id, rail: rail },
    { t: "mirrorClear" }
  ];
}

/* 캠프 자리까지 잘라 내고 새로 이어 붙인다 */
function railAppend(scenes) {
  if (S.mirrorCheckpoint != null) MIRROR.scenes.length = S.mirrorCheckpoint + 1;
  scenes.forEach(x => MIRROR.scenes.push(x));
  SCENES = buildScenes(MIRROR);
  S.waiting = false;
  next();
}

/* ── 순환 머리말 ───────────────────────────────────────────── */
SCENE_EXT.railCycleHead = function (s) {
  const rule = mirrorRuleNow();
  setBackdrop(mirrorBG(rule), rule.name);
  divider();
  say("── " + s.cycle + "순환 ──　" + railScaleText(s.k), "place");
  say(s.cycle === 1
    ? "선로가 둥글게 휘어 제자리로 돌아온다. 세 정거장, 그리고 다시 여기."
    : "같은 선로다. 같은 셋이 서 있다. 이번에는 " + railScaleText(s.k) + ".", "sys");
  return cont();
};

/* ── 베이스캠프 ────────────────────────────────────────────────
 *  이형우가 순환과 순환 사이에 세워 둔 자리입니다. 여기서
 *    · 체력과 관리력이 전부 찹니다
 *    · 보너스를 하나 고릅니다 (그 순환에 처음 닿았을 때만)
 *    · 편성을 고칩니다
 *    · 종착역으로 갈지, 한 순환 더 돌지 고릅니다 (loop.free 순환을 넘겼을 때만)
 *  져도 이 자리로 돌아옵니다 — defeat() 참고. 돌아왔을 때 보너스를 또 주지는
 *  않습니다(picks 의 길이로 갈립니다). 안 그러면 일부러 져서 보너스를 모읍니다.
 */
SCENE_EXT.railCamp = function (s) {
  const rule = mirrorRuleNow();
  const r2 = S.rail2;
  if (!r2) return next();

  S.mirrorCheckpoint = S.sc - 1;      // 이 장면이 «져도 돌아오는 자리»
  r2.done = Math.max(r2.done || 0, s.cycle);
  S.waiting = true;

  /* 베이스캠프에 실제로 닿은 자리입니다 — 보관함에도 남겨서, 창을 닫았다
   * 다시 열어도 이 순환 끝에서부터 이어할 수 있게 합니다(resumeMirror 참고).
   * 편성은 담지 않습니다(사용자 지침) — mirrorClear() 에서 지웁니다. */
  S.railSave = { key: rule.key,
                 rail2: { bosses: r2.bosses.slice(), done: r2.done, picks: r2.picks.slice() },
                 checkpoint: S.mirrorCheckpoint, turns: S.mirrorRunTurns || 0, arc: S.arc };
  saveVault();

  divider();
  say("── " + s.cycle + "순환 종료 ──", "place");
  setBackdrop(mirrorBG(rule), rule.name);

  const 처음 = (r2.picks.length < s.cycle);   // 이 순환의 몫을 아직 안 골랐는가
  if (처음) {
    speak(rule.camp.who, s.cycle === 1
      ? "여기에 베이스캠프를 세워 뒀습니다. 선로가 돌아오는 자리니까요."
      : "또 오셨군요. 캠프는 그대로 있습니다.");
    railCampHeal();
    speak(rule.camp.who, "순환은 어떠셨습니까. …도움이 될 만한 것들을 좀 찾아 뒀습니다. 하나 챙기시죠.");
    return railBonusPick(rule, s.cycle);
  }
  /* 져서 되돌아온 자리입니다. 몫은 이미 받았으니 다시 주지 않습니다. */
  speak(rule.camp.who, "돌아오셨습니까. 캠프는 그대로입니다. 다시 나가시죠.");
  railCampHeal();
  return railFork(rule, s.cycle);
};

function railCampHeal() {
  S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
  S.restManage = true;                 // 다음 전투는 관리력을 가득 채우고 엽니다
  say("이형우가 관리력과 체력을 전부 회복시켰다.", "good");
  render();
}

function railBonusPick(rule, cycle) {
  S.waiting = true;
  const have = railBonus();
  divider();
  say("순환을 하나 돌 때마다 하나씩 고른다. 같은 것을 거듭 골라도 되고, 그때는 더해진다.", "sys");
  say("고른 것은 이 2호선 안에서만 산다 — 유리창으로 돌아가면 사라진다.", "sys");
  buttons(RAIL2_BONUSES.map((b, i) => ({
    label: b.name + "　" + b.desc +
           (have[b.key] ? "　(지금 +" + Math.round(have[b.key] * 100) + "%)" : ""),
    key: String(i + 1),
    fn: () => {
      S.rail2.picks.push(b.key);
      say("→ " + b.name + " — " + b.desc, "gain");
      /* 체력 상한이 올랐으면 오른 만큼 마저 채웁니다 */
      S.party.forEach(w => { if (w) S.hp[w] = maxHp(w); });
      render();
      railFork(rule, cycle);
    }
  })));
}

function railFork(rule, cycle) {
  S.waiting = true;
  const 이번K = railCycleScale(rule, cycle);
  const 다음K = railCycleScale(rule, cycle + 1);
  const 다음순환 = {
    label: (cycle + 1) + "순환으로　" + railScaleText(다음K),
    fn: () => railAppend(railCycleScenes(rule, cycle + 1))
  };
  const 편성 = { label: "편성 고치기", cls: "ghost",
                 fn: () => openParty(() => railFork(rule, cycle)) };

  divider();
  if (cycle < rule.loop.free) {
    say("종착역으로 가는 문은 아직 닫혀 있다. " +
        countBefore(rule.loop.free) + " 순환은 돌아야 한다.", "sys");
    다음순환.cls = "primary";
    return buttons([다음순환, 편성]);
  }

  speak(rule.camp.who,
    "여기서 종착역으로 빠지실 수 있습니다. 한 바퀴 더 도셔도 되고요. " +
    "다만 종착역에 서 있는 것도 그만큼 세져 있을 겁니다.");
  buttons([
    { label: "종착역으로　" + railScaleText(이번K), cls: "primary",
      fn: () => railAppend(railFinalScenes(rule, cycle)) },
    다음순환,
    편성
  ]);
}

/* ── 결과 카드 ──────────────────────────────────────────────────
 *  거울 던전(노말·하드·익스트림 — 테마팩 갈래) · 거울굴절철도(1호선·2호선)
 *  를 완주한 순간의 기록입니다(사용자 지침 2026-09-02 — 원래 거울굴절철도
 *  뿐이었으나 테마팩 갈래도 같은 보관함·같은 개수로 함께 셉니다).
 *  최근 세 판까지 보관함에 남아, 나중에 「기록」 화면에서 다시 꺼내
 *  복사할 수 있습니다. 서버 없이 도는 게임이라 순위표 대신, 화면 갈무리
 *  없이도 자랑할 수 있게 글 한 덩이로 옮겨 붙여 넣을 수 있게 하려는 것입니다.
 *
 *  packIds — 테마팩 갈래에서 이번 판에 고른 팩 id 목록(순서대로).
 *  거울굴절철도 등 팩이 없는 갈래는 null 을 넘깁니다. */
function mirrorRecordBuild(rule, packIds) {
  const party = S.party.map(w => {
    if (!w) return null;
    const id = idByKey(S.equip[w]);
    return { name: nameOf(w), title: id ? id.title : "", star: id ? id.star : null, sync: syncLevel(w) };
  });
  const advisors = advisorOnList().map(advisorById).filter(Boolean)
    .map(a => ({ name: a.name, title: a.title }));
  const gifts = giftOnList().map(giftById).filter(Boolean)
    .map(g => ({ name: g.name }));
  /* 2호선 순환 보너스 — 같은 것을 거듭 고르면 더해지므로 몫을 셉니다 */
  const picks = {};
  ((S.rail2 && S.rail2.picks) || []).forEach(k => { picks[k] = (picks[k] || 0) + 1; });
  /* 발동한 시너지 — 결과 카드용으로 이름만 얼려 둡니다(수치는 굳이 안 남깁니다) */
  const synergies = activeSynergies(S.party).map(s => s.name);
  /* 고른 테마팩 — 이름만 순서대로 얼려 둡니다(팩 자체가 나중에 없어져도 카드는 그대로 읽힙니다) */
  const packs = (packIds || []).map(id => {
    const p = MIRROR_PACKS.find(x => x.id === id);
    return p ? p.name : id;
  });
  return {
    at: Date.now(),
    ver: VERSION,
    key: rule.key,
    name: rule.loop ? rule.finalName : rule.name,   // 2호선은 「종착역」 이름으로 남깁니다
    turns: S.mirrorRunTurns || 0,
    cycles: (S.rail2 && S.rail2.done) || null,       // 1호선 등 순환 없는 갈래는 null
    party, advisors, gifts, picks, synergies, packs
  };
}

/* 최근 세 판까지만 보관함에 남깁니다 — 맨 앞이 최신입니다. */
function pushMirrorRecord(rec) {
  if (!S.mirrorRecords) S.mirrorRecords = [];
  S.mirrorRecords.unshift(rec);
  S.mirrorRecords = S.mirrorRecords.slice(0, 3);
}

function mirrorRecordDateText(at) {
  const d = new Date(at);
  const pad = n => String(n).padStart(2, "0");
  return d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate()) +
         " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

/* 2호선 순환 보너스로 고른 특전을 «이름 ×횟수」 로 폅니다. 하나도 안 골랐으면 null. */
function mirrorPickText(rec) {
  const keys = Object.keys(rec.picks || {});
  if (!keys.length) return null;
  return keys.map(k => {
    const b = RAIL2_BONUSES.find(x => x.key === k);
    return (b ? b.name : k) + " ×" + rec.picks[k];
  }).join(" · ");
}

/* 남에게 그대로 붙여 넣을 수 있는 글로 폅니다 */
function mirrorRecordText(rec) {
  const partyStr = rec.party.filter(Boolean)
    .map(p => p.name + (p.title ? "(" + p.title + ")" : "")).join(" · ") || "없음";
  const advStr = rec.advisors.length
    ? rec.advisors.map(a => a.name + (a.title ? "(" + a.title + ")" : "")).join(" · ")
    : "없음";
  const giftStr = rec.gifts.length ? rec.gifts.map(g => g.name).join(" · ") : "없음";
  const pickStr = mirrorPickText(rec);
  const lines = [
    "「라슈 컴퍼니」 " + rec.name + " 클리어",
    "턴수 " + rec.turns + "턴" + (rec.cycles ? "　(" + rec.cycles + "순환)" : ""),
    "편성 " + partyStr,
    "교육위원 " + advStr,
    "기프트 " + giftStr
  ];
  if (rec.packs && rec.packs.length) lines.push("테마팩 " + rec.packs.join(" → "));
  if (pickStr) lines.push("특전 " + pickStr);
  lines.push("v" + rec.ver + "　" + mirrorRecordDateText(rec.at));
  return lines.join("\n");
}

/* 결과 카드 — 캡처해서 자랑할 수 있게 편성칸 그대로 보여 주는 별도 화면.
 * mirrorClear() 에서 막 딴 기록으로 열리거나, 「기록」 화면(openRecord)에서
 * 보관함에 남은 최근 세 판 중 하나를 다시 열어 볼 수 있습니다.
 * 나가는 손잡이는 늘 유리창으로 갑니다 — 어디서 열렸든 같습니다. */
function openMirrorResult(rec) {
  $modal.classList.add("on");

  const emptySlot = '<div class="slot ro"><div class="lock">비어 있음</div></div>';
  const pad = (arr, n) => {
    const a = (arr || []).slice(0, n);
    while (a.length < n) a.push(null);
    return a;
  };

  const partyHTML = rec.party.map(w => !w ? emptySlot :
    '<div class="slot ro">' +
      (w.sync ? '<div class="mrsync">+' + w.sync + '단계</div>' : '') +
      '<div class="nm">' + w.name + '</div>' +
      '<div class="sub">' + (w.title
        ? '<span class="star">' + stars(w.star || 0) + '</span> ' + w.title
        : '인격 없음') + '</div>' +
    '</div>'
  ).join('');

  const giftHTML = pad(rec.gifts, 3).map(g => g
    ? '<div class="slot ro"><div class="nm">' + g.name + '</div></div>'
    : emptySlot
  ).join('');

  const advHTML = pad(rec.advisors, 3).map(a => a
    ? '<div class="slot ro"><div class="nm">' + a.title + ' ' + a.name + '</div></div>'
    : emptySlot
  ).join('');

  const synText = (rec.synergies && rec.synergies.length) ? rec.synergies.join(' · ') : '없음';
  const pickText = mirrorPickText(rec) || '없음';
  /* 테마팩 갈래(노말·하드·익스트림)에만 있는 자리 — 고른 순서 그대로 화살표로 잇습니다 */
  const packHTML = (rec.packs && rec.packs.length)
    ? '<div class="mrlabel">고른 테마팩</div><div class="mrline">' + rec.packs.join(' → ') + '</div>'
    : '';

  $sheet.innerHTML =
    '<div class="mrcard">' +
      '<div class="mrclear">' + rec.name + ' 클리어</div>' +
      '<div class="mrstats"><b class="mrturn">' + rec.turns + '턴</b>' +
        (rec.cycles ? '<span class="mrcyc">' + rec.cycles + '순환</span>' : '') +
      '</div>' +
      '<div class="mrlabel">편성</div>' +
      '<div class="grid three mrparty">' + partyHTML + '</div>' +
      '<div class="mrlabel">사용한 E.G.O 기프트</div>' +
      '<div class="grid three">' + giftHTML + '</div>' +
      '<div class="mrlabel">세운 교육위원</div>' +
      '<div class="grid three">' + advHTML + '</div>' +
      '<div class="mrlabel">발동한 시너지</div>' +
      '<div class="mrline">' + synText + '</div>' +
      packHTML +
      '<div class="mrlabel">선택한 특전</div>' +
      '<div class="mrline">' + pickText + '</div>' +
      '<div class="mrver">v' + rec.ver + '　' + mirrorRecordDateText(rec.at) + '</div>' +
    '</div>' +
    '<div class="hint" style="margin-top:14px">이 화면을 캡처해서 자랑할 곳에 공유하세요.</div>' +
    '<div class="modalfoot" style="justify-content:flex-end">' +
      '<button id="mrExit" class="primary">유리창으로 나가기</button>' +
    '</div>';

  document.getElementById("mrExit").onclick = () => { closeModal(); glass(); };
}

/* 로그에 결과 카드를 한 덩이로 띄웁니다 — say() 와 달리 줄바꿈을 그대로 살립니다 */
function sayCard(text) {
  const el = document.createElement("pre");
  el.className = "resultcard";
  el.textContent = text;
  $log.appendChild(el);
  $log.scrollTop = $log.scrollHeight;
}

/* 클립보드로 복사합니다. 옛 브라우저 등 navigator.clipboard 가 없는 환경은
 * 감춘 textarea 로 대신합니다.
 * btn 을 주면(모달 안 등, 로그가 가려져 say() 가 안 보이는 자리) 그 손잡이
 * 글자를 잠깐 «복사됨!」으로 바꿔 알립니다 — 안 주면 로그에 한 줄 남깁니다. */
function copyText(text, okMsg, btn) {
  const done = () => {
    if (!btn) { say(okMsg || "복사했습니다.", "good"); return; }
    const old = btn.textContent;
    btn.textContent = "복사됨!"; btn.disabled = true;
    setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 1200);
  };
  const fail = () => {
    const msg = "복사에 실패했습니다 — 카드를 길게 눌러 직접 골라 복사해 주세요.";
    btn ? alert(msg) : say(msg, "bad");
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, fail);
    return;
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    ok ? done() : fail();
  } catch (e) { fail(); }
}

function mirrorClear() {
  const rule = mirrorRuleNow();
  /* 결과 카드(테마팩 갈래)용 — 지우기 전에 «이번 판에서 고른 팩» 목록을
   * 먼저 빼 둡니다. case "mirrorPackDone" 이 마지막 팩까지 실어 둔 것입니다. */
  const clearedPackIds = (rule.packRounds && S.railSave && S.railSave.key === rule.key)
    ? (S.railSave.clearedPacks || []) : null;
  /* 완주했으므로 저장해 둔 이어하기 자리는 이제 필요 없습니다 — 임시 데이터라
   * 여기서 지웁니다(saveVault() 는 이 함수 뒤 어디선가 자연히 한 번 더 돌아
   * 보관함에도 반영됩니다). */
  if (S.railSave && S.railSave.key === rule.key) S.railSave = null;
  divider();
  say(rule.loop            ? "둥글게 휘어 있던 선로가 마침내 풀린다."
    : rule === MIRROR_EXTREME ? "흩어진 조각들이 하나씩 제자리를 찾아 간다."
    : rule === MIRROR_HARD    ? "깨진 유리가 도로 맞물린다."
    :                           "유리창이 다시 맑아진다.", "good");
  /* 이 갈래를 «처음» 완주하는가 — 표를 남기기 전에 봐 두어야 합니다 */
  const firstRun = !(S.mirrorDone && S.mirrorDone[rule.key]);
  if (!S.mirrorDone) S.mirrorDone = {};
  S.mirrorDone[rule.key] = true;

  /* ── 「행운의 부적」 ──────────────────────────────────────────
   *  2호선에서 순환마다 고를 수 있는 넷 중 하나입니다. 고른 수만큼
   *  받는 몫이 늘어납니다 — 원고료 · 황금교본 · 파편 상자 · 이벤트 재화 모두.
   *  다른 갈래에서는 railBonus() 가 0 을 돌려주므로 곱해도 그대로입니다. */
  const 덤 = 1 + railBonus().reward;
  const 몫 = n => Math.round((n || 0) * 덤);
  if (덤 > 1)
    say("행운의 부적이 몫을 " + Math.round((덤 - 1) * 100) + "% 늘린다.", "gain");

  /* 원고료는 «처음 완주할 때만» 나옵니다. 고정값이라 earn() 을 타지 않으므로,
   * 들머리 칸에 적힌 수가 그대로 들어옵니다. */
  if (rule.bonus) {
    if (firstRun) {
      S.money += 몫(rule.bonus);
      say("처음 완주한 삯 — " + CURRENCY + " " + 몫(rule.bonus) + " 획득.", "gain");
    } else {
      say(CURRENCY + "는 처음 완주할 때만 나온다.", "sys");
    }
  }
  if (rule.codex) {
    S.codex += 몫(rule.codex);
    say("비친 것들이 남기고 간 황금교본 " + 몫(rule.codex) + "권.  (보유 " + S.codex + ")", "gain");
  }
  /* 인격 파편 상자(선택) — 돌 때마다 받는 몫입니다. 갈래마다 다릅니다. */
  if (rule.fragBoxSelect) {
    addFragBox("select", 몫(rule.fragBoxSelect));
    say("인격 파편 상자(선택) " + 몫(rule.fragBoxSelect) + "개 획득.  (보유 " +
        fragBoxCount("select") + "개)", "gain");
  }
  /* 이벤트 재화 — 갈래마다 다릅니다. 각 MIRROR_TIERS 줄의 event 를 봅니다. */
  gainEvent(몫(rule.event));
  /* 완주 업적은 여기서 봅니다. S.mirror 를 내리기 전에 불러야
   * 편성·시너지 조건이 아직 거울 안의 것으로 읽힙니다. */
  checkAchievements(null, rule.key);
  /* 결과 카드 — 거울굴절철도(1호선·2호선)뿐 아니라 노말·하드·익스트림
   * (테마팩 갈래)도 남깁니다(사용자 지침 2026-09-02) — 보는 곳·보관함은
   * 같고, 남는 개수(pushMirrorRecord 의 slice(0,3))도 함께 셉니다.
   * S.rail2 를 지우기 전에(바로 아래) 만들어야 순환 수·특전을 읽을 수 있습니다. */
  const record = (rule.group === "rail" || rule.packRounds)
    ? mirrorRecordBuild(rule, clearedPackIds) : null;
  if (record) pushMirrorRecord(record);
  saveVault();
  S.mirror = false;
  S.mirrorTier = null;
  S.mirrorHard = false;
  /* 순환 보너스는 여기서 사라집니다 — 이 2호선 한 판 안에서만 살던 것입니다.
   * 「굴레」로 부풀렸던 체력 상한이 도로 줄어드니, 넘치는 몫을 깎아 맞춥니다. */
  S.rail2 = null;
  S.party.forEach(w => { if (w) S.hp[w] = Math.min(curHp(w), maxHp(w)); });
  MIRROR = null;
  S.ended = true;
  if (record) { divider(); sayCard(mirrorRecordText(record)); }
  render();
  const again = enkCount() >= rule.cost;
  const clearButtons = [
    { label: again ? "한 번 더" : "한 번 더 (" + ENK_RULE.name + " 부족)",
      cls: "primary", disabled: !again, fn: () => startMirror(rule.key) }
  ];
  /* 결과 카드가 있는 갈래(거울굴절철도)는 유리창/상점으로 바로 나가지 않고,
   * 먼저 결과 카드 화면을 거칩니다 — 그 화면의 [유리창으로 나가기] 가 진짜 출구입니다. */
  if (record) {
    clearButtons.push({ label: "결과 카드 보기", cls: "primary",
      fn: () => openMirrorResult(record) });
    clearButtons.push({ label: "결과 카드 복사", cls: "ghost",
      fn: () => copyText(mirrorRecordText(record), "결과 카드를 복사했습니다 — 자랑할 곳에 붙여 넣으세요.") });
  } else {
    clearButtons.push({ label: "유리창", fn: () => glass() });
    clearButtons.push({ label: "상점", cls: "ghost", fn: () => openShop(() => {}) });
  }
  buttons(clearButtons);
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
    ((S.mirrorRecords || []).length
      ? '<h3 style="margin:18px 0 4px">거울 던전 결과 카드</h3>' +
        '<div class="hint">거울 던전(노말·하드·익스트림)·거울굴절철도를 합쳐 최근 세 판까지 남습니다. 「보기」로 캡처용 화면을 다시 열거나, 「복사」로 글로 붙여 넣으세요.</div>' +
        '<div class="grid one">' +
        S.mirrorRecords.map((r, i) =>
          '<div class="slot" style="cursor:default">' +
            '<div class="nm">' + r.name + ' 클리어</div>' +
            '<div class="sub">' + r.turns + '턴' + (r.cycles ? '　·　' + r.cycles + '순환' : '') +
              (r.packs && r.packs.length ? '　·　' + r.packs.join(' → ') : '') +
              '　·　' + mirrorRecordDateText(r.at) + '</div>' +
            '<div style="margin-top:8px;display:flex;gap:8px">' +
              '<button id="recview' + i + '" class="ghost">결과 카드 보기</button>' +
              '<button id="reccp' + i + '" class="ghost">복사</button>' +
            '</div>' +
          '</div>'
        ).join('') +
        '</div>'
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

  (S.mirrorRecords || []).forEach((r, i) => {
    const cp = document.getElementById("reccp" + i);
    if (cp) cp.onclick = () => copyText(mirrorRecordText(r), null, cp);
    const vw = document.getElementById("recview" + i);
    if (vw) vw.onclick = () => openMirrorResult(r);
  });

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
  if (g.event) out.push(eventCurName() + " " + g.event);
  if (g.enk)   out.push(ENK_RULE.name + " " + g.enk);
  if (g.fragBoxSelect) out.push("인격 파편 상자(선택) " + g.fragBoxSelect + "개");
  if (g.fragBoxRandom) out.push("인격 파편 상자(무작위) " + g.fragBoxRandom + "개");
  if (g.enkCap) out.push(ENK_CAPSULE.name + " " + g.enkCap + "개");
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
  /* 캡슐·상자는 개수로 쌓이기만 하므로 상한 때문에 버려지지 않습니다 */
  if (g.money || g.codex || g.event || g.support || g.enkCap ||
      g.fragBoxSelect || g.fragBoxRandom) return false;   // 다른 것이 있으면 버려질 일 없습니다
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
  if (g.event) { addEvent(g.event); got.push(eventCurName() + " " + g.event); }
  if (g.fragBoxSelect) { addFragBox("select", g.fragBoxSelect); got.push("인격 파편 상자(선택) " + g.fragBoxSelect + "개"); }
  if (g.fragBoxRandom) { addFragBox("random", g.fragBoxRandom); got.push("인격 파편 상자(무작위) " + g.fragBoxRandom + "개"); }
  if (g.enkCap) { addEnkCap(g.enkCap); got.push(ENK_CAPSULE.name + " " + g.enkCap + "개"); }
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

  /* 기간이 지나면 받았든 안 받았든 화면에서 뺀다 — 지난 우편을 언제까지고
   * 「받았습니다」로 늘어놓을 까닭이 없다. */
  const live = all.filter(mailLive);
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
/* 정렬("added"·"name"·"synergy")과 「보유한 것만」 — 판이 도는 동안 기억합니다.
 * 사용자 지침(2026-08-31)으로 기본을 «보유한 것만 보기»로 바꿨습니다. */
let ADV_SORT = "added";
let ADV_OWNED_ONLY = true;
/* 「시너지순」 정렬용 — 이 교육위원의 제목이 synergySortedList() 의 몇 번째
 * 시너지에 걸리는지를 등수로 돌려줍니다. 어디에도 안 걸리면 맨 뒤로 갑니다. */
function advisorSynergyRank(a) {
  const ordered = synergySortedList();
  for (let i = 0; i < ordered.length; i++) {
    const tags = Array.isArray(ordered[i].tag) ? ordered[i].tag : [ordered[i].tag];
    if (tags.some(tg => a.title.indexOf(tg) >= 0)) return i;
  }
  return ordered.length;
}
function openAdvisor(back) {
  $modal.classList.add("on");
  const all = advisorList();
  const mine = all.filter(a => S.advisorsOwned && S.advisorsOwned[advisorId(a)]);

  const cap = advisorSlots();
  const nowOn = advisorOnList();
  const 다음 = nextSlotChapter("advisor");

  /* 정렬·「보유한 것만」 — 인격 장착(openEquip)의 EQUIP_OWNED_ONLY와 같은
   * 요령입니다. 기본은 보유한 것만 보이게(ADV_OWNED_ONLY = true) 해 두었습니다
   * (사용자 지침 2026-08-31 — "추가된 순서로만 나와서 난잡하다"). */
  let list = all.slice();
  if (ADV_SORT === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name, "ko") || a.title.localeCompare(b.title, "ko"));
  } else if (ADV_SORT === "synergy") {
    list.sort((a, b) => advisorSynergyRank(a) - advisorSynergyRank(b) || a.name.localeCompare(b.name, "ko"));
  }
  if (ADV_OWNED_ONLY) list = list.filter(a => S.advisorsOwned && S.advisorsOwned[advisorId(a)]);

  let h = '<h2>보 조 교 육 위 원</h2>' +
          '<div class="hint">관리자 옆에 <b>' + cap + '명</b>까지 세울 수 있습니다. 직접 싸우지는 않고, ' +
          '편성된 작성위원 전원에게 상시 효과를 겁니다.　세운 ' + nowOn.length + ' / ' + cap +
          '　·　보유 ' + mine.length + ' / ' + all.length +
          (다음 ? '<br>' + 다음 + '을 마치면 한 명 더 세울 수 있습니다.' : '') +
          '</div>' +
          '<div class="eqbar">' +
            '<label class="eqchk"><input type="checkbox" id="advowned"' +
              (ADV_OWNED_ONLY ? ' checked' : '') + '> 보유한 것만 보기</label>' +
            '<button id="advsort_added" class="' + (ADV_SORT === "added" ? "" : "ghost") + '">추가순</button>' +
            '<button id="advsort_name" class="' + (ADV_SORT === "name" ? "" : "ghost") + '">이름순</button>' +
            '<button id="advsort_synergy" class="' + (ADV_SORT === "synergy" ? "" : "ghost") + '">시너지순</button>' +
          '</div>' +
          '<div class="grid">';

  h += '<div class="slot' + (!nowOn.length ? ' sel' : '') + '" data-pick="">' +
         '<div class="nm">모두 내리기</div><div class="sub">아무도 세우지 않습니다</div></div>';

  if (!list.length)
    h += '<div class="slot"><div class="sub">' +
         (ADV_OWNED_ONLY ? '아직 보유한 교육위원이 없습니다 — 「보유한 것만 보기」를 꺼 보십시오.'
                         : '표시할 교육위원이 없습니다.') + '</div></div>';

  list.forEach(a => {
    const k = advisorId(a);
    const has = !!(S.advisorsOwned && S.advisorsOwned[k]);
    const on  = advisorIsOn(k);
    /* 같은 사람을 이미 세웠으면 못 고릅니다 — N사 이형우와 L사 이형우처럼 */
    const 겹침 = has && !on && advisorNameTaken(k);
    /* 그 사람이 지금 지원 작성위원으로 편성에 있으면(예: 하축론=이정빈) 못 세웁니다 */
    const 지원겹침 = has && !on && !겹침 && advisorBlockedBySupport(k);
    const 고를수있나 = has && !겹침 && !지원겹침;
    h += '<div class="slot' + (on ? ' sel' : '') + '"' +
           (고를수있나 ? ' data-pick="' + k + '"' : '') + '>' +
           '<div class="' + (고를수있나 || on ? 'nm' : 'lock') + '">' +
             '<span class="star">' + stars(a.star) + '</span> ' + a.title + ' ' + a.name +
             (on ? ' <span class="sub">· 배치</span>' : '') + '</div>' +
           '<div class="sub">' + (has ? a.desc : '미보유') + '</div>' +
           (겹침 ? '<div class="sub" style="color:#c8403a">' + withJosa(a.name, "을") +
                   ' 이미 세웠습니다. 한 사람은 한 번만 설 수 있습니다.</div>' : '') +
           (지원겹침 ? '<div class="sub" style="color:#c8403a">' +
                   withJosa(지원겹침, "이") + ' 지원 작성위원으로 편성에 있어 세울 수 없습니다.</div>' : '') +
           (has && a.note ? '<div class="sub">' + a.note + '</div>' : '') +
         '</div>';
  });
  h += '</div><div class="modalfoot"><button id="aclose">돌아가기</button></div>';
  $sheet.innerHTML = h;

  document.getElementById("advowned").onchange = (e) => { ADV_OWNED_ONLY = e.target.checked; openAdvisor(back); };
  ["added", "name", "synergy"].forEach(key => {
    document.getElementById("advsort_" + key).onclick = () => { ADV_SORT = key; openAdvisor(back); };
  });

  $sheet.querySelectorAll(".slot[data-pick]").forEach(el => {
    el.onclick = () => {
      const k = el.dataset.pick;
      /* 빈 손잡이는 «모두 내리기» */
      if (!k) S.advisorOn = [];
      else if (advisorIsOn(k)) S.advisorOn = advisorOnList().filter(x => x !== k);
      else if (advisorNameTaken(k)) return;      // 같은 사람은 둘 세울 수 없습니다
      else if (advisorBlockedBySupport(k)) return; // 지원 작성위원으로 이미 서 있습니다
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

/* ── 동기화 화면 ─────────────────────────────────────────────
 *  작성위원 12명을 줄로 늘어놓고, 각자의 동기화 단계·파편 보유량과
 *  다음 단계로 올리는 손잡이를 보여 준다.
 *
 *  손잡이는 파편이 모자라도 눌립니다 — 눌러야 «부족합니다» 안내가 뜹니다.
 *  (상점처럼 아예 못 누르게 막지 않은 것은, 얼마나 모자란지 그 자리에서
 *  바로 알려 주고 싶어서입니다.) */
function openSync(back) {
  $modal.classList.add("on");

  const draw = (msg) => {
    const cap = syncMax();
    const next = nextSyncChapter();
    let h = '<h2>동 기 화</h2>' +
      '<div class="hint">인격 파편으로 작성위원의 동기화 단계를 올립니다. ' +
      '단계 1당 그 작성위원의 공격·방어·체력이 모두 ' + Math.round(SYNC_RULE.statPct * 100) +
      '%씩 강해집니다. 지원 작성위원은 자기 단계가 없어, 함께 편성된 두 작성위원 중 ' +
      '낮은 쪽의 단계를 빌려 씁니다.<br>' +
      '지금은 <b>' + cap + '단계</b>까지 올릴 수 있습니다.' +
      (next ? ' ' + next + '을 마치면 더 오릅니다.' : '') + '</div>';

    if (msg) h += '<div class="hint" style="color:#d8b26a">' + msg + '</div>';

    Object.keys(SINNERS).forEach(who => {
      const s = SINNERS[who];
      const lv = syncLevel(who);
      const maxed = lv >= cap;
      const cost = syncCost(lv);
      const skill = UNIQUE_SKILLS[who];
      const skillHTML = (skill && lv >= 1)
        ? '　·　<span class="uskill"><b>' + skill.name + '</b> ' +
            skill.desc(skillTierValue(skill, lv)) + '</span>'
        : '';
      h += '<div class="syncrow">' +
             (maxed ? '<button disabled>상한 도달</button>'
                    : '<button data-sync="' + who + '">동기화　' + cost + '</button>') +
             '<div class="body">' +
               '<div class="nm">' + s.name + '</div>' +
               '<div class="sub">' +
                 (lv > 0 ? '동기화 ' + lv + '단계' : '아직 동기화되지 않음') +
                 (maxed ? ' (상한)' : '') +
                 '　·　파편 ' + fragCount(who) + '개' +
                 skillHTML +
               '</div>' +
             '</div>' +
           '</div>';
    });

    h += '<div class="modalfoot"><button id="syclose">닫기</button></div>';
    $sheet.innerHTML = h;

    $sheet.querySelectorAll("[data-sync]").forEach(el => {
      el.onclick = () => {
        const who = el.dataset.sync;
        const s = SINNERS[who];
        const lv = syncLevel(who);
        if (lv >= syncMax()) {           // 손잡이를 이미 감췄지만, 만약을 대비해 한 번 더
          draw(s.name + " — 지금은 " + syncMax() + "단계가 상한입니다.");
          return;
        }
        const cost = syncCost(lv);
        if (fragCount(who) < cost) {
          draw(s.name + " — 파편이 모자랍니다.  (" + fragCount(who) + " / " + cost + ")");
          return;
        }
        S.frags[who] -= cost;
        if (!S.sync) S.sync = {};
        S.sync[who] = lv + 1;
        saveVault(); render();
        const newLevel = lv + 1;
        const settled = () => draw(s.name + " — 동기화 " + newLevel + "단계에 이르렀다.");
        const skill = UNIQUE_SKILLS[who];
        if (skill && UNIQUE_SKILL_TIERS.includes(newLevel))
          uniqueSkillFlash(newLevel, s.quote, skill.name, settled);
        else syncFlash(newLevel, s.quote, settled);
      };
    });
    document.getElementById("syclose").onclick = () => { closeModal(); render(); if (back) back(); };
  };
  draw(null);
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

/* 보관함이 보여 줄 아이템 종류. 인격 파편처럼 「모아 두는 것」이 늘어날 때마다
 * 여기 한 칸 더 얹으면 됩니다 — openVault() 는 손대지 않아도 됩니다.
 * (쿠폰 · 이벤트 상품 등은 실제 상태값이 생기면 그때 추가) */
function vaultItemCategories() {
  return [
    {
      label: "인격 파편",
      note: "뽑기에서 중복이 나오면 작성위원마다 따로 쌓입니다.",
      items: Object.keys(SINNERS).map(who => ({
        name: SINNERS[who].name,
        sub:  fragCount(who) + "개"
      }))
    }
  ];
}

function openVault(back) {
  $modal.classList.add("on");
  let h = '<h2>보 관 함</h2>' +
          '<div class="hint">여기 담긴 것은 회차를 새로 시작해도 사라지지 않습니다. ' +
          '무엇을 가졌는지·장착은 편성 화면의 [인격 장착]에서 봅니다.</div>';

  vaultItemCategories().forEach(cat => {
    h += '<div style="margin:14px 0 6px;color:#e8e4de;font-weight:700">' + cat.label + '</div>';
    if (cat.note) h += '<div class="hint">' + cat.note + '</div>';
    h += '<div class="grid">';
    cat.items.forEach(it => {
      h += '<div class="slot"><div class="nm">' + it.name + '</div>' +
             '<div class="sub">' + it.sub + '</div></div>';
    });
    h += '</div>';
  });

  /* 인격 파편 상자 — 보관함에서 바로 «사용» 하는 자리라 syncrow 로,
   * 오른쪽 끝에 사용 손잡이를 둔다. 이런 손잡이가 필요 없는 항목은
   * vaultItemCategories() 에 얹으면 되고, 여기는 손댈 것 없다. */
  h += '<div style="margin:14px 0 6px;color:#e8e4de;font-weight:700">인격 파편 상자</div>' +
       '<div class="hint">' + FRAGBOX_RULE.desc + '</div>' +
       '<div class="hint">' + FRAGBOX_RULE.desc2 + '</div>';
  FRAGBOX_KINDS.forEach(k => {
    const cnt = fragBoxCount(k.key);
    h += '<div class="syncrow">' +
           '<button' + (cnt > 0 ? ' data-box="' + k.key + '"' : ' disabled') + '>사용</button>' +
           '<div class="body">' +
             '<div class="nm">' + k.name + '</div>' +
             '<div class="sub">보유 ' + cnt + '개</div>' +
           '</div>' +
         '</div>';
  });

  /* 엔케팔린 캡슐 — 파편 상자와 같은 모양의 사용 손잡이를 둡니다.
   * 없거나(0개) 엔케팔린이 이미 가득이면 손잡이를 잠급니다. */
  const capCnt  = enkCapCount();
  const capFull = enkCount() >= ENK_RULE.max;
  h += '<div style="margin:14px 0 6px;color:#e8e4de;font-weight:700">' + ENK_CAPSULE.name + '</div>' +
       '<div class="hint">' + ENK_CAPSULE.desc + '</div>' +
       '<div class="syncrow">' +
         '<button' + (capCnt > 0 && !capFull ? ' id="vcap"' : ' disabled') + '>사용</button>' +
         '<div class="body">' +
           '<div class="nm">' + ENK_CAPSULE.name + '</div>' +
           '<div class="sub">보유 ' + capCnt + '개　·　' + ENK_RULE.name + ' ' +
             enkCount() + ' / ' + ENK_RULE.max +
             (capCnt > 0 && capFull ? '　(가득 차 있어 쓸 수 없습니다)' : '') + '</div>' +
         '</div>' +
       '</div>';

  h += '<div class="modalfoot"><button id="vclose">닫기</button>' +
       '<button id="vrec">기록 · 내보내기</button>' +
       '<button id="vreset" class="ghost">보관함 비우기</button></div>';
  $sheet.innerHTML = h;

  const vcap = document.getElementById("vcap");
  if (vcap) vcap.onclick = () => {
    const got = enkCapUse();
    if (got) {
      render();
      say(ENK_CAPSULE.name + "을 써 " + ENK_RULE.name + "을 " + got + "개 채웠다.　(지금 " +
          enkCount() + " / " + ENK_RULE.max + ")", "gain");
    }
    openVault(back);   // 개수와 눈금이 바뀌었으니 다시 그립니다
  };

  document.getElementById("vclose").onclick = () => { closeModal(); render(); if (back) back(); };
  document.getElementById("vrec").onclick = () => openRecord(() => openVault(back));
  document.getElementById("vreset").onclick = () => openReset(() => openVault(back));
  $sheet.querySelectorAll("[data-box]").forEach(el => {
    el.onclick = () => openFragBoxUse(el.dataset.box, back);
  });
}

/* ── 인격 파편 상자 사용 ──────────────────────────────────────
 *  1) 쓸 개수 — 바(슬라이더)로 고른다. 최소 1개, 최대는 지금 가진 개수.
 *  2) select 만 — 어느 작성위원 몫으로 받을지 고른다.
 *  3) 파편을 얹고 결과를 보여 준다.
 */
function openFragBoxUse(kind, back) {
  $modal.classList.add("on");
  const meta = FRAGBOX_KINDS.find(k => k.key === kind);
  const owned = fragBoxCount(kind);
  if (!meta || owned <= 0) { openVault(back); return; }

  let h = '<h2>' + meta.name + '</h2>' +
    '<div class="hint">' + FRAGBOX_RULE.desc + ' 사용할 개수를 고르십시오.  (보유 ' + owned + '개)</div>' +
    '<div class="hint" id="bxamt" style="color:#e8e4de;font-weight:700;font-size:15px">1개 사용</div>' +
    '<input type="range" id="bxrange" min="1" max="' + owned + '" value="1" ' +
      'style="width:100%;accent-color:#c8403a">' +
    '<div class="modalfoot">' +
      '<button id="bxcancel" class="ghost">그만두기</button>' +
      '<button id="bxnext" class="primary">다음</button>' +
    '</div>';
  $sheet.innerHTML = h;

  const range = document.getElementById("bxrange");
  const amt = document.getElementById("bxamt");
  range.oninput = () => { amt.textContent = range.value + "개 사용"; };

  document.getElementById("bxcancel").onclick = () => openVault(back);
  document.getElementById("bxnext").onclick = () => {
    const n = +range.value;
    if (kind === "random") openFragBoxRandom(n, back);
    else openFragBoxPickWho(n, back);
  };
}

/* 무작위 — 개수(n)만큼 상자를 태워 n×mult 개를 낱개로 12명에게 임의로 흩는다.
 * 낱개(1)씩 얹으므로 몫은 늘 자연수이고, 합은 언제나 n×mult 와 같다. */
function openFragBoxRandom(n, back) {
  if (fragBoxCount("random") < n) { openVault(back); return; }
  S.fragBox.random -= n;
  const total = n * FRAGBOX_RULE.mult;
  const who12 = Object.keys(SINNERS);
  const got = {};
  for (let i = 0; i < total; i++) {
    const w = who12[Math.floor(Math.random() * who12.length)];
    got[w] = (got[w] || 0) + 1;
    addFrag(w, 1);
  }
  saveVault(); render();
  say("인격 파편 상자(무작위) " + n + "개를 열어, 파편 " + total + "개를 나눠 받았다.", "gain");

  let h = '<h2>인격 파편 상자 (무작위)</h2>' +
    '<div class="hint">상자 ' + n + '개를 열어 인격 파편 ' + total + '개를 얻었습니다.</div>' +
    '<div class="grid">' +
    Object.keys(got).sort((a, b) => got[b] - got[a]).map(w =>
      '<div class="slot"><div class="nm">' + SINNERS[w].name + '</div>' +
        '<div class="sub">+' + got[w] + '개　·　지금 ' + fragCount(w) + '개</div></div>'
    ).join('') +
    '</div>' +
    '<div class="modalfoot"><button id="bxdone" class="primary">확인</button></div>';
  $sheet.innerHTML = h;
  document.getElementById("bxdone").onclick = () => openVault(back);
}

/* 선택 — 개수(n)를 정한 뒤 12명 중 «누구 몫으로 받을지» 고르게 한다 */
function openFragBoxPickWho(n, back) {
  const gain = n * FRAGBOX_RULE.mult;
  let h = '<h2>인격 파편 상자 (선택)</h2>' +
    '<div class="hint">상자 ' + n + '개를 쓰면 인격 파편 ' + gain +
      '개를 받습니다. 어느 작성위원 몫으로 받겠습니까?</div>' +
    '<div class="grid">' +
    Object.keys(SINNERS).map(w =>
      '<div class="slot" data-who="' + w + '"><div class="nm">' + SINNERS[w].name + '</div>' +
        '<div class="sub">지금 ' + fragCount(w) + '개</div></div>'
    ).join('') +
    '</div>' +
    '<div class="modalfoot"><button id="bxback" class="ghost">되돌아가기</button></div>';
  $sheet.innerHTML = h;

  $sheet.querySelectorAll("[data-who]").forEach(el => {
    el.onclick = () => {
      if (fragBoxCount("select") < n) { openVault(back); return; }
      const w = el.dataset.who;
      S.fragBox.select -= n;
      addFrag(w, gain);
      saveVault(); render();
      say(SINNERS[w].name + " 몫으로 인격 파편 상자(선택) " + n + "개를 써, 파편 " + gain + "개를 얻었다.", "gain");

      let h2 = '<h2>인격 파편 상자 (선택)</h2>' +
        '<div class="hint">' + SINNERS[w].name + ' 파편 ' + gain +
          '개를 얻었습니다.  (지금 ' + fragCount(w) + '개)</div>' +
        '<div class="modalfoot"><button id="bxdone" class="primary">확인</button></div>';
      $sheet.innerHTML = h2;
      document.getElementById("bxdone").onclick = () => openVault(back);
    };
  });
  document.getElementById("bxback").onclick = () => openFragBoxUse("select", back);
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
/* ── 캐시를 건너뛰고 다시 열기 ────────────────────────────────
 *  주소 뒤에 처음 보는 값을 붙이면 브라우저가 캐시에서 찾지 못해 새로 받아옵니다.
 *  그렇게 새로 온 index.html 안의 <script src="engine.js?v=…"> 는 지금 판을
 *  가리키므로 engine.js 까지 함께 갈립니다 — 판 번호는 tools/배포하기.sh 가 붙입니다.
 *
 *  ■ 왜 그냥 새로고침으로는 안 되는가
 *    사파리는 그냥 새로고침(⌘R)을 해도 이미 받아 둔 하위 파일은 다시 받지 않습니다.
 *    GitHub Pages 가 붙여 주는 것이 max-age=600 뿐이라 더 그렇습니다. 그래서
 *    「새로고침 한 번이면 됩니다」라고만 일러 두면 사파리 쓰는 분은 빠져나갈 길이
 *    없었습니다 — 잠긴 화면에서 새로고침해도 여전히 옛 engine.js 였으니까요.
 */
function reloadFresh() {
  if (location.protocol === "http:" || location.protocol === "https:")
    location.replace(location.pathname + "?cb=" + Date.now());
  else
    location.reload();
}

/* 뒤에서 온 보관함을 열었을 때 — 여기서 멈춥니다.
 * 새 판으로 열면 그대로 이어집니다. 거의 언제나 브라우저가 옛 engine.js 를
 * 물고 있는 것이므로, 손잡이 첫째는 캐시를 건너뛰고 다시 여는 것입니다. */
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
  say("온라인 판이라면 브라우저가 옛 engine.js 를 캐시에 붙들고 있는 것입니다. " +
      "아래 [최신 판으로 다시 열기] 를 누르면 캐시를 건너뛰고 새로 받아옵니다.", "sys");
  if (isWebKit())
    say("사파리는 그냥 새로고침(⌘R)으로는 갈리지 않습니다 — 받아 둔 것을 그대로 씁니다. " +
        "위 손잡이가 듣지 않으면 ⌘⌥R 을 누르시거나, " +
        "사파리 설정 → 개인정보 보호 → 웹사이트 데이터 관리에서 이 쪽 것을 지워 주십시오.", "bad");
  divider();
  render();
  buttons([
    { label: "최신 판으로 다시 열기", cls: "primary", fn: () => reloadFresh() },
    { label: "다시 확인", fn: () => glass() },
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
  /* 이벤트 재화는 여기 적지 않습니다 — 상점과 이벤트 교환소 안에서만 보입니다 */
  say(CURRENCY + " " + S.money + "　·　황금교본 " + S.codex, "sys");
  say(ENK_RULE.name + " " + enkCount() + " / " + ENK_RULE.max + "　·　" + enkNextText(), "sys");
  versionNotice();          // 옛 판 보관함을 열었으면 여기서 한 번 알린다
  eventNotice();            // 새 이야기가 나와 이벤트 재화가 갈렸으면 한 번 알린다
  storageNotice();          // 저장이 막혔거나(사파리 file://) 지워질 수 있는(사파리 7일) 환경이면 일러 준다

  /* 처음 오신 분께 — 어디를 눌러야 하는지 일러 둡니다.
   * 한 장이라도 마쳤으면 나오지 않습니다. 아는 사람에게는 잔소리이니. */
  if (!done && !sides) {
    divider();
    say("처음이시라면 —", "place");
    say("아래 [운전석] 을 누르고 «0장 돌아갈 수 없는» 을 고르면 이야기가 시작됩니다.", "good");
    say("[편성] 에서 누구를 데려갈지, [상점] 에서 새 인격을 뽑을 수 있습니다. " +
        "무엇을 눌러야 할지 모르겠으면 [운전석] 부터 누르십시오.", "sys");
  }
  /* 이번 판에 새로 들어온 것들을 한 번 알려 줍니다.
   * 유리창을 다 그린 뒤에 덮어씌우므로, 닫으면 바로 유리창이 보입니다. */
  if (noticeDue()) {
    render();
    buttons([{ label: "…", cls: "primary", disabled: true }]);
    /* 닫을 때 «본 것» 으로 적어 둡니다.
     * 이 알림은 원래 상점에서 열리던 것이라, 닫으면 상점을 다시 그리는 것으로
     * 끝났습니다. 그런데 유리창에서 열면 닫는 길이 glass() 를 다시 부르고,
     * 그러면 noticeDue() 가 여전히 참이라 알림이 곧바로 다시 뜹니다 —
     * 「이번 판에서는 다시 보지 않음」을 누르지 않는 한 빠져나갈 수가 없었습니다.
     * 여기서 열리는 것은 이제 유리창뿐이므로, 어느 손잡이로 닫든 한 번 본 것으로 봅니다. */
    return openNotice(() => { noticeHide(); closeModal(); glass(); });
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
    /* 3장을 마치기 전에는 손잡이를 아예 내놓지 않습니다 */
    syncUnlocked() ? { label: "동기화", fn: () => openSync(() => glass()) } : null,
    { label: "보관함", fn: () => openVault(() => glass()) },
    /* 「다음부터 표시하지 않음」을 누른 판에서는 이 손잡이가 사라집니다 */
    patchHidden() ? null
                  : { label: "패치 노트", cls: "ghost", fn: () => openPatch(() => glass()) }
  ]);
  showEnkBar(true);
  /* 처음 오신 분께 — 손잡이를 하나씩 짚어 드립니다. 한 번만 나옵니다. */
  tutorOnce("glass");
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
