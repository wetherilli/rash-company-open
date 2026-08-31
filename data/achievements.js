/* =====================================================================
 *  라슈 컴퍼니 — 업적
 * ---------------------------------------------------------------------
 *  유리창의 [업적] 으로 열립니다.
 *  조건을 채우면 그 자리에서 보상이 들어오고, 보관함에 남습니다.
 *
 *  ■ 적는 법 (영문 코드 없음. name 이 곧 구분입니다)
 *
 *    name    업적 제목
 *    desc    이용자에게 보여 줄 조건 한 줄
 *    reward  보상 이름 (화면에 그대로 적힙니다)
 *
 *    when    조건. 아래 것들을 함께 적으면 모두 맞아야 합니다.
 *      kill        쓰러뜨려야 하는 적 이름. 여러 개면 배열 — 그중 하나만 맞으면 됩니다.
 *                  이름이 그 말을 품고만 있어도 맞는 것으로 봅니다.
 *      clear       거울 던전을 «끝까지 돌았을 때» 만 봅니다. 갈래 이름을 적습니다 —
 *                  "mirror" · "mirrorHard" · "mirrorExtreme" · "railLine1" · "railLine2" 등.
 *                  where 처럼 여럿을 배열로 적으면 그중 하나만 맞으면 됩니다 —
 *                  clear: ["mirrorHard", "mirrorExtreme"]
 *                  적을 쓰러뜨리는 것과는 다른 사건이라, kill 과 같이 적지 마십시오.
 *      where       "story" 본편 · "mirror" 거울 던전(하드·익스트림 포함)
 *                  · "mirrorHard" 하드만 · "mirrorExtreme" 익스트림만
 *                  여럿을 배열로 적으면 그중 하나만 맞으면 됩니다 —
 *                  where: ["mirrorHard", "mirrorExtreme"]
 *                  적지 않으면 어디서든.
 *      advisor     그 이름의 보조 교육위원을 세우고 있어야 합니다.
 *      party       그 작성위원이 편성에 있어야 합니다. 여럿이면 배열(모두 필요).
 *      titleHas    편성된 누군가의 인격 이름에 그 말이 들어 있어야 합니다.
 *      synergy     그 이름의 편성 시너지가 지금 발동 중이어야 합니다.
 *
 *    give    보상으로 주는 것
 *      support   지원 작성위원 — "제목|이름"
 *      money     원고료
 *      codex     황금교본
 * ===================================================================== */

const ACHIEVEMENTS = [
  {
    name: "바다도마뱀의 구출",
    desc: "이형우 보조 교육위원을 세운 채로 융합된 아라온호 추진팀 윤희준을 쓰러뜨린다.",
    reward: "지원 작성위원 ★★ 아라온호 추진팀 윤희준",
    when: { kill: "윤희준", advisor: "이형우" },
    give: { support: "아라온호 추진팀|윤희준" }
  },
  {
    name: "우생회의 거울",
    desc: "김태성을 편성한 채로, 하드 거울 던전에서 김준성을 쓰러뜨린다.",
    reward: "지원 작성위원 ★★★ 쥐는 자 김준성",
    when: { kill: "김준성", where: "mirrorHard", party: "kim_taeseong" },
    give: { support: "쥐는 자|김준성" }
  },
  {
    name: "영덕의 밤을 불태우는",
    desc: "영덕의 요리사 시너지가 발동한 채로, 거울 던전에서 뒤틀린 참깨라면을 쓰러뜨린다.",
    reward: "지원 작성위원 ★★ 영덕의 요리사 이유현",
    when: { kill: "참깨라면", where: "mirror", synergy: "영덕의 요리사" },
    give: { support: "영덕의 요리사|이유현" }
  },
  {
    name: "산산이 부서진",
    desc: "익스트림 거울 던전을 끝까지 돈다.",
    reward: "지원 작성위원 ★★★ L사 비포팀 정윤하",
    when: { clear: "mirrorExtreme" },
    give: { support: "L사 비포팀|정윤하" }
  },
  {
    name: "번개는 이제 그만!",
    desc: "하드 또는 익스트림 거울 던전에서 머리 없는 드래곤 케빈을 쓰러뜨린다.",
    reward: "지원 작성위원 ★★★ 모나크 버틀러 오은성",
    when: { kill: "케빈", where: ["mirrorHard", "mirrorExtreme"] },
    give: { support: "모나크 버틀러|오은성" }
  },
  {
    name: "큰 망치의 길",
    desc: "「망치」가 든 인격을 편성한 채로, 거울 던전에서 우생회 큰망치 심승휘를 쓰러뜨린다.",
    reward: "지원 작성위원 ★★★ 우생회 큰망치 심승휘",
    when: { kill: "심승휘", where: "mirror", titleHas: "망치" },
    give: { support: "우생회 큰망치|심승휘" }
  },
  {
    name: "괴물들의 밤",
    desc: "I사 시너지가 발동한 채로, 하드 거울 던전에서 데스리퍼를 쓰러뜨린다.",
    reward: "지원 작성위원 ★★ I사 선봉3팀 이유건",
    /* synergy 는 시너지의 «이름» 으로 찾습니다. I사 태그의 이름은 「우주정복의 의지」입니다. */
    when: { kill: "데스리퍼", where: "mirrorHard", synergy: "우주정복의 의지" },
    give: { support: "I사 선봉3팀|이유건" }
  },
  {
    /* 종점에서 무엇을 만나는지는 적지 않습니다 — 직접 닿아야 압니다.
     * clear 는 «끝까지 돌았을 때» 만 봅니다 (kill 과 같이 적지 마십시오). */
    name: "익숙한 전화벨",
    desc: "거울굴절철도 1호선을 끝까지 돈다.",
    reward: "지원 작성위원 ★★★ 이집티쿠스 모니터",
    when: { clear: "railLine1" },
    give: { support: "이집티쿠스|모니터" }
  },
  {
    /* 1호선과 마찬가지로 종착역에 무엇이 서 있는지는 적지 않습니다 — 닿아야 압니다.
     * 순환을 몇 바퀴 돌든, 종착역을 넘겨야만 clear 가 섭니다 (mirrorClear 참고). */
    name: "가상생물학의 정수",
    desc: "거울굴절철도 2호선을 종착역까지 끝낸다.",
    reward: "지원 작성위원 ★★★ 남부협회 수산시장 낚시꾼 표성우",
    when: { clear: "railLine2" },
    give: { support: "남부협회 수산시장 낚시꾼|표성우" }
  },
  {
    name: "망해버린 시리즈",
    desc: "가면라이더 시너지가 발동한 채로, 하드 또는 익스트림 거울 던전에서 타나콘다를 쓰러뜨린다.",
    reward: "지원 작성위원 ★★ G사 촬영전문가 박준정",
    /* synergy 는 시너지의 «이름» 으로 찾습니다 — data/characters.js SYNERGIES 의 "가면라이더 연계기" */
    when: { kill: "타나콘다", where: ["mirrorHard", "mirrorExtreme"], synergy: "가면라이더 연계기" },
    give: { support: "G사 촬영전문가|박준정" }
  }
];
