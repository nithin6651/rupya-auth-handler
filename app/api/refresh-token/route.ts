// app/api/refresh-token/route.ts
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

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    console.log('🔄 Starting Upstox token refresh check...')

    const { data: tokens, error: fetchError } = await supabase
      .from('upstox_tokens')
      .select('*')
      .not('refresh_token', 'is', null)

    if (fetchError) throw fetchError
    if (!tokens?.length) return NextResponse.json({ message: 'No tokens to refresh' })

    const now = Date.now()
    let refreshed = 0

    for (const token of tokens) {
      const expiresAt = new Date(token.expires_at).getTime()
      const timeLeft = expiresAt - now

      if (timeLeft < 2 * 60 * 60 * 1000) {
        console.log(`🕓 Refreshing token for ${token.upstox_user_id}`)

        const response = await fetch('https://api.upstox.com/v2/login/authorization/token', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.UPSTOX_CLIENT_ID!,
            client_secret: process.env.UPSTOX_CLIENT_SECRET!,
            refresh_token: token.refresh_token,
            grant_type: 'refresh_token',
          }),
        })

        const newToken = await response.json()
        if (!response.ok) {
          console.error(`❌ Failed refresh for ${token.upstox_user_id}:`, newToken)
          continue
        }

        const newExpiry = new Date(Date.now() + 86400000).toISOString()
        const { error: updateError } = await supabase
          .from('upstox_tokens')
          .update({
            access_token: newToken.access_token,
            refresh_token: newToken.extended_token || token.refresh_token,
            expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq('upstox_user_id', token.upstox_user_id)

        if (!updateError) {
          refreshed++
          console.log(`✅ Refreshed token for ${token.upstox_user_id}`)
        } else {
          console.error('⚠️ Update failed:', updateError)
        }
      }
    }

    return NextResponse.json({ message: `Refreshed ${refreshed} tokens successfully.` })
  } catch (err) {
    console.error('🔥 Token refresh error:', err)
    return NextResponse.json({ error: 'Token refresh failed', details: String(err) }, { status: 500 })
  }
}
