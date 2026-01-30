
# Make PublicEventPage Fully Replace Template with GrapesJS Content

## Current Behavior Comparison

| Page | GrapesJS Content Handling |
|------|---------------------------|
| `EventLandingPage.tsx` | **Full replacement** - Lines 244-267 return a completely custom page with only GrapesJS HTML/CSS, GlobalFooter, and CookieConsentBanner |
| `PublicEventPage.tsx` | **Embedded section** - Lines 416-434 render GrapesJS content inside a `<Card>` within the default template (hero, sidebar, about sections still visible) |

## Proposed Solution

Modify `PublicEventPage.tsx` to add an early return when GrapesJS content is available, matching `EventLandingPage.tsx` behavior exactly.

---

## Implementation Details

### File: `src/components/events/PublicEventPage.tsx`

Add an early return block **after** the error/not-found check (after line 234) and **before** the default template rendering (line 236):

```tsx
// After line 234 (after error/not-found check, before const org = ...)

// Prefer GrapesJS-built landing page when available (full page replacement)
if (event.landing_page_data && (event.landing_page_data as any).html) {
  const lp = event.landing_page_data as any as { 
    html: string; 
    css?: string | null; 
    meta?: { title?: string; description?: string } 
  };

  // Sanitize HTML and CSS to prevent XSS attacks
  const sanitizedHTML = sanitizeLandingPageHTML(lp.html);
  const sanitizedCSS = lp.css ? sanitizeLandingPageCSS(lp.css) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SkipLink href="#main-content" />
      <main id="main-content" className="flex-1">
        <section className="border-b border-border bg-background">
          {/* Inject sanitized GrapesJS CSS into the page scope */}
          {sanitizedCSS && <style dangerouslySetInnerHTML={{ __html: sanitizedCSS }} />}
          <div
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
          />
        </section>
      </main>
      <GlobalFooter />
      <CookieConsentBanner />
    </div>
  );
}
```

### Remove Embedded Card Rendering

Since we now handle GrapesJS content with a full page replacement, remove the embedded rendering (lines 416-434):

**Before:**
```tsx
{/* Render custom landing page if available (sanitized to prevent XSS) */}
{event.landing_page_data && (event.landing_page_data as any).html && (
  <Card id="custom-content">
    <CardContent className="pt-6">
      {(event.landing_page_data as any).css && (
        <style
          dangerouslySetInnerHTML={{ 
            __html: sanitizeLandingPageCSS((event.landing_page_data as any).css) 
          }}
        />
      )}
      <div
        dangerouslySetInnerHTML={{ 
          __html: sanitizeLandingPageHTML((event.landing_page_data as any).html) 
        }}
      />
    </CardContent>
  </Card>
)}
```

**After:** Remove this entire block (it will never be reached since we return early)

---

## Behavior After Change

| Scenario | PublicEventPage Behavior |
|----------|--------------------------|
| Event has GrapesJS landing page | Full page replacement with custom HTML/CSS + footer + cookie banner |
| Event has no GrapesJS content | Default template with hero, about, sidebar, organizer card |

---

## Files to Modify

| File | Change Type |
|------|-------------|
| `src/components/events/PublicEventPage.tsx` | Edit - Add early return for GrapesJS, remove embedded Card rendering |

---

## Preserved Functionality

The following will still work after this change:
- SEO hooks (`useSeo`) - already runs before the early return
- JSON-LD structured data - already runs before the early return
- UTM tracking and page view tracking - already runs before the early return
- Section deep-linking - works within GrapesJS content if sections have IDs
- Language attribute setting - already runs before the early return
- Cookie consent and global footer - included in the early return block

---

## Testing Checklist

- [ ] Create an event with a custom landing page via the page builder
- [ ] Publish the landing page
- [ ] Visit `/event/:slug` - should show only the custom GrapesJS content
- [ ] Verify GlobalFooter and CookieConsentBanner are present
- [ ] Verify event without custom landing page shows default template
- [ ] Test "View Full Details" link still works from GrapesJS pages (if included as a block)
