import { redirect } from 'next/navigation'

// Redirect to pipeline projects (new pipeline app)
export default function Home() {
  redirect('/pipeline/projects')
}
