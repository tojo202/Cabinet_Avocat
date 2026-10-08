import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/store/auth'

export function useLogout() {
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()

  return async function handleLogout() {
    await logout()
    toast.success('Déconnexion réussie')
    navigate('/login', { replace: true })
  }
}
