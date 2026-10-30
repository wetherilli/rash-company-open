/* =====================================================================
 *  「테마팩」 — 거울 던전(노말·하드·익스트림) 개편의 핵심 데이터
 * ---------------------------------------------------------------------
 *  ■ 왜 생겼나
 *    부산행·7장·7.5장까지 병합되면, 지금까지 만난 적이 전부 거울 던전
 *    무작위 뽑기 풀에 섞입니다. 장이 늘수록 풀이 계속 불어나므로,
 *    그대로 두면 거울 던전의 «실제 난이도»가 판이 나올 때마다 계속
 *    오르게 됩니다 — 이걸 막으려고 만든 것이 테마팩입니다.
 *
 *    무작위로 아무 적이나 셋 뽑는 대신, **미리 짜 둔 「적 셋짜리 묶음」**
 *    (잡졸 1 + 보스 2)을 통째로 골라 상대하는 방식으로 바꿉니다. 새 장이
 *    나오면 그 장(또는 그 테마)에 맞는 테마팩을 하나씩 더 만들어 풀에
 *    보태는 식으로 관리합니다 — 풀이 아무리 불어나도, «한 판에서 실제로
 *    상대하는 적 셋»의 세기는 항상 팩 하나 분량으로 고정됩니다.
 *
 *  ■ 이 파일이 담는 것 — 테마팩 데이터만입니다.
 *    실제로 이 데이터를 읽어 화면을 그리고 전투를 잇는 코드는
 *    engine.js 쪽(「테마팩 선택」 절 — openPackGate 부터)에 있습니다.
 *    이 파일은 오직 «어떤 팩이 있고, 무엇으로 이루어져 있는가»만 다룹니다.
 *
 *  ■ 팩 하나의 생김새
 *      { id: "pack01", name: "이름 없는 자들", foes: ["csa_fraud", "unknown_squad", "kim_junseong"] }
 *
 *    id     코드에서 가리킬 때 쓰는 짧은 열쇠. 순서(pack01, pack02 …)가
 *           곧 「몇 번 팩」인지를 말합니다 — 화면에도 이 번호를 씁니다.
 *    name   15자 이내의 짧은 이름. 화면(테마팩 선택 화면의 세 갈래)에
 *           그대로 뜹니다.
 *    bg     팩에 들어가 있는 동안(테마팩 선택 화면으로 돌아올 때까지)
 *           보여 줄 배경 그림(사용자 지침 2026-09-02). 이미 있는 그림
 *           중 그 팩의 장·적과 관련 있는 것을 그대로 재사용했습니다 —
 *           안 적으면 그냥 거울 던전 기본 배경(mirrorBG)을 씁니다.
 *    foes   FOES(data/foes.js) 열쇠 셋, **약한 것부터 강한 것 순서**로
 *           적습니다 — 팩 안에서 실제로 싸우는 순서이기도 합니다
 *           (사용자 지침 2026-09-02 — 가장 센 보스가 항상 맨 마지막에
 *           나오도록). 첫 번째가 잡졸(몸풀기), 둘째·셋째가 보스 둘입니다.
 *    railOnly  true 를 달면 «익스트림의 세 번째 팩 선택»에서만 나옵니다
 *           (아래 「거울굴절철도 팩」 참고) — 평소 무작위 풀에는 안 섞입니다.
 *    tier   railOnly 팩에만 적습니다 — 그 팩이 딸린 갈래의 열쇠
 *           («railLine1» 처럼). 그 갈래를 «완주해 본» 사람에게만 이 팩이
 *           나옵니다(S.mirrorDone). 열린 것만으로는 안 나옵니다 —
 *           종점은 직접 닿아 봐야 아는 것이라서입니다.
 *
 *  ■ 지금 들어 있는 것 — 본편(main, wip 제외) 기준 21팩 (v2.18.0)
 *    보통 15 · 거울굴절철도 팩(railOnly) 6 — 1호선 · 2호선 · 3호선 둘 · 4호선 둘.
 *    아래는 처음 짤 때(11팩)의 이야기입니다.
 *    2026-09-02 사용자 지침으로 열 팩을 처음 짰고, 부산행이 병합되면서(v1.12.0,
 *    2026-09-04) 그 장 몫인 pack12 「곁가지의 밤」이 하나 늘었습니다. 아직 남은
 *    wip(7장·7.5장)에서 새로 생길 보스는 **일부러 뺐습니다** — 그 장들이 실제로
 *    병합되면 그때 새 팩을 몇 개 더 보태면 됩니다(장마다 하나씩이 기본 그림입니다).
 *    **번호가 pack10 다음 pack12로 건너뜁니다** — pack11은 7장 꾸러미가 미리
 *    잡아 둔 자리라, 7장이 병합되면 그 자리가 메워집니다. id 는 보관함에
 *    「깬 팩」 기록으로 남으므로, 빈 자리를 메우겠다고 다시 번호를 매기지 마십시오.
 *
 *    본편 FOES 중 보스(`boss:true`)가 14마리뿐이라, 10팩×보스2 = 20자리를
 *    다 채우지 못합니다. 그래서 원래 잡졸이던 여섯 — **김준성(3장 기본형)·
 *    우생회 큰망치 심승휘·다시 끌려온 이형우·정체를 밝히지 않는 무리·
 *    북부 총기 협회 중화기반·관상용 괴수 B** — 를 수치가 세다는 이유로
 *    「보스」 자리에 끼워 넣었습니다.
 *    **확정(사용자 지침 2026-09-02)** — 이 여섯 중 **우생회 큰망치
 *    심승휘만** 실제로 `boss: true`를 붙였습니다(data/story.js). 강타·
 *    광역 패턴을 쓰고, 3장 본편의 그 전투도 함께 세지며, 2호선 순환의
 *    보스 뽑기 풀에도 새로 섞입니다. 나머지 다섯은 그대로 `boss` 없이
 *    남아 있습니다 — 팩 안에서 둘째 자리(더 약한 보스)로 서지만, 겉보기
 *    수치만 세고 강타·광역은 안 씁니다.
 *
 *    업적 킬 조건 일곱(윤희준·김준성·참깨라면·케빈·심승휘·데스리퍼·
 *    타나콘다, data/achievements.js) 전부 아래 열 팩 안에 들어갑니다.
 *    2장의 「올림피아드 참가자」는 안 썼습니다 — 2장에 이미 잡졸 자리(그림에서
 *    나온 환상체)가 하나면 충분해서 뺐습니다. 「공룡애호가 바이퍼」도 같은 까닭으로
 *    빠져 있었는데, 부산행 팩(pack12)이 노미러 가능한 적을 둘밖에 못 채워
 *    그 잡졸 자리를 빌려 갔습니다.
 *
 *  ■ 거울굴절철도 팩 (railOnly) — 익스트림 세 번째 선택 전용
 *    사용자 지침(2026-09-02) — 익스트림의 «세 번째(마지막)» 테마팩
 *    선택에서는, 보여 주는 셋 중 하나가 **반드시** 이 팩들 가운데 하나로
 *    고정됩니다(무작위로 어느 것이 나올지만 정합니다) — 그때 «이미 완주해 본
 *    갈래» 의 팩만 후보에 듭니다(tier · 사용자 지침 2026-09-12). 하나도 없으면
 *    그 자리도 평소 풀에서 채웁니다.
 *    나머지 두 자리는 평소처럼 일반 풀(아래 열 팩)에서 뽑습니다.
 *    노말·하드에서는, 그리고 익스트림의 1·2번째 선택에서는 절대 안
 *    나옵니다. 잡졸·보스는 자유롭게 골랐습니다(사용자 지침에는
 *    "잡졸1+보스1+쥬3피노/데이비드 피터스"만 정해져 있었습니다) —
 *    각 장의 가장 센 잡졸·보스를 하나씩 붙여, 「지금까지 만난 것 중
 *    가장 센 것들 + 진짜 종점」이라는 느낌을 주려 했습니다. 마음에
 *    안 들면 foes 만 바꾸면 됩니다.
 *
 *  ■ perk — 테마팩 특전 (사용자 지침 2026-10-14)
 *    그 팩을 «고르면» 얻고, 그 팩부터 «그 판이 끝날 때까지» 듣습니다(2026-10-21 — 예전엔 다 깨야
 *    얻었습니다). 그 팩을 넘지 못하고 갈림길로 돌아오면 그 팩의 특전은 빠집니다.
 *    { name, desc, effect }. effect 에 쓸 수 있는 열쇠는 engine.js packPerks 머리말에 있습니다.
 *    특전마다 아이콘을 한 장 그립니다 — tools/아이콘-도안.js 에 특전 이름 그대로
 *    (node tools/check.js 가 빠진 것을 짚습니다). 팩을 새로 지으면 특전도 함께 짓습니다.
 *    거울굴절철도 팩 넷은 익스트림 마지막 갈림길에만 서므로, 그 특전은 그 팩 셋을 치르는 동안만
 *    씁니다. 수치는 전부 처음 잡아 본 값입니다.
 *
 *  ■ 계단 — 거울 전용 수치 (사용자 지침 2026-10-21)
 *    거울 던전의 적은 더는 «본편 수치 × 배수» 로 서지 않습니다. 본편 적은 장이 늘수록
 *    점점 세지고(G안 2600 · 기가노토사우루스 2800), 그 수치를 그대로 곱하면 «어느 팩을
 *    만났느냐» 가 «어느 난이도에 들어왔느냐» 보다 몇 배 크게 갈렸습니다. 그래서 수치는
 *    아래 MIRROR_STEPS 에서만 나오고, 팩은 «누가 서는가»(이름·그림·대사·기믹)만 정합니다.
 *
 *      층       계단    노말   하드   익스트림
 *      저층부   1·2·3    ○      ○        ○      ← 첫 번째 갈림길
 *      중층부   4·5·6           ○        ○      ← 두 번째 갈림길
 *      상층부   7·8·9                    ○      ← 세 번째 갈림길
 *
 *    한 층의 세 계단은 팩 안의 세 자리입니다 — 첫째(잡졸) 1계단, 둘째 2계단, 셋째 3계단.
 *    모든 팩이 모든 층에 똑같이 나옵니다(같은 팩이 저층에서는 가볍게, 상층에서는 무겁게).
 *    적의 기믹(강타·광역·회복·되받아치기 …)과 보스 여부는 본편 것을 그대로 가져옵니다.
 *
 *    ▶ 새 팩을 지을 때 — 적 셋을 «잡졸 → 보스 → 큰보스» 차례로 적기만 하면 됩니다.
 *      수치는 따로 적지 않습니다. 본편에서 아무리 센 적이어도 거울에서는 계단 값으로 섭니다.
 *
 *  ■ 철도 — 거울굴절철도 전용 수치 (사용자 지침 2026-10-21)
 *    RAIL_STEPS 는 상층부보다 한 단 위입니다. 거울굴절철도 1~3호선과, 익스트림 마지막
 *    갈림길에 서는 철도 팩(railOnly)이 이 표를 씁니다 — 철도 팩은 잡졸 · 뒤 보스 · 종점.
 *    2호선의 순환·3호선의 통과로 오르는 세기는 «시작 배수 대비 몇 배» 로 이 값 위에 곱합니다
 *    (2호선 ×3.0→3.5 이면 ×1.17). 그래서 화면의 «×3.0» 눈금과 계단 삯은 예전 그대로입니다.
 *
 *  ■ 변조 — 적이 설 때마다 MIRROR_VARY 만큼 흔듭니다
 *    같은 계단이라도 적마다, 들어갈 때마다 값이 조금씩 다릅니다(인격 설계와 같은 까닭 —
 *    모든 갈래의 적이 똑같은 수치로 서면 만듦새가 떨어져 보입니다). 체력은 일의 자리에서
 *    반올림해 10 단위, 공격·방어는 정수입니다. 고정값이 아니므로 이어하기로 돌아오면
 *    다시 굴립니다.
 *
 *  ■ 심층 — 어비스 거울 던전의 4·5층 (사용자 지침 2026-10-23 · 이름 2026-10-30)
 *    1~3층은 익스트림 그대로(MIRROR_STEPS 1~9계단). 4·5층은 DEEP_STEPS 두 줄이고,
 *    거울굴절철도 팩도 거기서는 이 표를 탑니다(RAIL_PACK_ROLES 를 안 봅니다).
 *    «뒤섞인» 강화 선택지 — 1~3층은 계단 값에 DEEP_ENH_STAT 을 얹고, 기믹을
 *    DEEP_MIX_COUNT 만큼 빌려 입으며, 특전은 DEEP_ENH_PERK 로 키웁니다.
 *    층을 넘길 때마다 DEEP_PAY, 완주 삯은 engine.js 의 MIRROR_DEEP 이 정합니다.
 *    deepOnly: true 팩은 4·5층 갈림길에만 섭니다.
 * ===================================================================== */
