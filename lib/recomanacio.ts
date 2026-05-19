// lib/recomanacio.ts
// Algorisme de creuament de gustos per Planify
// Donats els perfils dels membres d'un pla, retorna un ranking de tipus de cuina

// ---------------------------------------------------------------------------
// Tipus
// ---------------------------------------------------------------------------

export interface PerfilUsuari {
  id: string
  nom: string
  preferencies: string[]   // ex: ['Italiana', 'Japonesa']
  restriccions: string[]   // ex: ['Vegà', 'Sense gluten']
  pressupost: '€' | '€€' | '€€€'
}

export interface TipusCuina {
  id: string
  nom: string
  emoji: string
  // Quines restriccions alimentàries NO pot satisfer aquest tipus de cuina
  // Si un membre del grup té alguna d'aquestes restriccions, la cuina queda descartada
  restriccionsIncompatibles: string[]
  // Rang de preus típic d'aquest tipus de restaurant
  pressupostTipic: ('€' | '€€' | '€€€')[]
}

export interface ResultatCuina {
  cuina: TipusCuina
  puntuacio: number        // 0–100
  membres_a_favor: string[] // noms dels membres que la prefereixen
  membres_en_contra: string[] // noms dels membres amb restriccions incompatibles (no hauria d'haver-n'hi si s'han filtrat)
  compatible: boolean      // false si algun membre no pot menjar-hi
  raons: string[]          // explicació llegible de la puntuació
}

// ---------------------------------------------------------------------------
// Catàleg de tipus de cuina (els més generals i comuns per grups d'amics)
// ---------------------------------------------------------------------------

export const TIPUS_CUINA: TipusCuina[] = [
  {
    id: 'italiana',
    nom: 'Italiana',
    emoji: '🍕',
    restriccionsIncompatibles: [],
    pressupostTipic: ['€', '€€'],
  },
  {
    id: 'japonesa',
    nom: 'Japonesa',
    emoji: '🍣',
    restriccionsIncompatibles: ['Vegà', 'Vegetarià', 'Sense marisc'],
    pressupostTipic: ['€€', '€€€'],
  },
  {
    id: 'mediterrania',
    nom: 'Mediterrània',
    emoji: '🥗',
    restriccionsIncompatibles: [],
    pressupostTipic: ['€€', '€€€'],
  },
  {
    id: 'mexicana',
    nom: 'Mexicana',
    emoji: '🌮',
    restriccionsIncompatibles: [],
    pressupostTipic: ['€', '€€'],
  },
  {
    id: 'asiatica',
    nom: 'Asiàtica',
    emoji: '🍜',
    restriccionsIncompatibles: [],
    pressupostTipic: ['€', '€€'],
  },
  {
    id: 'americana',
    nom: 'Americana / Hamburgueseria',
    emoji: '🍔',
    restriccionsIncompatibles: ['Vegà', 'Vegetarià', 'Halal', 'Kosher'],
    pressupostTipic: ['€', '€€'],
  },
  {
    id: 'espanyola',
    nom: 'Espanyola / Tapes',
    emoji: '🥘',
    restriccionsIncompatibles: ['Vegà', 'Sense marisc'],
    pressupostTipic: ['€', '€€'],
  },
  {
    id: 'vegana',
    nom: 'Vegana / Vegetariana',
    emoji: '🌱',
    restriccionsIncompatibles: [],
    pressupostTipic: ['€€', '€€€'],
  },
  {
    id: 'fusio',
    nom: 'Fusió / Creativa',
    emoji: '✨',
    restriccionsIncompatibles: [],
    pressupostTipic: ['€€', '€€€'],
  },
  {
    id: 'xinesa',
    nom: 'Xinesa',
    emoji: '🥡',
    restriccionsIncompatibles: ['Sense gluten', 'Halal', 'Kosher'],
    pressupostTipic: ['€', '€€'],
  },
  {
    id: 'indiana',
    nom: 'Índia',
    emoji: '🍛',
    restriccionsIncompatibles: [],
    pressupostTipic: ['€', '€€'],
  },
  {
    id: 'griega',
    nom: 'Grega',
    emoji: '🫒',
    restriccionsIncompatibles: [],
    pressupostTipic: ['€', '€€'],
  },
]

// Mapa per trobar ràpidament una cuina per nom (per creuar amb les preferències dels perfils)
// Inclou sinònims/variants per si l'usuari ha escollit el nom en castellà des del perfil actual
const MAPA_NOMS: Record<string, string> = {
  'italiana': 'italiana',
  'japonesa': 'japonesa',
  'mediterránea': 'mediterrania',
  'mediterrània': 'mediterrania',
  'mexicana': 'mexicana',
  'asiática': 'asiatica',
  'asiàtica': 'asiatica',
  'americana': 'americana',
  'española': 'espanyola',
  'espanyola': 'espanyola',
  'vegana': 'vegana',
  'vegetariana': 'vegana',
  'fusión': 'fusio',
  'fusió': 'fusio',
  'china': 'xinesa',
  'xinesa': 'xinesa',
  'india': 'indiana',
  'índia': 'indiana',
  'griega': 'griega',
  'grega': 'griega',
}

