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
 *                  갈래에 따라서는 «어떻게 끝냈는가» 까지 갈라 볼 수 있습니다 —
 *                  그럴 때는 갈래 열쇠 뒤에 콜론을 붙인 말을 그대로 적습니다
 *                  ("갈래열쇠:무엇"). 그 갈래가 제 자리에서 checkAchievements 를
 *                  그 말로 한 번 더 부릅니다.
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
 *      id        작성위원의 인격 — { who: "열쇠", star: 3, title: "제목" }
 *                (data/characters.js SINNERS 의 열쇠·성급·제목 그대로)
 *                이미 지닌 인격이면 배정에서 겹쳤을 때와 같이 파편으로 돌아옵니다.
 *                data/characters.js 에서 그 인격 줄에 hidden: true 를 적어 두면
 *                «업적으로만 얻는 숨은 인격» 이 됩니다 — 배정·인격 교환에 안 나오고,
 *                얻기 전에는 노트·장착 화면·보관함 어디에도 뜨지 않습니다
 *                (engine.js 의 idHidden 머리말 참고).
 *      money     원고료
 *      codex     황금교본
 *      advisor   보조 교육위원 — "제목|이름". ADVISORS 에 hidden: true 로 적어 둔
 *                  «업적으로만 오는» 교육위원도 이 자리로 줍니다(그때부터 도감·
 *                  배정 화면에 보이기 시작합니다 — engine.js 의 advisorHidden).
 *                  이미 함께하는 사람이면 황금교본으로 돌아옵니다.
 *      syncModule  동기화 모듈 개수 — 보관함에서 써서, 작성위원 하나를 골라
 *                  그 사람의 동기화를 두 단계 올립니다 (engine.js 의 SYNC_MODULE)
 *      advisorTicket / giftTicket   선택권 개수 — 보관함에서 써서, 아직 못 가진
 *                                   교육위원·기프트 하나를 직접 골라 받습니다
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
  },
  {
    name: "실험은 계속된다",
    desc: "하드 또는 익스트림 거울 던전에서 김연준을 쓰러뜨린다.",
    reward: "지원 작성위원 ★★★ 개화 E.G.O :: 스테고우로스 하축론",
    when: { kill: "김연준", where: ["mirrorHard", "mirrorExtreme"] },
    give: { support: "개화 E.G.O :: 스테고우로스|하축론" }
  },
  {
    name: "아픈 사람은 보건실로",
    desc: "하드 또는 익스트림 거울 던전에서 신해수랜드 보건선생님 박상원을 쓰러뜨린다.",
    reward: "지원 작성위원 ★★★ 신해수랜드 보건선생님 박상원",
    when: { kill: "박상원", where: ["mirrorHard", "mirrorExtreme"] },
    give: { support: "신해수랜드 보건선생님|박상원" }
  },
  {
    /* G안이 noMirror 였을 때는 이 업적이 절대 달성 불가능했습니다 —
     * 사용자 지침(2026-09-01)으로 noMirror 를 떼며 풀렸습니다(위 FOES 의
     * shinhaesuland_gan 주석 참고). G안은 mirrorExtreme 의 무작위 보스
     * 자리에 뽑힐 수 있으므로, 「퍼레이드의 열기」를 켠 채로 익스트림을
     * 돌다 만나면 채워집니다 — 다만 뽑기 운이 필요합니다.
     *
     * 자리는 원래 거울굴절철도였는데 사용자 지침(2026-09-06)으로
     * 익스트림 거울 던전으로 옮겼습니다. 보상도 지원 작성위원 신해수에서
     * «숨은 인격» 이소정으로 갈았습니다(위 SINNERS.lee_sojeong 참고) —
     * 신해수는 아래 「교장실에서는 정숙」이 대신 맡습니다. */
    name: "퍼레이드를 끝내러 왔다",
    desc: "「퍼레이드의 열기」(신해수랜드 시너지)가 발동한 채로, 익스트림 거울 던전에서 신해수랜드의 여왕 G안을 쓰러뜨린다.",
    reward: "★★★ P사 익룡무리 타격대 이소정",
    when: { kill: "G안", where: "mirrorExtreme", synergy: "퍼레이드의 열기" },
    give: { id: { who: "lee_sojeong", star: 3, title: "P사 익룡무리 타격대" } }
  },
  {
    /* 사용자 지침(2026-09-06) — 신해수(지원 작성위원)의 새 자리입니다.
     * 본편 7장 교장실에서 「이런 일을 벌인 너를 용서할 수 없다」를 고르면
     * 붙는 선택지 보스(FOES.shinhaesu_principal, 위)를 이겨야 열립니다.
     * 「그래, 불필요한 싸움은 하지 말자」쪽으로 지나가면 안 열립니다 —
     * 그 갈림길에만 달린 보상입니다.
     *
     * kill 은 이름을 «품고만 있어도» 맞는 것으로 보므로(engine.js
     * achieveMatches 참고), "신해수"라고만 적으면 「신해수랜드…」가 든
     * 김희재·박상원·G안까지 전부 걸립니다. 그래서 이 개체에만 있는
     * 「교장 신해수」로 적었습니다. where:"story" 도 함께 달아 두었지만,
     * shinhaesu_principal 은 noMirror:true 라 어차피 본편에만 섭니다. */
    name: "교장실에서는 정숙",
    desc: "본편에서 신해수랜드의 교장 신해수를 쓰러뜨린다.",
    reward: "지원 작성위원 ★★★ 신해수랜드 교장선생님 신해수",
    when: { kill: "교장 신해수", where: "story" },
    give: { support: "신해수랜드 교장선생님|신해수" }
  }
];
