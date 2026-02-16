// app/login/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('メールとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    
    try {
      await signIn(email, password)
      toast.success('ログインしました')
      router.push('/')
    } catch (err) {
      console.error('ログイン失敗:', err)
      if (err.message.includes('Invalid login credentials')) {
        toast.error('メールアドレスかパスワードが違います')
      } else {
        toast.error('ログインできませんでした')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>シフト管理システム</h1>
          <p className='text-gray-600 mt-2'>ログイン</p>
        </div>

        <div className='bg-white p-8 rounded-lg shadow-sm border border-gray-200'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>メールアドレス</label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'
                placeholder='example@email.com'
                disabled={isLoading}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>パスワード</label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'
                placeholder='••••••••'
                disabled={isLoading}
              />
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-blue-600 text-white py-3 rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:opacity-50'
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className='mt-6 text-center text-sm text-gray-600'>
            アカウントがない場合は{' '}
            <Link href='/signup' className='text-blue-600 hover:text-blue-700 hover:underline'>新規登録</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
