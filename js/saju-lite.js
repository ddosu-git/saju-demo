/* 무료 메뉴용 사주 계산 (브라우저에서 바로 계산, AI 없음).
 * saju.py 의 원국 계산(시간 보정·서머타임·야자시 처리)을 그대로 옮긴 것. 대운·신살·용신은 유료 분석지에서만 쓴다.
 * 필요: vendor/lunar.js (lunar-javascript 1.7.7). node 에서는 require 로 쓸 수 있다(검증용). */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) module.exports = factory(require("../vendor/lunar.js"));
  else root.SajuLite = factory(root);
})(this, function (L) {
  const GAN = "甲乙丙丁戊己庚辛壬癸", ZHI = "子丑寅卯辰巳午未申酉戌亥";
  const GAN_KO = "갑을병정무기경신임계", ZHI_KO = "자축인묘진사오미신유술해";
  const GAN_ELEM = "목목화화토토금금수수", ZHI_ELEM = "수토목목토화화토금금토수";
  const ELEM_HANJA = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
  const SHISHEN_KO = { 比肩: "비견", 劫财: "겁재", 食神: "식신", 伤官: "상관", 偏财: "편재",
    正财: "정재", 七杀: "편관", 正官: "정관", 偏印: "편인", 正印: "정인" };
  const HIDE_MAIN = { 子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙", 午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬" };
  const UNSEONG = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
  const CHANGSAENG = { 甲: "亥", 乙: "午", 丙: "寅", 丁: "酉", 戊: "寅", 己: "酉", 庚: "巳", 辛: "子", 壬: "申", 癸: "卯" };
  // saju.py 와 같은 표: 서머타임 기간(-60분), 표준시 UTC+8:30 기간(경도 보정 생략)
  const DST = [["1948-06-01", "1948-09-12"], ["1949-04-03", "1949-09-10"], ["1950-04-01", "1950-09-09"],
    ["1951-05-06", "1951-09-08"], ["1955-05-05", "1955-09-08"], ["1956-05-20", "1956-09-29"],
    ["1957-05-05", "1957-09-21"], ["1958-05-04", "1958-09-20"], ["1959-05-03", "1959-09-19"],
    ["1960-05-01", "1960-09-17"], ["1987-05-10", "1987-10-10"], ["1988-05-08", "1988-10-08"]];
  const UTC0830 = [["1908-04-01", "1911-12-31"], ["1954-03-21", "1961-08-09"]];
  // saju.py 의 PLACES 와 같은 표 (출생지 경도). 고르지 않으면 기본 -30분
  const PLACES = {
    "서울": 126.98, "인천": 126.71, "경기 남부(수원)": 127.01, "경기 북부(의정부)": 127.04,
    "춘천": 127.73, "원주": 127.92, "강릉": 128.88, "대전·세종": 127.38, "청주": 127.49, "천안": 127.15,
    "전주": 127.15, "광주": 126.85, "목포": 126.39, "여수·순천": 127.56, "대구": 128.60, "안동": 128.73,
    "포항": 129.36, "울산": 129.31, "부산": 129.08, "창원·마산": 128.68, "진주": 128.11, "제주": 126.53,
    "울릉도": 130.91,
  };

  const elemOf = (ch) => GAN.includes(ch) ? GAN_ELEM[GAN.indexOf(ch)] : ZHI_ELEM[ZHI.indexOf(ch)];
  const ko = (gz) => GAN_KO[GAN.indexOf(gz[0])] + ZHI_KO[ZHI.indexOf(gz[1])];
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (t) => `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  const inPeriods = (t, ps) => ps.some(([a, b]) => a <= iso(t) && iso(t) <= b);
  // 날짜 계산은 시간대 영향을 받지 않도록 UTC Date 를 "벽시계 시각" 그릇으로 쓴다
  const wall = (y, m, d, h, mi) => new Date(Date.UTC(y, m - 1, d, h, mi));

  function toSolar(ymd, h, mi, cal) {
    const [y, m, d] = ymd.split("-").map(Number);
    if (cal === "양력") return wall(y, m, d, h, mi);
    const s = L.Lunar.fromYmdHms(y, cal === "윤달" ? -m : m, d, h, mi, 0).getSolar();
    return wall(s.getYear(), s.getMonth(), s.getDay(), h, mi);
  }

  // Python round 와 같게 (.5 는 짝수 쪽으로)
  const pyRound = (x) => { const f = Math.floor(x), d = x - f; return d > 0.5 || (d === 0.5 && f % 2 !== 0) ? f + 1 : f; };
  function placeMinutes(place, t) { return pyRound((PLACES[place] - (inPeriods(t, UTC0830) ? 127.5 : 135)) * 4); }

  function correctTime(t, lonMin = -30, place = null) {
    const notes = [];
    const orig = t.getTime();
    if (inPeriods(t, DST)) { t = new Date(t.getTime() - 60 * 60000); notes.push("서머타임 -60분"); }
    if (place) {
      const m = placeMinutes(place, t);
      t = new Date(t.getTime() + m * 60000);
      notes.push(`출생지 ${place} 경도 보정 ${m > 0 ? "+" : ""}${m}분`);
    } else if (inPeriods(t, UTC0830)) notes.push("당시 표준시 UTC+8:30 → 경도 보정 생략");
    else { t = new Date(t.getTime() + lonMin * 60000); notes.push(`경도 보정 ${lonMin}분`); }
    return [t, notes, Math.round((t.getTime() - orig) / 60000)];
  }

  function shishen(dayGan, gan) { return SHISHEN_KO[L.LunarUtil.SHI_SHEN[dayGan + gan]]; }

  // 신강약·용신: sinsal.py 의 strength / yongsin 과 같은 규칙 (단순 억부)
  const CYCLE = "목화토금수";
  const shift = (e, k) => CYCLE[(CYCLE.indexOf(e) + k + 5) % 5];  // +1 내가 생함, +2 내가 극함, -1 나를 생함
  const STRENGTH = { TTT: "극신강", TTF: "중신강", TFT: "신강", TFF: "강변약", FTT: "약변강", FTF: "중신약", FFT: "신약", FFF: "극신약" };
  function strength(dayGan, y, m, d, h) {
    const me = elemOf(dayGan), helps = [me, shift(me, -1)];
    const ok = (ch) => helps.includes(elemOf(ch));
    const others = [y[0], y[1], m[0], h[0], h[1]].filter(ok).length >= 3;
    return STRENGTH[[ok(m[1]), ok(d[1]), others].map((b) => (b ? "T" : "F")).join("")];
  }
  function yongsin(dayGan, label) {
    const me = elemOf(dayGan);
    const yong = label === "극신강" ? shift(me, 2) : ["중신강", "신강", "약변강"].includes(label) ? shift(me, 1) : me;
    const gi = shift(yong, -2);
    return { 용신: yong, 희신: shift(yong, -1), 기신: gi, 구신: shift(gi, -1) };
  }

  function unseong(dayGan, zhi) {
    const step = ZHI.indexOf(zhi) - ZHI.indexOf(CHANGSAENG[dayGan]);
    const yang = GAN.indexOf(dayGan) % 2 === 0;
    return UNSEONG[(((yang ? step : -step) % 12) + 12) % 12];
  }

  /** ymd "YYYY-MM-DD", time "HH:MM" 또는 "모름", cal "양력"|"음력"|"윤달" */
  function calc(ymd, time, cal = "양력", place = null) {
    if (place === "모름" || place === "") place = null;
    if (place && !(place in PLACES)) throw new Error("출생지 " + place);
    const known = time && time !== "모름";
    const [h, mi] = known ? time.split(":").map(Number) : [12, 0];
    let t = toSolar(ymd, h, mi, cal), notes = ["시간 모름 → 12:00 기준(시주 제외)"];
    if (known) [t, notes] = correctTime(t, -30, place);
    const lunar = L.Solar.fromYmdHms(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), t.getUTCHours(), t.getUTCMinutes(), 0).getLunar();
    const ec = lunar.getEightChar();
    ec.setSect(1); // 23시 이후는 다음 날 일주 (saju.py 와 같음)
    const dayGan = ec.getDayGan();
    const pillars = {};
    for (const [name, gz] of [["시주", ec.getTime()], ["일주", ec.getDay()], ["월주", ec.getMonth()], ["년주", ec.getYear()]]) {
      if (name === "시주" && !known) continue;
      pillars[name] = { 간지: gz, 한글: ko(gz), 천간십성: name === "일주" ? "일간" : shishen(dayGan, gz[0]),
        지지십성: shishen(dayGan, HIDE_MAIN[gz[1]]), 운성: unseong(dayGan, gz[1]) };
    }
    const elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    for (const p of Object.values(pillars)) { elements[elemOf(p.간지[0])]++; elements[elemOf(p.간지[1])]++; }
    // 시간을 몰라도 신강약은 12시 기준 시주로 참고 계산 (saju.py 와 같음)
    const label = strength(dayGan, ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime());
    const lm = lunar.getMonth();
    return {
      입력: { 날짜: ymd, 시간: known ? time : "모름", 달력: cal, 출생지: place || "모름" },
      양력: iso(toSolar(ymd, 12, 0, cal)),
      음력: `${lunar.getYear()}년 ${lm < 0 ? "윤" : ""}${Math.abs(lm)}월 ${lunar.getDay()}일`,
      보정: notes, 일간: dayGan, 일간오행: elemOf(dayGan), 월지: pillars["월주"].간지[1],
      원국: pillars, 오행: elements, 신강약: label, 용신: yongsin(dayGan, label),
    };
  }

  /** 그날 일진이 나(일간)에게 어떤 기운인지 */
  function dayLuck(r, date = new Date()) {
    const lunar = L.Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
    const gz = lunar.getDayInGanZhiExact();
    return { 간지: gz, 한글: ko(gz), 천간: shishen(r.일간, gz[0]), 지지: shishen(r.일간, HIDE_MAIN[gz[1]]),
      운성: unseong(r.일간, gz[1]), 오행: elemOf(gz[0]) };
  }

  return { calc, dayLuck, elemOf, ko, ELEM_HANJA, GAN, ZHI, PLACES };
});
