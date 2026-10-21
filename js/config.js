// كل معلومات المحل بهذا الملف. عدّل هنا بس، والموقع كله يتحدّث وحده.
window.SHOP = {
  name: "حلاقة الأمير",

  // رقم الواتساب بالصيغة الدولية بدون + أو أصفار بالبداية (مثال: 9647701234567)
  whatsapp: "9647700000000",
  // رقم الاتصال مثل ما ينكتب للناس
  phoneDisplay: "0770 000 0000",

  address: "بغداد، الكرادة داخل، قرب ساحة كهرمانة",
  mapUrl: "https://maps.google.com/?q=Karrada+Baghdad",
  instagram: "https://instagram.com/",

  // أوقات الدوام لكل يوم (0 = الأحد ... 6 = السبت). null يعني عطلة.
  hours: {
    0: { open: "10:00", close: "22:00" },
    1: { open: "10:00", close: "22:00" },
    2: { open: "10:00", close: "22:00" },
    3: { open: "10:00", close: "22:00" },
    4: { open: "10:00", close: "23:00" },
    5: { open: "14:00", close: "22:00" },
    6: { open: "10:00", close: "22:00" }
  },

  // كل كم دقيقة يبدي دور جديد
  slotMinutes: 30,
  // كم يوم لگدّام يگدر الزبون يحجز
  bookingDays: 14,

  // الخدمات والتسريحات. السعر بالدينار، والمدة بالدقايق.
  services: [
    { id: "fade", name: "قصة فيد", note: "تدريج من الصفر، ويا تحديد", price: 10000, minutes: 30 },
    { id: "classic", name: "قصة كلاسيك بالمقص", note: "طول على كيفك، تخفيف وترتيب", price: 8000, minutes: 30 },
    { id: "beard", name: "تحديد لحية", note: "موس وخيط، ويا فوطة حارة", price: 5000, minutes: 15 },
    { id: "combo", name: "قصة ولحية", note: "أي قصة تختارها ويا تحديد اللحية", price: 13000, minutes: 45 },
    { id: "kids", name: "قصة أطفال", note: "للأعمار تحت ١٢ سنة", price: 6000, minutes: 30 },
    { id: "facial", name: "تنظيف بشرة وماسك", note: "بخار، تقشير، وماسك فحم", price: 10000, minutes: 30 },
    { id: "groom", name: "تجهيز عريس", note: "قصة، لحية، بشرة، وسشوار", price: 50000, minutes: 90 }
  ],

  // صور الشغل. حط صورك بمجلد images/gallery وغيّر الأسماء هنا.
  // style لازم يطابق id من الخدمات حتى يشتغل الفلتر.
  gallery: [
    { src: "images/gallery/fade-1.svg", style: "fade", caption: "فيد عالي ويا خط جانبي" },
    { src: "images/gallery/classic-1.svg", style: "classic", caption: "كلاسيك ويا فرق جانبي" },
    { src: "images/gallery/beard-1.svg", style: "beard", caption: "تحديد لحية كاملة" },
    { src: "images/gallery/fade-2.svg", style: "fade", caption: "فيد واطي" },
    { src: "images/gallery/kids-1.svg", style: "kids", caption: "قصة أطفال قصيرة" },
    { src: "images/gallery/combo-1.svg", style: "combo", caption: "فيد ويا لحية مدرّجة" },
    { src: "images/gallery/classic-2.svg", style: "classic", caption: "كلاسيك طويل للخلف" },
    { src: "images/gallery/groom-1.svg", style: "groom", caption: "تجهيز عريس" }
  ]
};
