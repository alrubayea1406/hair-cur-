# Sterling Explains 🪙

قناة يوتيوب إنكليزية مرسومة: **Sterling** يشرح الفلوس والبنوك والاقتصاد من خلال قصص تاريخية حقيقية.
كل شي بالمشروع مسوّى بالكود: الشخصية، الحركة، الصوت، الترجمة، المؤثرات، والموسيقى.
من سكربت واحد يطلع **فيديو طويل بالعرض (16:9)** و**مقاطع Shorts / Reels عمودية (9:16)** مقطوعة منه.

## الشخصية

**Sterling**: شاب بنظارات مدوّرة، صدرية خضرة، بابيون ذهبي، وأكمام قميص مطوية.
عنده عملة ذهبية يقلبها بالهوا لمّا يوصل لأهم نقطة بالقصة، وهاي اللقطة «ماركة» القناة.

- **أسلوبه:** ذكي، مرح، يحچي بسرعة ووضوح، ويحب القصص الغريبة اللي بيها درس عن الفلوس.
- **التعابير:** happy, excited, surprised, thinking, sad, worried, wink, determined, laugh, smug, neutral
- **الحركات:** idle, explain, explainBoth, point, pointLeft, pointUp, present, presentLeft, think, shrug, wave, cheer, facepalm, hips, coin
- **الصوت:** صوت مصمَّم إله خصيصاً على ElevenLabs (`voices/sterling.json`).

## كيف ينسوى فيديو جديد

```bash
npm install                             # مرة وحدة
node scripts/voice.mjs 001-mansa-musa   # الصوت + توقيت كل كلمة + حركة الفم
node scripts/render.mjs 001-mansa-musa  # الفيديو الطويل + الـShorts + الأغلفة + معلومات يوتيوب
```

النتيجة تطلع بـ `out/<id>/`:

| الملف | شنو هو |
|------|--------|
| `<id>.mp4` | الفيديو الطويل 1920×1080 |
| `short-N-*.mp4` | مقاطع Shorts/Reels عمودية 1080×1920 |
| `thumbnail.png` | صورة الغلاف للفيديو الطويل (1280×720) |
| `thumbnail-vertical.png` | غلاف عمودي للـShorts |
| `youtube.txt` | العنوان + الوصف (ويّا الفصول/Chapters) + التاغات |
| `short-N-*.txt` | عنوان ووصف كل Short |
| `captions.srt` | ترجمة إنكليزية ترفعها على يوتيوب |

### ملف السكربت `videos/<id>/script.json`

كل مشهد = جملة يحچيها Sterling + شنو يصير على الشاشة:

```json
{
  "chapter": "Why it went wrong",
  "say": "Prices went up. Economists have a name for this: inflation.",
  "layout": "left", "theme": "studio",
  "expression": "determined", "pose": "present", "look": {"x": 0.7, "y": 0},
  "bigText": "Inflation", "bigTextWord": 9,
  "props": [
    {"type": "chart", "points": [2, 3, 5, 8], "label": "Prices"},
    {"icon": "coin", "word": 3, "anim": "drop"}
  ],
  "beats": [{"word": 5, "coin": true, "expression": "excited"}]
}
```

- `word`: رقم الكلمة بالجملة (يبدي من 0)، حتى الشي يطلع بالضبط وقت ما تنقال الكلمة.
- `layout`: `left` (المقدم يسار والرسومات يمين)، `right`، `center`، `closeup` (لقطة قريبة)، `small`، `full`
- `theme`: الخلفية: `studio`، `vault`، `parchment` (تاريخ)، `desert`، `crimson` (أزمة)، `chart`، `sky`، `night`
- `props`: `icon` (أكثر من 3000 رسمة Fluent Emoji، رخصة MIT)، `stat` (رقم كبير)، `year` (سنة)، `chart` (رسم بياني يتحرك).
  للبحث عن رسمة: `node scripts/find-icon.mjs bank gold`
- `shorts`: أي مشاهد تنقطع وتصير Short، ويّا جملة الافتتاح (`hook`).
- علامات صوتية مثل `[whispers]` و`[laughs]` تغيّر نبرة الصوت.

بالفيديو العمودي التصميم يتغيّر تلقائياً: المقدم ينزل جوّا، الرسومات تصعد فوگ، والإشارة للجانب تصير إشارة لفوگ.

## الصوت والرصيد

- كل 900 حرف تقريباً ينولّد بطلب منفصل وينحفظ. إذا عدّلت مشهد، بس قطعته تنعاد، والباقي ما يصرف رصيد.
- الدقيقة الوحدة من الفيديو تصرف تقريباً 1000 حرف من ElevenLabs.
- `--qa` يحوّل الصوت لنص حتى نتأكد إن الكلمات انگالت صح. يصرف رصيد إضافي.

## الموسيقى والمؤثرات

متولّدة بالكود (`scripts/make-sfx.mjs`): لوب lo-fi، رنّة العملة، pop، whoosh. فما عليها أي حقوق.

## الترخيص

- Remotion مجاني للأفراد والشركات الصغيرة (3 موظفين أو أقل).
- Fluent Emoji: رخصة MIT من Microsoft.
- الخطوط Montserrat وLalezar: رخصة OFL مفتوحة.
