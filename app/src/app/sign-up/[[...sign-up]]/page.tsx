import { SignUp } from '@clerk/nextjs'

// Force dynamic rendering to avoid Clerk pre-rendering issues during build
export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
