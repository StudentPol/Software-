import { NextRequest, NextResponse } from 'next/server'

// Dataset de 10 ressenyes reals de prova (subtasca #31)
const DATASET_POC = [
  {
    restaurant: 'La Taula Verda',
    esperado: 'APT',
    ressenyes: [
      'Perfecte per a celíacs! Tenen carta específica sense gluten i el personal sap molt bé com evitar la contaminació creuada.',
      'La meva filla celíaca va poder menjar sense problemes. Van cuinar la pasta en una olla neta i apart.',
      'Molt conscients de les al·lèrgies. Quan vaig dir que era celíac, la cuinera va sortir a parlar amb mi personalment.',
    ],
  },
  {
    restaurant: 'Pizzeria Roma',
    esperado: 'NO_APT',
    ressenyes: [
      'Fan pizza sense gluten però l\'enfornen al mateix forn que les normals. La meva dona celíaca va tenir reacció.',
      'Ull als celíacs: no tenen protocol de contaminació creuada. Em van dir que "normalment no passa res".',
      'Bona pizza però no recomanaria per a celíacs reals. Les opcions sense gluten arriben amb pa a la mateixa safata.',
    ],
  },
  {
    restaurant: 'Gastrobar El Pont',
    esperado: 'INCERT',
    ressenyes: [
      'Bon menjar, ambient agradable. Els meus amics van gaudir molt de la carn.',
      'Lloc perfecte per a grups. Bona relació qualitat-preu i atenció excel·lent.',
      'Ho recomanaria per a sopars d\'empresa. El servei és molt professional.',
    ],
  },
  {
    restaurant: 'Can Benet',
    esperado: 'APT',
    ressenyes: [
      'Tinc celiaquia i porto anys venint aquí. Mai he tingut cap problema, saben exactament què han de fer.',
      'Certificat sense gluten a la vista. El menú especial és molt complert i deliciós.',
      'La cuinera va sortir expressament per explicar-me com preparen els plats per evitar contaminació. 10/10.',
    ],
  },
]

const PROMPT = `Ets un analista especialitzat en seguretat alimentària per a persones celíaques.

Analitza les ressenyes d'aquest restaurant i determina si és APT, NO_APT o INCERT per a persones celíaques.

Criteris:
- APT: mencionen opcions sense gluten, carta especial, protocols anticontaminació, personal format
- NO_APT: mencionen contaminació creuada, falta d'opcions, problemes amb celíacs
- INCERT: no hi ha informació suficient o les ressenyes no parlen de gluten

Respon ÚNICAMENT amb un JSON vàlid sense cap text addicional:
{
  "veredicte": "APT" | "NO_APT" | "INCERT",
  "confiança": 0-100,
  "evidències": ["frase clau extreta literalment"],
  "resum": "Explicació breu en català (1-2 frases)"
}`

export async function POST(req: NextRequest) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 })
  }

  const { ressenyes, restaurant } = await req.json()
  if (!ressenyes || !Array.isArray(ressenyes)) {
    return NextResponse.json({ error: 'Falten ressenyes' }, { status: 400 })
  }

  const textRessenyes = ressenyes.map((r: string, i: number) => `${i + 1}. "${r}"`).join('\n')
  const prompt = `${PROMPT}\n\nRestaurant: ${restaurant}\nRessenyes:\n${textRessenyes}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Anthropic error: ${res.status} - ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = (data.content as Array<{ type: string; text?: string }>)
      .map(b => b.text || '')
      .join('')
      .replace(/```json|```/g, '')
      .trim()

    const resultat = JSON.parse(text)
    return NextResponse.json({ ...resultat, restaurant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET retorna el dataset per a la UI
export async function GET() {
  return NextResponse.json({ dataset: DATASET_POC })
}
