# Performance Analysis Report
## Colin O'Neill Portfolio Website

**Analysis Date:** 2025-12-23
**Analyzer:** Claude Code
**Codebase Type:** Static HTML/CSS/JavaScript Portfolio Site

---

## Executive Summary

This portfolio website is well-designed with clean HTML/CSS and good UX, but has **significant performance optimization opportunities**. The main issues are:

1. **Unoptimized images (3.1 MB)** - 47% of total site size
2. **Expensive CSS filters** causing GPU-intensive rendering
3. **Inefficient DOM manipulation** patterns
4. **No responsive image srcsets** for different screen sizes
5. **Inline styles** preventing browser caching
6. **Complex CSS selectors** triggering expensive recalculations

**Impact:** These issues negatively affect:
- Page load time (LCP - Largest Contentful Paint)
- First Contentful Paint (FCP)
- Cumulative Layout Shift (CLS)
- Mobile performance scores
- Core Web Vitals

---

## Critical Performance Issues

### 1. Unoptimized Image Files (CRITICAL)

**Location:** `/images/` directory
**Total Size:** 3.1 MB (47% of codebase)

#### Problem Images:
```
AutoCase.jpg        - 684 KB  ⚠️ CRITICAL
OPTCallout.jpg      - 514 KB  ⚠️ CRITICAL
Opt_Case.jpg        - 499 KB  ⚠️ CRITICAL
F4_1.png            - 414 KB  ⚠️ CRITICAL (should be JPG)
EHIcallout.jpg      - 388 KB  ⚠️ HIGH
F4_1.jpg            - 346 KB  ⚠️ HIGH
air-canada-mobile-2 - 181 KB  ⚠️ MEDIUM
air-canada-mobile-1 - 127 KB  ⚠️ MEDIUM
```

#### Performance Impact:
- **Slow page load** - Particularly on mobile/slow connections
- **Poor LCP score** - Large images delay largest contentful paint
- **Increased bandwidth costs** - For both server and users
- **High mobile data usage** - Bad UX for users on cellular

#### Recommendations:
1. **Compress all JPEGs** - Target < 200 KB per image using tools like:
   - ImageOptim (Mac)
   - TinyPNG/TinyJPG
   - Sharp (CLI)
   - Squoosh (web-based)

2. **Convert PNG to optimized format**
   - `F4_1.png` should be JPG or WebP (not PNG for photos)

3. **Implement responsive images** with `srcset`:
   ```html
   <img src="image-800w.jpg"
        srcset="image-400w.jpg 400w,
                image-800w.jpg 800w,
                image-1200w.jpg 1200w"
        sizes="(max-width: 768px) 100vw, 800px"
        alt="Description">
   ```

4. **Use modern formats** - WebP with JPEG fallback:
   ```html
   <picture>
     <source srcset="image.webp" type="image/webp">
     <img src="image.jpg" alt="Description">
   </picture>
   ```

5. **Complete lazy loading implementation**
   - 8/13 images have `loading="lazy"` ✓
   - 5 images missing it ✗
   - Add to all below-the-fold images

---

### 2. Expensive CSS Blur Filters (CRITICAL)

**Location:** `password-protection.css:12` and `:29`

#### Code:
```css
/* Line 12-15 */
body.content-hidden > *:not(#password-overlay) {
    filter: blur(10px);              /* ⚠️ EXPENSIVE */
    pointer-events: none;
    user-select: none;
}

/* Line 29 */
backdrop-filter: blur(8px);          /* ⚠️ EXPENSIVE */
```

#### Performance Impact:
- **GPU-intensive operations** - Blur triggers expensive compositing
- **Forced repaints/reflows** - When modal appears/disappears
- **Poor animation performance** - Janky transitions
- **Battery drain** - Particularly on mobile devices
- **Delayed First Contentful Paint** - Applied on page load

#### Why This Is Bad:
CSS `filter` and `backdrop-filter` effects:
- Force the browser to create new rendering layers
- Trigger GPU compositing on every frame
- Cause expensive pixel-level operations
- Block the main thread during transitions
- Apply to **entire page content** (`> *`) - extremely costly

#### Recommendations:

