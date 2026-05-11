import { NextResponse } from 'next/server'

import { getSREFExport } from '@/lib/protocol/client'

/**
 * GET /api/export/sref
 *
 * Hämtar användarens SREF v1-doc från Selvra-protokollet och returnerar
 * som nedladdningsbart JSON-attachment. Browser triggar fil-spara-dialog
 * via Content-Disposition: attachment.
 *
 * Filnamn: selvra-sref-YYYY-MM-DD.json
 */

export async function GET() {
  let response
  try {
    response = await getSREFExport()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new NextResponse(
      JSON.stringify({ error: 'sref_export_failed', message: msg }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const filename = `selvra-sref-${today}.json`
  const body = JSON.stringify(response.document, null, 2)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // För server-rendrade attachments: cache:a inte i CDN/browser
      'Cache-Control': 'no-store',
    },
  })
}
