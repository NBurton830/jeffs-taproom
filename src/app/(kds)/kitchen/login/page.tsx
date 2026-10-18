import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/kds/LoginForm'
import { getStaff } from '@/lib/auth'

export const metadata = { title: 'Kitchen sign in' }

// KDS-001
export default async function KitchenLogin() {
  if (await getStaff()) redirect('/kitchen')
  return (
    <main id="main" className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-3xl font-bold uppercase">Kitchen sign in</h1>
      <LoginForm />
    </main>
  )
}
