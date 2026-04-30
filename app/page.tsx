'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [planes, setPlanes] = useState<any[]>([])
  const [perfil, setPerfil] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfilData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setPerfil(perfilData)

      const { data: miembrosData } = await supabase
        .from('miembros')
        .select('plan_id, planes(id, nombre, zona, codigo, created_at)')
        .eq('user_id', user.id)

      const planesActivos = miembrosData?.map((m: any) => m.planes).filter(Boolean) || []
      setPlanes(planesActivos)
      setCargando(false)
    }
    cargarDatos()
  }, [refresh])

  async function handleEliminar(planId: string) {
    if (!confirm('¿Seguro que quieres eliminar este plan?')) return
    setEliminando(planId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: plan } = await supabase.from('planes').select('creador_id').eq('id', planId).single()
    if (plan?.creador_id === user.id) {
      await supabase.from('votos').delete().eq('plan_id', planId)
      await supabase.from('miembros').delete().eq('plan_id', planId)
      await supabase.from('planes').delete().eq('id', planId)
    } else {
      await supabase.from('miembros').delete().eq('plan_id', planId).eq('user_id', user.id)
    }
    setRefresh(prev => prev + 1)
    setEliminando(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (cargando) {
    return (
      <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:'#5a8a3a'}}>Cargando...</p>
      </main>
    )
  }

  return (
    <main style={{minHeight:'100vh', background:'#f4f9ee', padding:'0'}}>
  <div style={{ background: '#3B6D11', padding: '48px 32px 28px', borderRadius: '0 0 28px 28px', marginBottom: '32px' }}>
  {/* Aquest div és el que separa el logo del botó */}
  <div style={{ 
    maxWidth: '900px', 
    margin: '0 auto', 
    display: 'flex', 
    justifyContent: 'space-between', // Separa els elements als extrems
    alignItems: 'center'             // Centra verticalment el botó amb el logo
  }}>
    
    {/* Bloc de l'Esquerra: Logo i Salutació */}
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
          <circle cx="7" cy="8" r="2.5" fill="#97C459" />
          <circle cx="15" cy="8" r="2.5" fill="#C0DD97" />
          <circle cx="11" cy="6" r="2.5" fill="#97C459" opacity="0.8" />
          <path d="M4 17c0-2.2 2.7-4 6-4" stroke="#C0DD97" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 17c0-2.2-2.7-4-6-4" stroke="#C0DD97" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: '22px', fontWeight: '500', color: '#EAF3DE' }}>Planify</span>
      </div>
      <p style={{ fontSize: '14px', color: '#97C459', margin: 0 }}>Hola, {perfil?.nombre || 'amigo'} 👋</p>
    </div>

    {/* Bloc de la Dreta: Botó Salir */}
    <button onClick={handleLogout} style={{
      background: 'rgba(255,255,255,0.15)',
      border: 'none',
      borderRadius: '20px',
      padding: '6px 14px',
      color: '#C0DD97',
      fontSize: '13px',
      cursor: 'pointer'
    }}>
      Salir
    </button>

  </div>
</div>
  <div style={{maxWidth:'900px', margin:'0 auto', padding:'0 32px 40px'}}>
        <div style={{display:'flex', gap:'12px', marginBottom:'32px', width:'100%'}}>
  <a href="/plan/crear" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'14px 24px', borderRadius:'14px', background:'#3B6D11', textDecoration:'none', flex:'1'}}>
    <span style={{fontSize:'20px', color:'#EAF3DE'}}>+</span>
    <div>
      <p style={{fontSize:'14px', fontWeight:'500', color:'#EAF3DE', margin:0}}>Crear plan</p>
      <p style={{fontSize:'11px', color:'#97C459', margin:0}}>Nuevo grupo</p>
    </div>
  </a>
  <a href="/unirse" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'14px 24px', borderRadius:'14px', background:'#EAF3DE', textDecoration:'none', border:'2px solid #3B6D11', flex:'1'}}>
    <span style={{fontSize:'20px', color:'#3B6D11'}}>#</span>
    <div>
      <p style={{fontSize:'14px', fontWeight:'500', color:'#3B6D11', margin:0}}>Unirme</p>
      <p style={{fontSize:'11px', color:'#639922', margin:0}}>Tengo un código</p>
    </div>
  </a>
</div>

        <div>
          <p style={{fontSize:'12px', fontWeight:'500', color:'#639922', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'12px'}}>
            {planes.length > 0 ? `Planes activos (${planes.length})` : 'Sin planes activos'}
          </p>

          {planes.length === 0 ? (
            <div style={{
              textAlign:'center', padding:'48px 20px',
              border:'2px dashed #C0DD97', borderRadius:'20px',
              background:'#f7fcf2'
            }}>
              <p style={{fontSize:'32px', marginBottom:'10px'}}>🍽️</p>
              <p style={{color:'#639922', fontSize:'14px'}}>Crea tu primer plan o únete con un código</p>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              {planes.map((plan: any) => (
                <div key={plan.id} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'16px 18px', borderRadius:'16px',
                  background:'#fff', border:'1px solid #d4edbb',
                }}>
                  <a href={`/plan/${plan.id}`} style={{flex:1, textDecoration:'none'}}>
                    <p style={{fontSize:'15px', fontWeight:'500', color:'#1a3d0e', marginBottom:'4px'}}>{plan.nombre}</p>
                    <p style={{fontSize:'12px', color:'#639922'}}>📍 {plan.zona} · 🔑 {plan.codigo}</p>
                  </a>
                  <button
                    onClick={() => handleEliminar(plan.id)}
                    disabled={eliminando === plan.id}
                    style={{background:'none', border:'none', cursor:'pointer', fontSize:'16px', opacity: eliminando === plan.id ? 0.3 : 0.5, padding:'4px'}}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{marginTop:'32px', paddingTop:'20px', borderTop:'1px solid #d4edbb', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <a href="/perfil/crear" style={{fontSize:'13px', color:'#639922', textDecoration:'none'}}>
            ✏️ Editar perfil
          </a>
          <p style={{fontSize:'12px', color:'#97C459'}}>Planify</p>
        </div>
      </div>
    </main>
  )
}