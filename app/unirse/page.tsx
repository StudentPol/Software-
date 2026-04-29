'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UnirseASala() {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleUnirse() {
    if (!codigo.trim()) {
      setError('Introduce el código del plan')
      return
    }
    setCargando(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Buscar el plan por código
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

    // Comprobar si ya es miembro
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
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
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
    </main>
  )
}