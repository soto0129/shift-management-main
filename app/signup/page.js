// app/signup/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password || !passwordConfirm) {
      toast.error('全部入力してください')
      return
    }

    if (password.length < 6) {
      toast.error('パスワードは6文字以上で')
      return
    }

    if (password !== passwordConfirm) {
      toast.error('パスワードが一致しません')
      return
    }

    setIsLoading(true)
    
    try {
      await signUp(email, password)
      toast.success('登録しました！')
      router.push('/login')
    } catch (err) {
      console.error('登録失敗:', err)
      if (err.message.includes('already registered')) {
        toast.error('このメールアドレスは既に登録されています')
      } else {
        toast.error('登録できませんでした')
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
          <p className='text-gray-600 mt-2'>新規登録</p>
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
                placeholder='6文字以上'
                disabled={isLoading}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>パスワード（確認）</label>
              <input
                type='password'
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'
                placeholder='もう一度入力'
                disabled={isLoading}
              />
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-blue-600 text-white py-3 rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 hover:shadow-md disabled:opacity-50'
            >
              {isLoading ? '登録中...' : '登録する'}
            </button>
          </form>

          <div className='mt-6 text-center text-sm text-gray-600'>
            既にアカウントがある場合は{' '}
            <Link href='/login' className='text-blue-600 hover:text-blue-700 hover:underline'>ログイン</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
