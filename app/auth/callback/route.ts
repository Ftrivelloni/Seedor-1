import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback received:', { code, token, next })

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }

      console.log('Session exchanged successfully:', data.user?.email)

      // Si hay un token en la URL, redirigir al setup apropiado
      if (token) {
        // Verificar el tipo de invitación para determinar la redirección
        const { data: invitation } = await supabase
          .from('invitations')
          .select('role_code')
          .eq('token', token)
          .single()

        if (invitation) {
          if (invitation.role_code === 'admin') {
            return NextResponse.redirect(`${origin}/admin-setup?token=${token}`)
          } else {
            return NextResponse.redirect(`${origin}/user-setup?token=${token}`)
          }
        }
      }

      // Redirección por defecto
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }
  }

  // Si no hay código, pero hay token, redirigir directamente
  if (token) {
    try {
      const { data: invitation } = await supabase
        .from('invitations')
        .select('role_code')
        .eq('token', token)
        .single()

      if (invitation) {
        if (invitation.role_code === 'admin') {
          return NextResponse.redirect(`${origin}/admin-setup?token=${token}`)
        } else {
          return NextResponse.redirect(`${origin}/user-setup?token=${token}`)
        }
      }
    } catch (error) {
      console.error('Error processing token redirect:', error)
    }
  }

  // Fallback - redirigir al home
  return NextResponse.redirect(`${origin}/`)
}