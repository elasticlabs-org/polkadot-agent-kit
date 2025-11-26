"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to configuration page by default
    router.push("/config")
  }, [router])

  return (
    <div className="modern-container flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 modern-logo flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="modern-text-secondary">Redirecting to configuration...</p>
      </div>
    </div>
  )
}
