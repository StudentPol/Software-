'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cargandoGoogle, setCargandoGoogle] = useState(false)
  const [cargandoFacebook, setCargandoFacebook] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contrasenya incorrectes')
      setCargando(false)
      return
    }
    const redirect = searchParams.get('redirect') || '/'
    router.push(redirect)
  }

  async function handleGoogle() {
    setCargandoGoogle(true)
    const redirect = searchParams.get('redirect') || '/'
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
  }

  async function handleFacebook() {
    setCargandoFacebook(true)
    const redirect = searchParams.get('redirect') || '/'
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div style={{ background: '#17181a', borderRadius: '14px', padding: '10px', display: 'inline-flex' }}>
              <svg width="36" height="36" viewBox="0 0 22 22" fill="none">
                <circle cx="7" cy="8" r="2.5" fill="rgba(255,255,255,0.5)" />
                <circle cx="15" cy="8" r="2.5" fill="rgba(255,255,255,0.8)" />
                <circle cx="11" cy="6" r="2.5" fill="rgba(255,255,255,0.5)" opacity="0.8" />
                <path d="M4 17c0-2.2 2.7-4 6-4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M18 17c0-2.2-2.7-4-6-4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-medium mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Planify</h1>
          <p className="text-sm text-muted-foreground">Inicia sessió per continuar</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={handleGoogle}
            disabled={cargandoGoogle}
            className="w-full py-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {cargandoGoogle ? 'Redirigint...' : 'Continuar amb Google'}
          </button>

          <button
            onClick={handleFacebook}
            disabled={cargandoFacebook}
            className="w-full py-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors font-medium text-sm flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {cargandoFacebook ? 'Redirigint...' : 'Continuar amb Facebook'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">o amb email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-muted-foreground">Contrasenya</label>
              <a href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                Has oblidat la contrasenya?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={cargando}
            className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {cargando ? 'Entrant...' : 'Iniciar sessió →'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            No tens compte?{' '}
            <a href={`/auth/registro${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`} className="text-foreground underline underline-offset-4">
              Registra&apos;t
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
