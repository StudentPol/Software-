'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ZONAS = [
  'Gràcia', 'Eixample', 'Barceloneta', 
  'Poblenou', 'Sant Pere', 'Sarrià', 'Gotic'
]

function generarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums = '123456789'
  let codigo = 'PLAN-'
  for (let i = 0; i < 4; i++) codigo += letras[Math.floor(Math.random() * letras.length)]
  for (let i = 0; i < 2; i++) codigo += nums[Math.floor(Math.random() * nums.length)]
  return codigo
}

export default function CrearPlan() {
  const [nombre, setNombre] = useState('')
  const [zona, setZona] = useState('Gràcia')
  const [fecha, setFecha] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleCrear() {
    if (!nombre.trim()) {
      setError('El nombre del plan es obligatorio')
      return
    }
    setCargando(true)
    setError('')

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

    // Añadir al creador como miembro
    await supabase.from('miembros').insert({
      plan_id: data.id,
      user_id: user.id,
    })

    setCodigoGenerado(codigo)
    setCargando(false)
  }

  if (codigoGenerado) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
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
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              Ir al plan →
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
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
            <label className="text-sm text-muted-foreground block mb-2">Zona</label>
            <div className="flex flex-wrap gap-2">
              {ZONAS.map(z => (
                <button
                  key={z}
                  onClick={() => setZona(z)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    zona === z
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
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
    </main>
  )
}