// app/api/upstox-token/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Lazy-load Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('❌ Missing Supabase credentials in environment')
  return createClient(url, key)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
  }

  console.log('🔗 Received Upstox code:', code)
  const supabase = getSupabaseClient()

  // 1️⃣ Exchange code for access token
  const tokenResponse = await fetch('https://api.upstox.com/v2/login/authorization/token', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.UPSTOX_CLIENT_ID!,
      client_secret: process.env.UPSTOX_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenResponse.json()

  if (!tokenResponse.ok) {
    console.error('❌ Token exchange failed:', tokenData)
    return NextResponse.json({ error: 'Token exchange failed', details: tokenData }, { status: 500 })
  }

  console.log('✅ Token data received:', tokenData)

  const upstoxUserId = tokenData.user_id || 'unknown_upstox_user'
  const accessToken = tokenData.access_token
  const refreshToken = tokenData.extended_token || null
  const expiresAt = new Date(Date.now() + 86400000).toISOString()

  let userId: string | null = null
  try {
    const { data } = await supabase.auth.getUser()
    userId = data?.user?.id || null
  } catch {
    console.log('⚠️ No Supabase user session found — saving without UUID.')
  }

  // 3️⃣ Save token to Supabase
  const { error } = await supabase.from('upstox_tokens').upsert({
    user_id: userId,
    upstox_user_id: upstoxUserId,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('❌ Supabase insert failed:', error)
    return NextResponse.json({ error: 'Supabase insert failed', details: error }, { status: 500 })
  }

  console.log('✅ Token saved successfully for Upstox user:', upstoxUserId)

  return NextResponse.json({
    message: 'Upstox token saved successfully',
    upstox_user_id: upstoxUserId,
    supabase_user_id: userId || 'none',
  })
}
