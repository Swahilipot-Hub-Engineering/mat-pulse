# Security Policy

The security and privacy of commuters and transit operators are paramount to Swahilipot Hub.

## Reporting a Vulnerability

If you discover a security vulnerability in this project:

1. **Do not open a public GitHub issue.**
2. Send an email to the Swahilipot Hub Engineering security team or open a private advisory at:
   https://github.com/Swahilipot-Hub-Engineering/mat-pulse/security/advisories/new
3. Include details of the vulnerability, steps to reproduce, and any proof-of-concept material.

We will acknowledge receipt within 2 working days and provide an estimated fix timeline.

## Data Protection & Privacy

| Question | Details |
| :--- | :--- |
| Does this project store commuter personal data? | **No.** Commuters access feeds and maps anonymously without accounts. |
| What vehicle data is stored? | Transient GPS coordinates, vehicle registration / ID, speed, and heading. |
| Where is it stored? | In-memory with a 5-minute expiry threshold for stale vehicles. |
| Access control | Public GTFS feeds are open data; ingest endpoints can be authenticated via API secret. |
