import { NextRequest, NextResponse } from 'next/server'

// Mantenim la teva funció d'emojis intacta tal com la tens
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

// 1. ADAPTEM EL TEU CÀLCUL INTEGRAT PERQUÈ COMBINI ABSOLUTAMENT TOT
function calcularPercentatgeRestaurant(
  place: any,
  puntuacioBaseCuina: number,
  preuIdealStr: string,
  restriccionsGrup: string[]
): number {
  let puntsTotals = 0

  // --- A. GUSTOS DEL GRUP (Pes: 50 punts de la nota base de cuines de la IA) ---
  // Aprofitem la nota que ja havíem calculat per a aquesta cuina específica (0-100) i la ponderem a la meitat
  puntsTotals += (puntuacioBaseCuina / 100) * 50

  // --- B. ENCAIX DE PREU DE GOOGLE PLACES (Pes: 25 punts) ---
  let preuRestaurantGoogle = '€€'
  if (place.price_level !== undefined) {
    if (place.price_level === 0 || place.price_level === 1) preuRestaurantGoogle = '€'
    if (place.price_level === 2) preuRestaurantGoogle = '€€'
    if (place.price_level >= 3) preuRestaurantGoogle = '€€€'

    if (preuRestaurantGoogle === preuIdealStr) {
      puntsTotals += 25 // Clava el preu del grup
    } else {
      puntsTotals += 5  // Penalització si desquadra la butxaca
    }
  } else {
    puntsTotals += 15 // Si Google no té informat el preu, donem un vot de confiança neutre
  }

  // --- C. VALORACIÓ REALS DE CLIENTS - GOOGLE RATING (Pes: 25 punts) ---
  // Un lloc de 5.0 estrelles s'emporta els 25 punts. Un de 4.0 estrelles se n'emporta 20.
  const ratingReal = place.rating ?? 4.0
  puntsTotals += (ratingReal / 5) * 25

  // --- D. COMRPOVACIÓ EXTRA DE RESTRICCIONS CONTRA FALSOS POSITIUS ---
  // Si hi ha restriccions al grup i el local té tags perillosos (ex: "bakery" o "pastisseria" per a celíacs)
  // podem cobrir-nos l'esquena, encara que la cerca ja va filtrada.
  const t = (place.types || []).join(' ').toLowerCase()
  if (restriccionsGrup.includes('sense gluten') && (t.includes('bakery') || t.includes('meal_takeaway'))) {
    // Si és una fleca convencional sense filtrar bé, reduïm dramàticament per seguretat
    puntsTotals -= 20
  }

  // Retornem el percentatge final net formatat (0-100)
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

  // Guardem l'array net de restriccions per passar-lo a la funció matemàtica
  const arrayRestriccions = restriccionsParam.split(',').map(r => r.trim().toLowerCase()).filter(Boolean)
  const textRestriccions = arrayRestriccions.join(' ')

  try {
    const promises = cuines.map(cuina => {
      const restriccionsNetejes = textRestriccions ? ` "${textRestriccions}"` : ''
      const queryText = `restaurant ${cuina} ${zona}${restriccionsNetejes}`.trim()
      
      // Nota: Deixem que Google busqui lliurement la seva llista (retorna fins a 20 o 30 locals per defecte de cop)
      return fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(queryText)}&type=restaurant&language=ca&key=${apiKey}`)
        .then(r => r.json())
        .then(data => ({ data, cuina }))
    })

    const resultats = await Promise.all(promises)

    const vistos = new Set<string>()
    const tots: any[] = []

    // 2. RECOLLIM TOTS ELS RESTAURANTS DE LES MULTIPLES CERQUES (Fins a 30 o 40 resultats combinats)
    resultats.forEach(({ data, cuina }) => {
      const idx = cuines.indexOf(cuina)
      const puntuacioBaseCuina = puntuacions[idx] || 50
      const membresAFavor = membres[idx] || []

      ;(data.results || []).forEach((r: any) => {
        if (!vistos.has(r.place_id)) {
          vistos.add(r.place_id)

          // Cridem la nova funció que tritura i calcula el percentatge real amb seguretat per a TypeScript
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

    // 3. FLUX DE SELECCIÓ: Filtrem, ordenem de major a menor puntuació i ens quedem NOMÉS AMB ELS 5 MILLORS
    const restaurantsFiltratsIOrdenats = tots
      .filter((r: any) => r.puntuacio_calculada > 0) // Eliminem qualsevol 0% per seguretat
      .sort((a, b) => b.puntuacio_calculada - a.puntuacio_calculada) // Ordenació decreixent (100% -> 0%)
      .slice(0, 5) // Ens quedem amb el Top 5 real de tota la cerca massiva

    // Mapegem el resultat final per enviar-lo polit al frontend
    const restaurants = restaurantsFiltratsIOrdenats.map((r: any) => ({
      id: r.place_id,
      nom: r.name,
      adreca: r.formatted_address?.split(',').slice(0, 2).join(',') || '',
      rating: r.rating || null,
      num_ressenyes: r.user_ratings_total || 0,
      preu: r.price_level ? '€'.repeat(r.price_level) : null,
      foto: r.photos?.[0]?.photo_reference || null,
      emoji: emojiPerTipus(r.types || [], r.name),
      puntuacio: r.puntuacio_calculada, // El percentatge variable de cada local lligat al grup!
      puntuacio_calculada: r.puntuacio_calculada,
      membres_a_favor: r.membres_a_favor,
    }))

    return NextResponse.json({ restaurants })
  } catch (error) {
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }
}