const SUPABASE_URL = 'https://aqgrnrhtqsxdrlljtsrk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZ3Jucmh0cXN4ZHJsbGp0c3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTY1NjUsImV4cCI6MjA5MTU3MjU2NX0.yeM2Biz1XWAfp9IRga3-SSiu2bokc3hpJT2QS86josk';

export default async function handler(req, res) {
  const { id, lang } = req.query;
  const isEn = lang === 'en';
  const siteUrl = 'https://prayer-letter.vercel.app';

  let title = isEn ? "Abigail's Prayer Letter" : "Abigail의 기도 편지";
  let description = isEn
    ? 'A missionary prayer letter sharing faith and ministry stories.'
    : '선교사 기도 편지 — 믿음과 사역 이야기를 나눕니다.';
  let image = `${siteUrl}/letter_header.png`;
  const letterUrl = `${siteUrl}/letter.html?id=${id}${isEn ? '&lang=en' : ''}`;

  if (id) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/letters?slug=eq.${id}&select=title,title_en,main_photo`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const [letter] = await response.json();
      if (letter) {
        title = isEn && letter.title_en ? letter.title_en : letter.title;
        if (letter.main_photo) image = letter.main_photo;
      }
    } catch (e) {}
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${letterUrl}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Abigail's Prayer Letter">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta http-equiv="refresh" content="0;url=${letterUrl}">
</head>
<body>
  <script>window.location.replace('${letterUrl}');</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  res.status(200).send(html);
}
