/* ── 작성위원 12명의 고유 능력 ──────────────────────────────────
 *  동기화 1단계에 해금되고, 4·8·12단계에서 더 강해집니다 (TODO.md 「강화 수치」 참고).
 *
 *  kind: "active"  — 전투 중 방어 옆 손잡이로 직접 고름. 같은 적에게 한 번
 *                     (갑주만 8·12단계에서 두 번·세 번까지 — uses 참고)
 *        "passive" — 조건이 맞으면 자동 발동. 파티 카드에 스택으로 표시.
 *
 *  tiers: 1·4·8·12단계에서의 수치. 능력마다 뜻이 다르므로 desc()가 값을
 *  받아 그 능력에 맞는 문장으로 풀어 씁니다 — 회색 설명 칸(.uskill)과
 *  동기화 화면에서 같은 desc()를 그대로 우려 씁니다.
 */
const UNIQUE_SKILLS = {
  cha_minjun: {
    name: "흡혈", kind: "active",
    tiers: { 1: 20, 4: 30, 8: 40, 12: 50 },
    desc: v => "강화 공격, 준 피해의 " + v + "% 회복 · 같은 적에게 한 번"
  },
  kim_haju: {
    name: "반격", kind: "active",
    tiers: { 1: 1.3, 4: 1.5, 8: 1.8, 12: 2.2 },
    desc: v => "맞고 살아 있으면 ×" + v + " 확정 치명타로 반격 · 같은 적에게 한 번"
  },
  park_suo: {
    name: "회피", kind: "active",
    tiers: { 1: 1.3, 4: 1.5, 8: 1.8, 12: 2.2 },
    desc: v => "한 번 완전히 피하고, 다음 공격은 ×" + v + " 확정 치명타 · 같은 적에게 한 번"
  },
  song_hamin: {
    name: "도발", kind: "active",
    tiers: { 1: 3, 4: 5, 8: 8, 12: 12 },
    desc: v => "노려지는 대상을 자신으로, 받는 피해 " + v + "% 감소 · 같은 적에게 한 번"
  },
  chu_minsu: {
    name: "책임", kind: "active",
    tiers: { 1: 7, 4: 10, 8: 15, 12: 20 },
    desc: v => "아군이 받을 피해를 전부 대신 받고 " + v + "% 경감 · 같은 적에게 한 번"
  },
  lee_gyeongwon: {
    name: "겹살", kind: "active",
    tiers: { 1: -26, 4: -20, 8: -14, 12: -8 },
    desc: v => "공격을 두 번, 공격력은 " + Math.abs(v) + "% 감소 · 같은 적에게 한 번"
  },
  kim_duhyeon: {
    name: "강공", kind: "active",
    /* 받는 피해 배율(×2.0)은 끝까지 고정 — 위험은 그대로 지고 가는, 다듬어지지 않은 능력 */
    tiers: { 1: 1.5, 4: 1.8, 8: 2.1, 12: 2.5 },
    desc: v => "공격력 ×" + v + ", 받는 피해는 ×2.0 그대로 · 같은 적에게 한 번"
  },
  seong_siyun: {
    name: "갑주", kind: "active",
    /* %감소 → 완전무효 → 무효화 여러 번, 질적으로 다른 네 단계.
     * 8단계부터 "모든 액티브는 적 하나당 한 번" 규칙의 유일한 예외. */
    tiers: {
      1: { pct: 0.5, uses: 1 },
      4: { pct: 1,   uses: 1 },
      8: { pct: 1,   uses: 2 },
      12: { pct: 1,  uses: 3 }
    },
    desc: v => (v.pct >= 1
        ? "받는 피해 완전 무효 · 같은 적에게 " + v.uses + (v.uses > 1 ? "번까지" : "번")
        : "받는 피해 " + Math.round(v.pct * 100) + "% 감소 · 같은 적에게 한 번")
  },
  kim_taeseong: {
    name: "광신", kind: "passive",
    tiers: { 1: 3, 4: 5, 8: 7, 12: 10 },
    desc: v => "처치할 때마다 공격력 " + v + "% 상승 · 이번 갈래 동안 누적"
  },
  yu_ain: {
    name: "보복", kind: "passive",
    tiers: { 1: 0.5, 4: 1, 8: 1.5, 12: 2 },
    desc: v => "아군이 죽을 때마다 공격력 " + v + "% 상승 · 자신이 죽으면 초기화"
  },
  lee_hanbeom: {
    name: "격노", kind: "passive",
    tiers: { 1: 12, 4: 10, 8: 8, 12: 6 },
    desc: v => "잃은 체력 " + v + "%마다 추가 피해 1%"
  },
  lee_sojeong: {
    name: "배임", kind: "passive",
    tiers: { 1: 12, 4: 10, 8: 8, 12: 6 },
    desc: v => "잃은 체력 " + v + "%마다 방어 +1"
  }
};

/* 동기화 1·4·8·12단계 — 고유 능력이 해금·강화되는 자리 */
const UNIQUE_SKILL_TIERS = [1, 4, 8, 12];

/* who의 지금 동기화 단계에서 적용할 능력 수치. 아직 1단계도 안 됐으면 null
 * (syncLevel은 engine.js 쪽 함수라 여기서는 값만 계산해 두고, 실제로 부를 때
 * 엔진 쪽에서 syncLevel(who)를 넘겨줍니다). */
