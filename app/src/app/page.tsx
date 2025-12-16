import { redirect } from 'next/navigation'

// Redirect to dashboard (auth disabled for now)
export default function Home() {
  redirect('/dashboard/projects')
}
