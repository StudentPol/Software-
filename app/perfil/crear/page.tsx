'use client'

import { useState } from 'react'
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
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium mb-2">Crea tu perfil</h1>
          <p className="text-muted-foreground text-sm">
            El agente usará esto para encontrar el restaurante perfecto para tu grupo
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
            {cargando ? 'Guardando...' : 'Guardar perfil y continuar →'}
          </button>
        </div>
      </div>
    </main>
  )
}