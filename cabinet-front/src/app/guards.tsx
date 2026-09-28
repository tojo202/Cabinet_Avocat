import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { Skeleton } from '@/components/ui/skeleton'

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token)
  const user = useAuth((s) => s.user)
  const fetchMe = useAuth((s) => s.fetchMe)
  const location = useLocation()
  const [loading, setLoading] = useState(Boolean(token) && !user)

  useEffect(() => {
    if (!token) return
    if (user) return
    fetchMe()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, user, fetchMe])

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return <>{children}</>
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: string
  children: ReactNode
}) {
  const can = useAuth((s) => s.can)
  const user = useAuth((s) => s.user)

  if (user && !can(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
