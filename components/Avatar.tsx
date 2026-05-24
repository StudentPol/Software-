'use client'

import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  nombre?: string | null
  size?: number
  className?: string
  /** Si es 'plan', el monigote por defecto tiene un icono de calendario en vez de persona */
  tipo?: 'usuario' | 'plan'
}

/**
 * Avatar — muestra la foto de perfil si existe, o un monigote SVG con inicial / icono.
 * Tamaño por defecto: 40px.
 */
export function Avatar({ src, nombre, size = 40, className = '', tipo = 'usuario' }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const showFallback = !src || imgError

  // Color de fondo determinista a partir del nombre
  const colors = [
    '#E8D5FF', '#FFD5E8', '#D5E8FF', '#D5FFE8',
    '#FFE8D5', '#E8FFD5', '#D5D5FF', '#FFD5D5',
  ]
  const colorIdx = nombre
    ? nombre.charCodeAt(0) % colors.length
    : 0
  const bgColor = colors[colorIdx]
  const initial = nombre ? nombre.charAt(0).toUpperCase() : '?'

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size, background: showFallback ? bgColor : undefined }}
    >
      {!showFallback ? (
        <img
          src={src!}
          alt={nombre || 'avatar'}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      ) : tipo === 'usuario' ? (
        /* Monigote de persona */
        <svg
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ) : (
        /* Icono de plan (calendario) */
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface AvatarUploadProps {
  currentUrl?: string | null
  nombre?: string | null
  size?: number
  tipo?: 'usuario' | 'plan'
  onUpload: (file: File) => Promise<string | null>
  /** URL pública resultante tras subir */
  onChange?: (url: string) => void
}

/**
 * AvatarUpload — Avatar clicable que abre el selector de archivo y llama a onUpload.
 */
export function AvatarUpload({
  currentUrl,
  nombre,
  size = 80,
  tipo = 'usuario',
  onUpload,
  onChange,
}: AvatarUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl || null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await onUpload(file)
    if (result) {
      setUrl(result)
      onChange?.(result)
    }
    setUploading(false)
    // reset input so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <label
      className="relative cursor-pointer group"
      style={{ width: size, height: size, display: 'block' }}
      title="Cambiar foto"
    >
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
        disabled={uploading}
      />

      {/* Avatar base */}
      <Avatar src={url} nombre={nombre} size={size} tipo={tipo} />

      {/* Overlay "editar" */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      >
        {uploading ? (
          <svg
            className="animate-spin"
            width={size * 0.35}
            height={size * 0.35}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg
            width={size * 0.3}
            height={size * 0.3}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </div>

      {/* Badge cámara (siempre visible, pequeño) */}
      <div
        className="absolute bottom-0 right-0 bg-foreground text-background rounded-full flex items-center justify-center border-2 border-background"
        style={{ width: size * 0.32, height: size * 0.32 }}
      >
        <svg
          width={size * 0.16}
          height={size * 0.16}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </label>
  )
}
