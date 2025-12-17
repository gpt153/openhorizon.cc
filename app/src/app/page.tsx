import { redirect } from 'next/navigation'

// Redirect to projects (auth disabled for now)
export default function Home() {
  redirect('/projects')
}
