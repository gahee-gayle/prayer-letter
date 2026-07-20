// Supabase Edge Function: send-newsletter
// 1) 구독 시 "환영 메일" 발송  (요청 본문 { type: "welcome", name, email, lang })
// 2) 새 기도편지 알림 발송      (요청 본문 { slug, title, title_en })
// 필요한 시크릿: RESEND_API_KEY  (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 자동 주입)

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "Abigail & Missions <hello@abigailmissions.com>";
const SITE = "https://abigailmissions.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function sendEmail(to: string, subject: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  return r.ok;
}

function shell(inner: string, en: boolean) {
  const font = en ? "Georgia,serif" : "'Noto Serif KR',serif";
  return `<div style="font-family:${font};max-width:520px;margin:0 auto;color:#2c2925;line-height:1.8">
    ${inner}
    <p style="font-size:12px;color:#9a9186;margin-top:26px">Abigail &amp; Missions · <a href="${SITE}" style="color:#9a9186">${SITE}</a></p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json();

    // ── 1) 환영 메일 ──
    if (body?.type === "welcome") {
      const en = body.lang === "en";
      const name = body.name ? String(body.name) : (en ? "friend" : "동역자");
      if (!body.email) return json({ error: "missing email" }, 400);
      const subject = en
        ? "Thank you for subscribing · Abigail & Missions"
        : "구독해 주셔서 감사합니다 · Abigail & Missions";
      const inner = en
        ? `<p>Dear ${name},</p>
           <p>Thank you for subscribing to <strong>Abigail &amp; Missions</strong>. 💛</p>
           <p>You'll receive our prayer letters and ministry news as they're shared. We're so grateful to walk this journey together.</p>
           <p><a href="${SITE}" style="display:inline-block;background:#bd7149;color:#fff;text-decoration:none;padding:11px 26px;border-radius:6px;font-family:sans-serif;font-size:14px">Visit the site →</a></p>
           <p style="margin-top:22px;color:#736b60">With gratitude,<br>Abigail</p>`
        : `<p>${name}님, 안녕하세요.</p>
           <p><strong>Abigail &amp; Missions</strong> 구독을 신청해 주셔서 진심으로 감사드립니다. 💛</p>
           <p>앞으로 새 기도편지와 사역 소식을 이메일로 전해드릴게요. 이 여정에 함께해 주셔서 감사해요.</p>
           <p><a href="${SITE}" style="display:inline-block;background:#bd7149;color:#fff;text-decoration:none;padding:11px 26px;border-radius:6px;font-family:sans-serif;font-size:14px">사이트 둘러보기 →</a></p>
           <p style="margin-top:22px;color:#736b60">감사한 마음으로,<br>Abigail 드림</p>`;
      const ok = await sendEmail(body.email, subject, shell(inner, en));
      return json({ ok });
    }

    // ── 2) 새 편지 알림 (구독자 전체) ──
    const { slug, title, title_en } = body || {};
    if (!slug) return json({ error: "missing slug" }, 400);

    const subsRes = await fetch(`${SUPABASE_URL}/rest/v1/subscribers?select=name,email,lang`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const subs = await subsRes.json();
    if (!Array.isArray(subs) || subs.length === 0) return json({ sent: 0 });

    const link = `${SITE}/letters.html?id=${slug}`;
    let sent = 0;
    for (const s of subs) {
      const en = s.lang === "en";
      const t = en ? (title_en || title) : title;
      const name = s.name ? String(s.name) : (en ? "friend" : "동역자");
      const subject = en ? `New prayer letter: ${t}` : `새 기도편지: ${t}`;
      const inner = en
        ? `<p>Dear ${name},</p>
           <p>A new prayer letter has been posted:</p>
           <p style="font-size:20px;font-weight:600;color:#bd7149;margin:18px 0">${t}</p>
           <p><a href="${link}" style="display:inline-block;background:#bd7149;color:#fff;text-decoration:none;padding:11px 26px;border-radius:6px;font-family:sans-serif;font-size:14px">Read the letter →</a></p>
           <p style="margin-top:22px;color:#736b60">With gratitude,<br>Abigail</p>`
        : `<p>${name}님께,</p>
           <p>새 기도편지가 올라왔어요.</p>
           <p style="font-size:20px;font-weight:600;color:#bd7149;margin:18px 0">${t}</p>
           <p><a href="${link}" style="display:inline-block;background:#bd7149;color:#fff;text-decoration:none;padding:11px 26px;border-radius:6px;font-family:sans-serif;font-size:14px">편지 읽기 →</a></p>
           <p style="margin-top:22px;color:#736b60">감사한 마음으로,<br>Abigail 드림</p>`;
      if (await sendEmail(s.email, subject, shell(inner, en))) sent++;
    }
    return json({ sent });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
