'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default function UnirseASala() {
  const searchParams = useSearchParams()
  const [codigo, setCodigo] = useState(searchParams.get('codigo') || '')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleUnirse() {
    if (!codigo.trim()) {
      setError('Introduce el código del plan')
      return
    }
    setCargando(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { 
      router.push(`/auth/login?redirect=/unirse?codigo=${codigo}`)
      return 
    }

    const { data: plan, error: planError } = await supabase
      .from('planes')
      .select('*')
      .eq('codigo', codigo.toUpperCase())
      .single()

    if (planError || !plan) {
      setError('Código incorrecto, compruébalo')
      setCargando(false)
      return
    }

    const { data: miembroExiste } = await supabase
      .from('miembros')
      .select('id')
      .eq('plan_id', plan.id)
      .eq('user_id', user.id)
      .single()

    if (!miembroExiste) {
      await supabase.from('miembros').insert({
        plan_id: plan.id,
        user_id: user.id,
      })
    }

    router.push(`/plan/${plan.id}`)
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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 pb-10">
        <div className="w-full max-w-md mx-auto">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            ← Volver
          </a>
          <h2 className="text-2xl font-medium mb-2">Unirme a un plan</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Introduce el código que te ha compartido tu amigo
          </p>

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Código del plan</label>
              <input
                type="text"
                placeholder="Ej: PLAN-ABC123"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring uppercase"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleUnirse}
              disabled={cargando}
              className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {cargando ? 'Buscando plan...' : 'Unirme al plan →'}
            </button>
          </div>
        </div>
      </div>

    </main>
  )
}
