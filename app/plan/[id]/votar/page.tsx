'use client'
import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'


const RESTAURANTES_PRUEBA = [
  {
    id: '1',
    nombre: 'La Pepita',
    cocina: 'Mediterránea',
    precio: '€€',
    emoji: '🥗',
    rating: 4.5,
    distancia: '200m',
    tags: ['Vegano', 'Sin gluten', 'Terraza'],
  },
  {
    id: '2',
    nombre: 'Bar Brutal',
    cocina: 'Vinos & Tapas',
    precio: '€€€',
    emoji: '🍷',
    rating: 4.7,
    distancia: '450m',
    tags: ['Natural wines', 'Compartir'],
  },
  {
    id: '3',
    nombre: 'Parking Pizza',
    cocina: 'Italiana',
    precio: '€€',
    emoji: '🍕',
    rating: 4.4,
    distancia: '300m',
    tags: ['Pizza', 'Ambiente', 'Fun'],
  },
  {
    id: '4',
    nombre: 'Flax & Kale',
    cocina: 'Vegana',
    precio: '€€€',
    emoji: '🌱',
    rating: 4.3,
    distancia: '600m',
    tags: ['Healthy', 'Sin gluten', 'Vegano'],
  },
  {
    id: '5',
    nombre: 'La Cova Fumada',
    cocina: 'Catalana',
    precio: '€',
    emoji: '🦑',
    rating: 4.6,
    distancia: '2.1km',
    tags: ['Clásico', 'Sin reservas'],
  },
]

export default function VotarPage() {
    const supabase = createClient()
  const [indice, setIndice] = useState(0)
  const [votos, setVotos] = useState<{ id: string; voto: boolean }[]>([])
  const [animacion, setAnimacion] = useState('')
  const [terminado, setTerminado] = useState(false)
  const params = useParams()
  const router = useRouter()
  useEffect(() => {
    async function comprobarVotos() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
  
      const { data: votosExistentes } = await supabase
        .from('votos')
        .select('id')
        .eq('plan_id', params.id)
        .eq('user_id', user.id)
  
      if (votosExistentes && votosExistentes.length >= RESTAURANTES_PRUEBA.length) {
        router.push(`/plan/${params.id}/resultados`)
      } else {
        setIndice(0)
        setVotos([])
        setTerminado(false)
      }
    }
    comprobarVotos()
  }, [])
  const restaurante = RESTAURANTES_PRUEBA[indice]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const banner = (
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
  )

  async function votar(voto: boolean) {
    setAnimacion(voto ? 'right' : 'left')
  
    const { data: { user } } = await supabase.auth.getUser()
  
    if (user) {
      await supabase.from('votos').upsert({
        plan_id: params.id,
        user_id: user.id,
        restaurante_id: restaurante.id,
        voto,
      })
    }
  
    setTimeout(() => {
      setVotos(prev => [...prev, { id: restaurante.id, voto }])
      setAnimacion('')
      if (indice + 1 >= RESTAURANTES_PRUEBA.length) {
        setTerminado(true)
      } else {
        setIndice(prev => prev + 1)
      }
    }, 300)
  }

  if (terminado) {
    const likes = votos.filter(v => v.voto).map(v =>
      RESTAURANTES_PRUEBA.find(r => r.id === v.id)
    )

    return (
      <main className="min-h-screen bg-background">
        {banner}
        <div className="max-w-3xl mx-auto px-8 pb-10">
          <div className="w-full max-w-md mx-auto text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-2xl font-medium mb-2">¡Has votado!</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Esperando que el resto del grupo vote...
          </p>

          {likes.length > 0 ? (
            <div className="flex flex-col gap-3 mb-8">
              <p className="text-sm text-muted-foreground text-left">Tus likes</p>
              {likes.map((r, i) => r && (
                <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border">
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="text-left">
                    <p className="font-medium">{r.nombre}</p>
                    <p className="text-sm text-muted-foreground">{r.cocina} · {r.precio}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mb-8">No has dado like a ninguno 😅</p>
          )}

          <button
            onClick={() => router.push(`/plan/${params.id}/resultados`)}
            className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          >
            Ver resultados →
          </button>
        </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {banner}
      <div className="max-w-3xl mx-auto px-8 pb-10">
        <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-between items-center mb-6">
          <a href={`/plan/${params.id}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver
          </a>
          <span className="text-sm text-muted-foreground">
            {indice + 1} / {RESTAURANTES_PRUEBA.length}
          </span>
        </div>

        <div
          className="border border-border rounded-2xl p-6 mb-6 transition-all duration-300"
          style={{
            transform: animacion === 'right'
              ? 'translateX(200px) rotate(15deg)'
              : animacion === 'left'
              ? 'translateX(-200px) rotate(-15deg)'
              : 'none',
            opacity: animacion ? 0 : 1,
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-medium">{restaurante.nombre}</h3>
              <p className="text-muted-foreground text-sm">{restaurante.cocina}</p>
            </div>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-accent">
              {restaurante.precio}
            </span>
          </div>

          <div className="h-32 rounded-xl bg-accent flex items-center justify-center text-5xl mb-4">
            {restaurante.emoji}
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            {restaurante.tags.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-accent text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>⭐ {restaurante.rating}</span>
            <span>📍 {restaurante.distancia}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => votar(false)}
            className="flex-1 py-4 rounded-xl border border-border hover:bg-red-50 hover:border-red-200 transition-colors text-2xl"
          >
            ✗
          </button>
          <button
            onClick={() => votar(true)}
            className="flex-1 py-4 rounded-xl border border-border hover:bg-green-50 hover:border-green-200 transition-colors text-2xl"
          >
            ✓
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          ✗ No me convence · ✓ Me apunta
        </p>
        </div>
      </div>
    </main>
  )
}