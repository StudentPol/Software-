'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

interface ResultadoRestaurant {
  id: string;
  nom: string;
  nombre?: string;
  emoji: string;
  votos: number;
  adreca?: string;
}

export default function ResultadosPage() {
  const [resultados, setResultados] = useState<ResultadoRestaurant[]>([])
  const [plan, setPlan] = useState<any>(null)
  const [ganador, setGanador] = useState<ResultadoRestaurant | null>(null)
  const [cargando, setCargando] = useState(true)
  const [totalMembres, setTotalMembres] = useState(0)
  const [votantsActuals, setVotantsActuals] = useState(0)
  const [hiHaEmpat, setHiHaEmpat] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function cargarResultados() {
      const { data: planData } = await supabase
        .from('planes')
        .select('*, cuines_seleccionades')
        .eq('id', params.id)
        .single()

      setPlan(planData)
      const cuines = planData?.cuines_seleccionades || []

      const { data: membresData } = await supabase
        .from('miembros')
        .select('user_id')
        .eq('plan_id', params.id)
      const total = membresData?.length || 0
      setTotalMembres(total)

      const { data: votosData } = await supabase
        .from('votos')
        .select('restaurante_id, voto, user_id')
        .eq('plan_id', params.id)

      const uniqueVotants = new Set(votosData?.map((v: {user_id: string}) => v.user_id) || [])
      const numVotants = uniqueVotants.size
      setVotantsActuals(numVotants)

      const conteo: Record<string, number> = {}
      votosData?.forEach((v: {voto: boolean, restaurante_id: string}) => {
        if (v.voto) {
          conteo[v.restaurante_id] = (conteo[v.restaurante_id] || 0) + 1
        }
      })

      const noVotants = total - numVotants
      if (noVotants > 0 && cuines.length > 0) {
        let maxLikes = -1
        let restaurantMajoria = cuines[0]?.id
        cuines.forEach((r: any) => {
          const likes = conteo[r.id] || 0
          if (likes > maxLikes) {
            maxLikes = likes
            restaurantMajoria = r.id
          }
        })
        if (restaurantMajoria) {
          conteo[restaurantMajoria] = (conteo[restaurantMajoria] || 0) + noVotants
        }
      }

      const ranking: ResultadoRestaurant[] = cuines
        .map((r: any) => ({ ...r, nombre: r.nom, votos: conteo[r.id] || 0 }))
        .sort((a: any, b: any) => b.votos - a.votos)

      setResultados(ranking)

      if (ranking.length > 0) {
        const maxVotos = ranking[0].votos
        const empatats = ranking.filter((r) => r.votos === maxVotos)
        if (empatats.length > 1) {
          setHiHaEmpat(true)
          setGanador(empatats[Math.floor(Math.random() * empatats.length)])
        } else {
          setHiHaEmpat(false)
          setGanador(ranking[0])
        }
      }
      setCargando(false)
    }
    cargarResultados()
  }, [params.id, supabase])

  const totalVotos = resultados.reduce((s, r) => s + r.votos, 0) || 1
  const medallas = ['🥇', '🥈', '🥉']

  if (cargando) return <main className="min-h-screen flex items-center justify-center">Calculant...</main>

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{ganador?.nom} ha guanyat!</h1>
        {/* Resto del JSX igual, pero escapando comillas si las hay */}
        <button onClick={() => router.push('/')} className="mt-4 p-2 bg-black text-white rounded">
          Tornar a l&apos;inici
        </button>
      </div>
    </main>
  )
}
