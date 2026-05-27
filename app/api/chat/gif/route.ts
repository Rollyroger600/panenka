import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET /api/chat/gif?q=<query>&offset=<n>
// Proxies GIPHY search to avoid exposing API key client-side
export async function GET(req: NextRequest) {
  const jar = await cookies()
  const initials = jar.get('participant')?.value
  if (!initials) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const offset = req.nextUrl.searchParams.get('offset') ?? '0'
  const apiKey = process.env.GIPHY_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'GIPHY niet geconfigureerd' }, { status: 503 })
  }

  const endpoint = q.trim()
    ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=24&offset=${offset}&rating=pg-13&lang=nl`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=24&offset=${offset}&rating=pg-13`

  const res = await fetch(endpoint, { next: { revalidate: 60 } })
  if (!res.ok) {
    return NextResponse.json({ error: 'GIPHY fout' }, { status: 502 })
  }

  const json = await res.json()

  // Return only what we need: id, title, preview + original URLs
  const gifs = (json.data ?? []).map((g: GiphyGif) => ({
    id: g.id,
    title: g.title,
    preview: g.images.fixed_height_small.url,
    original: g.images.fixed_height.url,
  }))

  return NextResponse.json({ gifs })
}

interface GiphyGif {
  id: string
  title: string
  images: {
    fixed_height_small: { url: string }
    fixed_height: { url: string }
  }
}