// Mapa de restriccions: variant castellà → id normalitzat
const MAPA_RESTRICCIONS: Record<string, string> = {
  'vegetariano': 'Vegetarià',
  'vegetarià': 'Vegetarià',
  'vegano': 'Vegà',
  'vegà': 'Vegà',
  'sin gluten': 'Sense gluten',
  'sense gluten': 'Sense gluten',
  'sin lactosa': 'Sense lactosa',
  'sense lactosa': 'Sense lactosa',
  'halal': 'Halal',
  'kosher': 'Kosher',
  'sin frutos secos': 'Sense fruits secs',
  'sense fruits secs': 'Sense fruits secs',
  'sin marisco': 'Sense marisc',
  'sense marisc': 'Sense marisc',
}

function normalitzarRestriccio(r: string): string {
  return MAPA_RESTRICCIONS[r.toLowerCase()] ?? r
}

// ---------------------------------------------------------------------------
// Algorisme principal
// ---------------------------------------------------------------------------

/**
 * Donats els perfils dels membres d'un pla, retorna un ranking de tipus de cuina.
 *
 * Puntuació (0–100):
 *  - Base: 0 punts
 *  - +10 punts per cada membre que la prefereix explícitament
 *  - +5 punts si el pressupost típic encaixa amb la majoria del grup
 *  - -∞ (descartada) si alguna cuina és incompatible amb alguna restricció d'algun membre
 *
 * Les cuines descartades surten al final de la llista amb compatible=false.
 */
