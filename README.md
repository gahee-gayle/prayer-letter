# 기도 편지 웹앱 · Prayer Letter Builder

따뜻한 기도 편지를 쉽게 작성하고 공유할 수 있는 웹앱입니다.

---

## 파일 구성

```
prayer-letter-app/
├── index.html      — 메인 페이지
├── style.css       — 디자인
├── app.js          — 기능 (저장, AI 생성, 미리보기)
├── vercel.json     — Vercel 배포 설정
└── README.md       — 이 파일
```

---

## Vercel로 무료 배포하기 (5분)

### 방법 1 — 드래그앤드롭 (가장 쉬움)

1. [vercel.com](https://vercel.com) 접속 → GitHub 또는 이메일로 무료 가입
2. 대시보드에서 **"Add New → Project"** 클릭
3. **"Import Third-Party Git Repository"** 아래 **"Deploy without a Git repository"** 클릭
4. 이 폴더 전체를 드래그앤드롭
5. **Deploy** 클릭 → 1~2분 후 URL 발급 완료!

배포 후 예시 URL: `https://prayer-letter-[랜덤].vercel.app`

### 방법 2 — GitHub 연동 (업데이트 편함)

1. GitHub에서 새 저장소 생성
2. 이 폴더 파일들을 업로드
3. Vercel에서 GitHub 저장소 연결
4. 이후 파일 수정 시 자동으로 배포됨

---

## 주요 기능

- **편집 탭** — 제목, 날짜, 인사말, 사진, 한/영 본문, 기도 제목, 마무리 인사 입력
- **AI 생성 탭** — 3가지 톤(공식/감동/간결) × 3가지 언어(한/영/둘 다) 조합으로 AI가 자동 생성
- **미리보기 탭** — 완성된 편지 확인, 이메일 발송, 인쇄/PDF 저장
- **템플릿 탭** — 편지 저장 및 불러오기, 빠른 시작 템플릿 4가지
- **실시간 미리보기** — 편집 탭 오른쪽에서 입력하는 대로 즉시 확인

---

## 커스터마이징

`style.css`의 `:root` 변수에서 색상을 바꿀 수 있어요:

```css
--pink-600: #c0446f;   /* 포인트 색상 */
--warm-50:  #fdfaf6;   /* 배경 색상 */
```

---

*Made with ✝ for missionary work*
