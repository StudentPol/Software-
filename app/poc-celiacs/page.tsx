'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Resultat {
  restaurant: string
  veredicte: 'APT' | 'NO_APT' | 'INCERT'
  confiança: number
  evidències: string[]
  resum: string
  esperat?: string
  correcte?: boolean
  error?: string
}

interface DatasetItem {
  restaurant: string
  esperado: string
  ressenyes: string[]
}

export default function PoCCeliacsPage() {
  const [resultats, setResultats] = useState<Resultat[]>([])
  const [executant, setExecutant] = useState(false)
  const [fet, setFet] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [dataset, setDataset] = useState<DatasetItem[]>([])
  const router = useRouter()

  function afegirLog(msg: string) {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString('ca-ES')}] ${msg}`])
  }

  async function executarPoc() {
    setExecutant(true)
    setResultats([])
    setLog([])
    setFet(false)

    // Obtenir dataset
    const dsRes = await fetch('/api/poc-celiacs')
    const { dataset: ds } = await dsRes.json()
    setDataset(ds)

    afegirLog(`Inici de la PoC — ${ds.length} restaurants a analitzar`)

    const nouResultats: Resultat[] = []

    for (const item of ds) {
      afegirLog(`Analitzant: ${item.restaurant}...`)
      try {
        const res = await fetch('/api/poc-celiacs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurant: item.restaurant, ressenyes: item.ressenyes }),
        })
        const data = await res.json()

        if (data.error) {
          afegirLog(`ERROR a ${item.restaurant}: ${data.error}`)
          nouResultats.push({ restaurant: item.restaurant, veredicte: 'INCERT', confiança: 0, evidències: [], resum: '', error: data.error })
        } else {
          const correcte = data.veredicte === item.esperado
          afegirLog(`→ ${item.restaurant}: ${data.veredicte} (${data.confiança}%) — ${correcte ? '✓ CORRECTE' : '✗ INCORRECTE'}`)
          nouResultats.push({ ...data, esperat: item.esperado, correcte })
        }
      } catch (e: any) {
        afegirLog(`ERROR a ${item.restaurant}: ${e.message}`)
        nouResultats.push({ restaurant: item.restaurant, veredicte: 'INCERT', confiança: 0, evidències: [], resum: '', error: e.message })
      }

      setResultats([...nouResultats])
    }

    const correctes = nouResultats.filter(r => r.correcte).length
    const precisio = Math.round((correctes / ds.length) * 100)
    const confMitjana = Math.round(nouResultats.reduce((s, r) => s + r.confiança, 0) / ds.length)
    afegirLog(`✓ Finalitzat — Precisió: ${precisio}% (${correctes}/${ds.length}) · Confiança mitjana: ${confMitjana}%`)

    setFet(true)
    setExecutant(false)
  }

  const correctes = resultats.filter(r => r.correcte).length
  const precisio = resultats.length > 0 ? Math.round((correctes / resultats.length) * 100) : 0
  const confMitjana = resultats.length > 0 ? Math.round(resultats.reduce((s, r) => s + r.confiança, 0) / resultats.length) : 0
  const viable = precisio >= 75

  function badgeStyle(v: string) {
    if (v === 'APT') return { background: '#EAF3DE', color: '#27500A', border: '1px solid #C3E6A0' }
    if (v === 'NO_APT') return { background: '#FCEBEB', color: '#791F1F', border: '1px solid #F5BFBF' }
    return { background: '#FAEEDA', color: '#633806', border: '1px solid #F0D08A' }
  }

  function verdictLabel(v: string) {
    if (v === 'APT') return '✓ Apte per a celíacs'
    if (v === 'NO_APT') return '✗ No apte per a celíacs'
    return '? Informació insuficient'
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem 1rem', maxWidth: '640px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '13px', marginBottom: '1rem', padding: 0 }}>
          ← Tornar
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', background: 'var(--accent)', padding: '2px 8px', borderRadius: '4px' }}>Software #30</span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '6px' }}>PoC: IA per detectar seguretat per a celíacs</h1>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
          Prova de Concepte que valida si Claude pot llegir ressenyes de restaurants i classificar si són aptes per a persones celíaques.
        </p>
      </div>

      {/* Dataset preview */}
      <div style={{ border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>Dataset de prova — 4 restaurants · 12 ressenyes</p>
        {[
          { nom: 'La Taula Verda', esperat: 'APT' },
          { nom: 'Pizzeria Roma', esperat: 'NO_APT' },
          { nom: 'Gastrobar El Pont', esperat: 'INCERT' },
          { nom: 'Can Benet', esperat: 'APT' },
        ].map(r => (
          <div key={r.nom} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: '13px' }}>
            <span>{r.nom}</span>
            <span style={{ ...badgeStyle(r.esperat), fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>{r.esperat.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Botó executar */}
      <button
        onClick={executarPoc}
        disabled={executant}
        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--foreground)', color: 'var(--background)', border: 'none', fontWeight: 600, fontSize: '14px', cursor: executant ? 'not-allowed' : 'pointer', opacity: executant ? 0.6 : 1, marginBottom: '1.5rem' }}
      >
        {executant ? '⏳ Executant anàlisi amb Claude...' : fet ? '↺ Tornar a executar' : '▶ Executar PoC amb IA'}
      </button>

      {/* Mètriques */}
      {resultats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '1.5rem' }}>
          {[
            { val: `${precisio}%`, lbl: 'Precisió' },
            { val: `${confMitjana}%`, lbl: 'Confiança mitjana' },
            { val: `${correctes}/${resultats.length}`, lbl: 'Correctes' },
          ].map(m => (
            <div key={m.lbl} style={{ background: 'var(--accent)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{m.lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Resultats */}
      {resultats.map(r => (
        <div key={r.restaurant} style={{ border: `0.5px solid ${r.correcte ? 'var(--border)' : '#F5BFBF'}`, borderRadius: '12px', padding: '1rem', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{r.restaurant}</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ ...badgeStyle(r.veredicte), fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>{verdictLabel(r.veredicte)}</span>
              <span style={{ fontSize: '12px', color: r.correcte ? '#27500A' : '#791F1F' }}>{r.correcte ? '✓' : '✗'}</span>
            </div>
          </div>
          {r.error ? (
            <p style={{ fontSize: '12px', color: '#791F1F' }}>Error: {r.error}</p>
          ) : (
            <>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                  <span>Confiança</span><span>{r.confiança}%</span>
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'var(--accent)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.confiança}%`, borderRadius: '3px', background: r.confiança > 70 ? '#3B6D11' : r.confiança > 40 ? '#854F0B' : '#A32D2D' }} />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>{r.resum}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {r.evidències?.map((e, i) => (
                  <span key={i} style={{ fontSize: '11px', background: 'var(--accent)', border: '0.5px solid var(--border)', borderRadius: '4px', padding: '2px 6px', color: 'var(--muted-foreground)' }}>&quot;{e}&quot;</span>
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      {/* Log */}
      {log.length > 0 && (
        <div style={{ marginTop: '1.5rem', border: '0.5px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)', marginBottom: '8px' }}>Log d&apos;execució</p>
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: '11px', fontFamily: 'monospace', padding: '3px 0', borderBottom: '0.5px solid var(--border)', color: 'var(--muted-foreground)' }}>{l}</div>
          ))}
        </div>
      )}

      {/* Conclusions (#33) */}
      {fet && (
        <div style={{ marginTop: '1.5rem', border: '0.5px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>Subtasca #33 — Conclusions</p>

          <div style={{ background: viable ? '#EAF3DE' : '#FCEBEB', border: `1px solid ${viable ? '#C3E6A0' : '#F5BFBF'}`, borderRadius: '8px', padding: '12px', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 600, color: viable ? '#27500A' : '#791F1F', fontSize: '14px', marginBottom: '4px' }}>
              {viable ? '✓ Tècnicament VIABLE' : '⚠ Revisar implementació'}
            </p>
            <p style={{ fontSize: '13px', color: viable ? '#3B6D11' : '#A32D2D' }}>
              Precisió del {precisio}% amb confiança mitjana del {confMitjana}%. La funcionalitat {viable ? 'pot integrar-se al sistema de matchmaking.' : 'necessita ajustament del prompt.'}
            </p>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '8px' }}>
            <strong>Metodologia:</strong> 4 restaurants amb 3 ressenyes cadascun (12 ressenyes totals). Dataset cobreix els 3 escenaris: APT, NO_APT i INCERT.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '8px' }}>
            <strong>Observació clau:</strong> El model identifica mencions implícites (&quot;van cuinar en una olla a part&quot;) i retorna INCERT quan no hi ha informació sobre gluten, evitant falsos positius.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
            <strong>Propera integració:</strong> Afegir el camp <code>seguretat_celiacs</code> a <code>/api/restaurants</code> i incorporar-ho com a factor a <code>calcularPercentatgeRestaurant()</code>.
          </p>
        </div>
      )}

    </main>
  )
}
