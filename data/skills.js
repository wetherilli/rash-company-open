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
