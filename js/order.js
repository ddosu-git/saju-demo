/* 주문서: 입력 확인 → 구글 시트(Apps Script)로 전송 → 입금 안내 화면 */
(function () {
  const shop = window.SHOP;
  const $ = (s) => document.querySelector(s);
  const TOPICS = ["연애", "직업", "재물"];  // 고민 글(선택)을 받는 상품
  let familyCount = 0;

  const product = () => shop.products.find((p) => p.id === (document.querySelector("input[name=o-product]:checked") || {}).value);
  const radio = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value || "";
  // 함께 볼 사람: 가족궁합은 1~4명(필수), 연애는 상대 0~1명(선택)
  const maxPeople = () => ((product() || {}).id === "연애" ? 1 : 4);

  function orderId() {
    const d = new Date(), pad = (n) => String(n).padStart(2, "0");
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
    return `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
  }

  function renderProducts(selected) {
    $("#o-products").innerHTML = shop.products.map((p) => `
      <label class="card check" style="cursor:pointer">
        <input type="radio" name="o-product" value="${SITE.esc(p.id)}" ${p.id === selected ? "checked" : ""}>
        <span><b>${p.emoji} ${SITE.esc(p.title)}</b> · ${SITE.won(p.price)}<br><span class="hint">${SITE.esc(p.desc)}</span></span>
      </label>`).join("");
  }

  function addPerson() {
    if ($("#o-family").children.length >= maxPeople()) return;
    const i = ++familyCount;
    const box = document.createElement("div");
    box.className = "card person"; box.dataset.i = i;
    box.innerHTML = `
      <button type="button" class="btn ghost small remove" aria-label="이 사람 빼기">빼기</button>
      <div class="row two" style="margin-bottom:10px">
        <div><label for="p${i}-rel">관계</label><input type="text" id="p${i}-rel" maxlength="10" placeholder="${(product() || {}).id === "연애" ? "예) 전 연인, 썸 상대" : "예) 엄마, 남편, 아들"}"></div>
        <div><label>성별</label><div class="seg">
          <label><input type="radio" name="p${i}-gender" value="여"><span>여</span></label>
          <label><input type="radio" name="p${i}-gender" value="남"><span>남</span></label></div></div>
      </div>
      <div style="margin-bottom:10px"><div class="seg">
        <label><input type="radio" name="p${i}-cal" value="양력" checked><span>양력</span></label>
        <label><input type="radio" name="p${i}-cal" value="음력"><span>음력</span></label>
        <label><input type="radio" name="p${i}-cal" value="윤달"><span>윤달</span></label></div></div>
      <div class="row two">
        <div><div class="row three date3" data-date="p${i}"><select id="p${i}-y" aria-label="년"></select><select id="p${i}-m" aria-label="월"></select><select id="p${i}-d" aria-label="일"></select></div></div>
        <div><input type="time" id="p${i}-time" aria-label="태어난 시간"></div>
      </div>
      <label class="check" style="margin-top:6px"><input type="checkbox" id="p${i}-unknown"> 시간을 몰라요</label>`;
    $("#o-family").appendChild(box);
    SITE.fillDate(box.querySelector("[data-date]"));
    box.querySelector(`#p${i}-unknown`).addEventListener("change", (e) => { box.querySelector(`#p${i}-time`).disabled = e.target.checked; });
    box.querySelector(".remove").addEventListener("click", () => { box.remove(); refreshAdd(); });
    refreshAdd();
  }
  function refreshAdd() {
    const n = $("#o-family").children.length, p = product();
    $("#o-add").disabled = n >= maxPeople();
    // 다른 사람의 생년월일을 쓸 때만 그 사람에게 알렸는지 확인한다
    const ask = !!p && (p.id === "가족궁합" || (p.id === "연애" && n > 0));
    $("#o-agree-family").hidden = !ask; $("#o-agree-family-text").hidden = !ask;
  }

  function onProductChange() {
    const p = product();
    $("#o-sel").textContent = p ? `${p.emoji} ${p.title}` : "상품을 골라 주세요";
    $("#o-price").textContent = p ? SITE.won(p.price) : "";
    $("#o-dream-box").hidden = !p || p.id !== "해몽";
    $("#o-concern-box").hidden = !p || !TOPICS.includes(p.id);
    const fam = !!p && (p.id === "가족궁합" || p.id === "연애");
    $("#o-family-box").hidden = !fam;
    if (fam) {
      const love = p.id === "연애";
      $("#o-family-legend").innerHTML = love ? '함께 볼 상대 <span class="hint">(선택 · 1명 · 생년월일을 넣으면 두 사람의 기운도 봅니다)</span>'
                                             : '함께 볼 사람 <span class="hint">(최대 4명)</span>';
      $("#o-add").textContent = love ? "+ 상대 추가" : "+ 사람 추가";
      [...$("#o-family").children].slice(maxPeople()).forEach((box) => box.remove());
      if (!love && !$("#o-family").children.length) addPerson();
    }
    refreshAdd();
  }

  function birthOk(date, time, cal, place) {
    try { SajuLite.calc(date, time, cal, place); return true; } catch (e) { return false; }
  }

  function collect() {
    const p = product();
    if (!p) throw "상품을 골라 주세요.";
    const name = $("#o-name").value.trim();
    if (!name) throw "이름을 적어 주세요.";
    const gender = radio("o-gender"); if (!gender) throw "성별을 골라 주세요.";
    const cal = radio("o-cal");
    const date = SITE.readDate("o"); if (!date) throw "생년월일을 골라 주세요.";
    const time = $("#o-unknown").checked ? "모름" : $("#o-time").value;
    if (!time) throw "태어난 시간을 적거나 '시간을 몰라요'를 골라 주세요.";
    const place = $("#o-place").value;
    if (!birthOk(date, time, cal, place)) throw "생년월일을 다시 확인해 주세요. (음력·윤달은 실제로 있는 날짜만 됩니다)";
    const order = { id: orderId(), createdAt: new Date().toISOString(), product: p.id, price: p.price, name, gender, cal, date, time };
    if (place) order.place = place;
    if (TOPICS.includes(p.id) && $("#o-concern").value.trim()) order.concern = $("#o-concern").value.trim().slice(0, 500);

    if (p.id === "해몽") {
      const dream = $("#o-dream").value.trim();
      if (dream.length < 20) throw "꿈 내용을 20자 이상 적어 주세요.";
      order.dream = dream;
      order.dreamDate = $("#o-dream-date").value || "";
    }
    const people = [...$("#o-family").children];
    if (p.id === "가족궁합" || (p.id === "연애" && people.length)) {
      if (!people.length) throw "함께 볼 사람을 한 명 이상 넣어 주세요.";
      order.family = people.map((box, n) => {
        const i = box.dataset.i, label = `${n + 1}번째 분`;
        const rel = box.querySelector(`#p${i}-rel`).value.trim().replace(/,/g, " ");
        if (!rel) throw `${label}의 관계를 적어 주세요.`;
        const g = radio(`p${i}-gender`); if (!g) throw `${rel}의 성별을 골라 주세요.`;
        const c = radio(`p${i}-cal`), d = SITE.readDate(`p${i}`);
        if (!d) throw `${rel}의 생년월일을 골라 주세요.`;
        const t = box.querySelector(`#p${i}-unknown`).checked ? "모름" : box.querySelector(`#p${i}-time`).value;
        if (!t) throw `${rel}의 태어난 시간을 적거나 '시간을 몰라요'를 골라 주세요.`;
        if (!birthOk(d, t, c)) throw `${rel}의 생년월일을 다시 확인해 주세요.`;
        return { rel, gender: g, cal: c, date: d, time: t };
      });
      if (!$("#o-agree-family").checked) throw `함께 볼 ${p.id === "연애" ? "상대" : "분들"}에게 알리고 동의를 받았는지 확인해 주세요.`;
    }

    const email = $("#o-email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw "분석지를 받을 이메일을 정확히 적어 주세요.";
    order.email = email;
    order.phone = $("#o-phone").value.trim();
    order.depositor = $("#o-depositor").value.trim() || name;
    if (!$("#o-agree-privacy").checked) throw "개인정보 수집·이용에 동의해 주세요.";
    if (!$("#o-agree-refund").checked) throw "환불 규정을 확인해 주세요.";
    return order;
  }

  async function send(order) {
    if (!shop.orderEndpoint) { console.log("[테스트 모드] 주문 내용", order); return; }
    // Apps Script 는 CORS 응답을 주지 않으므로 no-cors 로 보낸다(응답은 읽지 못함). 네트워크 오류만 실패로 본다
    await fetch(shop.orderEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "order", order }) });
  }

  function showDone(order) {
    const p = shop.products.find((x) => x.id === order.product);
    const due = new Date(new Date(order.createdAt).getTime() + shop.depositHours * 3600e3);
    const b = shop.bank;
    $("#order-view").hidden = true;
    const v = $("#done-view");
    v.hidden = false;
    v.innerHTML = `
      <h2>주문이 접수되었습니다 🙏</h2>
      <p class="sub">아래 계좌로 입금해 주시면, 확인 후 24시간 안에 <b>${SITE.esc(order.email)}</b>로 분석지를 보내 드립니다.</p>
      <div class="card" style="display:grid;gap:6px">
        <div>주문번호 <b>${order.id}</b></div>
        <div>상품 <b>${p.emoji} ${SITE.esc(p.title)}</b></div>
        <div>입금하실 금액 <b style="color:var(--accent);font-size:20px">${SITE.won(order.price)}</b></div>
        <div>입금 계좌 <b>${SITE.esc(b.name)} ${SITE.esc(b.account)}</b> (예금주 ${SITE.esc(b.holder)})
          <button type="button" class="btn ghost small" id="copy-acc" style="margin-left:6px">계좌 복사</button></div>
        <div>입금자명 <b>${SITE.esc(order.depositor)}</b></div>
        <div class="hint">${due.getMonth() + 1}월 ${due.getDate()}일 ${due.getHours()}시까지 입금이 없으면 주문이 취소됩니다.</div>
      </div>
      <div class="notice" style="margin-top:14px">이 화면을 캡처해 두시면 편합니다. 주문 내용을 바꾸고 싶으시면 주문번호와 함께 문의해 주세요.</div>
      <p style="margin-top:18px"><a class="btn ghost" href="index.html">처음으로</a></p>`;
    $("#copy-acc").addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(`${b.name} ${b.account}`); e.target.textContent = "복사됨"; } catch (err) { e.target.textContent = "직접 복사해 주세요"; }
    });
    window.scrollTo({ top: 0 });
  }

  function init() {
    $("#testbanner").hidden = !!shop.orderEndpoint;
    const want = new URLSearchParams(location.search).get("p");
    renderProducts(shop.products.some((p) => p.id === want) ? want : "");
    document.querySelectorAll("input[name=o-product]").forEach((r) => r.addEventListener("change", onProductChange));
    $("#o-unknown").addEventListener("change", (e) => { $("#o-time").disabled = e.target.checked; });
    $("#o-add").addEventListener("click", addPerson);
    const now = new Date();  // toISOString 은 UTC 라 한국 아침엔 어제 날짜가 된다
    $("#o-dream-date").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    SITE.fillPlaces($("#o-place"));
    // 무료 메뉴에서 넣은 이름·성별·생년월일·출생지 이어받기 (이 기기에 저장된 것)
    const b = SITE.loadProfile();
    if (b) {
      if (b.place) $("#o-place").value = b.place;
      if (b.name) $("#o-name").value = b.name;
      const g = document.querySelector(`input[name=o-gender][value="${b.gender}"]`); if (g) g.checked = true;
      SITE.setDate("o", b.date);
      const c = document.querySelector(`input[name=o-cal][value="${b.cal}"]`); if (c) c.checked = true;
      if (b.time === "모름") { $("#o-unknown").checked = true; $("#o-time").disabled = true; } else if (b.time) $("#o-time").value = b.time;
    }
    onProductChange();

    let busy = false;
    $("#o-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      $("#o-error").textContent = "";
      if ($("#o-website").value) return;  // 스팸 로봇 걸러내기
      let order;
      try { order = collect(); } catch (msg) { $("#o-error").textContent = String(msg); return; }
      busy = true; $("#o-submit").disabled = true; $("#o-submit").textContent = "접수 중…";
      // 예전 화면(예전 가격·상품)으로 주문이 나가지 않게, 보내기 직전에 최신인지 한 번 더 확인한다
      if (!(await SITE.isLatest())) {
        $("#o-error").textContent = "사이트가 새로 바뀌었습니다. 최신 화면으로 다시 불러옵니다. 입력하신 내용을 확인한 뒤 다시 눌러 주세요.";
        setTimeout(() => location.reload(), 1500);
        return;
      }
      try { await send(order); showDone(order); }
      catch (err) { $("#o-error").textContent = "주문을 보내지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요."; }
      finally { busy = false; $("#o-submit").disabled = false; $("#o-submit").textContent = "주문하고 입금 안내 받기"; }
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
