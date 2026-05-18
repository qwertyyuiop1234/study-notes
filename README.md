# Study Notes Site

`jekyll-theme-rtd` 기반 개인 공부 노트 GitHub Pages 사이트 뼈대입니다.

## 배포 예정 URL

```text
https://qwertyyuiop1234.github.io/study-notes/
```

## 로컬 구조

```text
docs/
  _config.yml
  index.md
  computer-architecture/
  operating-system/
  probability-and-statistics/
  machine-learning/
```

## GitHub Pages 설정 예정

GitHub repository 이름은 `study-notes`를 사용합니다.

Pages 설정은 다음 중 하나를 사용합니다.

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/docs`

## 아직 하지 않은 것

- GitHub remote 연결 안 함
- GitHub repo 생성 안 함
- 파일 push 안 함
- 기존 공부 HTML 업로드 안 함

## 로컬 미리보기

Ruby/Jekyll 환경이 준비되어 있으면:

```bash
bundle install
bundle exec jekyll serve --source docs
```

이후 브라우저에서:

```text
http://127.0.0.1:4000/study-notes/
```
