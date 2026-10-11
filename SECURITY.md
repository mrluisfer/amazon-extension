# Security Policy

This extension runs on a shopping site and its API accepts crowdsourced data, so we take
security and privacy reports seriously. Thank you for helping keep users safe.

## Reporting a vulnerability

**Please do not open a public issue, discussion or pull request for security problems.**

Report privately through GitHub:
[**Report a vulnerability**](https://github.com/mrluisfer/amazon-extension/security/advisories/new)
(Security tab → _Report a vulnerability_).

Please include:

- What component is affected (extension, API, website, parser) and the version or commit.
- Steps to reproduce or a proof of concept, and the impact you expect.
- Whether the issue is already public anywhere.

What to expect:

- Acknowledgement within **5 business days** (this is a volunteer project).
- An initial assessment and, if confirmed, a fix plan within **15 business days**.
- Credit in the advisory once a fix ships, unless you prefer to stay anonymous.

## Supported versions

Only the latest published version of the extension and the currently deployed API receive
security fixes.

## Scope

In scope, for example:

- Ways for a web page, Amazon's DOM or another extension to read the auth token, call the API
  as a user, or bypass the message sender allow-lists.
- XSS or code execution in extension pages (panel, popup, options) or the website.
- Collecting or sending data without consent, or beyond what the
  [privacy policy](apps/web/app/routes/privacy.tsx) describes.
- API authentication/authorization flaws, data poisoning that bypasses corroboration, or
  ways to access another user's watchlist.
- Leaked credentials in this repository.

Out of scope:

- Vulnerabilities in Amazon's own website or services (report those to Amazon).
- Volumetric denial of service or rate-limit exhaustion without a bypass.
- Reports from automated scanners without a demonstrated impact.
- Missing hardening headers on the static website with no exploitable issue.

## Safe harbor

We won't pursue or support legal action against good-faith research that respects user
privacy, avoids degrading the service, does not access other users' data beyond what is
needed to demonstrate the issue, and gives us reasonable time to fix it before disclosure.

Our threat model and mitigations are documented in [`docs/security.md`](docs/security.md).
