// أدوات مشتركة بين الصفحات: تنسيق الأرقام والأوقات، وتعبئة معلومات المحل.
(function () {
  const shop = window.SHOP;
  const num = new Intl.NumberFormat("ar-IQ");
  const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5]; // الأسبوع العراقي يبدي بالسبت

  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  function fromMinutes(total) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  function period(h) {
    if (h < 12) return "الصبح";
    if (h < 15) return "الظهر";
    if (h < 18) return "العصر";
    return "بالليل";
  }

  // "16:30" ← "٤:٣٠ العصر"، و short تشيل الدقايق إذا صفر: "٤ العصر"
  function formatTime(hhmm, short) {
    const [h, m] = hhmm.split(":").map(Number);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const clock = short && m === 0 ? num.format(h12) : num.format(h12) + ":" + num.format(m).padStart(2, "٠");
    return clock + " " + period(h);
  }

  function formatPrice(iqd) {
    return num.format(iqd) + " د.ع";
  }

  function formatMinutes(min) {
    if (min < 60) return num.format(min) + " دقيقة";
    const h = min / 60;
    if (h === 1) return "ساعة";
    if (h === 1.5) return "ساعة ونص";
    if (h === 2) return "ساعتين";
    return num.format(h) + " ساعات";
  }

  function dayName(dayIndex) {
    // 4 تشرين الأول 2026 كان أحد، فنزيد عليه رقم اليوم
    const ref = new Date(2026, 9, 4 + dayIndex);
    return new Intl.DateTimeFormat("ar-IQ", { weekday: "long" }).format(ref);
  }

  function dateKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDate(d) {
    return new Intl.DateTimeFormat("ar-IQ", { weekday: "long", day: "numeric", month: "long" }).format(d);
  }

  function whatsappLink(text) {
    return "https://wa.me/" + shop.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  function service(id) {
    return shop.services.find((s) => s.id === id);
  }

  // يحوّل الأرقام العربية-الهندية للاتينية حتى نتحقق منها
  function latinDigits(str) {
    return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  }

  function fillShopInfo(root) {
    (root || document).querySelectorAll("[data-shop]").forEach((el) => {
      const key = el.dataset.shop;
      if (key === "phone") {
        el.textContent = shop.phoneDisplay;
      } else if (key === "tel") {
        el.href = "tel:" + latinDigits(shop.phoneDisplay).replace(/\s/g, "");
      } else if (key === "whatsapp") {
        el.href = whatsappLink();
      } else if (key === "address") {
        el.textContent = shop.address;
      } else if (key === "map") {
        el.href = shop.mapUrl;
      } else if (key === "instagram") {
        el.href = shop.instagram;
      } else if (key === "year") {
        el.textContent = num.format(new Date().getFullYear());
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => fillShopInfo());

  window.Amir = {
    shop,
    num,
    WEEK_ORDER,
    toMinutes,
    fromMinutes,
    formatTime,
    formatPrice,
    formatMinutes,
    dayName,
    dateKey,
    parseDateKey,
    formatDate,
    whatsappLink,
    service,
    latinDigits
  };
})();
