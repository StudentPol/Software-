'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

interface Missatge {
  id: string
  user_id: string
  nom_usuari: string
  contingut: string
  created_at: string
}

export default function ChatPage() {
  const [missatges, setMissatges] = useState<Missatge[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [nomUsuari, setNomUsuari] = useState('')
  const [plan, setPlan] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [enviant, setEnviant] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function inicialitzar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      // Carregar nom de l'usuari
      const { data: perfil } = await supabase
        .from('profiles')
        .select('nombre')
        .eq('id', user.id)
        .single()
      setNomUsuari(perfil?.nombre || 'Usuari')

      // Carregar dades del pla
      const { data: planData } = await supabase
        .from('planes')
        .select('id, nombre, zona')
        .eq('id', params.id)
        .single()
      if (!planData) { router.push('/'); return }
      setPlan(planData)

      // Comprovar que l'usuari és membre del pla
      const { data: membre } = await supabase
        .from('miembros')
        .select('user_id')
        .eq('plan_id', params.id)
        .eq('user_id', user.id)
        .single()
      if (!membre) { router.push('/'); return }

      // Carregar missatges existents
      const { data: missatgesData } = await supabase
        .from('missatges')
        .select('*')
        .eq('plan_id', params.id)
        .order('created_at', { ascending: true })
      setMissatges(missatgesData || [])
      setCargando(false)
    }

    inicialitzar()
  }, [])

  // Subscripció en temps real
  useEffect(() => {
    if (cargando) return

    const channel = supabase
      .channel(`chat-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'missatges',
          filter: `plan_id=eq.${params.id}`,
        },
        (payload) => {
          setMissatges(prev => [...prev, payload.new as Missatge])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [cargando])

  // Scroll automàtic quan arriba un missatge nou
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [missatges])

  async function handleEnviar() {
    const contingut = text.trim()
    if (!contingut || enviant) return

    setEnviant(true)
    setText('')

    await supabase.from('missatges').insert({
      plan_id: params.id,
      user_id: userId,
      nom_usuari: nomUsuari,
      contingut,
    })

    setEnviant(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  function formatHora(iso: string) {
    return new Date(iso).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDia(iso: string) {
    const data = new Date(iso)
    const avui = new Date()
    const ahir = new Date()
    ahir.setDate(avui.getDate() - 1)

    if (data.toDateString() === avui.toDateString()) return 'Avui'
    if (data.toDateString() === ahir.toDateString()) return 'Ahir'
    return data.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })
  }

  // Agrupa missatges per dia per mostrar separadors
  function grupsDeDia(llista: Missatge[]) {
    const grups: { dia: string; items: Missatge[] }[] = []
    llista.forEach(m => {
      const dia = formatDia(m.created_at)
      const ultim = grups[grups.length - 1]
      if (ultim && ultim.dia === dia) {
        ultim.items.push(m)
      } else {
        grups.push({ dia, items: [m] })
      }
    })
    return grups
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregant chat...</p>
      </main>
    )
  }

  const grups = grupsDeDia(missatges)

  return (
    <main className="h-screen flex flex-col bg-background">

      {/* Header fix */}
      <div className="bg-foreground px-6 pt-5 pb-4 rounded-b-3xl flex-shrink-0">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/plan/${params.id}`)}
              className="text-background/70 hover:text-background transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div>
              <p className="text-background font-medium leading-tight">{plan?.nombre}</p>
              <p className="text-background/50 text-xs">📍 {plan?.zona}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/15 border-none rounded-xl px-3 py-1.5 text-background text-sm cursor-pointer hover:bg-white/25 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Àrea de missatges — fa scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto flex flex-col gap-1">

          {missatges.length === 0 && (
            <div className="text-center py-16">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-muted-foreground text-sm">Encara no hi ha missatges.</p>
              <p className="text-muted-foreground text-sm">Sigues el primer en escriure!</p>
            </div>
          )}

          {grups.map(grup => (
            <div key={grup.dia}>
              {/* Separador de dia */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground px-2">{grup.dia}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Missatges del dia */}
              <div className="flex flex-col gap-1">
                {grup.items.map((m, i) => {
                  const esMeu = m.user_id === userId
                  const anterior = grup.items[i - 1]
                  const mateixRemitent = anterior?.user_id === m.user_id
                  const esUltimDelBloc = !grup.items[i + 1] || grup.items[i + 1].user_id !== m.user_id

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${esMeu ? 'items-end' : 'items-start'} ${mateixRemitent ? 'mt-0.5' : 'mt-3'}`}
                    >
                      {/* Nom — només al primer missatge del bloc */}
                      {!mateixRemitent && !esMeu && (
                        <p className="text-xs text-muted-foreground mb-1 ml-1">{m.nom_usuari}</p>
                      )}

                      <div className={`flex items-end gap-1.5 ${esMeu ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar — només a l'últim missatge del bloc */}
                        <div className="w-6 flex-shrink-0">
                          {esUltimDelBloc && !esMeu && (
                            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">
                              {m.nom_usuari[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Bombolla */}
                        <div
                          className={`max-w-[72vw] sm:max-w-xs px-3.5 py-2 text-sm leading-relaxed break-words ${
                            esMeu
                              ? 'bg-foreground text-background rounded-2xl rounded-br-sm'
                              : 'bg-accent text-foreground rounded-2xl rounded-bl-sm'
                          }`}
                        >
                          {m.contingut}
                        </div>
                      </div>

                      {/* Hora — només a l'últim del bloc */}
                      {esUltimDelBloc && (
                        <p className={`text-[10px] text-muted-foreground mt-1 ${esMeu ? 'mr-8' : 'ml-8'}`}>
                          {formatHora(m.created_at)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input fix a baix */}
      <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escriu un missatge..."
            maxLength={500}
            className="flex-1 px-4 py-2.5 rounded-full border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring text-sm"
          />
          <button
            onClick={handleEnviar}
            disabled={!text.trim() || enviant}
            className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          </button>
        </div>
      </div>

    </main>
  )
}