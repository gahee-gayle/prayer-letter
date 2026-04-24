# Prayer Letter App — Project Context

## 프로젝트 개요
Abigail의 선교 기도 편지 웹앱. Vercel에 배포된 정적 사이트 + Supabase 백엔드.
- **라이브 URL**: https://prayer-letter.vercel.app
- **GitHub**: gahee-gayle/prayer-letter (Vercel과 연결 → push하면 자동 배포)
- **Supabase 프로젝트**: aqgrnrhtqsxdrlljtsrk

## 파일 구조
- `index.html` — 편지 작성/편집 페이지 (어드민 전용)
- `app.js` — 편지 작성 페이지의 모든 로직 (현재 v=15)
- `style.css` — 전체 스타일
- `letter.html` — 개별 편지 읽기 페이지 (`?id=슬러그`)
- `letters.html` — 편지 목록 페이지
- `donate.html` — 후원 페이지
- `vercel.json` — Vercel 설정

## 기술 스택
- 순수 HTML/CSS/JS (프레임워크 없음)
- Supabase REST API (JWT anon key로 직접 호출)
- `contenteditable` div + `document.execCommand` 으로 리치 텍스트 편집

## 어드민 인증
- 비밀번호: `7922`
- `sessionStorage('pl_auth', '1')` 로 세션 관리
- letters.html: "관리" 버튼 → 비밀번호 입력 → 편집/삭제/편지쓰기 활성화
- letter.html: 편지 읽기 중 편집 버튼 → 비밀번호 입력 → `index.html?edit=슬러그`

## Supabase letters 테이블 구조
```
id, slug, title (한국어), title_en (영어), date,
main_photo (URL), body_blocks (JSON 배열), created_at
```

### body_blocks 구조
```json
[{ "textKo": "<b>살롬!</b> HTML 가능", "textEn": "Hello!" }]
```

## 주요 기능 & 구현 메모

### 리치 텍스트 편집 (app.js)
- `makeBlockField()`: contenteditable + B/I/U 툴바 + 색상 팔레트 + 커스텀 컬러 피커
- `fmtBlock()`: `execCommand` 사용, `el.focus()` 호출 금지 (selection 초기화됨)
- `saveBlockSelection()` / `restoreBlockSelection()`: 컬러 피커 포커스 이탈 시 selection 복원
- `<input type="color">` 는 반드시 `<button>` 밖에 위치해야 함

### 드래그 앤 드롭 (app.js)
- `_dragIdx` 상태 + HTML5 Drag and Drop API
- `onDragStart`, `onDragOver`, `onDragDrop`, `onDragEnd`

### 미리보기
- `renderBodyBlocksPreview()`: HTML 그대로 렌더링 (escHtml 사용 안 함)
- letter.html 디자인과 일치: 크림 타이틀 바, 오버레이 없음

### 카드 미리보기 (letters.html)
- `stripHtml()` 로 body_blocks HTML에서 plain text 추출 후 120자 미리보기

## 배포 방법
파일 수정 후 GitHub 웹에서 업로드하거나:
```bash
cd ~/Documents/prayer-letter
git add .
git commit -m "업데이트 내용"
git push
```
→ Vercel 자동 배포 (1~2분 소요)

## 자주 하는 작업
- **편지 내용 수정**: Supabase 대시보드 또는 어드민 편집 기능 사용
- **스타일 변경**: style.css
- **편집기 기능 추가**: app.js의 makeBlockField() 또는 renderBlockEditor()
- **카드 레이아웃 변경**: letters.html의 letterCard() 함수
