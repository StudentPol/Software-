'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { AvatarUpload } from '@/components/Avatar'

export const dynamic = 'force-dynamic'

export default function EditarPlan() {
  const [nombre, setNombre] = useState('')
  const [zona, setZona] = useState('')
  const [fecha, setFecha] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [esCreador, setEsCreador] = useState(false)
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: plan } = await supabase
        .from('planes')
        .select('*')
        .eq('id', planId)
        .single()

      if (!plan) { router.push('/'); return }

      // Solo el creador puede editar
      if (plan.creador_id !== user.id) {
        router.push(`/plan/${planId}`)
        return
      }

      setEsCreador(true)
      setNombre(plan.nombre || '')
      setZona(plan.zona || '')
      setFecha(plan.fecha || '')
      setCoverUrl(plan.cover_url || null)
      setCargando(false)
    }
    cargar()
  }, [planId])

  async function uploadCover(file: File): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    setSubiendoFoto(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'plan-covers')
    formData.append('path', `${planId}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`)

    const res = await fetch('/api/avatar', { method: 'POST', body: formData })
    if (!res.ok) {
      const { error } = await res.json()
      setError(error || 'Error al subir la imagen')
      setSubiendoFoto(false)
      return null
    }
    const { url } = await res.json()

    // Guardar inmediatamente en BD
    await supabase.from('planes').update({ cover_url: url }).eq('id', planId)

    setSubiendoFoto(false)
    return url
  }

  async function deleteCover() {
    if (coverUrl) {
      const path = coverUrl.split('/plan-covers/')[1]
      if (path) await supabase.storage.from('plan-covers').remove([path])
    }
    await supabase.from('planes').update({ cover_url: null }).eq('id', planId)
    setCoverUrl(null)
  }

  async function handleGuardar() {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!zona.trim()) { setError('La zona es obligatoria'); return }

    setGuardando(true)
    setError('')

    const { error } = await supabase
      .from('planes')
      .update({ nombre, zona, fecha: fecha || null, cover_url: coverUrl })
      .eq('id', planId)

    if (error) {
      setError('Error al guardar: ' + error.message)
      setGuardando(false)
      return
    }

    router.push(`/plan/${planId}`)
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
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
            onClick={() => router.push(`/plan/${planId}`)}
            className="bg-white/15 border-none rounded-xl px-3.5 py-1.5 text-background text-sm cursor-pointer hover:bg-white/25 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 pb-10">
        <div className="w-full max-w-md mx-auto">

          <h2 className="text-2xl font-medium mb-8">Editar plan</h2>

          <div className="flex flex-col gap-6">

            {/* Foto de portada */}
            <div>
              <label className="text-sm text-muted-foreground block mb-3">
                Foto del plan
                <span className="ml-2 text-xs">(opcional)</span>
              </label>
              <div className="flex items-center gap-4">
                <AvatarUpload
                  currentUrl={coverUrl}
                  nombre={nombre || 'Plan'}
                  size={72}
                  tipo="plan"
                  onUpload={uploadCover}
                  onChange={(url) => setCoverUrl(url)}
                  onDelete={deleteCover}
                />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {subiendoFoto
                    ? 'Subiendo foto...'
                    : coverUrl
                    ? 'Haz clic en la X para borrar, o en la foto para cambiarla.'
                    : 'Haz clic para subir una foto de portada.'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Nombre del plan</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Zona o barrio</label>
              <input
                type="text"
                value={zona}
                onChange={e => setZona(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                Fecha aproximada
                <span className="ml-2 text-xs">(opcional)</span>
              </label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {fecha && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  📅 {new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleGuardar}
              disabled={guardando || subiendoFoto}
              className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {subiendoFoto ? 'Subiendo foto...' : guardando ? 'Guardando...' : 'Guardar cambios →'}
            </button>

          </div>
        </div>
      </div>

    </main>
  )
}