"use strict";

/* 거울 던전 계단 — 3개씩 끊어 저층부 · 중층부 · 상층부. 팩 안의 자리 순서대로입니다. */
const MIRROR_STEPS = [
  /* 저층부 */
  { hp:  300, atk: 30, def:  6 },   // 1계단 — 잡졸
  { hp:  650, atk: 38, def:  7 },   // 2계단 — 보스
  { hp:  900, atk: 44, def:  8 },   // 3계단 — 큰보스
  /* 중층부 */
  { hp:  500, atk: 46, def:  9 },   // 4계단
  { hp: 1000, atk: 54, def: 10 },   // 5계단
  { hp: 1400, atk: 62, def: 11 },   // 6계단
  /* 상층부 */
  { hp:  750, atk: 64, def: 12 },   // 7계단
  { hp: 1500, atk: 74, def: 13 },   // 8계단
  { hp: 2100, atk: 86, def: 14 }    // 9계단
];
const MIRROR_LAYER_NAMES = ["저층부", "중층부", "상층부"];

/* 거울굴절철도 — 상층부보다 한 단 위. 어느 자리가 무엇인지는 engine.js 의 railRole 이 가릅니다. */
const RAIL_STEPS = {
  grunt: { hp:  800, atk: 66, def: 12 },   // 잡졸 (1호선 첫 역 · 3호선 앞 구간)
  front: { hp: 1500, atk: 76, def: 13 },   // 앞 구간 보스 (1호선 쉼표 전 · 2호선 순환)
  back:  { hp: 1900, atk: 84, def: 14 },   // 뒤 구간 보스 (1호선 쉼표 뒤 · 3호선 뒤 구간)
  final: { hp: 2600, atk: 94, def: 15 }    // 종점 · 중간역 (쥬3피노 · 데이비드 피터스 · 메뚜기 · 테리지노)
};
/* 철도 팩(익스트림 마지막 갈림길) 세 자리 */
const RAIL_PACK_ROLES = ["grunt", "back", "final"];

