'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [fet, setFet] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleReset() {
    if (!password.trim()) { setError('Introdueix la nova contrasenya'); return }
    if (password !== confirmar) { setError('Les contrasenyes no coincideixen'); return }
    if (password.length < 6) { setError('La contrasenya ha de tenir almenys 6 caràcters'); return }
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setCargando(false); return }
    setFet(true)
    setTimeout(() => router.push('/'), 2000)
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
          <p className="text-sm text-muted-foreground">Crea una nova contrasenya</p>
        </div>

        {fet ? (
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-medium mb-2">Contrasenya canviada!</h2>
            <p className="text-sm text-muted-foreground">Redirigint a l'inici...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Nova contrasenya</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Confirmar contrasenya</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={handleReset}
              disabled={cargando}
              className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {cargando ? 'Guardant...' : 'Canviar contrasenya →'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}