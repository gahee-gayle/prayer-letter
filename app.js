/* ═══════════════════════════════════════
   Supabase
═══════════════════════════════════════ */
const SUPABASE_URL = 'https://aqgrnrhtqsxdrlljtsrk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sSXz7XiLGhE8n4CbHFBX-A_bPndNsRF';

function generateSlug() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

async function saveToCloud() {
  const d = getHeaderData();
  const btn = document.getElementById('save-btn');
  btn.textContent = '저장 중...';
  btn.disabled = true;

  const slug = generateSlug();
  const payload = {
    slug,
    title:        d.title,
    title_en:     d.titleEn || null,
    date:         d.date || null,
    greeting:     d.greeting || null,
    greeting_en:  d.greetingEn || null,
    body_blocks:  bodyBlocks,
    prayer_items: prayerItems,
    closing:      d.closing || null,
    closing_en:   d.closingEn || null,
    main_photo:   mainPhoto || null,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/letters`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const shareUrl = `${location.origin}${location.pathname.replace('index.html','').replace(/\/$/, '')}/letter.html?id=${slug}`;
      showSaveSuccess(shareUrl);
      saveToLocalTemplates(d, slug);
    } else {
      const err = await res.json();
      console.error(err);
      btn.textContent = '저장 실패';
      setTimeout(() => { btn.textContent = '저장'; btn.disabled = false; }, 2000);
    }
  } catch(e) {
    btn.textContent = '저장 실패';
    setTimeout(() => { btn.textContent = '저장'; btn.disabled = false; }, 2000);
  }
}

function showSaveSuccess(shareUrl) {
  const btn = document.getElementById('save-btn');
  btn.textContent = '저장됨!';
  btn.disabled = false;

  const existing = document.getElementById('share-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'share-toast';
  toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: var(--teal-800); border: 1px solid var(--teal-400);
    border-radius: 14px; padding: 1rem 1.5rem;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 8px 32px rgba(10,56,50,0.4);
    z-index: 999; font-family: var(--font-sans); font-size: 14px;
    color: var(--text-on-dark); max-width: 90vw;
  `;
  toast.innerHTML = `
    <span>✓ 저장됐어요!</span>
    <input id="share-url" value="${shareUrl}" readonly
      style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
      border-radius:8px; padding:6px 10px; color:white; font-size:13px;
      width: 280px; font-family:var(--font-sans);">
    <button onclick="copyShareUrl()" style="
      padding:7px 16px; background:var(--blush-300); color:var(--teal-900);
      border:none; border-radius:999px; font-size:13px; font-weight:500;
      cursor:pointer; white-space:nowrap; font-family:var(--font-sans);">링크 복사</button>
    <button onclick="document.getElementById('share-toast').remove()" style="
      background:none; border:none; color:rgba(255,255,255,0.5);
      cursor:pointer; font-size:18px; padding:0 4px;">✕</button>
  `;
  document.body.appendChild(toast);
  setTimeout(() => { btn.textContent = '저장'; }, 2000);
}

function copyShareUrl() {
  const url = document.getElementById('share-url').value;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('#share-toast button');
    btn.textContent = '복사됨!';
    setTimeout(() => btn.textContent = '링크 복사', 2000);
  });
}

function saveToLocalTemplates(d, slug) {
  savedTemplates.unshift({
    id: Date.now(), slug, ...d,
    prayerItems: prayerItems.map(p => ({ko:p.ko, en:p.en})),
    bodyBlocks: JSON.parse(JSON.stringify(bodyBlocks)),
    mainPhoto,
    savedAt: new Date().toLocaleDateString('ko-KR', { month:'short', day:'numeric' })
  });
  localStorage.setItem('prayerLetterTemplates', JSON.stringify(savedTemplates));
  renderSavedList();
}

/* ═══════════════════════════════════════
   State
═══════════════════════════════════════ */
let pvLang = 'ko';
let aiLang = 'ko';
let aiTone = 'formal';
let savedTemplates = JSON.parse(localStorage.getItem('prayerLetterTemplates') || '[]');
let mainPhoto = null;

/* bodyBlocks = [{ textKo, textEn, photos: [dataUrl, ...] }, ...] */
let bodyBlocks = [];

/* prayerItems = [{ko, en}, ...] */
let prayerItems = [{ko:'', en:''}, {ko:'', en:''}, {ko:'', en:''}];

