import { SignIn } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, useLocation } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

export const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getToken, userId } = await auth()
    const token = await getToken({ template: 'convex' })

    return {
      userId,
      token,
    }
  },
)

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context }) => {
    const { userId, token } = await context.queryClient.ensureQueryData({
      queryKey: ['clerk-auth'],
      queryFn: () => fetchClerkAuth(),
      staleTime: 10 * 60 * 1000, // 10 minutes - avoid refetching on every navigation
    })

    // Set auth token for SSR Convex queries
    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token)
    }

    if (!userId) {
      throw new Error('Not authenticated')
    }

    return { userId, token }
  },
  errorComponent: ({ error }) => {
    const location = useLocation()

    if (error.message === 'Not authenticated') {
      return (
        <div className="flex items-center justify-center p-12">
          <SignIn routing="hash" forceRedirectUrl={location.href} />
        </div>
      )
    }

    throw error
  },
})
