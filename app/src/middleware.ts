import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/sign-in(.*)',        // Sign-in pages
  '/sign-up(.*)',        // Sign-up pages
  '/api/webhooks(.*)',   // Webhooks (Clerk, SendGrid, etc.)
])

export default clerkMiddleware(async (auth, request) => {
  // Public routes - allow access
  if (isPublicRoute(request)) {
    return NextResponse.next()
  }

  // Protected routes - require authentication
  const { userId, orgId } = await auth()

  if (!userId) {
    // For API routes, return 401 Unauthorized
    if (request.nextUrl.pathname.startsWith('/api')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // For pages, redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Add user and organization context to Sentry
  Sentry.setUser({
    id: userId,
  })

  if (orgId) {
    Sentry.setContext('organization', {
      id: orgId,
    })
  }

  // Add request context to Sentry
  Sentry.setContext('request', {
    url: request.url,
    method: request.method,
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
    },
  })

  // Authenticated - allow access
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
