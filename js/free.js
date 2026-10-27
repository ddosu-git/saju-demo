/* 무료 메뉴: 한 문항씩 입력 → 내 사주표 + 성향 맛보기 + 분석지 미리보기, 오늘의 운세. 모든 계산은 브라우저 안에서 (서버·AI 없음) */
(function () {
  const S = window.SajuLite;
  const ELEM_CLASS = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
  const COLORS = { 목: "초록·연두", 화: "빨강·주황", 토: "노랑·베이지", 금: "흰색·은색", 수: "검정·남색" };

  const DAY_MASTER = {
    甲: ["큰 나무", "하늘을 향해 곧게 뻗어 오르는 큰 나무입니다. 한번 정한 방향을 꾸준히 밀고 나가는 힘과 사람들을 이끄는 기상이 있습니다.", "쉽게 굽히지 않는 곧음이 장점이자, 가끔은 스스로를 지치게 하는 숙제가 됩니다."],
    乙: ["꽃과 덩굴", "바람에 부드럽게 휘어지며 어디서든 뿌리내리는 꽃과 덩굴입니다. 사람 사이를 잇는 친화력과 섬세한 감각이 돋보입니다.", "주변 눈치를 살피느라 내 마음을 뒤로 미루기 쉬우니, 내 뜻도 한 번씩 꺼내 보세요."],
    丙: ["한낮의 태양", "숨김없이 환하게 비추는 태양입니다. 밝고 솔직하며, 곁에 있는 사람들의 마음까지 데워 주는 열정이 있습니다.", "시작은 누구보다 뜨겁지만 마무리에서 힘이 빠지기 쉬우니, 끝맺음을 챙기면 빛이 오래갑니다."],
    丁: ["밤을 밝히는 등불", "어둠 속을 은은하게 밝히는 등불입니다. 따뜻한 배려와 한곳을 깊이 파고드는 집중력이 있습니다.", "서운함을 속으로 오래 태우는 편이라, 작은 마음도 그때그때 말로 풀어 주는 것이 좋습니다."],
    戊: ["듬직한 큰 산", "묵묵히 자리를 지키는 큰 산입니다. 믿음직하고 품이 넓어 사람들이 기대어 쉬어 가는 중재자입니다.", "변화 앞에서 신중함이 지나쳐 기회를 놓칠 수 있으니, 가끔은 가볍게 움직여 보세요."],
    己: ["기름진 들판", "무엇이든 길러 내는 기름진 들판입니다. 실속 있고 세심하며, 주변을 살뜰히 챙기는 살림꾼의 기운입니다.", "걱정이 많아 생각이 꼬리를 물기 쉬우니, 할 수 있는 것부터 하나씩 내려놓아 보세요."],
    庚: ["단단한 바위", "다듬어지기 전의 단단한 바위이자 쇠입니다. 의리와 결단력, 원칙을 지키는 곧은 심지가 있습니다.", "옳은 말도 날카롭게 들릴 수 있으니, 한마디의 온기를 더하면 사람들이 더 따릅니다."],
    辛: ["빛나는 보석", "곱게 다듬어진 보석입니다. 섬세한 미적 감각과 깔끔함, 스스로를 아끼는 자존감이 있습니다.", "작은 흠에도 마음이 쓰이는 예민함이 있어, 완벽하지 않아도 충분히 빛난다는 걸 기억하세요."],
    壬: ["넓은 강과 바다", "넓게 흐르는 강이자 바다입니다. 큰 포용력과 지혜, 어디로든 흘러가는 자유로움이 있습니다.", "한곳에 머물기 어려워 시작한 일이 흩어지기 쉬우니, 물길을 하나로 모으면 큰 힘이 됩니다."],
    癸: ["촉촉한 단비", "조용히 스며들어 생명을 키우는 단비입니다. 남다른 직관과 공감 능력, 풍부한 상상력이 있습니다.", "생각이 많아 결정이 늦어지기 쉬우니, 마음이 기우는 쪽을 조금 더 믿어 보세요."],
  };
  const SEASON = { 寅: "봄", 卯: "봄", 辰: "봄", 巳: "여름", 午: "여름", 未: "여름", 申: "가을", 酉: "가을", 戌: "가을", 亥: "겨울", 子: "겨울", 丑: "겨울" };
  const SEASON_PHRASE = { 봄: "만물이 깨어나는 봄", 여름: "열기가 가득한 여름", 가을: "결실이 영그는 가을", 겨울: "고요하고 차가운 겨울" };
  const MANY = { 목: "새로 시작하고 자라나려는 의욕이 강합니다", 화: "표현력과 열정이 넘칩니다", 토: "신중하고 믿음직한 편입니다",
                 금: "결단력이 있고 원칙을 중요하게 여깁니다", 수: "생각이 깊고 지혜롭습니다" };
  const NONE = { 목: "새 일을 시작할 때 망설임이 길어질 수 있습니다", 화: "마음을 겉으로 드러내는 데 서툴 수 있습니다",
                 토: "중심을 잡아 주는 습관이나 사람이 큰 도움이 됩니다", 금: "맺고 끊기가 어려울 때가 있습니다", 수: "쉬어 가는 여유가 부족해지기 쉽습니다" };

  const TODAY = {
    비견: ["동료 · 자립", "나와 뜻이 맞는 사람과 힘을 합치기 좋은 날입니다. 혼자 끌어안기보다 함께하면 일이 가벼워집니다.", "고집끼리 부딪히면 피곤해지니 한 발 물러서 보세요."],
    겁재: ["경쟁 · 나눔", "승부욕이 올라오고 추진력이 붙는 날입니다. 앞장서서 움직이면 성과가 따릅니다.", "지갑 단속이 필요한 날이에요. 충동구매와 돈 빌려주기는 미뤄 두세요."],
    식신: ["여유 · 즐거움", "마음에 여유가 생기고 좋아하는 일이 잘 풀리는 날입니다. 맛있는 식사나 취미로 나를 채워 주세요.", "느긋함이 지나치면 할 일을 미루게 되니 하나만 먼저 끝내 두세요."],
    상관: ["표현 · 재치", "아이디어가 번뜩이고 말솜씨가 살아나는 날입니다. 기획, 글쓰기, 발표에 좋습니다.", "말이 앞설 수 있으니 윗사람 앞에서는 한 번 더 생각하고 말해 주세요."],
    편재: ["기회 · 활동", "바깥 활동과 새로운 만남 속에서 기회가 보이는 날입니다. 부지런히 움직일수록 좋습니다.", "큰돈이 드는 결정은 하루만 미루고 다시 살펴보세요."],
    정재: ["성실 · 실속", "꼼꼼히 챙긴 만큼 돌아오는 날입니다. 정리, 가계부, 밀린 일 처리에 좋습니다.", "작은 것에 너무 매이면 큰 흐름을 놓칠 수 있어요."],
    편관: ["도전 · 긴장", "부담스러운 일이 찾아올 수 있지만, 해내면 확실히 인정받는 날입니다.", "무리한 일정은 줄이고, 저녁에는 꼭 쉬어 가세요."],
    정관: ["신뢰 · 인정", "약속과 규칙을 지키는 모습이 빛나는 날입니다. 격식 있는 자리나 중요한 만남에 좋습니다.", "남의 시선을 너무 의식하면 피곤해지니 내 속도를 지키세요."],
    편인: ["직관 · 배움", "혼자 생각하고 배우기 좋은 날입니다. 떠오르는 직감을 메모해 두세요.", "의심이 많아질 수 있으니 생각이 꼬이면 잠시 걸으며 머리를 식히세요."],
    정인: ["도움 · 안정", "윗사람이나 가까운 사람의 도움이 닿는 날입니다. 문서, 계약, 공부에 좋습니다.", "받기만 하면 기대가 커지니 고마운 마음을 한마디로 전해 주세요."],
  };

  // 유료 분석지 목차 (prompts/saju.md 의 소제목과 같은 순서)
  const SECTIONS = [["🌿", "사주 총평"], ["💫", "타고난 기질과 빛나는 강점"], ["💼", "직업 및 사회운"], ["💰", "재물운"],
                    ["🌸", "연애 및 대인관계"], ["🌱", "건강운"], ["⏳", "현재의 운기와 나아갈 길"], ["💡", "꼭 기억해야 할 점"]];
  const STEPS = 4;

  const $ = (sel) => document.querySelector(sel);
  const won = (n) => n.toLocaleString("ko-KR") + "원";
  const esc = (s) => window.SITE.esc(s);
  const radio = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value || "";
  let tab = "chart", step = 1;

  function calcOf(p) { try { return S.calc(p.date, p.time, p.cal, p.place || null); } catch (e) { return null; } }

  /* ── 입력 단계 ── */
  function readForm() {
    return { name: $("#f-name").value.trim(), gender: radio("f-gender"), cal: radio("f-cal") || "양력",
             date: window.SITE.readDate("f"), time: $("#f-unknown").checked ? "모름" : $("#f-time").value,
             place: $("#f-place").value };
  }
  function fillForm(p) {
    if (!p) return;
    if (p.name) $("#f-name").value = p.name;
    const g = document.querySelector(`input[name=f-gender][value="${p.gender}"]`); if (g) g.checked = true;
    const c = document.querySelector(`input[name=f-cal][value="${p.cal}"]`); if (c) c.checked = true;
    window.SITE.setDate("f", p.date);
    if (p.time === "모름") { $("#f-unknown").checked = true; $("#f-time").disabled = true; } else if (p.time) $("#f-time").value = p.time;
    if (p.place) $("#f-place").value = p.place;
  }
  function stepError(n) {
    const p = readForm();
    if (n === 1 && !p.name) return "어떻게 불러 드릴지 이름을 적어 주세요.";
    if (n === 2 && !p.gender) return "성별을 골라 주세요.";
    if (n === 3) {
      if (!p.date) return "년·월·일을 모두 골라 주세요.";
      if (!calcOf({ ...p, time: "모름" })) return "날짜를 다시 확인해 주세요. (음력·윤달은 실제로 있는 날짜만 됩니다)";
    }
    if (n === 4) {
      if (!p.time) return "태어난 시간을 넣거나 '몰라요'를 골라 주세요.";
      if (!calcOf(p)) return "날짜와 시간을 다시 확인해 주세요.";
    }
    return "";
  }
  function lastLabel() { return tab === "today" ? "오늘의 운세 보기" : "내 사주 보기"; }
  function go(n) {
    step = n;
    document.querySelectorAll(".wiz-step").forEach((el) => (el.hidden = Number(el.dataset.step) !== n));
    $("#w-no").textContent = n;
    $("#w-bar").style.width = (n / STEPS) * 100 + "%";
    $("#w-back").hidden = n === 1;
    $("#w-next").textContent = n === STEPS ? lastLabel() : "다음";
    $("#f-error").textContent = "";
    const box = document.querySelector(`.wiz-step[data-step="${n}"]`);
    const first = box.querySelector("input:not([type=radio]):not([type=checkbox]):not([disabled]), select");
    if (first && n > 1) first.focus({ preventScroll: true });
  }
  function next() {
    const err = stepError(step);
    if (err) { $("#f-error").textContent = err; return; }
    if (step < STEPS) return go(step + 1);
    const p = readForm();
    window.SITE.saveProfile(p);
    showProfile(p);
    render(true);
  }

  /* ── 저장된 정보 ── */
  function whoText(p) {
    const [y, m, d] = p.date.split("-").map(Number);
    return `<b>${esc(p.name)}</b>님 · ${y}년 ${m}월 ${d}일(${p.cal}) · ${p.time === "모름" ? "시간 모름" : p.time}${p.place ? ` · ${esc(p.place)}` : ""} · ${p.gender}`;
  }
  function showProfile(p) {
    $("#f-who").innerHTML = whoText(p);
    $("#f-profile").hidden = false;
    $("#f-form").hidden = true;
  }
  function editProfile() {
    fillForm(window.SITE.loadProfile());
    $("#f-profile").hidden = true;
    $("#f-result").classList.remove("on");
    $("#f-form").hidden = false;
    go(1);
  }

  /* ── 결과 ── */
  function pillarsHtml(r) {
    return ["시주", "일주", "월주", "년주"].map((name) => {
      const p = r.원국[name];
      const head = `<div class="head">${name === "일주" ? "일주 (나)" : name}</div>`;
      if (!p) return `<div class="pillar">${head}<div class="none">시간 모름</div></div>`;
      const cell = (ch, k) => `<div class="${ELEM_CLASS[S.elemOf(ch)]}"><div class="ch">${ch}</div><div class="ko">${k} · ${S.elemOf(ch)}</div></div>`;
      return `<div class="pillar${name === "일주" ? " me" : ""}">${head}<div class="ss">${p.천간십성}</div>${cell(p.간지[0], p.한글[0])}${cell(p.간지[1], p.한글[1])}<div class="ss">${p.지지십성}</div></div>`;
    }).join("");
  }

  function barsHtml(r) {
    const top = Math.max(1, ...Object.values(r.오행));
    return Object.entries(r.오행).map(([e, n]) =>
      `<div class="bar"><span>${e}(${S.ELEM_HANJA[e]})</span><span class="track"><span class="fill ${ELEM_CLASS[e]}" style="display:block;width:${n / top * 100}%"></span></span><span>${n}</span></div>`).join("");
  }

  function previewText(r) {
    const [thing, body, tip] = DAY_MASTER[r.일간];
    const season = SEASON[r.월지];
    const counts = Object.entries(r.오행);
    const max = Math.max(...counts.map(([, n]) => n));
    const many = counts.filter(([, n]) => n === max).map(([e]) => e);
    const none = counts.filter(([, n]) => n === 0).map(([e]) => e);
    let elem = `${many.join("·")} 기운이 가장 많아 ${MANY[many[0]]}.`;
    if (none.length) elem += ` ${none.join("·")} 기운은 없어서 ${NONE[none[0]]}.`;
    return `<h3>🌿 ${SEASON_PHRASE[season]}에 선 ${thing}</h3><p>${body}</p><p>${elem}</p><p>${tip}</p>`;
  }

  // 분석지 목차 + 흐리게 가린 맛보기. 가린 글도 이 사주로 계산한 값으로 만든다 (아무 글이나 흐리게 하지 않음)
  function teaserHtml(r, p) {
    const prod = window.SHOP.products[0], y = r.용신, month = r.원국["월주"];
    const toc = SECTIONS.map(([ic, t], i) => i === 0
      ? `<li class="free"><span>${ic} ${t}</span><span class="st">위에서 맛보기</span></li>`
      : `<li><span>${ic} ${t}</span><span class="st">🔒 분석지</span></li>`).join("");
    const blur = `<h4>💫 타고난 기질과 빛나는 강점</h4>
      <p>${esc(p.name)}님의 일간 ${r.일간}(${r.일간오행})은 ${r.신강약} 사주로, ${y.용신} 기운을 만날 때 가장 편안하게 힘을 냅니다. ${y.희신} 기운이 그 힘을 거들어 주고, ${y.기신} 기운이 몰려오는 때에는 한 걸음 쉬어 가는 지혜가 필요합니다.</p>
      <h4>💼 직업 및 사회운</h4>
      <p>사회의 자리를 뜻하는 월주에 ${month.천간십성}과 ${month.지지십성}이 놓여 있어, 일을 대하는 방식과 잘 맞는 환경이 분명하게 드러납니다.</p>`;
    const sample = window.SHOP.sampleReport
      ? `<a class="hint" href="${esc(window.SHOP.sampleReport)}" target="_blank" rel="noopener">샘플 분석지 먼저 보기 (PDF)</a>` : "";
    return `<h3>📜 분석지에서 이어지는 이야기</h3>
      <p class="hint" style="margin:0 0 6px">${esc(prod.title)} · ${esc(prod.delivery)} · 원국표·오행 그래프·10년 대운 흐름 포함</p>
      <ul class="toc">${toc}</ul>
      <div class="peek">
        <div class="blur" aria-hidden="true">${blur}</div>
        <div class="veil">
          <p>나머지 ${SECTIONS.length - 1}가지 이야기는 분석지로 받아 보세요</p>
          <a class="btn" href="order.html?p=${encodeURIComponent(prod.id)}">${esc(prod.title)} 받아 보기 · ${won(prod.price)}</a>
          ${sample}
        </div>
      </div>`;
  }

  function todayHtml(r) {
    const now = new Date();
    const d = S.dayLuck(r, now);
    const [kw, good, care] = TODAY[d.천간];
    const color = COLORS[r.용신.용신];  // 유료 분석지와 같은 용신 기준
    return `<div class="luck card">
      <div class="hint">${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 · 오늘의 일진 <b>${d.간지}(${d.한글})</b></div>
      <div class="big">오늘의 키워드: ${kw}</div>
      <p style="margin:0">${good}</p>
      <p style="margin:0">💡 ${care}</p>
      <div class="chips"><span class="chip">오늘 나에게 오는 기운: ${d.천간}·${d.지지}</span><span class="chip">행운의 색: ${color}</span></div>
    </div>`;
  }

  function ctaHtml() {
    const p = window.SHOP.products[0];
    return `<div class="cta"><p class="hint">용신(나에게 꼭 필요한 기운), 10년마다 바뀌는 대운, 직업·재물·연애운은 분석지에서 자세히 풀어 드립니다.</p>
      <a class="btn" href="order.html?p=${encodeURIComponent(p.id)}">${p.title} 받아 보기 · ${won(p.price)}</a></div>`;
  }

  function render(scroll) {
    const p = window.SITE.loadProfile();
    const r = p && calcOf(p);
    if (!r) return editProfile();
    const out = $("#f-result");
    out.innerHTML = tab === "today"
      ? todayHtml(r) + `<p class="hint" style="margin-top:12px">${esc(p.name)}님의 일간 <b>${r.일간}(${r.일간오행})</b>과 오늘 일진의 관계로 본 하루 운세입니다. 매일 바뀌어요.</p>` + ctaHtml()
      : `<div class="pillars">${pillarsHtml(r)}</div><div class="bars">${barsHtml(r)}</div>`
        + `<p class="hint" style="margin-top:8px">${r.입력.달력} ${r.입력.날짜}${r.입력.달력 === "양력" ? ` (음력 ${r.음력})` : ` (양력 ${r.양력})`} · ${r.보정.join(", ")}</p>`
        + previewText(r) + teaserHtml(r, p);
    out.classList.add("on");
    if (scroll) $("#free").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setTab(t) {
    tab = t;
    document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x.dataset.tab === t));
    if (!$("#f-form").hidden) { if (step === STEPS) $("#w-next").textContent = lastLabel(); return; }
    render(false);
  }

  function menuHtml() {
    const free = [["chart", "🀄", "내 사주표"], ["today", "☀️", "오늘의 운세"]].map(([t, ic, name]) =>
      `<a href="#free" data-open="${t}"><span class="ic">${ic}</span>${name}<span class="tag free">무료</span></a>`);
    const paid = window.SHOP.products.map((p) =>
      `<a href="order.html?p=${encodeURIComponent(p.id)}"><span class="ic">${p.emoji}</span>${esc(p.short || p.title)}<span class="tag">${won(p.price)}</span></a>`);
    return free.concat(paid).join("");
  }

  function init() {
    $("#menu").innerHTML = menuHtml();
    window.SITE.fillPlaces($("#f-place"));
    document.querySelectorAll("[data-open]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault(); setTab(a.dataset.open); $("#free").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    const first = window.SHOP.products[0];
    $("#bottom-cta").href = `order.html?p=${encodeURIComponent(first.id)}`;
    $("#bottom-cta").textContent = `${first.emoji} ${first.title} 받아 보기 · ${won(first.price)}`;

    document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
    $("#f-unknown").addEventListener("change", (e) => { $("#f-time").disabled = e.target.checked; });
    document.querySelectorAll("input[name=f-gender]").forEach((g) => g.addEventListener("change", () => setTimeout(next, 150)));
    $("#w-back").addEventListener("click", () => go(step - 1));
    $("#f-form").addEventListener("submit", (e) => { e.preventDefault(); next(); });
    $("#f-edit").addEventListener("click", editProfile);
    $("#f-clear").addEventListener("click", () => {
      window.SITE.clearProfile();
      $("#f-form").reset(); $("#f-time").disabled = false;
      editProfile();
    });

    const saved = window.SITE.loadProfile();
    if (saved && calcOf(saved)) { showProfile(saved); render(false); return; }
    // 예전 버전(생년월일만 저장)에서 넘어온 경우 넣어 둔 값만 채워 둔다
    try { fillForm(JSON.parse(localStorage.getItem("saju-free") || "null")); } catch (e) {}
    go(1);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
