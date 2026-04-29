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

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Calculando resultados...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
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
            onClick={() => router.push(`/plan/${params.id}/votar`)}
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
    </main>
  )
}