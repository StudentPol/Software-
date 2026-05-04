import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  const apiKey = process.env.GOOGLE_PLACES_API_KEY // sense NEXT_PUBLIC_

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query!)}&language=ca&key=${apiKey}`
  )
  const data = await res.json()
  return NextResponse.json(data)
}