// Cloudflare Pages Function for shared CampusFind report links.
//
//   /apps/campusfind/reports/:id            -> preview page (HTML with Open Graph tags)
//   /apps/campusfind/reports/image/:id?v=…  -> the report's first photo, for og:image
//
// Replaces two Netlify-only pieces from when the library was hosted there:
// netlify/edge-functions/report-preview.ts (the HTML page) and the
// _redirects line that proxied /image/:id to Supabase - Cloudflare Pages
// can't proxy to another domain from _redirects, so both live here now.
//
// Why a function at all: Facebook/Messenger's crawler doesn't run JavaScript,
// so the React SPA's empty <div id="root"> gives it nothing to build a card
// from. The report data comes from the campusfind Supabase project's
// og-preview function as JSON; the HTML is rendered here because Supabase
// Edge Functions on *.supabase.co force text/html responses to text/plain.
//
// SUPABASE_ANON_KEY is the same public anon key already shipped in
// campusfind's own client bundle - it grants no special access. The report
// lookup itself runs with the service-role key inside the Supabase function.

const SUPABASE_FUNCTIONS_URL = 'https://muigquisnrhdbvnexyzu.supabase.co/functions/v1/og-preview'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11aWdxdWlzbnJoZGJ2bmV4eXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODU4MTMsImV4cCI6MjA5ODM2MTgxM30.TUGW681ref_ioR609DXL6MaYXV1pzX3Sl1RgwBEwhg8'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderPage({ title, description, imageUrl, pageUrl, reportId, shareBase }) {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const imageTags = imageUrl
    ? `
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`
    : `
    <meta name="twitter:card" content="summary" />`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<meta property="og:type" content="website" />
<meta property="og:site_name" content="CampusFind" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />${imageTags}
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background: #06433C; color: #fff; margin: 0; padding: 24px 20px; }
  .card { max-width: 420px; margin: 0 auto; }
  img { width: 100%; border-radius: 16px; display: block; margin-bottom: 16px; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p { color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.4; }
  a.cta { display: inline-block; margin-top: 8px; color: #fff; text-decoration: underline; }
  .brand { margin-top: 24px; font-size: 13px; color: rgba(255,255,255,0.5); }
</style>
</head>
<body>
  <div class="card">
    ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" />` : ''}
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <p><a class="cta" href="${escapeHtml(shareBase)}">Open CampusFind to view or respond &rarr;</a></p>
    <p class="brand">CampusFind &middot; NWSSU Lost &amp; Found</p>
  </div>
  <script>
    // Crawlers never run this; they read the og:* tags above. Real browsers
    // run it immediately.
    //
    // Android App Links open the installed app straight to the report only
    // when the tap goes through Android's normal link handling. Chat apps
    // (Messenger, Instagram, sometimes WhatsApp) open links in their own
    // in-app browser instead and land here even with the app installed - so
    // on Android, try an explicit intent: URI first, which launches the app
    // to this report, falling back to the download page if it isn't
    // installed. Other platforms go to the download page.
    if (/Android/i.test(navigator.userAgent) && ${JSON.stringify(reportId)}) {
      window.location.replace(
        ${JSON.stringify(`intent://${shareBase.replace(/^https?:\/\//, '')}/reports/`)} +
          ${JSON.stringify(reportId)} +
          '#Intent;scheme=https;package=com.nwssu.campusfind;S.browser_fallback_url=' +
          encodeURIComponent(${JSON.stringify(shareBase)}) +
          ';end'
      )
    } else {
      window.location.replace(${JSON.stringify(shareBase)})
    }
  </script>
</body>
</html>`
}

// The og:image. The ?v=<photo filename> on the URL changes whenever the
// report's photo does, so caching it hard at the edge is safe.
async function serveImage(id, request) {
  const upstream = await fetch(`${SUPABASE_FUNCTIONS_URL}/image/${encodeURIComponent(id)}`, {
    headers: { apikey: SUPABASE_ANON_KEY },
    cf: { cacheTtl: 86400, cacheEverything: true },
  })
  if (!upstream.ok) {
    return new Response('Image not found', { status: upstream.status === 404 ? 404 : 502 })
  }
  const versioned = new URL(request.url).searchParams.has('v')
  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': versioned ? 'public, max-age=86400' : 'public, max-age=300',
    },
  })
}

export async function onRequestGet({ request, params }) {
  const parts = [].concat(params.path ?? []).filter(Boolean)
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' }

  if (parts[0] === 'image' && parts[1]) return serveImage(parts[1], request)

  const id = parts[0]
  if (!id || parts.length > 1) {
    return new Response('Missing report id', { status: 400, headers: htmlHeaders })
  }

  // Links point at whichever address this library is served from, so the
  // page works the same on the old Netlify address and the new one.
  const shareBase = `${new URL(request.url).origin}/apps/campusfind`

  let data
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${encodeURIComponent(id)}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
    data = await res.json()
  } catch (err) {
    console.error('report-preview: failed to fetch report data', err)
    return new Response('Unexpected server error', { status: 500, headers: htmlHeaders })
  }

  const pageUrl = `${shareBase}/reports/${id}`

  if (!data || data.notFound || !data.title) {
    return new Response(
      renderPage({
        title: 'Report not found',
        description: 'This CampusFind report no longer exists.',
        imageUrl: null,
        pageUrl,
        reportId: null,
        shareBase,
      }),
      { status: 404, headers: htmlHeaders }
    )
  }

  const imageUrl = data.photoFilename
    ? `${shareBase}/reports/image/${id}?v=${encodeURIComponent(data.photoFilename)}`
    : null

  return new Response(
    renderPage({ title: data.title, description: data.description ?? '', imageUrl, pageUrl, reportId: id, shareBase }),
    { headers: htmlHeaders }
  )
}
