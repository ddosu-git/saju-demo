/* 모든 페이지 공통: 상호명·상품 목록·하단 사업자 정보를 config.js 값으로 채운다 */
(function () {
  const shop = window.SHOP;
  const won = (n) => n.toLocaleString("ko-KR") + "원";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // 생년월일은 년·월·일 선택칸으로 받는다 (음력 2월 30일처럼 달력 입력칸이 못 받는 날짜가 있어서)
  function fillDate(box) {
    const p = box.dataset.date, thisYear = new Date().getFullYear();
    const opts = (from, to, unit, rev) => {
      const xs = []; for (let i = from; i <= to; i++) xs.push(i); if (rev) xs.reverse();
      return `<option value="">${unit}</option>` + xs.map((i) => `<option value="${i}">${i}${unit}</option>`).join("");
    };
    box.querySelector(`#${p}-y`).innerHTML = opts(1920, thisYear, "년", true);
    box.querySelector(`#${p}-m`).innerHTML = opts(1, 12, "월");
    box.querySelector(`#${p}-d`).innerHTML = opts(1, 31, "일");
  }
  function readDate(p) {
    const [y, m, d] = ["y", "m", "d"].map((k) => document.getElementById(`${p}-${k}`).value);
    return y && m && d ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
  }
  function setDate(p, ymd) {
    const [y, m, d] = (ymd || "").split("-").map(Number);
    if (!y) return;
    document.getElementById(`${p}-y`).value = y; document.getElementById(`${p}-m`).value = m; document.getElementById(`${p}-d`).value = d;
  }
  // 한 번 넣은 이름·성별·생년월일은 이 기기 브라우저에만 저장해 무료 메뉴와 주문서가 같이 쓴다
  const PROFILE_KEY = "saju-profile";
  function loadProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch (e) { return null; } }
  function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {} }
  function clearProfile() { try { localStorage.removeItem(PROFILE_KEY); localStorage.removeItem("saju-free"); } catch (e) {} }
  // 출생지 선택칸 (saju-lite.js 의 PLACES). 고르지 않으면 기본 -30분 보정
  function fillPlaces(select) {
    const names = Object.keys((window.SajuLite && window.SajuLite.PLACES) || {});
    select.innerHTML = `<option value="">모름·기타 (기본 보정)</option>` + names.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join("");
  }
  // 이 화면이 서버의 최신 빌드인지 (site_build.py 가 html 의 meta build 와 version.json 을 맞춰 둔다).
  // 확인할 수 없으면(연결 문제) 막지 않고 true — 가격은 주문 서버(Code.gs)가 따로 확인한다
  async function isLatest() {
    const meta = document.querySelector('meta[name="build"]');
    try {
      const v = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" }).then((r) => r.json());
      return !meta || !v.build || v.build === meta.content;
    } catch (e) { return true; }
  }
  window.SITE = { won, esc, fillDate, readDate, setDate, fillPlaces, loadProfile, saveProfile, clearProfile, isLatest };

  document.addEventListener("DOMContentLoaded", () => {
    const side = document.getElementById("side");
    if (side) {
      side.innerHTML = `<a class="logo" href="index.html">${esc(shop.brand)}</a>
        <h1>${esc(shop.tagline)}</h1>
        <ul>
          <li>🀄 생년월일만 넣으면 바로 보는 <b>무료 사주표</b></li>
          <li>📐 출생 시간 보정까지 반영한 <b>만세력 계산</b></li>
          <li>📜 입금 확인 후 24시간 안에 <b>PDF 분석지</b></li>
        </ul>
        <p class="hint">휴대폰에서도 같은 주소로 편하게 보실 수 있어요.</p>`;
    }
    document.querySelectorAll("[data-date]").forEach(fillDate);
    document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = shop.brand));
    document.querySelectorAll("[data-tagline]").forEach((el) => (el.textContent = shop.tagline));
    if (document.title.includes("{brand}")) document.title = document.title.replace("{brand}", shop.brand);

    const list = document.getElementById("products");
    if (list) {
      list.innerHTML = shop.products.map((p) => `
        <article class="card product">
          <h3>${p.emoji} ${esc(p.title)}</h3>
          <div class="price">${won(p.price)}</div>
          <p>${esc(p.desc)}</p>
          <div class="meta">${esc(p.delivery)} · 입금 확인 후 24시간 안에 이메일로 보내 드립니다</div>
          <a class="btn small" href="order.html?p=${encodeURIComponent(p.id)}">주문하기</a>
        </article>`).join("");
    }

    const foot = document.getElementById("footer");
    if (foot) {
      const b = shop.business;
      const biz = b.regNo
        ? `${esc(b.name)} · 대표 ${esc(b.owner)} · 사업자등록번호 ${esc(b.regNo)}${b.mailOrderNo ? ` · 통신판매업 ${esc(b.mailOrderNo)}` : ""}<br>${esc(b.address)}`
        : "사업자 정보 준비 중";
      const contact = [shop.contactEmail && `문의 <a href="mailto:${esc(shop.contactEmail)}">${esc(shop.contactEmail)}</a>`,
                       shop.kakaoChannel && `<a href="${esc(shop.kakaoChannel)}" target="_blank" rel="noopener">카카오톡 채널</a>`].filter(Boolean).join(" · ");
      foot.innerHTML = `<div class="wrap">
        <p><b>${esc(shop.brand)}</b>${contact ? " · " + contact : ""}</p>
        <p>${biz}</p>
        <p><a href="policy.html">이용약관 · 환불 규정 · 개인정보 처리방침</a></p>
        <p>사주 풀이는 명리학 해석에 기반한 참고 자료이며, 건강·법률·투자 등 중요한 결정은 해당 분야 전문가와 상담하시기 바랍니다.</p>
      </div>`;
    }
  });
})();
