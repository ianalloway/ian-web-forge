# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this portfolio website, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns directly to: **ian@allowayllc.com**
3. Include the following in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time**: You will receive an acknowledgment within 48 hours
- **Updates**: We will provide status updates every 5 business days
- **Resolution**: Critical vulnerabilities will be addressed within 7 days
- **Credit**: Security researchers will be credited (unless anonymity is requested)

## Security Considerations

### Website Security

This is a static portfolio website. Security considerations include:

- **XSS Prevention**: All user-generated content is sanitized
- **HTTPS**: Site is served over HTTPS only
- **Content Security Policy**: CSP headers are configured
- **External Links**: External links use `rel="noopener noreferrer"`

### Third-Party Services

- **Vercel/Netlify**: Hosting platform security
- **RSS Feed**: External RSS service for blog posts
- **Analytics**: Google Analytics (if enabled)

### Secure Development Checklist

- [ ] Keep dependencies updated
- [ ] Run `npm audit` regularly
- [ ] Review third-party scripts before inclusion
- [ ] Validate all external data sources
- [ ] Use environment variables for sensitive config

## Responsible Disclosure

We follow responsible disclosure practices:

1. Reporter notifies us of vulnerability
2. We acknowledge and begin investigation
3. We develop and test a fix
4. We release the fix and notify users
5. After 90 days (or upon fix release), details may be published

## Contact

- Security Email: ian@allowayllc.com
- General Contact: [@ianallowayxyz](https://x.com/ianallowayxyz)