/* ═══════════════════════════════════════
   Init
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date').valueAsDate = new Date();
  addBodyBlock();   // start with one block
  renderPrayerEditor();
  renderSavedList();
  setupTabNav();
  setupPillGroups();
  setupToneCards();
  setupInputListeners();
  syncAll();
});

/* ═══════════════════════════════════════
   Navigation
═══════════════════════════════════════ */
function setupTabNav() {
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => goTab(btn.dataset.tab))
  );
}

function goTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name)
  );
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('active', p.id === 'tab-' + name)
  );
  if (name === 'preview') syncPreview();
}

/* ═══════════════════════════════════════
   AI settings UI
═══════════════════════════════════════ */
function setupPillGroups() {
  document.querySelectorAll('#lang-group .pill').forEach(pill =>
    pill.addEventListener('click', () => {
      document.querySelectorAll('#lang-group .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      aiLang = pill.dataset.val;
    })
  );
}

function setupToneCards() {
  document.querySelectorAll('.tone-card').forEach(card =>
    card.addEventListener('click', () => {
      document.querySelectorAll('.tone-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      aiTone = card.dataset.tone;
    })
  );
}

/* ═══════════════════════════════════════
   Input listeners (header fields)
═══════════════════════════════════════ */
function setupInputListeners() {
  ['title','title-en','date','greeting','greeting-en','closing','closing-en'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', syncAll);
  });
  document.getElementById('save-btn').addEventListener('click', saveToCloud);
}

/* ═══════════════════════════════════════
   Helpers
═══════════════════════════════════════ */
function val(id) { return (document.getElementById(id) || {}).value || ''; }
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

function getHeaderData() {
  return {
    title:      val('title') || '제목 없음',
    titleEn:    val('title-en'),
    date:       val('date'),
    greeting:   val('greeting'),
    greetingEn: val('greeting-en'),
    prayer:     prayerItems.filter(p => p.ko || p.en).map((p,i) => `${i+1}. ${p.ko}`).join('\n'),
    prayerEn:   prayerItems.filter(p => p.ko || p.en).map((p,i) => `${i+1}. ${p.en || p.ko}`).join('\n'),
    closing:    val('closing'),
    closingEn:  val('closing-en'),
  };
}

function formatDate(v) {
  if (!v) return '';
  return new Date(v + 'T00:00:00').toLocaleDateString('ko-KR',
    { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ═══════════════════════════════════════
   Prayer Items Editor
═══════════════════════════════════════ */
function addPrayerItem() {
  prayerItems.push({ko:'', en:''});
  renderPrayerEditor();
  syncAll();
}

function removePrayerItem(idx) {
  if (prayerItems.length <= 1) return;
  prayerItems.splice(idx, 1);
  renderPrayerEditor();
  syncAll();
}

function renderPrayerEditor() {
  const wrap = document.getElementById('prayer-items-wrap');
  if (!wrap) return;
  wrap.innerHTML = prayerItems.map((item, i) => `
    <div class="prayer-item-block">
      <div class="prayer-item-header">
        <span class="prayer-num">${i + 1}.</span>
        ${prayerItems.length > 1
          ? `<button class="prayer-item-del" onclick="removePrayerItem(${i})" title="삭제">✕</button>`
          : ''}
      </div>
      <div class="prayer-item-fields">
        <input type="text"
          value="${escHtml(item.ko)}"
          placeholder="기도 제목 (한국어)"
          oninput="prayerItems[${i}].ko=this.value; syncAll()">
        <input type="text"
          value="${escHtml(item.en)}"
          placeholder="Prayer request (English)"
          oninput="prayerItems[${i}].en=this.value; syncAll()">
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════
   Body Blocks — editor
═══════════════════════════════════════ */
function addBodyBlock() {
  bodyBlocks.push({ textKo: '', textEn: '', photos: [] });
  renderBlockEditor();
  syncAll();
}

function removeBodyBlock(idx) {
  bodyBlocks.splice(idx, 1);
  renderBlockEditor();
  syncAll();
}

function renderBlockEditor() {
  const wrap = document.getElementById('body-blocks');
  if (!wrap) return;

  wrap.innerHTML = bodyBlocks.map((block, i) => `
    <div class="body-block" id="block-${i}">
      <div class="body-block-header">
        <span class="body-block-num">블록 ${i + 1}</span>
        ${bodyBlocks.length > 1
          ? `<button class="body-block-del" onclick="removeBodyBlock(${i})">삭제</button>`
          : ''}
      </div>
      <div class="field" style="margin-bottom:8px;">
        <label>한국어</label>
        <textarea rows="4"
          placeholder="사역 이야기 (한국어)..."
          oninput="bodyBlocks[${i}].textKo=this.value; syncAll()"
        >${escHtml(block.textKo)}</textarea>
      </div>
      <div class="field" style="margin-bottom:8px;">
        <label>English</label>
        <textarea rows="4"
          placeholder="Ministry story (English)..."
          oninput="bodyBlocks[${i}].textEn=this.value; syncAll()"
        >${escHtml(block.textEn)}</textarea>
      </div>
      <div class="body-block-photos" id="block-photos-${i}">
        ${block.photos.map((src, j) => `
          <div class="block-photo-wrap">
            <img src="${src}" alt="">
            <button class="rm" onclick="removeBlockPhoto(${i},${j})">✕</button>
          </div>`).join('')}
        <button class="block-add-photo" onclick="triggerBlockPhoto(${i})" title="사진 추가">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </button>
        <input type="file" accept="image/*" multiple
          id="block-file-${i}"
          style="display:none"
          onchange="loadBlockPhotos(event,${i})">
      </div>
    </div>`).join('');
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function triggerBlockPhoto(idx) {
  document.getElementById('block-file-' + idx).click();
}

function loadBlockPhotos(e, idx) {
  const files = Array.from(e.target.files).slice(0, 10 - bodyBlocks[idx].photos.length);
  let loaded = 0;
  if (!files.length) return;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      bodyBlocks[idx].photos.push(ev.target.result);
      if (++loaded === files.length) { renderBlockEditor(); syncAll(); }
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function removeBlockPhoto(blockIdx, photoIdx) {
  bodyBlocks[blockIdx].photos.splice(photoIdx, 1);
  renderBlockEditor();
  syncAll();
}

/* ═══════════════════════════════════════
   Main photo
═══════════════════════════════════════ */
function loadMainPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    mainPhoto = ev.target.result;
    const thumb = document.getElementById('main-photo-thumb');
    const ph    = document.getElementById('main-photo-placeholder');
    const pv    = document.getElementById('main-photo-preview');
    const badge = document.getElementById('main-photo-badge');
    if (thumb) thumb.src = mainPhoto;
    if (ph)    ph.style.display = 'none';
    if (pv)    pv.style.display = 'block';
    if (badge) badge.style.display = 'inline';
    syncAll();
  };
  reader.readAsDataURL(file);
}

function removeMainPhoto(e) {
  if (e) e.preventDefault();
  mainPhoto = null;
  const thumb = document.getElementById('main-photo-thumb');
  const ph    = document.getElementById('main-photo-placeholder');
  const pv    = document.getElementById('main-photo-preview');
  const badge = document.getElementById('main-photo-badge');
  const input = document.getElementById('main-photo-input');
  if (thumb) thumb.src = '';
  if (ph)    ph.style.display = 'flex';
  if (pv)    pv.style.display = 'none';
  if (badge) badge.style.display = 'none';
  if (input) input.value = '';
  syncAll();
}

/* ═══════════════════════════════════════
   Sync previews
═══════════════════════════════════════ */
function syncAll() {
  syncLivePreview();
  syncPreview();
}

function syncLivePreview() {
  const d = getHeaderData();
  setText('lp-title',    d.title);
  setText('lp-date',     formatDate(d.date));
  setText('lp-greeting', d.greeting);
  setText('lp-footer',   d.closing);
  renderBodyBlocksPreview('lp-body-blocks', 'ko');
  renderPrayerBlock('lp-prayer', 'lp-prayer-items', 'lp-prayer-title', 'ko');
  const img = document.getElementById('lp-main-img');
  if (img) { img.src = mainPhoto || ''; img.style.display = mainPhoto ? 'block' : 'none'; }
}

function syncPreview() {
  const d = getHeaderData();
  const isEn = pvLang === 'en';
  setText('fv-title',    isEn && d.titleEn    ? d.titleEn    : d.title);
  setText('fv-date',     formatDate(d.date));
  setText('fv-greeting', isEn && d.greetingEn ? d.greetingEn : d.greeting);
  setText('fv-footer',   isEn && d.closingEn  ? d.closingEn  : d.closing);
  renderBodyBlocksPreview('fv-body-blocks', pvLang);
  renderPrayerBlock('fv-prayer', 'fv-prayer-items', 'fv-prayer-title', pvLang);
  const img = document.getElementById('fv-main-img');
  if (img) { img.src = mainPhoto || ''; img.style.display = mainPhoto ? 'block' : 'none'; }
}

function renderBodyBlocksPreview(containerId, lang) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  if (!bodyBlocks.length) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = bodyBlocks.map(block => {
    const text = lang === 'en' ? block.textEn : block.textKo;
    const photos = block.photos;
    const pClass = photos.length === 1 ? 'p1'
                 : photos.length === 2 ? 'p2'
                 : photos.length === 3 ? 'p3' : 'p4';
    return `<div class="pv-block">
      ${text ? `<div class="pv-block-text">${escHtml(text)}</div>` : ''}
      ${photos.length ? `<div class="pv-block-photos ${pClass}">
        ${photos.slice(0,4).map(src => `<img src="${src}" alt="">`).join('')}
      </div>` : ''}
    </div>`;
  }).join('');
}

function renderPrayerBlock(boxId, itemsId, titleId, lang) {
  const box   = document.getElementById(boxId);
  const items = document.getElementById(itemsId);
  const title = document.getElementById(titleId);
  if (!box || !items) return;
  if (title) title.textContent = lang === 'en' ? 'Prayer Requests' : '기도 제목';
  const filled = prayerItems.filter(p => p.ko || p.en);
  if (filled.length) {
    items.innerHTML = filled.map((p, i) => {
      const text = lang === 'en' ? (p.en || p.ko) : p.ko;
      return text ? `<div>${i+1}. ${escHtml(text)}</div>` : '';
    }).filter(Boolean).join('');
    box.style.display = items.innerHTML ? 'block' : 'none';
  } else {
    box.style.display = 'none';
  }
}

/* ═══════════════════════════════════════
   Preview language toggle
═══════════════════════════════════════ */
function setPvLang(lang, el) {
  pvLang = lang;
  document.querySelectorAll('#pv-lang-group .pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  syncPreview();
}

/* ═══════════════════════════════════════
   AI Generation
═══════════════════════════════════════ */
async function generateAI() {
  const d = getHeaderData();
  const allKo = bodyBlocks.map(b => b.textKo).filter(Boolean).join('\n\n');
  const allEn = bodyBlocks.map(b => b.textEn).filter(Boolean).join('\n\n');
  const result  = document.getElementById('ai-result');
  const btn     = document.getElementById('gen-btn');
  const spinner = document.getElementById('ai-spinner');

  if (!allKo && !allEn) {
    result.textContent = '편집 탭에서 본문 내용을 먼저 입력해 주세요!';
    return;
  }

  const toneMap = {
    formal:  '공식적/격식체 (교회·기관용, 존댓말)',
    story:   '감동적/스토리텔링 (개인 후원자·SNS용)',
    summary: '간결/요약형 (200자 이내, 핵심만)'
  };
  const langMap = {
    ko:   '한국어로만',
    en:   'English only',
    both: '한국어 먼저, --- 후 영어 번역'
  };

  btn.disabled = true;
  spinner.classList.add('active');
  result.textContent = '생성 중...';

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content:
          `선교사 기도 편지 전문가. 아래로 기도 편지 작성.\n\n` +
          `[제목] ${d.title}\n[본문KO] ${allKo || '없음'}\n[본문EN] ${allEn || '없음'}\n` +
          `[기도제목] ${d.prayer || '없음'}\n[마무리] ${d.closing || '없음'}\n\n` +
          `[톤] ${toneMap[aiTone]}\n[언어] ${langMap[aiLang]}\n\n` +
          `ETI 영어교육 선교사(제주/해외). 인사→사역→감사→기도제목→마무리 순서. 따뜻하고 진심있게.`
        }]
      })
    });
    const data = await resp.json();
    result.textContent = (data.content || []).map(c => c.text || '').join('') || '오류가 발생했습니다.';
  } catch {
    result.textContent = '오류가 발생했습니다. 다시 시도해 주세요.';
  }

  btn.disabled = false;
  spinner.classList.remove('active');
}

function copyAI() {
  navigator.clipboard.writeText(document.getElementById('ai-result').textContent).then(() => {
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '복사됨!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

function applyAI() {
  const text = document.getElementById('ai-result').textContent;
  if (!text || text === '생성 중...' || text.includes('먼저 입력')) return;
  if (bodyBlocks.length === 0) addBodyBlock();
  bodyBlocks[0].textKo = text;
  renderBlockEditor();
  syncAll();
  goTab('edit');
}

/* ═══════════════════════════════════════
   Save / Load templates
═══════════════════════════════════════ */
function saveTemplate() {
  const d = getHeaderData();
  savedTemplates.unshift({
    id: Date.now(), ...d,
    prayerItems: prayerItems.map(p => ({ko: p.ko, en: p.en})),
    bodyBlocks: JSON.parse(JSON.stringify(bodyBlocks)),
    mainPhoto,
    savedAt: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  });
  localStorage.setItem('prayerLetterTemplates', JSON.stringify(savedTemplates));
  renderSavedList();
  const btn = document.getElementById('save-btn');
  btn.textContent = '저장됨!';
  setTimeout(() => btn.textContent = '저장', 1500);
}

function loadSaved(id) {
  const t = savedTemplates.find(x => x.id === id);
  if (!t) return;
  const setVal = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  setVal('title', t.title);       setVal('title-en', t.titleEn);
  setVal('date', t.date);
  setVal('greeting', t.greeting); setVal('greeting-en', t.greetingEn);
  setVal('prayer', t.prayer);
  setVal('closing', t.closing);   setVal('closing-en', t.closingEn);
  bodyBlocks = t.bodyBlocks ? JSON.parse(JSON.stringify(t.bodyBlocks)) : [{ textKo:'', textEn:'', photos:[] }];
  renderBlockEditor();
  prayerItems = t.prayerItems
    ? t.prayerItems.map(p => typeof p === 'object' ? p : {ko: p, en: ''})
    : [{ko:'', en:''}, {ko:'', en:''}, {ko:'', en:''}];
  renderPrayerEditor();
  mainPhoto = t.mainPhoto || null;
  const thumb = document.getElementById('main-photo-thumb');
  const ph    = document.getElementById('main-photo-placeholder');
  const pv    = document.getElementById('main-photo-preview');
  const badge = document.getElementById('main-photo-badge');
  if (mainPhoto) {
    if (thumb) thumb.src = mainPhoto;
    if (ph)    ph.style.display = 'none';
    if (pv)    pv.style.display = 'block';
    if (badge) badge.style.display = 'inline';
  } else {
    if (ph)    ph.style.display = 'flex';
    if (pv)    pv.style.display = 'none';
    if (badge) badge.style.display = 'none';
  }
  syncAll();
  goTab('edit');
}

function deleteSaved(id, e) {
  e.stopPropagation();
  if (!confirm('삭제할까요?')) return;
  savedTemplates = savedTemplates.filter(x => x.id !== id);
  localStorage.setItem('prayerLetterTemplates', JSON.stringify(savedTemplates));
  renderSavedList();
}

function renderSavedList() {
  const el = document.getElementById('saved-list');
  if (!el) return;
  if (!savedTemplates.length) {
    el.innerHTML = '<p class="empty-msg">아직 저장된 편지가 없어요.<br>편집 탭에서 작성하고 저장해 보세요!</p>';
    return;
  }
  el.innerHTML = '<div class="saved-list-grid">' +
    savedTemplates.map(t => `
      <div class="saved-item" onclick="loadSaved(${t.id})">
        <div>
          <div class="saved-item-title">${escHtml(t.title)}</div>
          <div class="saved-item-date">${t.savedAt}</div>
        </div>
        <button class="saved-item-del" onclick="deleteSaved(${t.id},event)">삭제</button>
      </div>`).join('') + '</div>';
}

/* ═══════════════════════════════════════
   Quick templates
═══════════════════════════════════════ */
function loadQuick(type) {
  const now = new Date();
  const map = {
    monthly: {
      title: now.getFullYear()+'년 '+(now.getMonth()+1)+'월 기도 편지',
      titleEn: now.toLocaleString('en',{month:'long'})+' '+now.getFullYear()+' Prayer Letter',
      greeting: '사랑하는 후원자님들께', greetingEn: 'Dear friends and supporters,',
      closing: '주님의 은혜 안에서, Abigail 드림', closingEn: 'In His grace, Abigail',
      prayers: [
        {ko:'영어 교육을 통한 복음 전파를 위해', en:'For the spread of the gospel through English education'},
        {ko:'재정적 필요를 위해', en:'For financial needs'},
        {ko:'건강과 사역의 지속을 위해', en:'For health and the continuation of ministry'}
      ],
      bodyKo: '이번 달도 하나님의 은혜 안에서 사역을 이어갈 수 있었습니다.\n\n',
      bodyEn: "By God's grace, ministry continued faithfully this month.\n\n"
    },
    event: {
      title: 'ETI 교사 훈련 세미나 보고', titleEn: 'ETI Teacher Training Seminar Report',
      greeting: '함께 기도해 주신 후원자님들께', greetingEn: 'Dear praying friends,',
      closing: '감사함으로, Abigail', closingEn: 'With gratitude, Abigail',
      prayers: [
        {ko:'훈련받은 교사들의 현장 사역을 위해', en:'For the field ministry of trained teachers'},
        {ko:'다음 세미나 준비를 위해', en:'For preparation of the next seminar'},
        {ko:'필요한 재정을 위해', en:'For the needed finances'}
      ],
      bodyKo: 'ETI 교사 훈련 세미나가 하나님의 은혜로 잘 마무리되었습니다.\n\n',
      bodyEn: "The ETI Teacher Training Seminar concluded beautifully by God's grace.\n\n"
    },
    urgent: {
      title: '긴급 기도 부탁드립니다', titleEn: 'Urgent Prayer Request',
      greeting: '사랑하는 기도 동역자님들께', greetingEn: 'Dear prayer partners,',
      closing: '은혜 안에서, Abigail 드림', closingEn: 'In His grace, Abigail',
      prayers: [{ko:'', en:''}, {ko:'', en:''}],
      bodyKo: '긴급히 기도 부탁드릴 제목이 생겨 연락드립니다.\n\n',
      bodyEn: 'I am writing to urgently request your prayers.\n\n'
    },
    thanks: {
      title: '감사 인사를 전합니다', titleEn: 'A Note of Gratitude',
      greeting: '사랑하는 후원자님께', greetingEn: 'Dear supporter,',
      closing: '감사와 사랑을 담아, Abigail', closingEn: 'With love and gratitude, Abigail',
      prayers: [
        {ko:'후원자님 가정의 건강과 축복을 위해', en:'For the health and blessing of your family'},
        {ko:'사역의 열매를 위해', en:'For the fruit of the ministry'}
      ],
      bodyKo: '지난 달 따뜻한 후원과 기도에 진심으로 감사드립니다.\n\n',
      bodyEn: 'Thank you so much for your generous support and prayers.\n\n'
    }
  };
  const t = map[type];
  if (!t) return;
  const setVal = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  setVal('title', t.title);       setVal('title-en', t.titleEn);
  setVal('greeting', t.greeting); setVal('greeting-en', t.greetingEn);
  setVal('closing', t.closing);   setVal('closing-en', t.closingEn);
  document.getElementById('date').valueAsDate = new Date();
  prayerItems = t.prayers
    ? t.prayers.map(p => typeof p === 'object' ? p : {ko: p, en: ''})
    : [{ko:'', en:''}, {ko:'', en:''}, {ko:'', en:''}];
  renderPrayerEditor();
  bodyBlocks = [{ textKo: t.bodyKo || '', textEn: t.bodyEn || '', photos: [] }];
  renderBlockEditor();
  syncAll();
  goTab('edit');
}

/* ═══════════════════════════════════════
   Print & PDF
═══════════════════════════════════════ */
function printOnly() {
  document.body.classList.add('print-only');
  document.body.classList.remove('print-pdf');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('print-only'), 1000);
  }, 100);
}

function savePDF() {
  document.body.classList.add('print-pdf');
  document.body.classList.remove('print-only');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('print-pdf'), 1000);
  }, 100);
}

/* ═══════════════════════════════════════
   Email
═══════════════════════════════════════ */
function sendEmail() {
  const d = getHeaderData();
  const recipient = val('recipient');
  const isEn = pvLang === 'en';
  const subject  = isEn && d.titleEn    ? d.titleEn    : d.title;
  const greeting = isEn && d.greetingEn ? d.greetingEn : d.greeting;
  const closing  = isEn && d.closingEn  ? d.closingEn  : d.closing;
  const content  = bodyBlocks.map(b => isEn ? b.textEn : b.textKo).filter(Boolean).join('\n\n');
  const body = `${greeting ? greeting+'\n\n' : ''}${content}\n\n[${isEn ? 'Prayer Requests' : '기도 제목'}]\n${d.prayer}\n\n${closing}`;
  window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
