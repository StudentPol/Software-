'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function PlanPage() {
  const [plan, setPlan] = useState<any>(null)
  const [miembros, setMiembros] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
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
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
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

        {userId === plan.creador_id ? (
          <button
            onClick={() => router.push(`/plan/${params.id}/votar`)}
            className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          >
            ¡Todo el grupo está! Empezar votación →
          </button>
        ) : (
          <div className="w-full py-4 rounded-xl border border-dashed border-border text-center">
            <p className="text-sm text-muted-foreground">⏳ Esperando a que el creador inicie la votación...</p>
        </div>
        )}
    </div>
      </div>
    </main>
  )
}