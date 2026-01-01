# Performance Budget

This file defines the performance budgets for the GNB Transfer application.

## Bundle Size Limits

### Total Bundle Size
- **Max Total Size:** 5 MB (uncompressed)
- **Max Total Size (Gzipped):** 2 MB

### Individual Chunks
- **Max Chunk Size:** 1 MB per JavaScript chunk
- **Max CSS File:** 500 KB

## Performance Metrics (Lighthouse)

### Desktop
- **Performance:** ≥ 90
- **Accessibility:** ≥ 95
- **Best Practices:** ≥ 95
- **SEO:** ≥ 95

### Mobile
- **Performance:** ≥ 85
- **Accessibility:** ≥ 95
- **Best Practices:** ≥ 95
- **SEO:** ≥ 95

## Load Time Targets

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Total Blocking Time (TBT):** < 200ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Speed Index:** < 3.0s

## Code Coverage Thresholds

### Frontend
- **Statements:** ≥ 70%
- **Branches:** ≥ 65%
- **Functions:** ≥ 65%
- **Lines:** ≥ 70%

### Backend
- **Statements:** ≥ 75%
- **Branches:** ≥ 70%
- **Functions:** ≥ 70%
- **Lines:** ≥ 75%

## Resource Limits

### Images
- **Max Image Size:** 200 KB (optimized)
- **Recommended Formats:** WebP, AVIF with fallbacks
- **Lazy Loading:** Required for images below the fold

### Fonts
- **Max Font Files:** 3
- **Font Display:** swap
- **Preload:** Critical fonts only

### Third-Party Scripts
- **Max Third-Party Scripts:** 5
- **Load Strategy:** Async or defer when possible

## Optimization Checklist

- [ ] Code splitting enabled
- [ ] Tree shaking configured
- [ ] Compression enabled (Gzip and Brotli)
- [ ] Images optimized and lazy-loaded
- [ ] CSS minimized and purged
- [ ] Service Worker for caching
- [ ] Resource hints (preconnect, dns-prefetch)
- [ ] Bundle analysis run and reviewed

## Monitoring

Performance budgets are enforced through:
1. **CI/CD Pipeline:** Bundle size checks in GitHub Actions
2. **Lighthouse CI:** Automated performance audits on PRs
3. **Code Coverage:** Vitest coverage thresholds
4. **Manual Reviews:** Regular performance audits

## Exceeding Budgets

If a performance budget is exceeded:
1. Review the PR changes that caused the increase
2. Identify heavy dependencies or large chunks
3. Apply code splitting or lazy loading
4. Consider alternative libraries or implementations
5. If unavoidable, document the reason and update budget if necessary

## Last Updated

2026-01-01
