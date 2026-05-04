'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<any[]>([])
  const [plan, setPlan] = useState<any>(null)
  const [ganador, setGanador] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [totalMembres, setTotalMembres] = useState(0)
  const [votantsActuals, setVotantsActuals] = useState(0)
  const [hiHaEmpat, setHiHaEmpat] = useState(false)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function cargarResultados() {
      const { data: planData } = await supabase
        .from('planes')
        .select('*, cuines_seleccionades')
        .eq('id', params.id)
        .single()

      setPlan(planData)
      const cuines = planData?.cuines_seleccionades || []

      // Comptar membres totals i quants han votat (Escenari 2)
      const { data: membresData } = await supabase
        .from('miembros')
        .select('user_id')
        .eq('plan_id', params.id)
      const total = membresData?.length || 0
      setTotalMembres(total)

      const { data: votosData } = await supabase
        .from('votos')
        .select('restaurante_id, voto, user_id')
        .eq('plan_id', params.id)

      const uniqueVotants = new Set(votosData?.map((v: any) => v.user_id) || [])
      const numVotants = uniqueVotants.size
      setVotantsActuals(numVotants)

      // --- ESCENARI 1: Guanya el local amb més votacions entre els usuaris ---
      // Comptar likes per restaurant
      const conteo: Record<string, number> = {}
      votosData?.forEach(v => {
        if (v.voto) {
          conteo[v.restaurante_id] = (conteo[v.restaurante_id] || 0) + 1
        }
      })

      // --- ESCENARI 2: Si algú no ha votat, el seu vot va a la majoria ---
      // Calcular quants membres NO han votat
      const noVotants = total - numVotants

      if (noVotants > 0 && cuines.length > 0) {
        // Trobar quin restaurant té més likes fins ara (la "majoria")
        // Els no-votants afegeixen el seu "vot" al guanyador provisional
        let maxLikes = 0
        let restaurantMajoria = cuines[0]?.id

        cuines.forEach((r: any) => {
          const likes = conteo[r.id] || 0
          if (likes > maxLikes) {
            maxLikes = likes
            restaurantMajoria = r.id
          }
        })

        // Afegir els vots dels no-votants al restaurant de la majoria
        if (restaurantMajoria) {
          conteo[restaurantMajoria] = (conteo[restaurantMajoria] || 0) + noVotants
        }
      }

      // Construir ranking ordenat per likes DESC
      const ranking = cuines
        .map((r: any) => ({ ...r, nombre: r.nom, votos: conteo[r.id] || 0 }))
        .sort((a: any, b: any) => b.votos - a.votos)

      setResultados(ranking)

      // --- ESCENARI 2 (empat): En cas d'empat, es decideix aleatòriament ---
      if (ranking.length > 0) {
        const maxVotos = ranking[0].votos
        const empatats = ranking.filter((r: any) => r.votos === maxVotos)

        if (empatats.length > 1) {
          // Hi ha empat → decisió aleatòria
          setHiHaEmpat(true)
          const indexAleatori = Math.floor(Math.random() * empatats.length)
          setGanador(empatats[indexAleatori])
        } else {
          setHiHaEmpat(false)
          setGanador(ranking[0])
        }
      }

      setCargando(false)
    }

    cargarResultados()
  }, [])

  const totalVotos = resultados.reduce((s, r) => s + r.votos, 0) || 1
  const medallas = ['🥇', '🥈', '🥉']

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Calculant resultats...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">

      {/* Header */}
      <div className="bg-foreground px-8 pt-6 pb-5 rounded-b-3xl mb-8">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 22 22" fill="none">
              <circle cx="7" cy="8" r="2.5" fill="rgba(255,255,255,0.5)" />
              <circle cx="15" cy="8" r="2.5" fill="rgba(255,255,255,0.8)" />
              <circle cx="11" cy="6" r="2.5" fill="rgba(255,255,255,0.5)" opacity="0.8" />
              <path d="M4 17c0-2.2 2.7-4 6-4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18 17c0-2.2-2.7-4-6-4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: '700', color: 'var(--background)' }}>
              Planify
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/15 border-none rounded-xl px-3.5 py-1.5 text-background text-sm cursor-pointer hover:bg-white/25 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 pb-10">
        <div className="w-full max-w-md mx-auto">

          {/* Guanyador — Escenari 1 */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">{ganador?.emoji}</div>
            <h2 className="text-2xl font-medium mb-1">
              {ganador?.nombre || ganador?.nom} guanya!
            </h2>
            <p className="text-muted-foreground text-sm">
              {plan?.nombre} · {plan?.zona}
            </p>
            {hiHaEmpat && (
              <div className="mt-3 bg-accent rounded-xl px-4 py-2 text-sm text-muted-foreground">
                🎲 Hi havia empat — guanyador decidit aleatòriament
              </div>
            )}
          </div>

          {/* Escenari 2: indicador de participació */}
          {totalMembres > 0 && (
            <div className="bg-accent rounded-xl p-4 mb-6">
              <p className="text-sm font-medium mb-2">Participació del grup</p>
              <div className="flex justify-center gap-2 mb-2">
                {Array.from({ length: totalMembres }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      i < votantsActuals
                        ? 'bg-foreground text-background'
                        : 'bg-border text-muted-foreground'
                    }`}
                  >
                    {i < votantsActuals ? '✓' : '—'}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {votantsActuals} de {totalMembres} han votat
              </p>
              {votantsActuals < totalMembres && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Els vots que faltaven han anat a la majoria
                </p>
              )}
            </div>
          )}

          {/* Ranking complet — Escenari 1 */}
          <div className="flex flex-col gap-3 mb-8">
            {resultados.map((r, i) => {
              const pct = Math.round((r.votos / totalVotos) * 100)
              const esGuanyador = r.id === ganador?.id
              return (
                <div
                  key={r.id}
                  className={`border rounded-xl p-4 transition-all ${
                    esGuanyador
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{medallas[i] || '  '}</span>
                      <span className="text-xl">{r.emoji}</span>
                      <div>
  <p className="font-medium">{r.nombre || r.nom}</p>
  
    <a href={`https://www.google.com/maps/place/?q=place_id:${r.id}`}
    target="_blank"
    rel="noopener noreferrer"
    className={`text-xs underline underline-offset-2 ${esGuanyador ? 'opacity-70' : 'text-muted-foreground'}`}
    onClick={e => e.stopPropagation()}
  >
    📍 Google Maps
  </a>
</div>
                    </div>
                    <span className={`text-sm font-medium ${esGuanyador ? 'opacity-80' : 'text-muted-foreground'}`}>
                      {r.votos} ✓
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${esGuanyador ? 'bg-background/20' : 'bg-accent'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${esGuanyador ? 'bg-background' : 'bg-foreground'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  await supabase.from('votos')
                    .delete()
                    .eq('plan_id', params.id)
                    .eq('user_id', user.id)
                }
                router.push(`/plan/${params.id}/votar`)
              }}
              className="w-full py-3 rounded-lg border border-border hover:bg-accent transition-colors font-medium"
            >
              Votar de nou
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              Tornar a l&apos;inici
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}
