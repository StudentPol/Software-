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

function calcularPercentatgeRestaurant(
  place: any,
  puntuacioBaseCuina: number,
  preuIdealStr: string,
  restriccionsGrup: string[]
): number {
  let puntsTotals = 0

  // --- A. GUSTOS DEL GRUP (Pes: 40 punts) ---
  puntsTotals += (puntuacioBaseCuina / 100) * 40

  // --- B. ENCAIX DE PREU DE GOOGLE PLACES (Pes: 20 punts) ---
  let preuRestaurantGoogle = '€€'
  if (place.price_level !== undefined) {
    if (place.price_level === 0 || place.price_level === 1) preuRestaurantGoogle = '€'
    if (place.price_level === 2) preuRestaurantGoogle = '€€'
    if (place.price_level === 3) preuRestaurantGoogle = '€€€'
    if (place.price_level >= 4) preuRestaurantGoogle = '€€€€'

    if (preuRestaurantGoogle === preuIdealStr) {
      puntsTotals += 20 
    } else if (preuIdealStr === '€' && (preuRestaurantGoogle === '€€€' || preuRestaurantGoogle === '€€€€')) {
      puntsTotals -= 40 
    } else if (preuIdealStr === '€€' && preuRestaurantGoogle === '€€€€') {
      puntsTotals -= 25
    } else {
      puntsTotals += 5 
    }
  } else {
    puntsTotals += 12 
  }
  
  // --- C. GOOGLE RATING (Pes: 40 punts) ---
  const ratingReal = place.rating ?? 4.0
  const numRessenyes = place.user_ratings_total || 0
  
  puntsTotals += (ratingReal / 5) * 38
  puntsTotals += Math.min(2, (numRessenyes / 500) * 2)

  // --- D. COMPROVACIÓ EXTRA DE RESTRICCIONS ---
  const t = (place.types || []).join(' ').toLowerCase()
  if (restriccionsGrup.includes('sense gluten') && (t.includes('bakery') || t.includes('meal_takeaway'))) {
    puntsTotals -= 25
  }

  return Math.min(100, Math.max(0, Math.round(puntsTotals)))
}

export async function GET(req: NextRequest) {
  const cuinesParam = req.nextUrl.searchParams.get('cuines')
  const puntuacionsParam = req.nextUrl.searchParams.get('puntuacions')
  const membresParam = req.nextUrl.searchParams.get('membres')
  const zona = req.nextUrl.searchParams.get('zona')
  
  const preuIdealStr = req.nextUrl.searchParams.get('preu_ideal') || '€€'
  const restriccionsParam = req.nextUrl.searchParams.get('restriccions') || ''
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
  if (!cuinesParam || !zona) return NextResponse.json({ error: 'Falten paràmetres' }, { status: 400 })

  const cuines = cuinesParam.split(',').map(c => c.trim())
  const puntuacions = puntuacionsParam?.split(',').map(Number) || cuines.map(() => 50)
  const membres = membresParam?.split(',').map(m => m.split('|').filter(Boolean)) || cuines.map(() => [])

  const arrayRestriccions = restriccionsParam.split(',').map(r => r.trim().toLowerCase()).filter(Boolean)
  const textRestriccions = arrayRestriccions.join(' ')

  try {
    // 🎯 TRADUCCIÓ: Passem el text '€' al nivell numèric que demana Google de filtre
    let maxPriceLevel = 2; 
    if (preuIdealStr === '€') maxPriceLevel = 1;
    if (preuIdealStr === '€€') maxPriceLevel = 2;
    if (preuIdealStr === '€€€') maxPriceLevel = 3;
    if (preuIdealStr === '€€€€') maxPriceLevel = 4;

    const promises = cuines.map(cuina => {
      const restriccionsNetejes = textRestriccions ? ` "${textRestriccions}"` : ''
      const queryText = `restaurant ${cuina} ${zona}${restriccionsNetejes}`.trim()
      
      // 🎯 FILTRE NATIU: Obliguem a Google a buscar només coses dins del pressupost del grup
      return fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(queryText)}&type=restaurant&minprice=0&maxprice=${maxPriceLevel}&language=ca&key=${apiKey}`)
        .then(r => r.json())
        .then(data => ({ data, cuina }))
    })

    const resultats = await Promise.all(promises)

    const vistos = new Set<string>()
    const tots: any[] = []

    resultats.forEach(({ data, cuina }) => {
      const idx = cuines.indexOf(cuina)
      const puntuacioBaseCuina = puntuacions[idx] || 50
      const membresAFavor = membres[idx] || []

      ;(data.results || []).forEach((r: any) => {
        if (!vistos.has(r.place_id)) {
          vistos.add(r.place_id)

          const percentatgeCoincidencia = calcularPercentatgeRestaurant(
            r,
            puntuacioBaseCuina,
            preuIdealStr,
            arrayRestriccions
          )

          tots.push({ 
            ...r, 
            puntuacio_calculada: percentatgeCoincidencia,
            membres_a_favor: membresAFavor 
          })
        }
      })
    })

    const restaurantsFiltratsIOrdenats = tots
      .filter((r: any) => r.puntuacio_calculada > 0)
      .sort((a, b) => b.puntuacio_calculada - a.puntuacio_calculada)
      .slice(0, 5)

    const restaurants = restaurantsFiltratsIOrdenats.map((r: any) => ({
      id: r.place_id,
      nom: r.name,
      adreca: r.formatted_address?.split(',').slice(0, 2).join(',') || '',
      rating: r.rating || null,
      num_ressenyes: r.user_ratings_total || 0,
      
      // 🎯 SEGURETAT ABSOLUTA: Mantenim el format d'euros clàssic sense xifres enganyoses
      preu: r.price_level ? '€'.repeat(r.price_level) : null,
      
      foto: r.photos?.[0]?.photo_reference || null,
      emoji: emojiPerTipus(r.types || [], r.name),
      puntuacio: r.puntuacio_calculada, 
      membres_a_favor: r.membres_a_favor,
    }))

    return NextResponse.json({ restaurants })
  } catch (error) {
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }
}