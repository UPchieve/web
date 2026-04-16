# Security Policy

## Reporting a Vulnerability

We take the security of this project seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitLab issues.**

### How to Report

Send an email to **security@upchieve.org** with the following information:

- **Subject:** `[SECURITY] Brief description of the vulnerability`
- **Description:** A clear and concise description of the vulnerability
- **Steps to reproduce:** Detailed steps to reproduce the issue
- **Impact:** What an attacker could achieve by exploiting this vulnerability
- **Suggested fix:** (Optional) If you have ideas on how to fix the issue

### Testing Environment

If you wish to do active testing, we prefer you use our staging environment at **https://staging.upchieve.org**, which is continuously deployed and closely mirrors production. That said, we understand that vulnerabilities may be discovered through normal use of the production site — this does not disqualify a report.

We ask that you:
- Avoid automated scanning of production.
- Do not access, modify, or exfiltrate data belonging to other users.
- Act in good faith and avoid disrupting our services.

### What to Expect

- **Acknowledgement:** You will receive an acknowledgement within **48 hours** of your report.
- **Updates:** We will keep you informed of our progress toward a fix.
- **Resolution timeline:** We aim to resolve critical vulnerabilities within **90 days**.
- **Credit:** With your permission, we will acknowledge your contribution by name in the public disclosure.

## Disclosure Policy

We follow a **coordinated disclosure** policy:

1. The reporter submits a vulnerability report privately.
2. We investigate and work on a fix.
3. The fix is deployed to production.
4. We publish a public disclosure (see below) and credit the reporter.

We kindly ask that you give us reasonable time to address the issue before any public disclosure.

### How We Disclose

1. Upon report, we open a [confidential GitLab issue](https://docs.gitlab.com/user/project/issues/confidential_issues/) to track the vulnerability during the investigation and fix, then make it public after deployment.
2. For significant vulnerabilities, we will request a [CVE identifier](https://docs.gitlab.com/user/application_security/cve_id_request/) via GitLab, which provides a permanent, publicly searchable record.
3. Credit the reporting researcher by name (with their permission) in the public issue and/or CVE record.

## Contact

| Purpose           | Contact              |
| ----------------- | -------------------- |
| Security issues   | security@upchieve.org |
| General questions | support@upchieve.org  |