export function calcularRecomanacions(perfils: PerfilUsuari[]): {
  ranking: ResultatCuina[]
  pressupostDominant: '€' | '€€' | '€€€'
  limitMaximGrup: number
  restriccionsGrup: string[]
} {
  if (perfils.length === 0) {
    return { ranking: [], pressupostDominant: '€€', limitMaximGrup: 2, restriccionsGrup: [] }
  }

  // 1. Calculem primer els mapes de preus i els límits (Així estan disponibles a tot el fitxer)
  const mapaPreus = { '€': 1, '€€': 2, '€€€': 3 }
  const limitMaximGrup = Math.min(...perfils.map(p => mapaPreus[p.pressupost]))

  // Calcular pressupost dominant del grup
  const comptadorPressupost: Record<string, number> = { '€': 0, '€€': 0, '€€€': 0 }
  perfils.forEach(p => { comptadorPressupost[p.pressupost]++ })
  const pressupostDominant = Object.entries(comptadorPressupost)
    .sort((a, b) => b[1] - a[1])[0][0] as '€' | '€€' | '€€€'

  // Normalitzar restriccions de tots els membres
  const todesLesRestriccions: string[] = perfils.flatMap(p =>
    p.restriccions.map(normalitzarRestriccio)
  )
  const restriccionsUnica = [...new Set(todesLesRestriccions)]

  const resultats: ResultatCuina[] = TIPUS_CUINA.map(cuina => {
    const raons: string[] = []

    // Comprovar compatibilitat
    const restriccionsViolades = cuina.restriccionsIncompatibles.filter(r =>
      restriccionsUnica.includes(r)
    )
    const compatible = restriccionsViolades.length === 0

    // Membres que la prefereixen explícitament
    const membresAFavor = perfils.filter(p =>
      p.preferencies.some(pref => {
        const id = MAPA_NOMS[pref.toLowerCase()]
        return id === cuina.id
      })
    ).map(p => p.nom)

    const membresEnContra: string[] = []
    if (!compatible) {
      // Trobar quins membres causen la incompatibilitat
      perfils.forEach(p => {
        const restriccionsNorm = p.restriccions.map(normalitzarRestriccio)
        const teProblem = cuina.restriccionsIncompatibles.some(r =>
          restriccionsNorm.includes(r)
        )
        if (teProblem) membresEnContra.push(p.nom)
      })
    }

    // Calcular puntuació
    let puntuacio = 0

    if (compatible) {
      // Punts per preferències
      const puntsPref = membresAFavor.length * 10
      puntuacio += puntsPref
      if (puntsPref > 0) {
        raons.push(`+${puntsPref} pts: ${membresAFavor.join(', ')} ho prefereix`)
      }

      // Bonus si el pressupost encaixa
      if (cuina.pressupostTipic.includes(pressupostDominant)) {
        puntuacio += 5
        raons.push(`+5 pts: pressupost ${pressupostDominant} encaixa`)
      }

      // Bonus si tothom al grup la prefereix (consens total)
      if (membresAFavor.length === perfils.length) {
        puntuacio += 15
        raons.push(`+15 pts: consens total del grup!`)
      }

      // Bonus petit per cuines neutrales (no preferides però tampoc rebutjades)
      if (membresAFavor.length === 0) {
        puntuacio += 2
        raons.push(`Opció neutra compatible amb tout el grup`)
      }

      // Normalitzar entre 0 i 100
      const maxTeoric = perfils.length * 10 + 5 + 15
      puntuacio = Math.min(100, Math.round((puntuacio / maxTeoric) * 100))
    } else {
      puntuacio = 0
      raons.push(`Incompatible: ${restriccionsViolades.join(', ')} (${membresEnContra.join(', ')})`)
    }

    return {
      cuina,
      puntuacio,
      membres_a_favor: membresAFavor,
      membres_en_contra: membresEnContra,
      compatible,
      raons,
    }
  })

  // Ordenar l'array de cuines
  resultats.sort((a, b) => {
    if (a.compatible && !b.compatible) return -1
    if (!a.compatible && b.compatible) return 1
    return b.puntuacio - a.puntuacio
  })

  // Retorn final net amb estructures clares
  return {
    ranking: resultats,
    pressupostDominant, 
    limitMaximGrup,      
    restriccionsGrup: restriccionsUnica
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retorna el pressupost mig del grup com a string llegible.
 */
export function resumPressupostGrup(perfils: PerfilUsuari[]): string {
  const mapa = { '€': 1, '€€': 2, '€€€': 3 }
  const mitja = perfils.reduce((s, p) => s + mapa[p.pressupost], 0) / perfils.length
  if (mitja <= 1.4) return '€'
  if (mitja <= 2.4) return '€€'
  return '€€€'
}

/**
 * Retorna les restriccions úniques del grup (normalitzades).
 */
export function restriccionsDelGrup(perfils: PerfilUsuari[]): string[] {
  const totes = perfils.flatMap(p => p.restriccions.map(normalitzarRestriccio))
  return [...new Set(totes)]
}

export interface RestaurantPlacesAPI {
  place_id: string
  name: string
  rating?: number       // Rating de Google (0.0 - 5.0)
  price_level?: number  // Nivell de preu de Google (0 - 4)
  types: string[]       // Tipus de lloc de Google
}

/**
 * Puntuació intel·ligent del local barrejant Google Places i dades del grup
 */
export function calcularCompatibilitatPlaces(
  restaurant: RestaurantPlacesAPI,
  perfils: any[],
  pressupostDominant: string,
  restriccionsGrup: string[],
  categoriaCuinaAssignada: string
): number {
  
  // --- 1. ESCUT DE SEGURETAT ABSOLUT (0% si es cola un fals positiu de Google) ---
  // Busquem les dades de la cuina al teu catàleg global (TIPUS_CUINA)
  const cuinaBase = TIPUS_CUINA.find(c => c.nom.toLowerCase() === categoriaCuinaAssignada.toLowerCase())
  if (cuinaBase) {
    const incompatibilitatsGraves = cuinaBase.restriccionsIncompatibles.filter(r =>
      restriccionsGrup.includes(r)
    )
    if (incompatibilitatsGraves.length > 0) {
      return 0 // Fora de la llista immediatament
    }
  }

  let puntsTotals = 0

  // --- 2. ADAPTACIÓ DE LA CARTA PER A RESTRICCIONS (Pes: 20 punts) ---
  // Com que l'API ja busca llocs aptes, per defecte donem els 20 punts.
  // Només si és una cuina de risc base (ex: Pizzeria per a un Celíac), baixem a 12 
  // per reflectir que la carta serà més limitada o dependrà de substituts.
  let puntsRestriccions = 20
  if (restriccionsGrup.length > 0) {
    const esCuinaDeRisc = (cuinaBase?.restriccionsIncompatibles.length ?? 0) > 0
    if (esCuinaDeRisc) puntsRestriccions = 12
  }
  puntsTotals += puntsRestriccions

  // --- 3. GUSTOS DEL GRUP (Pes: 35 punts) ---
  const membresAFavor = perfils.filter(p =>
    p.preferencies.some((pref: string) => pref.toLowerCase() === categoriaCuinaAssignada.toLowerCase())
  ).length

  const ratiGustos = membresAFavor / perfils.length
  if (membresAFavor > 0) {
    puntsTotals += ratiGustos * 35
  } else {
    puntsTotals += 15 // Cuina neutra (acceptable per a tothom, preferida per ningú)
  }

  // --- 4. VALORACIÓ REALS DE CLIENTS - GOOGLE RATING (Pes: 25 punts) ---
  const ratingReal = restaurant.rating ?? 4.0
  puntsTotals += (ratingReal / 5) * 25

// --- 5. ENCAIX DE PREU (Pes: 20 punts) ---
let preuRestaurantGoogle = '€€'

// Protegim TypeScript comprovant primer que no sigui 'undefined'
if (restaurant.price_level !== undefined) {
  if (restaurant.price_level === 0 || restaurant.price_level === 1) preuRestaurantGoogle = '€'
  if (restaurant.price_level === 2) preuRestaurantGoogle = '€€'
  if (restaurant.price_level >= 3) preuRestaurantGoogle = '€€€'

  // Si té preu i coincideix amb el que vol el grup, s'emporta els 20 punts nets
  if (preuRestaurantGoogle === pressupostDominant) {
    puntsTotals += 20
  } else {
    puntsTotals += 5  // Penalització si desquadra la butxaca
  }
} else {
  // Si Google no té preu (és undefined), apliquem el vot de confiança de 12 punts
  puntsTotals += 12
}

  // Retornem el percentatge net (0-100)
  return Math.min(100, Math.max(0, Math.round(puntsTotals)))
}