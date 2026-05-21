'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'



function generarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums = '123456789'
  let codigo = 'PLAN-'
  for (let i = 0; i < 4; i++) codigo += letras[Math.floor(Math.random() * letras.length)]
  for (let i = 0; i < 2; i++) codigo += nums[Math.floor(Math.random() * nums.length)]
  return codigo
}

function Banner({ onLogout }: { onLogout: () => void }) {
  return (
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
          onClick={onLogout}
          className="bg-white/15 border-none rounded-xl px-3.5 py-1.5 text-background text-sm cursor-pointer hover:bg-white/25 transition-colors"
        >
          Salir
        </button>
      </div>
    </div>
  )
}

export default function CrearPlan() {
  const [nombre, setNombre] = useState('')
  const [zona, setZona] = useState('')
  const [fecha, setFecha] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const [planId, setPlanId] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleCrear() {
    if (!nombre.trim()) {
      setError('El nombre del plan es obligatorio')
      return
    }
    setCargando(true)
    setError('')

    if (!zona.trim()) {
      setError('La zona és obligatòria')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const codigo = generarCodigo()

    const { data, error } = await supabase.from('planes').insert({
      nombre,
      zona,
      fecha,
      codigo,
      creador_id: user.id,
    }).select().single()

    if (error) {
      setError('Error al crear el plan: ' + error.message)
      setCargando(false)
      return
    }

    await supabase.from('miembros').insert({
      plan_id: data.id,
      user_id: user.id,
    })

    setCodigoGenerado(codigo)
    setPlanId(data.id)
    setCargando(false)
  }

  if (codigoGenerado) {
    return (
      <main className="min-h-screen bg-background">
        <Banner onLogout={handleLogout} />
        <div className="max-w-3xl mx-auto px-8 pb-10">
          <div className="w-full max-w-md mx-auto text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-medium mb-2">¡Plan creado!</h2>
            <p className="text-muted-foreground mb-8">
              Comparte este código con tu grupo
            </p>

            <div className="bg-accent rounded-2xl p-8 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Código de invitación</p>
              <p className="text-4xl font-medium tracking-widest">{codigoGenerado}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(codigoGenerado)}
                className="w-full py-3 rounded-lg border border-border hover:bg-accent transition-colors font-medium"
              >
                Copiar código
              </button>
              <button
  onClick={() => navigator.clipboard.writeText(
    `${window.location.origin}/unirse?codigo=${codigoGenerado}`
  )}
  className="w-full py-3 rounded-lg border border-border hover:bg-accent transition-colors font-medium"
>
  🔗 Copiar enlace de invitación
</button>
              <button
                onClick={() => router.push(`/plan/${planId}`)}
                className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
              >
                Ir al plan →
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Banner onLogout={handleLogout} />
      <div className="max-w-3xl mx-auto px-8 pb-10">
        <div className="w-full max-w-md mx-auto">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            ← Volver
          </a>
          <h2 className="text-2xl font-medium mb-8">Crear plan</h2>

          <div className="flex flex-col gap-6">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Nombre del plan</label>
              <input
                type="text"
                placeholder="Ej: Cena del viernes"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
  <label className="text-sm text-muted-foreground block mb-2">Zona o barri</label>
  <input
    type="text"
    placeholder="Ej: Gràcia, Eixample, Poblenou..."
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
    min={new Date().toISOString().split('T')[0]}
    onChange={e => {
      const seleccionada = e.target.value
      const avui = new Date().toISOString().split('T')[0]
      if (seleccionada >= avui) setFecha(seleccionada)
    }}
    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
  />
  {fecha && (
    <p className="text-xs text-muted-foreground mt-1.5">
      📅 {new Date(fecha + 'T12:00:00').toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
    </p>
  )}
</div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleCrear}
              disabled={cargando}
              className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {cargando ? 'Creando plan...' : 'Crear plan y obtener código →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
