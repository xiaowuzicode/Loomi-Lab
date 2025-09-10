// 重定向到新的表格化页面
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomFieldsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // 重定向到表格化页面
    router.replace('/custom-fields/table')
  }, [router])
  
  // 显示加载状态
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px' 
    }}>
      正在跳转到新版表格化页面...
    </div>
  )
}