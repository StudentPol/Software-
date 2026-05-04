import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rutas públicas: no requieren sesión
  const isAuthRoute = pathname.startsWith('/auth')
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Si hay sesión, comprobar si el perfil está completo
  // (excepto en la propia página de perfil y en las rutas de auth)
  const isPerfilRoute = pathname.startsWith('/perfil/crear')
  if (user && !isAuthRoute && !isPerfilRoute) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', user.id)
      .single()

    // TODO: añadir || !perfil.fecha_nacimiento cuando exista la columna en BD
    const perfilIncompleto = !perfil || !perfil.nombre
    if (perfilIncompleto) {
      return NextResponse.redirect(new URL('/perfil/crear', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}