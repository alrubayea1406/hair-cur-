// صفحة الحجز: اختيار الخدمة واليوم والساعة، وإرسال الحجز للحلاق بالواتساب.
(function () {
  const A = window.Amir;
  const shop = A.shop;
  const STORAGE_KEY = "amir.bookings";
  const LEAD_MINUTES = 15; // أقرب دور اليوم لازم يكون بعد ربع ساعة على الأقل

  const form = document.getElementById("booking-form");
  const servicesEl = document.getElementById("services");
  const daysEl = document.getElementById("days");
  const timesEl = document.getElementById("times");
  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("phone");
  const noteInput = document.getElementById("note");
  const errorsEl = document.getElementById("form-errors");

  const params = new URLSearchParams(location.search);
  const state = {
    service: A.service(params.get("service") || "") ? params.get("service") : null,
    date: null,
    time: null
  };
  let triedSubmit = false;

  function duration() {
    const s = A.service(state.service);
    return s ? s.minutes : shop.slotMinutes;
  }

  function slotsFor(key) {
    const d = A.parseDateKey(key);
    const h = shop.hours[d.getDay()];
    if (!h) return [];
    const now = new Date();
    const isToday = key === A.dateKey(now);
    const earliest = now.getHours() * 60 + now.getMinutes() + LEAD_MINUTES;
    const last = A.toMinutes(h.close) - duration();
    const slots = [];
    for (let t = A.toMinutes(h.open); t <= last; t += shop.slotMinutes) {
      if (isToday && t < earliest) continue;
      slots.push(A.fromMinutes(t));
    }
    return slots;
  }

  function option(name, value, id, checked, disabled, labelBuilder) {
    const wrap = document.createElement("div");
    wrap.className = "option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = value;
    input.id = id;
    input.checked = checked;
    input.disabled = disabled;
    const label = document.createElement("label");
    label.htmlFor = id;
    labelBuilder(label);
    wrap.append(input, label);
    return wrap;
  }

  function span(cls, text) {
    const el = document.createElement("span");
    el.className = cls;
    el.textContent = text;
    return el;
  }

  function renderServices() {
    servicesEl.innerHTML = "";
    shop.services.forEach((s) => {
      servicesEl.appendChild(
        option("service", s.id, "svc-" + s.id, s.id === state.service, false, (label) => {
          const top = span("svc__top", "");
          top.append(span("", s.name), span("", A.formatPrice(s.price)));
          label.append(top, span("svc__meta", s.note + " (" + A.formatMinutes(s.minutes) + ")"));
        })
      );
    });
  }

  function renderDays() {
    daysEl.innerHTML = "";
    const today = new Date();
    let firstOpen = null;
    for (let i = 0; i < shop.bookingDays; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const key = A.dateKey(d);
      const closed = slotsFor(key).length === 0;
      if (!closed && !firstOpen) firstOpen = key;
      if (state.date === key && closed) state.date = null;
      const dayLabel = i === 0 ? "اليوم" : i === 1 ? "باچر" : A.dayName(d.getDay());
      daysEl.appendChild(
        option("day", key, "day-" + key, state.date === key, closed, (label) => {
          label.setAttribute("aria-label", A.formatDate(d) + (closed ? "، ماكو دوام" : ""));
          label.append(
            span("day__name", dayLabel),
            span("day__num", A.num.format(d.getDate())),
            span("day__month", new Intl.DateTimeFormat("ar-IQ", { month: "long" }).format(d))
          );
        })
      );
      daysEl.lastChild.classList.add("day");
    }
    if (!state.date) state.date = firstOpen;
    const checked = daysEl.querySelector('input[value="' + state.date + '"]');
    if (checked) checked.checked = true;
  }

  function renderTimes() {
    timesEl.innerHTML = "";
    const slots = state.date ? slotsFor(state.date) : [];
    if (!slots.includes(state.time)) state.time = null;
    if (!slots.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = state.date ? "ماكو أوقات باقية بهذا اليوم. اختار يوم ثاني." : "اختار اليوم أول حتى تطلع الأوقات.";
      timesEl.appendChild(p);
      return;
    }
    slots.forEach((t) => {
      timesEl.appendChild(
        option("time", t, "time-" + t.replace(":", ""), state.time === t, false, (label) => {
          label.textContent = A.formatTime(t);
        })
      );
      timesEl.lastChild.classList.add("time");
    });
  }

  function setTicket(id, value) {
    const el = document.getElementById(id);
    el.textContent = value || "ما اخترت بعد";
    el.dataset.empty = value ? "false" : "true";
  }

  function updateTicket() {
    const s = A.service(state.service);
    setTicket("t-service", s && s.name);
    setTicket("t-day", state.date && A.formatDate(A.parseDateKey(state.date)));
    setTicket("t-time", state.time && A.formatTime(state.time));
    setTicket("t-duration", s && A.formatMinutes(s.minutes));
    setTicket("t-price", s && A.formatPrice(s.price));

    document.getElementById("step-service").dataset.done = String(!!s);
    document.getElementById("step-day").dataset.done = String(!!state.date);
    document.getElementById("step-time").dataset.done = String(!!state.time);
    document.getElementById("step-info").dataset.done = String(!!nameInput.value.trim() && !!normalizePhone(phoneInput.value));
  }

  // يرجّع الرقم بصيغة 07XXXXXXXXX أو null إذا مو رقم عراقي صحيح
  function normalizePhone(value) {
    let v = A.latinDigits(value).replace(/[\s\-()]/g, "");
    if (v.startsWith("+964")) v = "0" + v.slice(4);
    else if (v.startsWith("00964")) v = "0" + v.slice(5);
    else if (v.startsWith("964")) v = "0" + v.slice(3);
    return /^07\d{9}$/.test(v) ? v : null;
  }

  function setFieldError(input, message) {
    const err = document.getElementById(input.id + "-error");
    err.textContent = message || "";
    err.hidden = !message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate() {
    const problems = [];
    if (!state.service) problems.push({ text: "اختار الخدمة.", focus: servicesEl });
    if (!state.date) problems.push({ text: "اختار اليوم.", focus: daysEl });
    if (!state.time) problems.push({ text: "اختار الساعة.", focus: timesEl });

    const nameMsg = nameInput.value.trim() ? "" : "اكتب اسمك حتى يعرفك الحلاق.";
    setFieldError(nameInput, nameMsg);
    if (nameMsg) problems.push({ text: nameMsg, focus: nameInput });

    const phoneMsg = normalizePhone(phoneInput.value) ? "" : "اكتب رقم موبايل عراقي من ١١ رقم يبدي بـ 07.";
    setFieldError(phoneInput, phoneMsg);
    if (phoneMsg) problems.push({ text: phoneMsg, focus: phoneInput });

    errorsEl.hidden = problems.length === 0;
    errorsEl.innerHTML = "";
    if (problems.length) {
      errorsEl.appendChild(document.createTextNode("باقي كم شغلة قبل الإرسال:"));
      const ul = document.createElement("ul");
      problems.forEach((p) => {
        const li = document.createElement("li");
        li.textContent = p.text;
        ul.appendChild(li);
      });
      errorsEl.appendChild(ul);
    }
    return problems;
  }

  function buildMessage(b) {
    const s = A.service(b.service);
    const lines = [
      "السلام عليكم، أريد أحجز دور بحلاقة الأمير.",
      "الخدمة: " + s.name + " (" + A.formatPrice(s.price) + ")",
      "اليوم: " + A.formatDate(A.parseDateKey(b.date)),
      "الساعة: " + A.formatTime(b.time),
      "الاسم: " + b.name,
      "الموبايل: " + b.phone
    ];
    if (b.note) lines.push("ملاحظة: " + b.note);
    return lines.join("\n");
  }

  // ---------- حجوزاتي (محفوظة بهذا الجهاز بس) ----------
  function loadBookings() {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const now = new Date();
      return list.filter((b) => {
        const d = A.parseDateKey(b.date);
        d.setMinutes(A.toMinutes(b.time));
        return d > now && A.service(b.service);
      });
    } catch (e) {
      return [];
    }
  }

  function saveBookings(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // التخزين مسدود بالمتصفح؛ الحجز ينرسل بالواتساب عادي
    }
  }

  function renderMine() {
    const list = loadBookings();
    const section = document.getElementById("mine");
    const ul = document.getElementById("mine-list");
    ul.innerHTML = "";
    section.hidden = list.length === 0;
    list
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .forEach((b) => {
        const s = A.service(b.service);
        const li = document.createElement("li");
        li.className = "mine__item";
        const info = document.createElement("div");
        info.append(
          span("mine__what", s.name),
          span("mine__when", A.formatDate(A.parseDateKey(b.date)) + "، الساعة " + A.formatTime(b.time))
        );
        const cancel = document.createElement("a");
        cancel.className = "btn btn--ghost btn--small";
        cancel.target = "_blank";
        cancel.rel = "noopener";
        cancel.textContent = "ألغِ الحجز بالواتساب";
        cancel.href = A.whatsappLink(
          "السلام عليكم، أريد ألغي حجزي بحلاقة الأمير.\n" +
            s.name + "، " + A.formatDate(A.parseDateKey(b.date)) + "، الساعة " + A.formatTime(b.time) + "\n" +
            "الاسم: " + b.name
        );
        cancel.addEventListener("click", () => {
          saveBookings(loadBookings().filter((x) => x.id !== b.id));
          setTimeout(renderMine, 0);
        });
        li.append(info, cancel);
        ul.appendChild(li);
      });
  }

  // ---------- الأحداث ----------
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "service") {
      state.service = t.value;
      renderDays();
      renderTimes();
    } else if (t.name === "day") {
      state.date = t.value;
      renderTimes();
    } else if (t.name === "time") {
      state.time = t.value;
    }
    updateTicket();
    if (triedSubmit) validate();
  });

  form.addEventListener("input", () => {
    updateTicket();
    if (triedSubmit) validate();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    triedSubmit = true;
    const problems = validate();
    if (problems.length) {
      const target = problems[0].focus;
      const focusable = target.matches("input") ? target : target.querySelector("input:not(:disabled)");
      (focusable || target).focus();
      return;
    }

    const booking = {
      id: Date.now().toString(36),
      service: state.service,
      date: state.date,
      time: state.time,
      name: nameInput.value.trim(),
      phone: normalizePhone(phoneInput.value),
      note: noteInput.value.trim()
    };
    const url = A.whatsappLink(buildMessage(booking));
    const win = window.open(url, "_blank");
    if (win) win.opener = null;

    const others = loadBookings().filter(
      (b) => !(b.date === booking.date && b.time === booking.time && b.service === booking.service)
    );
    saveBookings(others.concat(booking));
    renderMine();

    const sent = document.getElementById("sent");
    document.getElementById("sent-link").href = url;
    sent.hidden = false;
    sent.focus();
  });

  renderServices();
  renderDays();
  renderTimes();
  updateTicket();
  renderMine();
})();
