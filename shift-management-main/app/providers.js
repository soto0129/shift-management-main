// app/providers.js
'use client'

import { Toaster } from 'react-hot-toast'

// Toast通知をアプリ全体で使えるようにするプロバイダー
// Toasterコンポーネントを配置することで、どこからでもtoast()を呼び出せる
export function Providers({ children }) {
  return (
    <>
      {children}
      {/* 
        Toast通知の表示位置と設定
        position: 画面右上に表示
        toastOptions: デフォルトの表示時間を3秒に設定
      */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )
}
