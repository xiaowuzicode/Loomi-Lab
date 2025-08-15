'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 客户端重定向到仪表板
    router.replace('/dashboard')
  }, [router])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(to bottom right, #1a202c, #553c9a)'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ 
          fontSize: '24px', 
          marginBottom: '16px',
          animation: 'spin 1s linear infinite'
        }}>
          ✨
        </div>
        <p>正在跳转到仪表板...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
