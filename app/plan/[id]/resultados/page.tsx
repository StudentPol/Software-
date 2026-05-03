'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

const RESTAURANTES_PRUEBA = [
  { id: '1', nombre: 'La Pepita', cocina: 'Mediterránea', precio: '€€', emoji: '🥗' },
  { id: '2', nombre: 'Bar Brutal', cocina: 'Vinos & Tapas', precio: '€€€', emoji: '🍷' },
  { id: '3', nombre: 'Parking Pizza', cocina: 'Italiana', precio: '€€', emoji: '🍕' },
  { id: '4', nombre: 'Flax & Kale', cocina: 'Vegana', precio: '€€€', emoji: '🌱' },
  { id: '5', nombre: 'La Cova Fumada', cocina: 'Catalana', precio: '€', emoji: '🦑' },
]

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<any[]>([])
  const [plan, setPlan] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function cargarResultados() {
      const { data: planData } = await supabase
        .from('planes')
        .select('*')
        .eq('id', params.id)
        .single()

      setPlan(planData)

      const { data: votosData } = await supabase
        .from('votos')
        .select('restaurante_id, voto')
        .eq('plan_id', params.id)

      // Contar votos por restaurante
      const conteo: Record<string, number> = {}
      votosData?.forEach(v => {
        if (v.voto) {
          conteo[v.restaurante_id] = (conteo[v.restaurante_id] || 0) + 1
        }
      })

      // Ordenar restaurantes por votos
      const ranking = RESTAURANTES_PRUEBA
        .map(r => ({ ...r, votos: conteo[r.id] || 0 }))
        .sort((a, b) => b.votos - a.votos)

      setResultados(ranking)
      setCargando(false)
    }

    cargarResultados()
  }, [])

  const totalVotos = resultados.reduce((s, r) => s + r.votos, 0) || 1
  const ganador = resultados[0]
  const medallas = ['🥇', '🥈', '🥉']

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Calculando resultados...</p>
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
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{ganador?.emoji}</div>
          <h2 className="text-2xl font-medium mb-1">¡{ganador?.nombre} gana!</h2>
          <p className="text-muted-foreground text-sm">
            {plan?.nombre} · {plan?.zona}
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {resultados.map((r, i) => {
            const pct = Math.round((r.votos / totalVotos) * 100)
            return (
              <div key={r.id} className="border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{medallas[i] || '  '}</span>
                    <div>
                      <p className="font-medium">{r.nombre}</p>
                      <p className="text-xs text-muted-foreground">{r.cocina} · {r.precio}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {r.votos} ✓
                  </span>
                </div>
                <div className="h-2 rounded-full bg-accent overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-500"
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
          Votar de nuevo
        </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          >
            Volver al inicio
          </button>
        </div>
        </div>
      </div>
    </main>
  )
}