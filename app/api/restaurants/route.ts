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
  
  // Capturem els nous paràmetres enviats
  const preuIdealStr = req.nextUrl.searchParams.get('preu_ideal') || '€€'
  const restriccionsParam = req.nextUrl.searchParams.get('restriccions') || ''
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
  if (!cuinesParam || !zona) return NextResponse.json({ error: 'Falten paràmetres' }, { status: 400 })

  const cuines = cuinesParam.split(',').map(c => c.trim())
  const puntuacions = puntuacionsParam?.split(',').map(Number) || cuines.map(() => 50)
  const membres = membresParam?.split(',').map(m => m.split('|').filter(Boolean)) || cuines.map(() => [])

  // Netegem les restriccions del grup per afegir-les de text a la cerca
  const textRestriccions = restriccionsParam.split(',').filter(Boolean).join(' ')

  // Convertim el text del preu ideal en el nivell numèric de Google Maps (1=€, 2=€€, 3=€€€, 4=€€€+)
  const preuIdealNumeric = preuIdealStr === '€' ? 1 : preuIdealStr === '€€' ? 2 : preuIdealStr === '€€€' ? 3 : 4

  try {
    const promises = cuines.map(cuina => {
      // Si hi ha restriccions (ex: "sense gluten"), les posem entre cometes al final.
      const restriccionsNetejes = textRestriccions ? ` "${textRestriccions}"` : ''
      const queryText = `restaurant ${cuina} ${zona}${restriccionsNetejes}`.trim()
      
      // Forcem &type=restaurant perquè Google elimini les pastisseries de soca-rel
      return fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(queryText)}&type=restaurant&language=ca&key=${apiKey}`)
        .then(r => r.json())
        .then(data => ({ data, cuina }))
    })

    const resultats = await Promise.all(promises)

    const vistos = new Set<string>()
    const tots: any[] = []

    // ==========================================
    // AQUÍ ESTÀ EL NOU BLOC MODIFICAT 👇
    // ==========================================
    resultats.forEach(({ data, cuina }) => {
      const idx = cuines.indexOf(cuina)
      const puntuacioBaseCuina = puntuacions[idx] || 50
      const membresAFavor = membres[idx] || []

      ;(data.results || []).forEach((r: any) => {
        if (!vistos.has(r.place_id)) {
          vistos.add(r.place_id)

          // 1. Comencem amb la puntuació base que tenia aquesta cuina per al grup
          let coincidenciaFinal = puntuacioBaseCuina

          // 2. Calculem el bonus/penalització de preu
          const preuRestaurant = r.price_level !== undefined ? r.price_level : preuIdealNumeric
          const diferenciaPreu = Math.abs(preuRestaurant - preuIdealNumeric)
          
          if (diferenciaPreu === 0) {
            coincidenciaFinal += 15  // Clava el preu del grup? Li sumem 15 punts de coincidència
          } else if (diferenciaPreu >= 2) {
            coincidenciaFinal -= 15  // Està molt lluny de la butxaca del grup? Penalitzem amb 15 punts
          }

          // 3. Afegim un petit bonus per les estrelles de Google Maps (max +5 punts)
          if (r.rating) {
            coincidenciaFinal += (r.rating - 3) * 2.5
          }

          // Assegurem que el percentatge final quedi lògic entre 0 i 100
          coincidenciaFinal = Math.max(0, Math.min(100, Math.round(coincidenciaFinal)))

          tots.push({ 
            ...r, 
            puntuacio_calculada: coincidenciaFinal, // Guardem la nota personalitzada del local
            membres_a_favor: membresAFavor 
          })
        }
      })
    })

    // Ordenem directament de major a menor coincidència calculada
    const restaurants = tots
      .sort((a, b) => b.puntuacio_calculada - a.puntuacio_calculada)
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
        puntuacio: r.puntuacio_calculada, // Ara el frontend rebrà el percentatge real i variable
        membres_a_favor: r.membres_a_favor,
      }))
    // ==========================================

    return NextResponse.json({ restaurants })
  } catch (error) {
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }
}