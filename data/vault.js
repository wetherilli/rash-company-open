/* =====================================================================
 *  라슈 컴퍼니 — 보관함 저장 파일
 * ---------------------------------------------------------------------
 *  여기에 담기는 것 — 보관함에 남는 것 «전부» 입니다
 *    ids        보유한 인격
 *    advisors   보유한 보조 교육위원      advisorOn  세워 둔 교육위원 (칸 순서대로)
 *    gifts      보유한 기프트             giftOn     세워 둔 기프트 (칸 순서대로)
 *    supports   얻은 지원 작성위원        achieved   달성한 업적
 *    cleared    클리어한 장               presets    담아 둔 편성 3칸
 *    mailTaken  이미 받은 우편            storyGain  이야기에서 인격을 이미 받은 자리
 *    equip / party / money / codex / newbie / enk
 *
 *    advisor · gift 는 «첫째 칸» 을 따로 적어 둔 것입니다. 옛 판이 읽을 수 있게 남겨 둡니다.
 *
 *  ■ 어떻게 쓰나
 *    게임은 시작할 때 이 파일을 읽습니다. 그 뒤의 진행은 브라우저 저장소에 쌓입니다.
 *    브라우저가 지워지거나 다른 컴퓨터로 옮길 때를 대비해, 게임 안의
 *    [기록] → [내보내기] 를 눌러 나온 파일을 이 파일에 통째로 덮어쓰세요.
 *    (그 파일을 [기록] → [가져오기] 로 곧장 골라도 됩니다 — 이쪽이 손이 덜 갑니다)
 *
 *  ■ 손대지 마십시오
 *    내보내기가 맨 아래에 적어 두는 sig 는 위 내용을 요약한 값입니다.
 *    안을 손으로 고치면 그 값과 어긋나 기록 화면에 «손댄 흔적» 으로 뜹니다.
 *    막으려는 것이 아니라 오류 보고를 헛짚지 않으려는 몫입니다.
 *
 *  ■ 비우려면
 *    VAULT_SEED 를 null 로 두면 됩니다.
 * ===================================================================== */

const VAULT_SEED = null;

/* 예시 — 내보내기를 하면 아래와 같은 모양이 나옵니다. (칸이 더 많습니다)
const VAULT_SEED = {
  ids: [
    "kim_duhyeon|3|개화 E.G.O :: 궁극의 도마뱀",
    "song_hamin|3|LST E.G.O :: 점박이"
  ],
  advisors: ["lee_hyeongwu_inquisitor"],
  advisor: "lee_hyeongwu_inquisitor",
  advisorOn: ["lee_hyeongwu_inquisitor"],
  gifts: [],
  gift: null,
  giftOn: [],
  presets: [null, null, null],
  supports: [],
  achieved: ["번개는 이제 그만!"],
  cleared: ["ch0", "ch1"],
  equip: { kim_duhyeon: "kim_duhyeon|3|개화 E.G.O :: 궁극의 도마뱀" },
  party: ["kim_duhyeon", "lee_hanbeom", "kim_taeseong"],
  money: 430,
  codex: 0,
  newbie: 0,
  enk: null,
  mailTaken: [],
  ver: "1.0.10",
  sig: "…"
};
*/