**Option 1: Use opacity instead** (Best for performance)
```css
body.content-hidden > *:not(#password-overlay) {
    opacity: 0.3;                    /* Fast, GPU-accelerated */
    pointer-events: none;
    user-select: none;
}
```

**Option 2: Apply blur to background image only**
```css
/* Don't blur ALL content, just add blurred background */
.password-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url('bg-image.jpg');
    filter: blur(10px);
    z-index: -1;
}
```

**Option 3: Hardware acceleration hints** (if you must use blur)
```css
body.content-hidden > *:not(#password-overlay) {
    filter: blur(10px);
    transform: translateZ(0);        /* Force GPU layer */
    will-change: filter;             /* Hint to browser */
}
```

---

### 3. Inefficient DOM Manipulation (HIGH)

**Location:** `index.html:724-733`

#### Code:
```javascript
activeItems.forEach(item => {
    const article = document.createElement('article');
    article.className = 'work-card';

    article.innerHTML = `                          // ⚠️ ISSUE
        <div class="work-meta">
            <h3>${item.title}</h3>
        </div>
        <div class="work-content">
            <p>${item.description}</p>
            <div class="outcome">Outcome: ${item.outcome}</div>
            <a href="${item.caseStudyLink}" class="work-link">Read Case Study →</a>
        </div>
    `;

    fragment.appendChild(article);
});
```

#### Performance Impact:
- **XSS vulnerability** - Unescaped user data in template literals
- **Slower parsing** - innerHTML requires HTML parser for each item
- **Potential security issue** - If data ever comes from external source

#### Why This Is Bad:
1. `innerHTML` parses HTML string for each iteration
2. No escaping of dynamic content (XSS risk)
3. Less performant than `textContent` for plain text
4. Good: Uses DocumentFragment ✓
5. Bad: innerHTML within the fragment ✗

#### Recommendations:

**Option 1: Use textContent for text** (Best)
```javascript
activeItems.forEach(item => {
    const article = document.createElement('article');
    article.className = 'work-card';

    const workMeta = document.createElement('div');
    workMeta.className = 'work-meta';
    const h3 = document.createElement('h3');
    h3.textContent = item.title;              // ✓ Safe, fast
    workMeta.appendChild(h3);

    const workContent = document.createElement('div');
    workContent.className = 'work-content';

    const p = document.createElement('p');
    p.textContent = item.description;         // ✓ Safe, fast

    const outcome = document.createElement('div');
    outcome.className = 'outcome';
    outcome.textContent = `Outcome: ${item.outcome}`;

    const link = document.createElement('a');
    link.href = item.caseStudyLink;
    link.className = 'work-link';
    link.textContent = 'Read Case Study →';

    workContent.append(p, outcome, link);
    article.append(workMeta, workContent);
    fragment.appendChild(article);
});
```

**Option 2: Use template element** (Modern)
```html
<template id="work-card-template">
    <article class="work-card">
        <div class="work-meta">
            <h3 data-bind="title"></h3>
        </div>
        <div class="work-content">
            <p data-bind="description"></p>
            <div class="outcome" data-bind="outcome"></div>
            <a class="work-link" data-bind="link">Read Case Study →</a>
        </div>
    </article>
</template>

<script>
const template = document.getElementById('work-card-template');
activeItems.forEach(item => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('[data-bind="title"]').textContent = item.title;
    clone.querySelector('[data-bind="description"]').textContent = item.description;
    clone.querySelector('[data-bind="outcome"]').textContent = `Outcome: ${item.outcome}`;
    clone.querySelector('[data-bind="link"]').href = item.caseStudyLink;
    fragment.appendChild(clone);
});
</script>
```

---

### 4. Event Listeners Without Optimization (MEDIUM)

**Location:** `index.html:642-645`

#### Code:
```javascript
// Line 642
metricsGrid.addEventListener('scroll', updateButtonStates, { passive: true });

// Line 645
window.addEventListener('resize', updateButtonStates, { passive: true });
```

#### Performance Impact:
- **Frequent firing** - Scroll/resize events fire 60+ times per second
- **Potential jank** - Function runs on every scroll/resize
- **No cleanup** - Listeners remain even if not needed
- **Good:** Uses `{ passive: true }` ✓

