import { NextResponse } from 'next/server'

// GET /api/push/vapid-public-key
// Returns the VAPID public key for client-side subscription setup
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) return NextResponse.json({ error: 'VAPID niet geconfigureerd' }, { status: 503 })
  return NextResponse.json({ publicKey: key })
}