/* 변조 폭 — hp·atk 는 비율(±), def 는 정수(±) */
const MIRROR_VARY = { hp: 0.10, atk: 0.08, def: 1 };

/* ── 어비스 거울 던전(심층) — 「■ 심층」 참고 ── */
/* 4·5층 — 익스트림 상층부(MIRROR_STEPS 7~9계단) 위로 이어 적은 표(사용자 지침 2026-10-23).
 * 이은 법 — 체력은 계단 사이 늘어나는 폭을 한 칸씩 더 키우고(잡졸 +200·+250 → +300·+350,
 * 보스 +350·+500 → +650·+800, 큰보스 +500·+700 → +900·+1100), 공격은 상층부 때의 폭
 * (+18 · +20 · +24)을 그대로 두 번, 방어는 +3 대신 +2 씩(방어가 벽이 되지 않게).
 * 거울굴절철도 팩도 4·5층에서는 이 표를 탑니다(RAIL_PACK_ROLES 를 안 봅니다). */
const DEEP_STEPS = [
  /*  잡졸                          보스                            큰보스 */
  [ { hp: 1050, atk:  82, def: 14 }, { hp: 2150, atk:  94, def: 15 }, { hp: 3000, atk: 110, def: 16 } ],   // 4층
  [ { hp: 1400, atk: 100, def: 16 }, { hp: 2950, atk: 114, def: 17 }, { hp: 4100, atk: 134, def: 18 } ]    // 5층
];
/* 1~3층 강화 선택지의 «조금 더 세게» — 그 계단 값에 곱하고(체력·공격) 더합니다(방어) */
const DEEP_ENH_STAT = { hp: 1.2, atk: 1.1, def: 1 };
/* 강화 선택지가 빌려 입는 기믹 수 — 1~3층 · 4·5층 */
const DEEP_MIX_COUNT = { upper: 1, deep: 2 };
/* 강화 선택지의 특전 — 비율은 이만큼 곱하고, 횟수·칸은 1 더합니다(deepEnhancePerk) */
const DEEP_ENH_PERK = { mult: 1.5, plus: 1 };
/* 층을 넘길 때마다 받는 몫. firstMoney 는 «그 층에 처음 닿았을 때만» 나옵니다.
 * 완주 삯은 MIRROR_DEEP 의 bonus · codex · fragBoxSelect · event (mirrorClear 가 줍니다). */
