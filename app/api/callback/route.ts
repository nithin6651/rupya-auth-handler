// app/api/callback/route.ts
import { NextResponse } from 'next/server'

// Prevent static optimization
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
  }

  console.log('🔗 Received Upstox code:', code)

  const isProduction = process.env.NODE_ENV === 'production'
  const redirectUrl = isProduction
    ? `https://uywnylyarazecapuxjvh.supabase.co/auth/v1/callback?code=${code}`
    : `http://localhost:3000/api/upstox-token?code=${code}`

  console.log('🔁 Redirecting to:', redirectUrl)
  return NextResponse.redirect(redirectUrl)
}
