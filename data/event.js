/* =====================================================================
 *  라슈 컴퍼니 — 이벤트
 * ---------------------------------------------------------------------
 *  상점 맨 위의 [이벤트 교환소] 로 열립니다.
 *
 *  원고료·황금교본과 같은 급의 재화가 하나 더 있습니다. 다만 «이름이 고정이
 *  아닙니다» — 지금 서 있는 이벤트가 무엇이냐에 따라 화면에 적히는 이름이
 *  바뀝니다. 괴수살인괴수 기간에는 「칼날이빨」, 부산행 기간에는 「열차티켓」
 *  으로 보입니다. 속으로는 늘 같은 한 칸(S.event)입니다.
 *
 *  ■ 지금 서 있는 이벤트를 어떻게 정하는가
 *    data/story.js 의 CHAPTERS «맨 마지막 줄» 이 그 기간의 이야기입니다.
 *    본편이든 .5장이든 가리지 않습니다 — 맨 뒤에 붙은 것이 곧 최신 스토리입니다.
 *    아래 chapter 는 그 장의 title 과 «글자 그대로» 같아야 맞물립니다.
 *
 *  ■ 스토리를 새로 얹을 때 (중요)
 *    1. data/story.js 의 CHAPTERS 맨 뒤에 그 장을 얹습니다.
 *    2. 여기 EVENTS 에 그 장 몫의 줄을 하나 더 답니다 — 새 기간에 쓸 재화
 *       이름(cur)과 기간(from·days)을 정해서 적습니다.
 *    3. 그러면 «저절로» 이벤트가 갈립니다. 모아 둔 이벤트 재화는 0으로
 *       초기화되고, 교환소에서 몇 개를 바꿨는지도 함께 지워져 한도가 다시 찹니다.
 *       이용자에게는 유리창에서 한 번 알립니다 —
 *       「새로운 이벤트 재화가 출시되었습니다 "…"! 기존 재화는 0으로 초기화됩니다.」
 *    아직 안 만든 장을 미리 적어 두어도 해롭지 않습니다 — CHAPTERS 맨 끝에
 *    그 장이 실제로 서기 전까지는 아무 일도 일어나지 않습니다.
 *
 *  ■ 기간 (우편함과 «같은 방식» 입니다 — 기기 시계를 봅니다)
 *      from   시작한 날. "2026-08-29" 꼴입니다. 안 적으면 기한이 없습니다.
 *      days   며칠 동안. 안 적으면 아래 EVENT_RULE.days.
 *    기간이 지나면 상점 맨 위의 교환소 손잡이가 «사라집니다». 이미 모아 둔
 *    재화는 없어지지 않고, 다음 이야기가 나올 때 0으로 갈립니다.
 *
 *  ■ 교환 물건 (goods)
 *      id     보관함에 남는 열쇠입니다. 한 번 정하면 바꾸지 마십시오 —
 *             바꾸면 그 물건을 몇 개 바꿨는지 잊고 한도가 다시 찹니다.
 *      name   화면에 적을 이름
 *      cost   이 기간 재화로 매기는 값 (한 번에 드는 값)
 *      limit  이 기간에 몇 번까지 바꿀 수 있는가. 0 이거나 안 적으면 무제한
 *      give   무엇을 주는가 — 우편(data/mail.js)과 «같은 말» 을 씁니다
 *               money           원고료
 *               codex           황금교본
 *               enk             엔케팔린 (상한을 넘겨서는 안 찹니다)
 *               enkCap          엔케팔린 캡슐
 *               fragBoxSelect   인격 파편 상자(선택)
 *               fragBoxRandom   인격 파편 상자(무작위)
 *               id              인격 — { who, star, title } 로 적습니다.
 *                               who 는 data/characters.js 의 영문 열쇠(kim_haju 등),
 *                               star·title 은 그 사람 ids 줄과 «글자 그대로» 같아야 합니다.
 *                               이미 지닌 인격이면 뽑기에서 겹쳤을 때와 똑같이
 *                               그 사람 몫 인격 파편으로 돌려받습니다.
 *      desc   한 줄 덧말. 없어도 됩니다
 *
 *  ■ 그 밖에
 *      line    상점 맨 위 띠에 얹히는 광고 문구
 *      banner  그 띠에 깔 그림
 *      desc    재화가 무엇인지 한 줄로 (교환소 위에 적힙니다)
 * ===================================================================== */

