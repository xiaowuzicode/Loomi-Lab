import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Loomi-Lab | 智能体管理平台',
  description: '基于 Next.js 的全栈后台管理平台，用于管理面向社媒的多智能体系统',
  keywords: ['AI', '智能体', '社交媒体', '管理平台', '小红书', '内容管理'],
  authors: [{ name: 'BlueFocus Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // 后台管理系统不需要被搜索引擎索引
  icons: {
    icon: '/images/loomi-icon.svg',
    shortcut: '/images/loomi-icon.svg',
    apple: '/images/loomi-icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
