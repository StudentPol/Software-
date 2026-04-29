'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function PlanPage() {
  const [plan, setPlan] = useState<any>(null)
  const [miembros, setMiembros] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function cargarPlan() {
      const { data: planData } = await supabase
        .from('planes')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!planData) { router.push('/'); return }
      setPlan(planData)

      const { data: miembrosData } = await supabase
        .from('miembros')
        .select('user_id, profiles(nombre)')
        .eq('plan_id', params.id)

      setMiembros(miembrosData || [])
      setCargando(false)
    }
    cargarPlan()
  }, [])

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando plan...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
          ← Volver
        </a>

        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-1">{plan.nombre}</h2>
          <p className="text-muted-foreground text-sm">📍 {plan.zona} · 🔑 {plan.codigo}</p>
        </div>

        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-3">
            Miembros del plan ({miembros.length})
          </p>
          <div className="flex flex-col gap-2">
            {miembros.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium">
                  {m.profiles?.nombre?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="font-medium">{m.profiles?.nombre || 'Usuario'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-accent rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Comparte este código</p>
          <p className="text-2xl font-medium tracking-widest">{plan.codigo}</p>
        </div>

        <button
          onClick={() => router.push(`/plan/${params.id}/votar`)}
          className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          Buscar restaurantes y votar →
        </button>
      </div>
    </main>
  )
}