/* 기간이 갈려도 그대로인 것들 */
const EVENT_RULE = {
  shop:  "이벤트 교환소",
  days:  28,             // from 만 적고 days 를 안 적었을 때 쓰는 기간(날)
  /* 편성에 «가장 새로 선 특정 배정» 의 대상 인격을 세워 두면, 한 명당 이 비율(%)
   * 만큼 더 받습니다. 교환소 맨 위 알림에 이 수가 그대로 적힙니다. */
  bonusPct: 20,
  /* 스토리 장을 마칠 때 들어오는 몫.
   *   latest — «가장 마지막 장»(지금은 6.5장 괴수살인괴수) 을 마쳤을 때
   *   story  — 그 밖의 장을 마쳤을 때
   *   first  — 그 장을 처음 마쳤을 때 / again — 다회차로 다시 마쳤을 때
   * 거울 던전 쪽 몫은 engine.js 의 MIRROR_TIERS 각 갈래에 event 로 적혀 있습니다. */
  gain: {
    story:  { first: 50,  again: 10 },
    latest: { first: 100, again: 30 }
  },
  /* 어느 이벤트도 서 있지 않을 때 재화를 부를 이름.
   * 이 상태에서는 상점에 교환소 손잡이가 아예 나오지 않습니다. */
  noCur: "이벤트 재화"
};

const EVENTS = [
  {
    id:      "kaiju",              /* 보관함에 남는 열쇠 — 바꾸지 마십시오 */
    chapter: "괴수살인괴수",       /* data/story.js 의 그 장 title 과 같아야 합니다 */
    cur:     "칼날이빨",
    desc:    "괴수를 죽인 괴수가 남기고 간 것.",
    line:    "괴수의 잔재는 또다른 거름이 된다.",   /* 상점 맨 위 띠에 얹히는 광고 문구 */
    banner:  "assets/scene/배수로 내부.jpg",
    from:    "2026-08-29",         /* ← 기간을 늘리거나 줄이려면 여기와 days 를 고칩니다 */
    days:    28,
    goods: [
      { id: "kaiju_box_select", name: "인격 파편 상자 (선택) 10개",
        cost: 30, limit: 30, give: { fragBoxSelect: 10 } },
      { id: "kaiju_box_random", name: "인격 파편 상자 (무작위) 5개",
        cost: 10, limit: 30, give: { fragBoxRandom: 5 } },
      { id: "kaiju_cap",        name: "엔케팔린 캡슐 1개",
        cost: 10, limit: 6,  give: { enkCap: 1 } },
      { id: "kaiju_codex",      name: "황금교본 5권",
        cost: 10, limit: 5,  give: { codex: 5 } },
      /* 횟수 제한 없음 — 남은 재화를 털어 넣는 자리입니다 */
      { id: "kaiju_money",      name: "원고료 5",
        cost: 1,  limit: 0,  give: { money: 5 } },
      /* 인격 — 한 번씩만입니다. 이미 지닌 인격이면 뽑기에서 겹쳤을 때와 똑같이
       * 그 사람 몫 인격 파편으로 돌려받습니다. */
      { id: "kaiju_id_duhyeon", name: "김두현 — G사 4등급 가면라이더",
        cost: 200, limit: 1,
        give: { id: { who: "kim_duhyeon", star: 3, title: "G사 4등급 가면라이더" } } },
      { id: "kaiju_id_haju",    name: "김하주 — 살수 아티스트",
        cost: 300, limit: 1,
        give: { id: { who: "kim_haju", star: 3, title: "살수 아티스트" } } }
    ]
  },

  /* 아직 만들지 않은 장입니다. CHAPTERS 맨 끝에 「부산행」이 서는 날
   * 저절로 이 기간으로 넘어가고, 칼날이빨은 0으로 지워집니다.
   * 그때 banner 와 from 을 채워 주십시오. */
  {
    id:      "busan",
    chapter: "부산행",
    cur:     "열차티켓",
    desc:    "어디로 가는지는 적혀 있지 않다.",
    line:    null,                 /* ← 그때 광고 문구를 적어 주십시오 */
    banner:  null,
    from:    null,
    goods: [
      { id: "busan_box_select", name: "인격 파편 상자 (선택) 10개",
        cost: 30, limit: 30, give: { fragBoxSelect: 10 } },
      { id: "busan_box_random", name: "인격 파편 상자 (무작위) 5개",
        cost: 10, limit: 30, give: { fragBoxRandom: 5 } },
      { id: "busan_cap",        name: "엔케팔린 캡슐 1개",
        cost: 10, limit: 6,  give: { enkCap: 1 } },
      { id: "busan_codex",      name: "황금교본 5권",
        cost: 10, limit: 5,  give: { codex: 5 } },
      { id: "busan_money",      name: "원고료 5",
        cost: 1,  limit: 0,  give: { money: 5 } }
    ]
  }
];
