'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/Avatar'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic';

function HomeContent() {
  const searchParams = useSearchParams()
  const [planes, setPlanes] = useState<any[]>([])
  const [planesFinalitzats, setPlanesFinalitzats] = useState<any[]>([])
  const [perfil, setPerfil] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: perfilData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setPerfil(perfilData)

      const { data: miembrosData } = await supabase
        .from('miembros')
        .select('plan_id, planes(id, nombre, zona, codigo, created_at, fecha, finalitzat, cover_url, creador_id)')
        .eq('user_id', user.id)

      const tots = (miembrosData?.map((m: any) => m.planes).filter(Boolean) || [])
        .sort((a: any, b: any) => {
          if (!a.fecha && !b.fecha) return 0
          if (!a.fecha) return 1
          if (!b.fecha) return -1
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        })

      setPlanes(tots.filter((p: any) => !p.finalitzat))
      setPlanesFinalitzats(tots.filter((p: any) => p.finalitzat))
      setCargando(false)
    }
    cargarDatos()
}, [refresh, searchParams])

  async function handleEliminar(planId: string) {
    if (!confirm('¿Seguro que quieres eliminar este plan?')) return
    setEliminando(planId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: plan } = await supabase.from('planes').select('creador_id').eq('id', planId).single()
    if (plan?.creador_id === user.id) {
      await supabase.from('votos').delete().eq('plan_id', planId)
      await supabase.from('miembros').delete().eq('plan_id', planId)
      await supabase.from('planes').delete().eq('id', planId)
    } else {
      await supabase.from('miembros').delete().eq('plan_id', planId).eq('user_id', user.id)
    }
    setRefresh(prev => prev + 1)
    setEliminando(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function PlanCard({ plan, finalitzat = false }: { plan: any, finalitzat?: boolean }) {
    const esCreador = userId === plan.creador_id
    return (
      <div className={`rounded-2xl bg-background border overflow-hidden ${finalitzat ? 'border-border opacity-70' : 'border-border'}`}>
        {/* Foto de portada */}
        <a href={`/plan/${plan.id}/resultados`} className="block no-underline">
          <div className="w-full h-32 bg-accent relative overflow-hidden">
            {plan.cover_url ? (
              <img
                src={plan.cover_url}
                alt={plan.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent to-border">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                  <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                </svg>
              </div>
            )}
            {finalitzat && (
              <div className="absolute top-2 left-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Finalitzat</span>
              </div>
            )}
          </div>
        </a>

        {/* Info + accions */}
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <a href={`/plan/${plan.id}/resultados`} className="flex-1 min-w-0 no-underline">
            <p className="text-sm font-medium text-foreground truncate">{plan.nombre}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              {plan.zona}
              <span className="opacity-30">·</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v3H9V7a3 3 0 0 1 3-3zm0 8a2 2 0 0 1 1 3.732V18a1 1 0 0 1-2 0v-2.268A2 2 0 0 1 12 12z"/></svg>
              {plan.codigo}
              {plan.fecha && (
                <>
                  <span className="opacity-30">·</span>
                  📅 {new Date(plan.fecha).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}
                </>
              )}
            </p>
          </a>

          <div className="flex items-center gap-1 shrink-0">
            {/* Botó editar — només el creador */}
            {esCreador && (
              <button
                onClick={() => router.push(`/plan/${plan.id}/editar`)}
                title="Editar plan"
                className="bg-transparent border border-border rounded-lg cursor-pointer p-1.5 opacity-50 hover:opacity-90 hover:bg-accent transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
            <button
              onClick={() => handleEliminar(plan.id)}
              disabled={eliminando === plan.id}
              title="Eliminar"
              className="bg-transparent border-none cursor-pointer p-1.5 opacity-40 hover:opacity-70 transition-opacity disabled:opacity-20"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background relative">

      {/* Header */}
      <div className="bg-foreground px-8 pt-6 pb-5 rounded-b-3xl relative z-10">
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
          {/* Avatar con menú desplegable */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl pl-3 pr-2 py-1.5 border-none cursor-pointer"
            >
              <span className="text-sm text-background/80 font-medium">
                {perfil?.nombre || 'amigo'}
              </span>
              <Avatar
                src={perfil?.avatar_url}
                nombre={perfil?.nombre}
                size={32}
                tipo="usuario"
              />
            </button>

            {menuAbierto && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuAbierto(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-20 bg-background rounded-2xl shadow-lg border border-border overflow-hidden min-w-[160px]">
                  <a
                    href="/perfil/crear"
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors no-underline"
                    onClick={() => setMenuAbierto(false)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Ver perfil
                  </a>
                  <div className="border-t border-border" />
                  <button
                    onClick={() => { setMenuAbierto(false); handleLogout() }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors bg-transparent border-none cursor-pointer text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero image */}
      <div className="mb-8 -mt-6 z-0 relative">
        <img
          src="/images/banner.png"
          alt=""
          className="w-full h-36 object-cover rounded-b-3xl"
        />
      </div>

      <div className="max-w-3xl mx-auto px-8 pb-10">

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <a href="/plan/crear" className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-foreground text-background no-underline flex-1 hover:opacity-90 transition-opacity">
            <span className="text-sm font-light">+</span>
            <div>
              <p className="text-sm font-medium m-0">Crear plan</p>
              <p className="text-xs opacity-50 m-0">Nuevo grupo</p>
            </div>
          </a>
          <a href="/unirse" className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-background no-underline flex-1 border border-border hover:bg-accent transition-colors">
            <span className="text-sm text-foreground">#</span>
            <div>
              <p className="text-sm font-medium text-foreground m-0">Unirme</p>
              <p className="text-sm text-muted-foreground m-0">Tengo un código</p>
            </div>
          </a>
        </div>

        {/* Plans actius */}
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
            {planes.length > 0 ? `Plans actius (${planes.length})` : 'Sense plans actius'}
          </p>
          {planes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-muted/30">
              <div className="flex justify-center mb-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
              </div>
              <p className="text-muted-foreground text-sm">Crea el teu primer pla o uneix-te amb un codi</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {planes.map((plan: any) => <PlanCard key={plan.id} plan={plan} />)}
            </div>
          )}
        </div>

        {/* Plans finalitzats */}
        {planesFinalitzats.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-3">
              Plans finalitzats ({planesFinalitzats.length})
            </p>
            <div className="grid grid-cols-2 gap-3">
              {planesFinalitzats.map((plan: any) => <PlanCard key={plan.id} plan={plan} finalitzat />)}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-border flex justify-between items-center">
          <a href="/perfil/crear" className="text-sm text-muted-foreground no-underline hover:text-foreground transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar perfil
          </a>
          <p className="text-sm text-muted-foreground/50" style={{ fontFamily: 'var(--font-heading)' }}>Planify</p>
        </div>

      </div>
    </main>
  )
}
export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}