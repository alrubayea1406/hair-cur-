// الصفحة الرئيسية: حالة المحل، لوحة الأسعار، معرض الشغل، وأوقات الدوام.
(function () {
  const A = window.Amir;
  const shop = A.shop;

  function renderStatus() {
    const el = document.getElementById("status");
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const today = shop.hours[now.getDay()];

    if (today && mins >= A.toMinutes(today.open) && mins < A.toMinutes(today.close)) {
      el.dataset.open = "true";
      el.textContent = "مفتوح هسه، نسد الساعة " + A.formatTime(today.close, true);
      return;
    }
    el.dataset.open = "false";
    if (today && mins < A.toMinutes(today.open)) {
      el.textContent = "مسدود هسه، نفتح اليوم الساعة " + A.formatTime(today.open, true);
      return;
    }
    for (let i = 1; i <= 7; i++) {
      const day = (now.getDay() + i) % 7;
      const h = shop.hours[day];
      if (!h) continue;
      const when = i === 1 ? "باچر" : "يوم " + A.dayName(day);
      el.textContent = "مسدود هسه، نفتح " + when + " الساعة " + A.formatTime(h.open, true);
      return;
    }
    el.textContent = "المحل مسدود هالفترة";
  }

  function renderPrices() {
    const list = document.getElementById("price-list");
    list.innerHTML = "";
    shop.services.forEach((s) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "price";
      a.href = "booking.html?service=" + encodeURIComponent(s.id);
      a.setAttribute("aria-label", s.name + "، " + A.formatPrice(s.price) + ". احجز هذي الخدمة");
      a.innerHTML =
        '<span class="price__name"></span><span class="price__dots" aria-hidden="true"></span>' +
        '<span class="price__amount"></span><span class="price__note"></span>' +
        '<span class="price__book" aria-hidden="true">احجز</span>';
      a.querySelector(".price__name").textContent = s.name;
      a.querySelector(".price__amount").textContent = A.formatPrice(s.price);
      a.querySelector(".price__note").textContent = s.note;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  // ---------- المعرض ----------
  let visible = [];
  let current = 0;

  function renderGallery() {
    const gallery = document.getElementById("gallery");
    const filters = document.getElementById("filters");
    if (!shop.gallery.length) {
      gallery.innerHTML = '<li class="gallery__empty">الصور راح تنزل قريب.</li>';
      return;
    }

    shop.gallery.forEach((item, i) => {
      const li = document.createElement("li");
      li.dataset.style = item.style;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shot";
      btn.dataset.index = i;
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.caption;
      img.loading = "lazy";
      img.width = 400;
      img.height = 500;
      const cap = document.createElement("span");
      cap.className = "shot__caption";
      cap.textContent = item.caption;
      btn.append(img, cap);
      btn.addEventListener("click", () => openLightbox(i));
      li.appendChild(btn);
      gallery.appendChild(li);
    });

    const styles = shop.services.filter((s) => shop.gallery.some((g) => g.style === s.id));
    const chips = [{ id: "all", name: "الكل" }].concat(styles);
    chips.forEach((c) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = c.name;
      chip.setAttribute("aria-pressed", c.id === "all" ? "true" : "false");
      chip.addEventListener("click", () => {
        filters.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        gallery.querySelectorAll("li").forEach((li) => {
          li.hidden = c.id !== "all" && li.dataset.style !== c.id;
        });
      });
      filters.appendChild(chip);
    });
  }

  const dialog = document.getElementById("lightbox");
  const dialogImg = document.getElementById("lightbox-img");
  const dialogCap = document.getElementById("lightbox-caption");

  function showShot() {
    const item = shop.gallery[visible[current]];
    dialogImg.src = item.src;
    dialogImg.alt = item.caption;
    dialogCap.textContent = item.caption;
  }

  function openLightbox(index) {
    visible = Array.from(document.querySelectorAll("#gallery li:not([hidden]) .shot")).map((b) => Number(b.dataset.index));
    current = Math.max(0, visible.indexOf(index));
    showShot();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function step(dir) {
    current = (current + dir + visible.length) % visible.length;
    showShot();
  }

  document.getElementById("lightbox-prev").addEventListener("click", () => step(-1));
  document.getElementById("lightbox-next").addEventListener("click", () => step(1));
  document.getElementById("lightbox-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (e) => {
    // الصفحة من اليمين لليسار: السهم اليسار يروح للصورة الجاية
    if (e.key === "ArrowLeft") step(1);
    if (e.key === "ArrowRight") step(-1);
  });

  function renderHours() {
    const body = document.getElementById("hours");
    const today = new Date().getDay();
    A.WEEK_ORDER.forEach((day) => {
      const h = shop.hours[day];
      const tr = document.createElement("tr");
      if (day === today) tr.dataset.today = "true";
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = A.dayName(day);
      const td = document.createElement("td");
      td.textContent = h ? A.formatTime(h.open, true) + " إلى " + A.formatTime(h.close, true) : "عطلة";
      tr.append(th, td);
      body.appendChild(tr);
    });
  }

  renderStatus();
  setInterval(renderStatus, 60 * 1000);
  renderPrices();
  renderGallery();
  renderHours();
})();