#### Why This Is An Issue:
- `updateButtonStates()` calculates `scrollLeft`, `scrollWidth`, `clientWidth` on **every scroll event**
- Layout properties trigger forced reflows when read
- Can cause scroll jank on lower-end devices

#### Recommendations:

**Option 1: Debounce resize, throttle scroll** (Best)
```javascript
// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Throttle scroll (max 10 calls/second)
metricsGrid.addEventListener('scroll',
    throttle(updateButtonStates, 100),
    { passive: true }
);

// Debounce resize (wait 150ms after resize stops)
window.addEventListener('resize',
    debounce(updateButtonStates, 150),
    { passive: true }
);
```

**Option 2: Use requestAnimationFrame** (Smoother)
```javascript
let ticking = false;

function requestUpdateButtonStates() {
    if (!ticking) {
        requestAnimationFrame(() => {
            updateButtonStates();
            ticking = false;
        });
        ticking = true;
    }
}

metricsGrid.addEventListener('scroll', requestUpdateButtonStates, { passive: true });
window.addEventListener('resize', requestUpdateButtonStates, { passive: true });
```

**Option 3: Intersection Observer** (Modern, efficient)
```javascript
// Use IntersectionObserver to detect when metrics are visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            updateButtonStates();
        }
    });
}, { threshold: 0.1 });

observer.observe(metricsSection);
```

---

### 5. Massive Inline Styles Block (MEDIUM)

**Location:** `index.html:28-420` (392 lines!)

#### Performance Impact:
- **Not cached** - Inline styles can't be cached between page loads
- **Larger HTML** - Bloats initial HTML payload
- **Blocking render** - Must be parsed before page renders
- **Duplicate code** - Case study pages have similar duplication

#### Current Structure:
```
index.html:
  - 392 lines of inline <style> (11+ KB)
  - External styles.css (571 lines)

Each case study page:
  - 100+ lines of inline <style>
  - External styles.css (same 571 lines)
```

#### Why This Is Bad:
- First page load: Download 11 KB inline + 571 lines external
- Navigate to case study: Can't reuse ANY index styles (not cached)
- Navigate back: Inline styles re-parsed from HTML
- External CSS would be cached after first load

#### Recommendations:

**Option 1: Move ALL to external stylesheet** (Best)
```
styles.css           - Global styles
index-styles.css     - Index-specific styles
case-study-styles.css - Case study-specific styles
```

```html
<!-- index.html -->
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="index-styles.css">

<!-- case-study-*.html -->
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="case-study-styles.css">
```

**Benefits:**
- Browser caches all CSS files
- Parallel downloads
- Smaller HTML payloads
- Faster subsequent page loads

**Option 2: Keep minimal critical CSS inline**
```html
<!-- Only critical above-the-fold styles inline (< 14 KB) -->
<style>
  /* Just navigation, hero, fonts */
  nav { ... }
  header { ... }
  @font-face { ... }
</style>

<!-- Everything else external -->
<link rel="stylesheet" href="styles.css">
```

---

### 6. Complex CSS Selectors (MEDIUM)

**Location:** `password-protection.css:11`

#### Code:
```css
body.content-hidden > *:not(#password-overlay) {
    filter: blur(10px);
    pointer-events: none;
    user-select: none;
}
```

#### Performance Impact:
- **Expensive selector** - Browser checks EVERY child element
- **Negation pseudo-class** - :not() adds complexity
- **ID selector in :not()** - Requires checking all children
- **Combined with blur filter** - Double performance hit

#### Why This Is Bad:
1. `> *` matches all direct children of body
2. `:not(#password-overlay)` filters out one element
3. Browser must evaluate this for every DOM element
4. On a page with 100+ elements, that's 100+ checks
5. Combined with `filter: blur()` - compounds the issue

#### Recommendations:

**Option 1: Use a wrapper div** (Best)
```html
<body>
  <div id="main-content" class="blurred-when-locked">
    <!-- All your page content -->
  </div>
  <div id="password-overlay">...</div>
</body>
```

