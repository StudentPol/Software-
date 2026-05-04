'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic';

function calcularEdad(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  if (isNaN(nacimiento.getTime())) return null
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mesActual = hoy.getMonth()
  const mesNacimiento = nacimiento.getMonth()
  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

const PREFERENCIAS = [
  'Italiana', 'Japonesa', 'Mediterránea', 'Mexicana',
  'Asiática', 'Americana', 'Española', 'Vegana', 'Fusión'
]

const RESTRICCIONES = [
  'Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa',
  'Halal', 'Kosher', 'Sin frutos secos', 'Sin marisco'
]

const PRESUPUESTO = [
  { valor: '€', label: '€ — Económico', sub: 'menos de 15€' },
  { valor: '€€', label: '€€ — Moderado', sub: '15€ - 30€' },
  { valor: '€€€', label: '€€€ — Premium', sub: 'más de 30€' },
]

export default function CrearPerfil() {
  const [nombre, setNombre] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [preferencias, setPreferencias] = useState<string[]>([])
  const [restricciones, setRestricciones] = useState<string[]>([])
  const [presupuesto, setPresupuesto] = useState('€€')
  const [cargando, setCargando] = useState(false)
  const [cargandoPerfil, setCargandoPerfil] = useState(true)
  const [error, setError] = useState('')
  const [esEdicion, setEsEdicion] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: perfilData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (perfilData) {
        setNombre(perfilData.nombre || '')
        setFechaNacimiento(perfilData.fecha_nacimiento || '') // TODO: descomentar cuando exista la columna en BD
        setPreferencias(perfilData.preferencias || [])
        setRestricciones(perfilData.restricciones || [])
        setPresupuesto(perfilData.presupuesto || '€€')
        setEsEdicion(true)
      }

      setCargandoPerfil(false)
    }
    cargarPerfil()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function toggleItem(lista: string[], setLista: (v: string[]) => void, item: string) {
    if (lista.includes(item)) {
      setLista(lista.filter(i => i !== item))
    } else {
      setLista([...lista, item])
    }
  }

  async function handleGuardar() {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    // TODO: activar cuando exista la columna fecha_nacimiento en BD
    const edad = calcularEdad(fechaNacimiento)
     if (!fechaNacimiento) {
       setError('La fecha de nacimiento es obligatoria')
       return
     }
     if (edad === null || edad < 14) {
       setError('Debes tener al menos 14 años para usar esta aplicación')
       return
     }
    setCargando(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      nombre,
      fecha_nacimiento: fechaNacimiento, // TODO: descomentar cuando exista la columna en BD
      preferencias,
      restricciones,
      presupuesto,
    })

    if (error) {
      setError('Error al guardar el perfil: ' + error.message)
      setCargando(false)
      return
    }

    router.push('/')
  }

  if (cargandoPerfil) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando perfil...</p>
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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 pb-10">
        <div className="w-full max-w-lg mx-auto">

          {esEdicion && (
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
              ← Volver
            </a>
          )}

          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              {esEdicion ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/70"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/70"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M6 14a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-2.5"/></svg>
              )}
            </div>
            <h1 className="text-2xl font-medium mb-2">
              {esEdicion ? 'Editar perfil' : 'Crea tu perfil'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {esEdicion
                ? 'Actualiza tus preferencias cuando quieras'
                : 'El agente usará esto para encontrar el restaurante perfecto para tu grupo'}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Tu nombre</label>
              <input
                type="text"
                placeholder="Ej: Laia"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Fecha de nacimiento</label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={e => setFechaNacimiento(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {fechaNacimiento && calcularEdad(fechaNacimiento) !== null && calcularEdad(fechaNacimiento)! < 14 && (
                <p className="text-sm text-red-500 mt-1">Debes tener al menos 14 años para usar esta aplicación.</p>
              )}
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                ¿Qué cocinas te gustan?
                <span className="ml-2 text-xs">(elige todas las que quieras)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCIAS.map(p => (
                  <button
                    key={p}
                    onClick={() => toggleItem(preferencias, setPreferencias, p)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      preferencias.includes(p)
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">
                Restricciones alimentarias
                <span className="ml-2 text-xs">(si tienes alguna)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {RESTRICCIONES.map(r => (
                  <button
                    key={r}
                    onClick={() => toggleItem(restricciones, setRestricciones, r)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      restricciones.includes(r)
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Presupuesto habitual</label>
              <div className="flex flex-col gap-2">
                {PRESUPUESTO.map(p => (
                  <button
                    key={p.valor}
                    onClick={() => setPresupuesto(p.valor)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                      presupuesto === p.valor
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <span className="font-medium">{p.label}</span>
                    <span className="text-sm opacity-70">{p.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleGuardar}
              disabled={cargando}
              className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : esEdicion ? 'Guardar cambios →' : 'Crear perfil y continuar →'}
            </button>
          </div>
        </div>
      </div>

    </main>
  )
}