const DEEP_PAY = {
  codex:      1,
  fragBox:    2,
  firstMoney: 100
};

const MIRROR_PACKS = [
  { id: "pack01", name: "이름 없는 자들", bg: "assets/scene/구C사 지하실.jpg",
    foes: ["csa_fraud", "unknown_squad", "kim_junseong"],
    perk: { name: "쥐어진 광신", desc: "김태성이 광신 3을 얻는다.", effect: { kills: 3 } } },
  { id: "pack02", name: "저녁을 방해하는 자들", bg: "assets/scene/K사 앞.jpg",
    foes: ["csa_grunt", "ramen_twisted", "won_daehan"],
    perk: { name: "식지 않은 참깨라면", desc: "전투에 이겼을 때의 회복이 25%에서 40%로 는다.", effect: { winHeal: 0.40 } } },
  { id: "pack03", name: "축제를 망치는 자", bg: "assets/scene/공룡의날 광장.jpg",
    foes: ["hwangjeo_phantasm", "viper_twisted", "hwangjeo"],
    perk: { name: "축제의 여운", desc: "전원의 치명타 확률 +10%p.", effect: { crit: 0.10 } } },
  { id: "pack04", name: "우생회의 그림자", bg: "assets/scene/P사 우생회.jpg",
    foes: ["creationist", "sim_seunghwi", "kim_junseong_crab"],
    perk: { name: "휘두를 때를 아는 것", desc: "독촉의 배수가 1.5에서 2.0으로 오른다.", effect: { push: 0.5 } } },
  { id: "pack05", name: "동심의 괴물들", bg: "assets/scene/F사 내부.jpg",
    foes: ["geugya_remnant", "ropo_incomplete", "twisted_shrimp"],
    perk: { name: "빛새우의 잔광", desc: "전원의 방어력 +15%.", effect: { all: { def: 0.15 } } } },
  { id: "pack06", name: "전원 입수다", bg: "assets/scene/대양 구 핀벤져스 지부.jpg",
    foes: ["cartel_thug", "cartel_capo", "lee_seojin_shark"],
    perk: { name: "입수 구호", desc: "매 전투 1턴에 전원의 공격력 +30%.", effect: { firstTurnAtk: 0.30 } } },
  { id: "pack07", name: "아라온호의 승선자", bg: "assets/scene/아라온호 조우.jpg",
    foes: ["fused_yunhuijun", "fused_ihyeongwu", "twisted_mosasaur"],
    perk: { name: "닻을 올려라", desc: "전투 시작 관리력 +1, 최대 관리력 +1.", effect: { manage: 1, manageMax: 1 } } },
  { id: "pack08", name: "괴물사냥꾼들", bg: "assets/scene/G사 골목.jpg",
    foes: ["nbga_gunner", "nbga_heavy", "deathleaper"],
    perk: { name: "사냥꾼의 조준", desc: "보스에게 주는 치명타 피해 +30%.", effect: { bossCritDmg: 0.30 } } },
  { id: "pack09", name: "괴수 소동", bg: "assets/scene/모나크 저택.jpg",
    foes: ["monarch_a", "garret", "kevin"],
    perk: { name: "집사의 예법", desc: "교정으로 줄이는 피해 +10%p.", effect: { correct: 0.10 } } },
  { id: "pack10", name: "하수로를 따라", bg: "assets/scene/배수로 내부.jpg",
    foes: ["gsa_riders", "monarch_b", "tanaconda"],
    perk: { name: "합체 필살", desc: "전원의 고유 능력(액티브) 사용 횟수 +1.", effect: { skillUses: 1 } } },
  { id: "pack12", name: "곁가지의 밤", bg: "assets/scene/고속열차 내부 (전투).jpg",
    foes: ["viper", "zombie_horde", "kim_yeonjun_busan"],
    perk: { name: "실험은 계속된다", desc: "7턴마다 전원이 체력 10%를 회복한다.", effect: { healEvery: 7, healRatio: 0.10 } } },

  /* ── 거울굴절철도 팩 — 익스트림 세 번째 선택 전용 ──
   *  tier 에 그 팩이 딸린 갈래를 적습니다(2026-09-12에 더한 칸) — 그 갈래가
   *  아직 안 열렸으면 이 팩도 안 나옵니다. 갈래가 늘어도 engine.js 는
   *  안 고쳐도 되게 하려는 몫입니다(drawPackChoices 참고). */
  { id: "rail1pack", name: "익숙한 벨소리", railOnly: true, tier: "railLine1",
    bg: "assets/scene/거울굴절철도1호선.jpg",
    foes: ["monarch_a", "tanaconda", "ju3pino"],
    perk: { name: "정시 발차", desc: "매 전투를 관리력이 가득 찬 채로 시작한다.", effect: { manageFull: true } } },
  { id: "rail2pack", name: "괴악한 복원", railOnly: true, tier: "railLine2",
    bg: "assets/scene/거울굴절철도2호선.jpg",
    foes: ["gsa_riders", "kevin", "david_peters"],
    perk: { name: "잘못 맞춘 뼈", desc: "전원의 공격력 +25%, 방어력 -10%.", effect: { all: { atk: 0.25, def: -0.10 } } } },
  { id: "pack11", name: "신해수랜드의 소동", bg: "assets/scene/신해수랜드 대치중.jpg",
    foes: ["hyeolgwi", "baksangwon", "shinhaesuland_gan"],
    perk: { name: "피의 축복", desc: "공격할 때마다 자기 최대 체력의 3%를 회복한다.", effect: { hitHeal: 0.03 } } },
  { id: "rail3pack1", name: "두 번 우는 것", railOnly: true, tier: "railLine3",
    bg: "assets/scene/거울굴절철도3호선중간역.jpg",
    foes: ["geugya_remnant", "deathleaper", "rail3_locust"],
    perk: { name: "먼저 우는 쪽", desc: "적의 선공으로 받는 피해 -50%.", effect: { firstCut: 0.50 } } },
  { id: "rail3pack2", name: "감은 눈", railOnly: true, tier: "railLine3",
    bg: "assets/scene/거울굴절철도3호선종착역.jpg",
    foes: ["hwangjeo_phantasm", "tanaconda", "rail3_therizino"],
    perk: { name: "감은 눈으로 본 것", desc: "광역 공격에 방어를 고르면 그 피해를 절반 더 줄인다.", effect: { aoeGuardCut: 0.5 } } },
  { id: "pack15", name: "숨겨둔 로단", bg: "assets/scene/공격받은 메카고질라.jpg",
    foes: ["olympiad_rival", "gimhuijae", "rodan_toy"],
    perk: { name: "꺾이지 않는 날개", desc: "광역 공격으로 받는 피해 -30%.", effect: { aoeCut: 0.30 } } },
  /* ⚠ 2026-10-14 에 다시 갈랐습니다(사용자 지침) — «한 팩에 초대형 보스는 하나만».
   * 이서진(2500)과 기가노토사우루스(2800)를 스토리에 맞춰 크게 올리고 나니, 둘이 한 팩에
   * 서던 「돌아온 원한」이 체력 합 5490 으로 거울 던전에서 가장 무거운 팩(G안 팩 4140)을
   * 넘겼고, 나머지 팩(합 1900)과는 세 배 차이가 났습니다. 그래서 둘을 갈랐습니다 —
   *
   *   pack13 「H사의 첫 밤」  바이퍼 190 → 분탕을 원하는 여자 520 → 기가노토사우루스 2800   합 3510
   *   pack14 「돌아온 원한」  뮤타돈 400 → 흑수 구 980 → 제3발톱 큰형님 이서진 2500        합 3880
   *
   * 둘 다 G안 팩 아래이고, 서로는 비슷합니다. 업적도 하나씩 갈립니다 — 「어둠 속의 눈동자」
   * (기가노토사우루스)는 pack13, 「돔배기 회먹기」(이서진)는 pack14.
   * 팩 이름은 그대로 두고 내용을 이름에 맞췄습니다: 첫 밤 = H사에 닿자마자 덤빈 상대와 그 밤의
   * 주인, 원한 = 디아의 흑수와 돔배기 값을 받으러 온 이서진.
   *
   * 분탕을 원하는 여자는 보스 판정이 없지만 둘째(약한 보스) 자리에 섭니다 — 본편에도 그런
   * 팩이 여럿 있습니다(mirrorpacks.js 머리말). 2장 「공룡애호가 바이퍼」는 부산행 팩(pack12)에
   * 이어 여기서도 빌려, 같은 잡졸이 두 팩에 겹칩니다(코드레드 자체 잡졸은 뮤타돈 하나뿐).
   * 거울 던전의 이서진은 스토리와 달리 끝까지 눕히는 보통 전투입니다(spare·endAt 은 장면 몫). */
  { id: "pack13", name: "H사의 첫 밤", bg: "assets/scene/메카고질라 갑판 낮.jpg",
    foes: ["viper", "duel_challenger", "giganotosaurus"],
    perk: { name: "군주의 자격", desc: "유아인이 서 있는 동안 전원의 방어력 +15%.",
            effect: { whileWho: "yu_ain", all: { def: 0.15 } } } },
  { id: "pack14", name: "돌아온 원한", bg: "assets/scene/공격받은 메카고질라.jpg",
    foes: ["mutadon", "heuksu_gu", "lee_seojin_codered"],
    /* 죽어도 초기화되지 않습니다 — 보복이 2에서 시작하고 그 아래로 안 내려갑니다(사용자 지침 2026-10-14) */
    perk: { name: "돔배기 값", desc: "유아인의 보복이 2에서 시작하고, 쓰러져도 2 아래로 내려가지 않는다.",
            effect: { retribFloor: 2 } } },
  { id: "rail4pack1", name: "데려가는 그늘", railOnly: true, tier: "railLine4",
    bg: "assets/scene/거울굴절철도4호선중간보스.jpg",
    foes: ["mutadon", "heuksu_gu", "rail4_quetzal"],
    perk: { name: "남은 사람의 몫", desc: "쓰러진 아군 하나마다 남은 전원의 공격력 +15%.", effect: { fallAtk: 0.15 } } },
  { id: "rail4pack2", name: "댐 앞 종점", railOnly: true, tier: "railLine4",
    bg: "assets/scene/거울굴절철도4호선종점.jpg",
    foes: ["duel_challenger", "giganotosaurus", "rail4_dirrex"],
    perk: { name: "망치를 든 구조대", desc: "N사 인격의 공격력 +100%.", effect: { tagged: { tag: "N사", atk: 1.00 } } } },
  /* ── 어비스 거울 던전 전용 — 심층 4·5층 갈림길에만 섭니다(deepOnly) ── */
  { id: "deep01", name: "다른 세계의 마왕", deepOnly: true, bg: "assets/scene/모나크 저택 옥상.jpg",
    foes: ["zombie_horde", "rodan_toy", "deep_mawang_lee"],
    perk: { name: "입에 담지 못할 이름", desc: "전원의 공격력 +40%.", effect: { all: { atk: 0.40 } } } },
  { id: "deep02", name: "호감이 끝나는", deepOnly: true, bg: "assets/scene/신해수랜드 4층.jpg",
    foes: ["kim_yeonjun_busan", "shinhaesuland_gan", "deep_cha_minjun"],
    perk: { name: "붉게 물든 랜스", desc: "전원의 치명타 확률 +25%p, 보스에게 주는 치명타 피해 +50%.",
            effect: { crit: 0.25, bossCritDmg: 0.50 } } },
  { id: "deep03", name: "방과 후의 교무실", deepOnly: true, bg: "assets/scene/신해수랜드 교장실.jpg",
    foes: ["hyeolgwi", "baksangwon", "shinhaesu_principal"],
    perk: { name: "보건실 열쇠", desc: "공격할 때마다 자기 최대 체력의 6%를 회복하고, 전투에 이기면 60%를 회복한다.",
            effect: { hitHeal: 0.06, winHeal: 0.60 } } }
];