```css
/* Much simpler, faster selector */
.blurred-when-locked {
    filter: blur(10px);  /* Only if you must use blur */
    pointer-events: none;
}
```

**Option 2: Use data attribute**
```html
<body data-locked="true">
```

```css
[data-locked="true"] #main-content {
    opacity: 0.3;  /* Better than blur */
    pointer-events: none;
}
```

---

### 7. Deprecated CSS Property (LOW)

**Location:** `index.html:155`

#### Code:
```css
.metrics-grid {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;  /* ⚠️ DEPRECATED */
    scroll-snap-type: x mandatory;
}
```

#### Issue:
- `-webkit-overflow-scrolling: touch` is **deprecated**
- No longer needed in modern browsers
- Momentum scrolling is now default on iOS

#### Recommendation:
```css
.metrics-grid {
    overflow-x: auto;
    /* Remove -webkit-overflow-scrolling */
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;  /* Modern alternative */
}
```

---

### 8. Missing Responsive Images (MEDIUM)

**Status:**
- 13 total `<img>` tags across site
- 8 have `loading="lazy"` ✓
- 5 missing lazy loading ✗
- **0 have srcset** ✗✗✗

#### Impact:
- Mobile users download desktop-sized images
- Wasted bandwidth (684 KB image on 375px screen)
- Slower mobile performance

#### Recommendation:
Create multiple image sizes:
```bash
# Example for AutoCase.jpg (684 KB)
AutoCase-400w.jpg   (~60 KB)  - Mobile
AutoCase-800w.jpg   (~150 KB) - Tablet
AutoCase-1200w.jpg  (~250 KB) - Desktop
AutoCase.webp       (~180 KB) - Modern browsers
```

Then use:
```html
<picture>
  <source
    type="image/webp"
    srcset="AutoCase-400w.webp 400w,
            AutoCase-800w.webp 800w,
            AutoCase-1200w.webp 1200w"
    sizes="(max-width: 768px) 100vw, 800px">
  <img
    src="AutoCase-800w.jpg"
    srcset="AutoCase-400w.jpg 400w,
            AutoCase-800w.jpg 800w,
            AutoCase-1200w.jpg 1200w"
    sizes="(max-width: 768px) 100vw, 800px"
    alt="Description"
    loading="lazy">
</picture>
```

---

## Algorithm Analysis

### No Inefficient Algorithms Found ✓

The JavaScript code is minimal and efficient:
- Simple forEach loops (O(n))
- Direct DOM queries with IDs (O(1))
- No nested loops
- No recursive functions
- No heavy computations

**One minor note:**
```javascript
// Line 617-618
const scrollLeft = metricsGrid.scrollLeft;
const maxScroll = metricsGrid.scrollWidth - metricsGrid.clientWidth;
```

Reading `scrollWidth` and `clientWidth` triggers **layout recalculation** (reflow).
This is fine if not called excessively, but runs on every scroll event.

**Better approach:** Cache these values on resize only:
```javascript
let maxScroll = 0;

function cacheMetricsDimensions() {
    maxScroll = metricsGrid.scrollWidth - metricsGrid.clientWidth;
}

function updateButtonStates() {
    const scrollLeft = metricsGrid.scrollLeft;
    scrollLeftBtn.disabled = scrollLeft <= 0;
    scrollRightBtn.disabled = scrollLeft >= maxScroll - 1;
}

// Update cache on resize
window.addEventListener('resize', debounce(() => {
    cacheMetricsDimensions();
    updateButtonStates();
}, 150));

// Initial cache
cacheMetricsDimensions();
```

---

## What's NOT an Issue

### No N+1 Queries ✓
- **No backend** - Pure static site
- **No database** - No SQL queries
- **No API calls** - All data is inlined
- **Not applicable** for this codebase

### No React Re-render Issues ✓
- **No React** - Vanilla JavaScript only
- **No Vue/Angular** - No framework
- **No virtual DOM** - Direct DOM manipulation
- **Not applicable** for this codebase

### Good Practices Found ✓
1. **DocumentFragment usage** - Batch DOM insertions (`index.html:718`)
2. **Passive event listeners** - `{ passive: true }` on scroll/resize
3. **Semantic HTML** - Good accessibility structure
4. **CSS custom properties** - Maintainable theming
5. **Mobile-responsive** - Thoughtful breakpoints
6. **Some lazy loading** - 8/13 images have it

