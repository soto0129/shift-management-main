// app/layout.js
import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'シフト自動調整システム',
  description: '制約条件に基づいてシフトを自動生成するシステム',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
