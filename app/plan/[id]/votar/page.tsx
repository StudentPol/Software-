'use client'
import { createClient } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export const dynamic = 'force-dynamic';

export default function VotarPage() {
  const supabase = createClient()
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [indice, setIndice] = useState(0)
  const [votos, setVotos] = useState<{ id: string; voto: boolean }[]>([])
  const [animacion, setAnimacion] = useState('')
  const [terminado, setTerminado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [totalMembres, setTotalMembres] = useState(0)
  const [votantsActuals, setVotantsActuals] = useState(0)
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Carregar restaurants del pla
      const { data: planData } = await supabase
        .from('planes')
        .select('cuines_seleccionades')
        .eq('id', params.id)
        .single()

      const cuines = planData?.cuines_seleccionades || []
      setRestaurants(cuines)

      // Comptar membres totals del pla (Escenari 2: necessitem saber el total per fer el tracking)
      const { data: membresData } = await supabase
        .from('miembros')
        .select('user_id')
        .eq('plan_id', params.id)
      setTotalMembres(membresData?.length || 0)

      // Comptar quants usuaris únics ja han votat (Escenari 2: tracking de participació)
      const { data: votantsData } = await supabase
        .from('votos')
        .select('user_id')
        .eq('plan_id', params.id)
      const uniqueVotants = new Set(votantsData?.map((v: any) => v.user_id) || [])
      setVotantsActuals(uniqueVotants.size)

      // Comprovar si l'usuari actual ja ha votat tots els restaurants
      const { data: votosExistentes } = await supabase
        .from('votos')
        .select('id')
        .eq('plan_id', params.id)
        .eq('user_id', user.id)

        if (votosExistentes && votosExistentes.length >= cuines.length && cuines.length > 0) {
          // Carregar els vots anteriors per mostrar-los correctament
          const { data: votosAnteriors } = await supabase
            .from('votos')
            .select('restaurante_id, voto')
            .eq('plan_id', params.id)
            .eq('user_id', user.id)
        
          const votosCarregats = (votosAnteriors || []).map((v: any) => ({
            id: v.restaurante_id,
            voto: v.voto,
          }))
          setVotos(votosCarregats)
          setTerminado(true)
        } else {
          setIndice(votosExistentes?.length || 0)
          setVotos([])
          setTerminado(false)
        }

      setCargando(false)
    }
    cargar()
  }, [])

  async function votar(voto: boolean) {
    const restaurante = restaurants[indice]
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
      const nouVotos = [...votos, { id: restaurante.id, voto }]
      setVotos(nouVotos)
      setAnimacion('')
      if (indice + 1 >= restaurants.length) {
        setTerminado(true)
        // Escenari 2: actualitzar el comptador de votants en acabar
        setVotantsActuals(prev => prev + 1)
      } else {
        setIndice(prev => prev + 1)
      }
    }, 300)
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregant restaurants...</p>
      </main>
    )
  }

  if (restaurants.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No hi ha restaurants per votar encara.</p>
          <button onClick={() => router.push(`/plan/${params.id}/recomanacio`)}
            className="text-sm underline">
            Genera la recomanació primer
          </button>
        </div>
      </main>
    )
  }

  // Pantalla: l'usuari ja ha votat — Escenari 2: esperant la resta del grup
  if (terminado) {
    const likes = votos.filter(v => v.voto).map(v => restaurants.find((r: any) => r.id === v.id))
    const faltanVotar = totalMembres - votantsActuals
    const totsMembresHanVotat = faltanVotar <= 0

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-2xl font-medium mb-2">Has votat!</h2>

          {/*
           * ESCENARI 2: Criteri d'acceptació — És necessari el vot de tots els usuaris.
           * Context: hi ha un procés de votació.
           * Event: si una persona decideix no votar.
           * Comportament esperat: el vot va a la majoria i en cas d'empat és aleatori.
           *
           * Aquí es mostra l'indicador de quants han votat i s'avisa del comportament
           * si algú no vota (implementat a resultados/page.tsx).
           */}
          <div className="bg-accent rounded-xl p-4 mb-6">
            <p className="text-sm font-medium mb-2">Votació del grup</p>
            <div className="flex justify-center gap-2 mb-2">
              {Array.from({ length: totalMembres }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    i < votantsActuals
                      ? 'bg-foreground text-background'
                      : 'bg-border text-muted-foreground'
                  }`}
                >
                  {i < votantsActuals ? '✓' : '...'}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {votantsActuals} de {totalMembres} han votat
            </p>
            {!totsMembresHanVotat && (
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Si algun membre no vota, el seu vot anirà a la majoria. En cas d&apos;empat, es decideix aleatòriament.
              </p>
            )}
          </div>

          {likes.length > 0 ? (
            <div className="flex flex-col gap-3 mb-8">
              <p className="text-sm text-muted-foreground text-left">Els teus likes</p>
              {likes.map((r: any, i: number) => r && (
                <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border">
                  <span className="text-2xl">{r.emoji}</span>
                  <p className="font-medium">{r.nom}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mb-8">No has donat like a cap 😅</p>
          )}

          <button
            onClick={() => router.push(`/plan/${params.id}/resultados`)}
            className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          >
            Veure resultats →
          </button>
        </div>
      </main>
    )
  }

  const restaurante = restaurants[indice]
  console.log('foto ref:', restaurante?.foto)
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <a href={`/plan/${params.id}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← Tornar
          </a>
          <span className="text-sm text-muted-foreground">
            {indice + 1} / {restaurants.length}
          </span>
        </div>

        {/* Barra de progrés */}
        <div className="h-1 rounded-full bg-accent mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${((indice) / restaurants.length) * 100}%` }}
          />
        </div>

        {/* Targeta del restaurant */}
<div
  className="border border-border rounded-2xl overflow-hidden mb-6 transition-all duration-300"
  style={{
    transform: animacion === 'right'
      ? 'translateX(200px) rotate(15deg)'
      : animacion === 'left'
      ? 'translateX(-200px) rotate(-15deg)'
      : 'none',
    opacity: animacion ? 0 : 1,
  }}
>
  {/* Foto */}
  {restaurante.foto ? (
  <img
    src={`/api/foto?ref=${restaurante.foto}`}
    alt={restaurante.nom}
    className="w-full h-48 object-cover"
    
  />
) : (
  <div className="w-full h-48 bg-accent flex items-center justify-center text-5xl">
    🍽️
  </div>
)}

  <div className="p-6">
  <div className="flex justify-between items-start mb-3">
  <div className="flex-1 pr-3">
    <h3 className="text-xl font-medium">{restaurante.nom}</h3>
    <p className="text-muted-foreground text-sm">{restaurante.adreca}</p>
  </div>
  {restaurante.preu && (
    <span className="text-sm font-medium px-3 py-1 rounded-full bg-accent whitespace-nowrap flex-shrink-0">
      {restaurante.preu}
    </span>
  )}
</div>

<div className="flex gap-4 text-sm text-muted-foreground mb-4">
  {restaurante.rating && (
    <span>⭐ {restaurante.rating} ({restaurante.num_ressenyes})</span>
  )}
</div>


  <a href={`https://www.google.com/maps/place/?q=place_id:${restaurante.id}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors inline-block mb-4"
>
  📍 Veure a Google Maps
</a>

    {restaurante.membres_a_favor?.length > 0 && (
      <p className="text-sm text-muted-foreground">
        👍 A {restaurante.membres_a_favor.join(', ')} els agrada
      </p>
    )}

    {/* Barra de compatibilitat */}
    <div className="h-1.5 rounded-full bg-accent overflow-hidden mt-4">
      <div
        className="h-full rounded-full bg-foreground"
        style={{ width: `${restaurante.puntuacio}%` }}
      />
    </div>
    <p className="text-xs text-muted-foreground mt-1 text-right">
      {restaurante.puntuacio}% compatibilitat amb el grup
    </p>
  </div>
</div>
        {/* Botons de vot */}
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
          ✗ No em convenç · ✓ M&apos;apunta
        </p>
      </div>
    </main>
  )
}
