MYJFT PWA — FIRST FUNCTIONAL FOUNDATION

Files:
- index.html: responsive learning app UI and interactions
- manifest.webmanifest: install metadata
- sw.js: offline app-shell caching
- icon.svg: app icon

Run locally:
Use a local web server (service workers require localhost or HTTPS), e.g. `python -m http.server 8000`, then open http://localhost:8000.

Deploy:
Upload these files to a GitHub repository and enable GitHub Pages, or deploy the folder to Cloudflare Pages. HTTPS is required for PWA installation and service workers.

Important content status:
The included 5-question quiz and vocabulary set are clearly starter/demo learning content to test interactions. The previously defined 211-question MyJFT source bank must be imported from the verified source files; it has not been silently recreated or modified here. Mock exam and flashcard screens are placeholders pending verified source integration.

Progress is stored locally in the browser. Audio uses the device/browser Japanese speech synthesis voice when available; voice availability varies by device. This first build does not include cloud accounts or cross-device sync.
