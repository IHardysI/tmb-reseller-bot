// CDEK Widget v3 service endpoint (Node/Next implementation of service.php)
// Requires env: CDEK_CLIENT_ID, CDEK_CLIENT_SECRET

import { NextRequest, NextResponse } from 'next/server'

const CDEK_BASE_URL = 'https://api.cdek.ru/v2'

async function getAuthToken(): Promise<string> {
  const clientId = process.env.CDEK_CLIENT_ID
  const clientSecret = process.env.CDEK_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('CDEK_CLIENT_ID and CDEK_CLIENT_SECRET must be set')
  }
  const res = await fetch(`${CDEK_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CDEK auth failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.access_token as string
}

async function proxyRequest(action: string, params: Record<string, any>, token: string) {
  // Optional: disable tariff calculations and return an empty tariffs list (feature flag)
  if (action === 'calculate' && process.env.CDEK_DISABLE_CALC === 'true') {
    const body = JSON.stringify({ tariff_codes: [] })
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Version': '3.11.1',
      },
    })
  }

  if (action === 'offices') {
    if (process.env.CDEK_DISABLE_OFFICES === 'true') {
      // Return empty list of delivery points to avoid 500 while creds are not configured
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Service-Version': '3.11.1' },
      })
    }
    const url = new URL(`${CDEK_BASE_URL}/deliverypoints`)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-App-Name': 'widget_pvz',
        'X-App-Version': '3.11.1',
      },
      cache: 'no-store',
    })
    return res
  }

  if (action === 'calculate') {
    const res = await fetch(`${CDEK_BASE_URL}/calculator/tarifflist`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-App-Name': 'widget_pvz',
        'X-App-Version': '3.11.1',
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    })
    return res
  }

  return new Response(JSON.stringify({ message: 'Unknown action' }), { status: 400 })
}

async function handle(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const queryParams: Record<string, any> = {}
    url.searchParams.forEach((v, k) => (queryParams[k] = v))
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const params = { ...queryParams, ...body }
    const action = params.action
    if (!action) {
      return NextResponse.json({ message: 'Action is required' }, { status: 400 })
    }
    const token = await getAuthToken()
    const proxied = await proxyRequest(action, params, token as string)
    // proxyRequest returns a standard Response. Return it directly.
    return proxied as Response
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Internal error' }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle

