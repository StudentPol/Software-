'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [planes, setPlanes] = useState<any[]>([])
  const [perfil, setPerfil] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfilData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setPerfil(perfilData)

      const { data: miembrosData } = await supabase
        .from('miembros')
        .select('plan_id, planes(id, nombre, zona, codigo, created_at)')
        .eq('user_id', user.id)

      const planesActivos = miembrosData
        ?.map((m: any) => m.planes)
        .filter(Boolean) || []

      setPlanes(planesActivos)
      setCargando(false)
    }
    cargarDatos()
  }, [refresh])

  async function handleEliminar(planId: string) {
    if (!confirm('¿Seguro que quieres eliminar este plan?')) return
    setEliminando(planId)
  
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
  
    // Comprobar si eres el creador
    const { data: plan } = await supabase
      .from('planes')
      .select('creador_id')
      .eq('id', planId)
      .single()
  
    if (plan?.creador_id === user.id) {
      // Si eres el creador, eliminar todo el plan
      await supabase.from('votos').delete().eq('plan_id', planId)
      await supabase.from('miembros').delete().eq('plan_id', planId)
      await supabase.from('planes').delete().eq('id', planId)
    } else {
      // Si no eres el creador, solo salirte del plan
      await supabase.from('miembros').delete()
        .eq('plan_id', planId)
        .eq('user_id', user.id)
    }
  
    setPlanes(prev => prev.filter(p => p.id !== planId))
    setEliminando(null)
    setRefresh(prev => prev + 1)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-medium">🍽️ Planify</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hola, {perfil?.nombre || 'amigo'} 👋
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Salir
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-10">
        
          <a href="/plan/crear"
          className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          <span className="text-2xl">+</span>
          <span className="font-medium text-sm">Crear plan</span>
          <span className="text-xs opacity-60">Nuevo grupo</span>
        </a>
        
          <a href="/unirse"
          className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-foreground hover:bg-accent transition-colors"
        >
          <span className="text-2xl">#</span>
          <span className="font-medium text-sm">Unirme</span>
          <span className="text-xs text-muted-foreground">Tengo un código</span>
        </a>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          {planes.length > 0 ? `Planes activos (${planes.length})` : 'Sin planes activos'}
        </h2>

        {planes.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-muted-foreground text-sm">
              Crea tu primer plan o únete a uno con un código
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {planes.map((plan: any) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent transition-colors"
              >
                <a href={`/plan/${plan.id}`} className="flex-1">
                  <p className="font-medium">{plan.nombre}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    📍 {plan.zona} · 🔑 {plan.codigo}
                  </p>
                </a>
                <button
                  onClick={() => handleEliminar(plan.id)}
                  disabled={eliminando === plan.id}
                  className="ml-4 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {eliminando === plan.id ? '...' : '🗑'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 pt-6 border-t border-border flex justify-between items-center">
        <a href="/perfil/crear" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ✏️ Editar perfil
        </a>
        <p className="text-xs text-muted-foreground">Planify MVP</p>
      </div>
    </main>
  )
}