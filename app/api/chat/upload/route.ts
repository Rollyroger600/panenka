import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { put } from '@vercel/blob'

const MAX_SIZE_MB = 10

// POST /api/chat/upload
// Multipart form-data: file field
export async function POST(req: NextRequest) {
  const jar = await cookies()
  const initials = jar.get('participant')?.value
  if (!initials) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Geen bestand' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Alleen afbeeldingen toegestaan' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Maximaal ${MAX_SIZE_MB}MB` }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `chat/${initials.toLowerCase()}-${Date.now()}.${ext}`

  try {
    const blob = await put(filename, file, { access: 'public' })
    return NextResponse.json({ url: blob.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Blob upload fout:', msg)
    return NextResponse.json({ error: `Blob fout: ${msg}` }, { status: 500 })
  }
}
