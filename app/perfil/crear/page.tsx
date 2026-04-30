'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

      const { data: perfil } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (perfil) {
        setNombre(perfil.nombre || '')
        setPreferencias(perfil.preferencias || [])
        setRestricciones(perfil.restricciones || [])
        setPresupuesto(perfil.presupuesto || '€€')
        setEsEdicion(true)
      }

      setCargandoPerfil(false)
    }
    cargarPerfil()
  }, [])

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
    setCargando(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      nombre,
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
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">

        {esEdicion && (
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
            ← Volver
          </a>
        )}

        <div className="text-center mb-8">
          <div className="text-3xl mb-3">
            {esEdicion ? '✏️' : '👋'}
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
    </main>
  )
}