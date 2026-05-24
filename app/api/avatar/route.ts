import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * POST /api/avatar
 * Body: multipart/form-data con:
 *   - file: imagen (jpg, png, webp, gif)
 *   - bucket: 'avatars' | 'plan-covers'   (default: 'avatars')
 *   - path: string opcional — ruta dentro del bucket (p.ej. user_id.jpg)
 *
 * Devuelve: { url: string } con la URL pública del archivo subido.
 *
 * SETUP necesario en Supabase:
 *   1. Crear bucket "avatars"      (público)
 *   2. Crear bucket "plan-covers"  (público)
 *   3. Policy: allow authenticated users to INSERT/UPDATE en ambos buckets
 *      (Storage > Policies > New policy > "Allow upload for authenticated users")
 */
export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bucket = (formData.get('bucket') as string) || 'avatars'
  const customPath = formData.get('path') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  }

  // Validar tipo y tamaño (máx 5 MB)
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 5 MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filePath = customPath || `${user.id}-${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return NextResponse.json({ url: publicUrl })
}
