// app/page.js
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function HomePage() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState({ staffCount: 0, thisMonthShifts: 0 })

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  async function fetchStats() {
    const { count: staffCount } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    
    const { count: shiftCount } = await supabase
      .from('shifts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    setStats({ staffCount: staffCount || 0, thisMonthShifts: shiftCount || 0 })
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('ログアウトしました')
    } catch (err) {
      console.error('ログアウト失敗:', err)
      toast.error('ログアウトできませんでした')
    }
  }

  const menuItems = [
    { href: '/shifts/calendar', title: 'シフトカレンダー', desc: '月間シフトの確認・編集' },
    { href: '/shifts', title: 'シフト自動生成', desc: '条件を設定して自動作成' },
    { href: '/staff', title: 'スタッフ管理', desc: 'スタッフの登録・編集' },
    { href: '/analytics', title: '勤務統計', desc: '勤務時間・出勤日数の集計' },
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white border-b'>
        <div className='max-w-4xl mx-auto px-4 py-5 flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-gray-900'>シフト管理システム</h1>
          <div className='flex items-center gap-4'>
            {user && (
              <>
                <span className='text-sm text-gray-600 hidden sm:inline'>{user.email}</span>
                <button
                  onClick={handleLogout}
                  className='text-sm text-gray-500 hover:text-gray-700 transition-colors'
                >
                  ログアウト
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className='max-w-4xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <div className='bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-default'>
            <div className='text-3xl font-bold text-gray-900'>{stats.staffCount}</div>
            <div className='text-sm text-gray-500'>登録スタッフ</div>
          </div>
          <div className='bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-default'>
            <div className='text-3xl font-bold text-gray-900'>{stats.thisMonthShifts}</div>
            <div className='text-sm text-gray-500'>今月のシフト</div>
          </div>
          <div className='bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-default'>
            <div className='text-3xl font-bold text-gray-900'>{new Date().getMonth() + 1}月</div>
            <div className='text-sm text-gray-500'>現在</div>
          </div>
          <div className='bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-default'>
            <div className='text-3xl font-bold text-blue-600'>稼働中</div>
            <div className='text-sm text-gray-500'>システム状態</div>
          </div>
        </div>

        <div className='space-y-3'>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className='flex items-center justify-between p-5 bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:border-gray-300'
            >
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>{item.title}</h3>
                <p className='text-sm text-gray-500'>{item.desc}</p>
              </div>
              <span className='text-gray-400 text-xl'>→</span>
            </Link>
          ))}
        </div>

        <div className='mt-8 text-center'>
          <Link
            href='/shifts'
            className='inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-md'
          >
            シフトを作成する
          </Link>
        </div>
      </main>

      <footer className='mt-16 border-t py-6 text-center text-gray-400 text-sm'>
        Shift Management System
      </footer>
    </div>
  )
}