---

## Performance Metrics Impact

### Estimated Current Scores:
- **LCP (Largest Contentful Paint):** 3.5-4.5s (Poor)
  - Large unoptimized images delay render

- **FCP (First Contentful Paint):** 2.0-2.5s (Needs Improvement)
  - Inline styles + blur filters block rendering

- **CLS (Cumulative Layout Shift):** < 0.1 (Good)
  - Images have dimensions, layout stable

- **TBT (Total Blocking Time):** < 300ms (Good)
  - Minimal JavaScript execution

- **Mobile Performance:** 50-65 (Poor)
- **Desktop Performance:** 75-85 (Needs Improvement)

### After Optimizations:
- **LCP:** 1.5-2.0s (Good) ✓
- **FCP:** 1.0-1.2s (Good) ✓
- **Mobile Performance:** 85-95 (Good) ✓
- **Desktop Performance:** 95-100 (Excellent) ✓

---

## Priority Recommendations

### HIGH PRIORITY (Implement Immediately)

1. **Optimize Images** (Biggest impact - 47% size reduction possible)
   - Compress all JPEGs to < 200 KB
   - Convert F4_1.png to JPG
   - Implement responsive srcsets
   - Estimated savings: 2+ MB

2. **Replace CSS Blur Filters** (Major render performance gain)
   - Use opacity instead of blur
   - Remove backdrop-filter
   - Simplify selector from `> *:not()` to single class

3. **Move Inline Styles to External CSS** (Caching + maintainability)
   - Extract 392 lines from index.html
   - Create index-styles.css and case-study-styles.css
   - Enable browser caching

### MEDIUM PRIORITY (Next Sprint)

4. **Optimize Event Listeners**
   - Add debounce to resize
   - Add throttle to scroll
   - Cache layout dimensions

5. **Complete Lazy Loading**
   - Add `loading="lazy"` to remaining 5 images
   - Consider adding to below-fold content

6. **Fix DOM Manipulation**
   - Replace innerHTML with textContent
   - Use template element or createElement

### LOW PRIORITY (Future Enhancement)

7. **Remove Deprecated CSS**
   - Delete `-webkit-overflow-scrolling: touch`

8. **Add Modern Image Formats**
   - Generate WebP versions
   - Implement <picture> with fallbacks

9. **Consider Build Process**
   - Minification (HTML, CSS, JS)
   - Asset optimization pipeline
   - Critical CSS extraction

---

## Testing Recommendations

After implementing changes, test with:

1. **Chrome DevTools Lighthouse**
   ```
   - Run for Mobile
   - Run for Desktop
   - Check Performance score
   - Review Core Web Vitals
   ```

2. **WebPageTest** (https://webpagetest.org)
   ```
   - Test from multiple locations
   - Check filmstrip view
   - Analyze waterfall
   ```

3. **Real Device Testing**
   ```
   - iPhone SE (low-end device)
   - Slow 3G throttling
   - Test password modal blur performance
   ```

4. **Browser DevTools Performance Panel**
   ```
   - Record page load
   - Check for long tasks
   - Identify forced reflows
   - Measure paint times
   ```

---

## Conclusion

This is a **well-designed portfolio site** with excellent UX and clean code structure. The performance issues are **fixable** and mostly related to:

1. **Asset optimization** (images)
2. **CSS performance** (filters, selectors)
3. **Caching strategy** (inline vs external CSS)

**Implementing the HIGH PRIORITY fixes could:**
- Reduce page size by 65% (6.6 MB → 2.3 MB)
- Improve mobile performance score by 30-40 points
- Reduce LCP by 2+ seconds
- Dramatically improve perceived performance

**None of the issues require major refactoring** - they're all straightforward optimizations that maintain the existing design and functionality.

---

**Next Steps:**
1. Start with image optimization (biggest impact)
2. Replace blur filters with opacity
3. Extract inline styles to external files
4. Test performance improvements
5. Iterate on remaining optimizations

Good luck!