function skillTierValue(skill, level) {
  if (!skill || !level) return null;
  const steps = UNIQUE_SKILL_TIERS.filter(t => t <= level);
  if (!steps.length) return null;
  const step = steps[steps.length - 1];
  return skill.tiers[step];
}

/* ── 연계 효과 ──────────────────────────────────────────────────
 *  작성위원 고유 능력과는 다른 자리입니다 — «누가 특정 인격을 장착하고,
 *  그 인격의 시너지가 발동 중이면, 전투 중 정해진 턴마다 같은 시너지
 *  인원 하나를 무작위로 뽑아 그 차례 공격력을 강화» 하는 자리(engine.js
 *  의 checkLinkSkills, beginTurn 끝에서 매 턴 검사합니다).
 *
 *  who          부르는 사람(작성위원 키). 편성에 있고 살아 있어야 합니다.
 *  needTitle    who 가 이 인격을 장착하고 있어야 발동합니다.
 *  synergyName  이 이름의 편성 시너지(SYNERGIES 의 name)가 지금 발동 중이어야 합니다.
 *  pickTag      제목에 이 말이 든 «편성원»(작성위원·지원 다 포함, who 자신도 포함)
 *               중에서 무작위로 한 명을 뽑습니다.
 *  startTurn / every   startTurn 턴부터, every 턴마다.
 *  giftName / giftEvery  그 이름의 E.G.O 기프트를 지녔으면 every 대신 이 값을 씁니다.
 *  atkMult      뽑힌 사람의 이번 턴 공격력 배율(2면 두 배).
 *  advisorName / advisorMult  그 이름의 보조 교육위원을 세웠으면 atkMult
 *               대신 이 값을 씁니다. giftName/giftEvery(주기 단축)와는
 *               독립된 자리라 함께 걸 수 있습니다(engine.js checkLinkSkills).
 *  label        전투 로그에 "(라벨)" 로 붙는 짧은 이름. 안 적으면 "연계".
 *  callLines    who 가 선창하는 대사 — 배열이면 무작위로 하나.
 *  selfLine     뽑힌 사람이 who 자신일 때 하는 대답.
 *  otherLine    뽑힌 사람이 다른 사람일 때 하는 대답.
 */
const LINK_SKILLS = [
  {
    id: "shinhaesuland_cha_minjun",
    who: "cha_minjun", needTitle: "신해수랜드 실장",
    synergyName: "퍼레이드의 열기",
    pickTag: "신해수랜드",
    startTurn: 2, every: 3,
    giftName: "탐하는 가시", giftEvery: 2,
    atkMult: 2,
    /* 「이정빈」보조 교육위원(7장 wip, "연계 효과 강화")을 세우면 배율이
     * 2배 → 2.5배로 오릅니다 — 이정빈이 아직 ADVISORS 에 없는 동안은
     * 그냥 조용히 안 걸립니다(탐하는 가시가 GIFTS 에 없던 동안과 같은 사정). */
    advisorName: "이정빈", advisorMult: 2.5,
    label: "가시꽃",
    callLines: ["피를 머금을 시간이다.", "준비해라.", "가시꽃을 피워낼 때군."],
    selfLine: "내가 직접 창을 들겠다.",
    otherLine: "받들겠습니다."
  }
];

/* ── 연계 추가타 ────────────────────────────────────────────────
 *  위 「연계 효과」와 발동 조건은 같은 결입니다(who 가 needTitle 을 장착하고
 *  synergyName 이 발동 중이면, startTurn 턴부터 every 턴마다) — 하지만
 *  효과가 다릅니다. 연계 효과는 «뽑힌 사람의 다음 차례»를 강화하지만,
 *  이건 who 가 «자기 공격을 마친 직후» 곧바로 다른 편성원 하나를 뽑아
 *  그 자리에서 추가 공격을 한 번 더 꽂아 넣습니다 — 뽑힌 사람의 이번
 *  차례 행동(공격이든 방어든)과는 무관한 «덤» 입니다.
 *  (engine.js 의 resolveTurn() 안 checkLinkBonus() 가 who 의 공격이
 *  끝날 때마다 검사합니다.)
 *
 *  who / needTitle / synergyName / startTurn / every  — 위 LINK_SKILLS 와 같은 뜻.
 *  pickTag       이 말이 제목에 든 «편성원»(who 자신은 이미 다른 인격을
 *                장착 중이라 보통 저절로 빠집니다) 중에서 무작위로 뽑습니다.
 *  callLines     who 가 선창하는 대사 — 배열이면 무작위로 하나.
 *  replyLines    { 편성원 키: 대답 } — 캐릭터마다 다른 대답을 미리 걸어
 *                둘 자리입니다(지금은 다 defaultReply 뿐입니다).
 *  defaultReply  replyLines 에 없는 사람이 하는 기본 대답.
 *  label         전투 로그에 "(라벨)" 로 붙는 짧은 이름.
 */
const LINK_BONUS_ATTACKS = [
  {
    id: "heuksu_yu_ain",
    who: "yu_ain", needTitle: "B구역 군주",
    synergyName: "흑수들의 왕",
    pickTag: "흑수",
    startTurn: 2, every: 3,
    label: "흑수",
    callLines: ["흑수여.", "물어뜯어라."],
    replyLines: {},
    defaultReply: "수행합니다."
  }
];
