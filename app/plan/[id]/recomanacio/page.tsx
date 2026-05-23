'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import {
  calcularRecomanacions,
  resumPressupostGrup,
  restriccionsDelGrup,
  type PerfilUsuari,
  type ResultatCuina,
} from '@/lib/recomanacio'

export default function RecomanacioPage() {
  const [plan, setPlan] = useState<any>(null)
  const [resultats, setResultats] = useState<ResultatCuina[]>([])
  const [perfils, setPerfils] = useState<PerfilUsuari[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [teRestaurants, setTeRestaurants] = useState(false)

  useEffect(() => {
    async function carregar() {
      // Carregar dades del pla
      const { data: planData, error: planError } = await supabase
        .from('planes')
        .select('*')
        .eq('id', params.id)
        .single()

      if (planError || !planData) {
        router.push('/')
        return
      }
      setPlan(planData)
      setTeRestaurants(!!(planData.cuines_seleccionades?.length > 0))

      // Carregar membres del pla amb els seus perfils
      const { data: membresData, error: membresError } = await supabase
        .from('miembros')
        .select('user_id, profiles(id, nombre, preferencias, restricciones, presupuesto)')
        .eq('plan_id', params.id)

      if (membresError) {
        setError('Error carregant els membres del pla.')
        setCargando(false)
        return
      }

      // Transformar a PerfilUsuari[]
      const perfilsCarregats: PerfilUsuari[] = (membresData || [])
        .filter((m: any) => m.profiles)
        .map((m: any) => ({
          id: m.profiles.id,
          nom: m.profiles.nombre || 'Usuari',
          preferencies: m.profiles.preferencias || [],
          restriccions: m.profiles.restricciones || [],
          pressupost: m.profiles.presupuesto || '€€',
        }))

        setPerfils(perfilsCarregats)
        const { ranking } = calcularRecomanacions(perfilsCarregats) // 👈 Extraiem 'ranking'
        setResultats(ranking)
        setCargando(false)
    }

    carregar()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3">🔄</div>
          <p className="text-muted-foreground">Creuant gustos del grup...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/plan/${params.id}`)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Tornar al pla
          </button>
        </div>
      </main>
    )
  }

  const compatibles = resultats.filter(r => r.compatible)
  const incompatibles = resultats.filter(r => !r.compatible)
  const top3 = compatibles.slice(0, 3)
  const resta = compatibles.slice(3)
  const pressupostGrup = resumPressupostGrup(perfils)
  const restriccionsGrup = restriccionsDelGrup(perfils)

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

        {/* Capçalera */}
        <a
          href={`/plan/${params.id}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          ← Tornar
        </a>

        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-1">Recomanació del grup</h2>
          <p className="text-muted-foreground text-sm">
            📍 {plan?.zona} · {perfils.length} {perfils.length === 1 ? 'membre' : 'membres'}
          </p>
        </div>

        {/* Resum del grup */}
        <div className="bg-accent rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-3">Resum del grup</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {perfils.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border text-sm"
              >
                <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
                  {p.nom[0].toUpperCase()}
                </span>
                <span>{p.nom}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>💰 Pressupost mig: {pressupostGrup}</span>
            {restriccionsGrup.length > 0 && (
              <span>⚠️ {restriccionsGrup.join(', ')}</span>
            )}
          </div>
        </div>

        {/* Top 3 recomanats */}
        {top3.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Millors opcions per al grup</p>
            <div className="flex flex-col gap-3">
              {top3.map((r, i) => {
                const medalles = ['🥇', '🥈', '🥉']
                const isGuanyador = i === 0
                return (
                  <div
                    key={r.cuina.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isGuanyador
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{medalles[i]}</span>
                        <span className="text-2xl">{r.cuina.emoji}</span>
                        <div>
                          <p className="font-medium">{r.cuina.nom}</p>
                          {r.membres_a_favor.length > 0 && (
                            <p className={`text-xs mt-0.5 ${isGuanyador ? 'opacity-70' : 'text-muted-foreground'}`}>
                              Li agrada a: {r.membres_a_favor.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Barra de puntuació */}
                      <div className="text-right">
                        <span className={`text-sm font-medium ${isGuanyador ? '' : 'text-muted-foreground'}`}>
                          {r.puntuacio}%
                        </span>
                      </div>
                    </div>

                    {/* Barra de progrés */}
                    <div className={`h-1.5 rounded-full overflow-hidden ${isGuanyador ? 'bg-background/20' : 'bg-accent'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isGuanyador ? 'bg-background' : 'bg-foreground'}`}
                        style={{ width: `${r.puntuacio}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resta de compatibles (colapsades) */}
        {resta.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Altres opcions compatibles</p>
            <div className="flex flex-col gap-2">
              {resta.map(r => (
                <div
                  key={r.cuina.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.cuina.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">{r.cuina.nom}</p>
                      {r.membres_a_favor.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Li agrada a: {r.membres_a_favor.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{r.puntuacio}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incompatibles */}
        {incompatibles.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">No recomanat pel grup</p>
            <div className="flex flex-col gap-2">
              {incompatibles.map(r => (
                <div
                  key={r.cuina.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-border opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl grayscale">{r.cuina.emoji}</span>
                    <div>
                      <p className="font-medium text-sm line-through">{r.cuina.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        ⚠️ {r.membres_en_contra.join(', ')} no {r.membres_en_contra.length === 1 ? 'pot' : 'poden'} menjar-hi
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cas especial: ningú té preferències al perfil */}
        {compatibles.every(r => r.membres_a_favor.length === 0) && (
          <div className="bg-accent rounded-xl p-4 mb-6 text-center text-sm text-muted-foreground">
            💡 Cap membre ha definit preferències al seu perfil. Tots els restaurants puntuen igual.
          </div>
        )}
{/* CTA: anar a votar */}
{!teRestaurants && (
          <button
            onClick={async () => {
              const { pressupostDominant, restriccionsGrup } = calcularRecomanacions(perfils)

              const cuinesAVotar = compatibles.slice(0, 5).map(r => ({
                id: r.cuina.id,
                nom: r.cuina.nom,
                emoji: r.cuina.emoji,
                puntuacio: r.puntuacio,
                membres_a_favor: r.membres_a_favor,
              }))

              // 1. Cridem l'API i USEM el resultat amb dades reals de Google Places
              let restaurantsAGuardar = cuinesAVotar
              try {
                const params_query = new URLSearchParams({
                  cuines: cuinesAVotar.map(c => c.nom).join(','),
                  puntuacions: cuinesAVotar.map(c => c.puntuacio).join(','),
                  membres: cuinesAVotar.map(c => c.membres_a_favor.join('|')).join(','),
                  zona: plan?.zona || '',
                  preu_ideal: pressupostDominant,
                  restriccions: restriccionsGrup.join(','),
                })
                const res = await fetch(`/api/restaurants?${params_query}`)
                if (res.ok) {
                  const data = await res.json()
                  if (data.restaurants && data.restaurants.length > 0) {
                    // Usem les dades reals de Google (amb adreca, foto, rating, etc.)
                    restaurantsAGuardar = data.restaurants
                  }
                }
              } catch (err) {
                console.error("Error cridant l'API de restaurants:", err)
              }

              // 2. Guardem a Supabase amb totes les dades reals
              const { error } = await supabase
                .from('planes')
                .update({ cuines_seleccionades: restaurantsAGuardar })
                .eq('id', params.id)

              if (error) { alert('Error guardant: ' + error.message); return }
              router.push(`/plan/${params.id}/votar`)
            }}
            className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          >
            Ara a votar restaurants específics →
          </button>
        )}
      </div>
      </div>
    </main>
  )
}