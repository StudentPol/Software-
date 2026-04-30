'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
      setCargando(false)
      return
    }
    router.push('/')
  }

  return (
    <main style={{minHeight:'100vh', background:'#f4f9ee', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <div style={{width:'100%', maxWidth:'420px'}}>

        <div style={{textAlign:'center', marginBottom:'40px'}}>
          <div style={{
            width:'64px', height:'64px', borderRadius:'18px',
            background:'#3B6D11', margin:'0 auto 16px',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 22 22" fill="none">
              <circle cx="7" cy="8" r="2.5" fill="#97C459"/>
              <circle cx="15" cy="8" r="2.5" fill="#C0DD97"/>
              <circle cx="11" cy="6" r="2.5" fill="#97C459" opacity="0.8"/>
              <path d="M4 17c0-2.2 2.7-4 6-4" stroke="#C0DD97" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M18 17c0-2.2-2.7-4-6-4" stroke="#C0DD97" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{fontSize:'26px', fontWeight:'500', color:'#1a3d0e', marginBottom:'6px'}}>Planify</h1>
          <p style={{fontSize:'14px', color:'#639922'}}>Inicia sesión para continuar</p>
        </div>

        <div style={{
          background:'#fff', borderRadius:'24px',
          border:'1px solid #639922', padding:'32px'
        }}>
          <div style={{marginBottom:'20px'}}>
            <label style={{fontSize:'13px', color:'#5a8a3a', display:'block', marginBottom:'8px'}}>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width:'100%', padding:'12px 16px', borderRadius:'12px',
                border:'1.5px solid #639922', background:'#f7fcf2',
                fontSize:'14px', color:'#1a3d0e', outline:'none',
                boxSizing:'border-box'
              }}
            />
          </div>

          <div style={{marginBottom:'24px'}}>
            <label style={{fontSize:'13px', color:'#5a8a3a', display:'block', marginBottom:'8px'}}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width:'100%', padding:'12px 16px', borderRadius:'12px',
                border:'1.5px solid #639922', background:'#f7fcf2',
                fontSize:'14px', color:'#1a3d0e', outline:'none',
                boxSizing:'border-box'
              }}
            />
          </div>

          {error && (
            <p style={{fontSize:'13px', color:'#dc2626', marginBottom:'16px', textAlign:'center'}}>{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={cargando}
            style={{
              width:'100%', padding:'14px', borderRadius:'14px',
              background: cargando ? '#639922' : '#3B6D11',
              color:'#EAF3DE', fontSize:'15px', fontWeight:'500',
              border:'none', cursor: cargando ? 'not-allowed' : 'pointer',
              transition:'opacity 0.2s', opacity: cargando ? 0.7 : 1
            }}
          >
            {cargando ? 'Entrando...' : 'Iniciar sesión →'}
          </button>

          <p style={{textAlign:'center', fontSize:'13px', color:'#639922', marginTop:'20px'}}>
            ¿No tienes cuenta?{' '}
            <a href="/auth/registro" style={{color:'#3B6D11', fontWeight:'500', textDecoration:'none', borderBottom:'1px solid #3B6D11'}}>
              Regístrate
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}