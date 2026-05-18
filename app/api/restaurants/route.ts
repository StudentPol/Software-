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
  const query = req.nextUrl.searchParams.get('query')
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
  if (!query) return NextResponse.json({ error: 'Falta el parámetro query' }, { status: 400 })

  try {
    // Separar les cuines i fer una crida per cada una
    const parts = query.split(' OR ')
    const zona = parts[parts.length - 1].replace('restaurants ', '').trim()
    const cuines = parts.slice(0, -1).map(p => p.replace('restaurants ', '').trim())

    // Fer una crida per cada cuina
    const promises = cuines.map(cuina =>
      fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`restaurant ${cuina} ${zona}`)}&language=ca&key=${apiKey}`)
        .then(r => r.json())
    )

    const resultats = await Promise.all(promises)

    // Combinar i deduplicar per place_id
    const vistos = new Set<string>()
    const tots: any[] = []

    resultats.forEach(data => {
      (data.results || []).forEach((r: any) => {
        if (!vistos.has(r.place_id)) {
          vistos.add(r.place_id)
          tots.push(r)
        }
      })
    })

    // Ordenar per rating i agafar els 5 millors
    const restaurants = tots
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
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
        puntuacio: 50,
        membres_a_favor: [],
      }))

    return NextResponse.json({ restaurants })
  } catch (error) {
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }
}