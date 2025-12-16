import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to projects page
  redirect('/dashboard/projects')
}
