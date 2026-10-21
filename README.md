# Mr Techlab Studio — User App

Multi-page web app (no build step). One HTML file per feature, one shared engine.

## Structure
Every page is self-contained: ONE `<style>` and ONE `<script>` inside the html file.
```
index.html        Main menu (Dev Yasin design): 7 feature cards, Support, Weather (°C), colour dot
apk.html          Apps marketplace (search, categories, details, download)
host.html         Hosting links
prompts.html      Prompts
files.html        Files (edit {{ }} + copy / ZIP download)
developer.html    Developer account + upload
downloads.html    My downloads
profile.html      Profile
privacy / terms / about / contact .html
img/logo.png      Logo
sw.js, manifest.json   PWA
```
Inside each inner page the script is laid out as: Firebase imports → theme → routing → auth → catalog → views → upload/developer → boot.

## Run
Browsers block ES modules on `file://`, so serve the folder over http(s):
`python3 -m http.server 8000` then open http://localhost:8000 (or deploy to any static host).

## Edit
- Support links: replace the `YOUR_*` placeholders in `index.html` (Support section + popup).
- Colours: `PALETTE` (7 schemes) is inside the script of every page — keep the lists identical.
- Firebase config / ImgBB key: top of the script in each inner page (`IMGBB_API_KEY` is still a placeholder).
- Each inner page sets `<body data-page-view="…">`; `ROUTES` in the inner-page script maps views to files.
