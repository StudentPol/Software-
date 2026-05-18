import { NextRequest, NextResponse } from 'next/server'

function emojiPerTipus(types: string[], nom: string): string {
  const t = types.join(' ').toLowerCase()
  const n = nom.toLowerCase()
  if (t.includes('japanese') || n.includes('japones') || n.includes('sushi') || n.includes('ramen')) return '🍣'
  if (t.includes('italian') || n.includes('italian') || n.includes('pizza') || n.includes('pasta')) return '🍕'
  if (t.includes('chinese') || n.includes('chino') || n.includes('xines')) return '🥡'
  if (t.includes('mexican') || n.includes('mexican') || n.includes('tacos')) return '🌮'
  if (t.includes('indian') || n.includes('indian') || n.includes('india')) return '🍛'
  if (t.includes('mediterranean') || n.includes('mediterr')) return '🥗'
  if (t.includes('american') || n.includes('burger') || n.includes('hamburgues')) return '🍔'
  if (t.includes('vegetarian') || n.includes('vega') || n.includes('vegeta')) return '🌱'
  if (t.includes('bar') || n.includes('tapes') || n.includes('tapas')) return '🥘'
  if (t.includes('seafood') || n.includes('marisc') || n.includes('peix')) return '🦞'
  if (t.includes('french') || n.includes('franc')) return '🥐'
  if (t.includes('greek') || n.includes('grec')) return '🫒'
  return '🍽️'
}

export async function GET(req: NextRequest) {
  const cuinesParam = req.nextUrl.searchParams.get('cuines')
  const puntuacionsParam = req.nextUrl.searchParams.get('puntuacions')
  const membresParam = req.nextUrl.searchParams.get('membres')
  const zona = req.nextUrl.searchParams.get('zona')
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
  if (!cuinesParam || !zona) return NextResponse.json({ error: 'Falten paràmetres' }, { status: 400 })

  const cuines = cuinesParam.split(',').map(c => c.trim())
  const puntuacions = puntuacionsParam?.split(',').map(Number) || cuines.map(() => 50)
  const membres = membresParam?.split(',').map(m => m.split('|').filter(Boolean)) || cuines.map(() => [])

  try {
    const promises = cuines.map(cuina =>
      fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`restaurant ${cuina} ${zona}`)}&language=ca&key=${apiKey}`)
        .then(r => r.json())
        .then(data => ({ data, cuina }))
    )

    const resultats = await Promise.all(promises)

    const vistos = new Set<string>()
    const tots: any[] = []

    resultats.forEach(({ data, cuina }) => {
      const idx = cuines.indexOf(cuina)
      const puntuacio = puntuacions[idx] || 50
      const membresAFavor = membres[idx] || []

      ;(data.results || []).forEach((r: any) => {
        if (!vistos.has(r.place_id)) {
          vistos.add(r.place_id)
          tots.push({ ...r, puntuacio, membres_a_favor: membresAFavor })
        }
      })
    })

    const restaurants = tots
      .sort((a, b) => b.puntuacio - a.puntuacio || (b.rating || 0) - (a.rating || 0))
      .slice(0, 5)
      .map((r: any) => ({
        id: r.place_id,
        nom: r.name,
        adreca: r.formatted_address?.split(',').slice(0, 2).join(',') || '',
        rating: r.rating || null,
        num_ressenyes: r.user_ratings_total || 0,
        preu: r.price_level ? '€'.repeat(r.price_level) : null,
        foto: r.photos?.[0]?.photo_reference || null,
        emoji: emojiPerTipus(r.types || [], r.name),
        puntuacio: r.puntuacio,
        membres_a_favor: r.membres_a_favor,
      }))

    return NextResponse.json({ restaurants })
  } catch (error) {
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }
}