// Renders the public preview page for a shared CampusFind report link
// (/apps/campusfind/reports/:id), with real Open Graph tags so Facebook/
// Messenger's crawler can build a rich card - the React SPA can't do this on
// its own (it ships an empty <div id="root"> that only fills in client-side).
//
// The actual report data comes from the campusfind Supabase project's
// og-preview function, which returns JSON (not HTML - Supabase Edge
// Functions on the shared *.supabase.co domain force text/html responses to
// text/plain, a platform restriction only lifted on a paid plan with a
// custom domain). Rendering the HTML here instead is what that function's
// own comments point to - Netlify has no such restriction.
//
// SUPABASE_ANON_KEY below is the same public anon key already embedded in
// campusfind's own client bundle - safe to ship in source, it grants no
// special access. The report-data lookup itself runs behind the service-role
// key inside the Supabase function, not this one.

const SUPABASE_FUNCTIONS_URL = 'https://muigquisnrhdbvnexyzu.supabase.co/functions/v1/og-preview'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11aWdxdWlzbnJoZGJ2bmV4eXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODU4MTMsImV4cCI6MjA5ODM2MTgxM30.TUGW681ref_ioR609DXL6MaYXV1pzX3Sl1RgwBEwhg8'
const PUBLIC_SHARE_URL = 'https://nwssu-library.netlify.app/apps/campusfind'
const LIBRARY_DOWNLOAD_URL = PUBLIC_SHARE_URL

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderPage({
  title,
  description,
  imageUrl,
  pageUrl,
}: {
  title: string
  description: string
  imageUrl: string | null
  pageUrl: string
}): string {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const imageTags = imageUrl
    ? `
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${imageUrl}" />`
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
<meta property="og:url" content="${pageUrl}" />${imageTags}
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
    ${imageUrl ? `<img src="${imageUrl}" alt="" />` : ''}
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
    <p><a class="cta" href="${LIBRARY_DOWNLOAD_URL}">Open CampusFind to view or respond &rarr;</a></p>
    <p class="brand">CampusFind &middot; NWSSU Lost &amp; Found</p>
  </div>
  <script>
    // Crawlers (Facebook/Messenger/etc.) never execute this - they only
    // read the og:* tags above, so the preview card still renders correctly.
    // Real browsers run it immediately, sending a human here (no app
    // installed - Android App Links intercepts the link before it ever
    // reaches this page when the app IS installed) on to the download page.
    // Safe here specifically because this page is served by Netlify, not
    // Supabase - Supabase's Edge Functions gateway forces any text/html
    // response containing a <script> tag down to text/plain with a CSP
    // sandbox (a platform restriction, see the campusfind repo's og-preview
    // function for where that was discovered), so this exact approach could
    // not work there. Netlify has no such restriction.
    window.location.replace(${JSON.stringify(LIBRARY_DOWNLOAD_URL)})
  </script>
</body>
</html>`
}

export default async (request: Request) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').filter(Boolean).pop()
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' }

  if (!id) {
    return new Response('Missing report id', { status: 400, headers: htmlHeaders })
  }

  let data: { notFound: boolean; title?: string; description?: string; photoFilename?: string | null }
  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${id}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
    data = await res.json()
  } catch (err) {
    console.error('report-preview: failed to fetch report data', err)
    return new Response('Unexpected server error', { status: 500, headers: htmlHeaders })
  }

  const pageUrl = `${PUBLIC_SHARE_URL}/reports/${id}`

  if (data.notFound) {
    return new Response(
      renderPage({
        title: 'Report not found',
        description: 'This CampusFind report no longer exists.',
        imageUrl: null,
        pageUrl,
      }),
      { status: 404, headers: htmlHeaders }
    )
  }

  const imageUrl = data.photoFilename
    ? `${PUBLIC_SHARE_URL}/reports/image/${id}?v=${encodeURIComponent(data.photoFilename)}`
    : null

  return new Response(
    renderPage({ title: data.title!, description: data.description!, imageUrl, pageUrl }),
    { headers: htmlHeaders }
  )
}

export const config = { path: '/apps/campusfind/reports/:id' }
