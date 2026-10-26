# WaterWolf security status

The desktop app isolates remote pages in sandboxed Chromium views with Node integration disabled and context isolation enabled. The application shell uses a narrow preload API and checks the sender of every IPC request. Site permission requests and downloads are denied. Top-level navigation and popups are limited to HTTP(S) addresses without embedded credentials. Invalid TLS certificates are rejected.

Live research uses a temporary Chromium session. It accepts only public HTTPS hostnames, rejects local and private address names, checks every resolved DNS answer against private and reserved IP ranges before each request, denies permissions and downloads, and clears session storage and cache when the run ends. A DNS check before a request reduces the chance of local-network access, but cannot fully prevent DNS rebinding because Chromium may resolve the name again when connecting. Agent browsing must not be treated as a hardened network isolation boundary.

The Shield shows aggregate blocked-event counts. It does not store blocked URLs or page contents. AI page text is sent to the provider only for a user-approved summary or research flow; live research sends the sources it reads to the configured provider. AI outputs and web page text remain untrusted.

Current limits: there is no malware or phishing reputation service, file scanning, downloadable-file review flow, independent network proxy for agent traffic, or code-signing certificate for Windows builds. Downloads remain disabled while those controls are absent. Update checks are automatic in the installed edition; downloading and installing an update requires a user action.

Please report vulnerabilities privately to the repository maintainers instead of opening a public issue with exploit details.
