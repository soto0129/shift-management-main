// app/staff/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function StaffPage() {
  const { user } = useAuth()
  
  const [staffList, setStaffList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '', hourly_wage: '', max_hours_per_week: '40' })
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, staffId: null, staffName: '' })

  useEffect(() => {
    if (user) fetchStaffList()
  }, [user])

  async function fetchStaffList() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('スタッフ取得失敗:', error)
        toast.error('データの取得に失敗しました')
        setErrorMessage(error.message)
        return
      }
      
      setStaffList(data || [])
    } catch (err) {
      console.error('なんかエラー出た:', err)
      toast.error('エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')
    
    if (!formData.name || !formData.hourly_wage || !formData.max_hours_per_week) {
      toast.error('全部入力してください')
      return
    }
    
    if (parseInt(formData.hourly_wage) <= 0) {
      toast.error('時給は1円以上で')
      return
    }
    
    try {
      const { error } = await supabase.from('staff').insert([{
        user_id: user.id,
        name: formData.name,
        hourly_wage: parseInt(formData.hourly_wage),
        max_hours_per_week: parseInt(formData.max_hours_per_week),
      }])
      
      if (error) {
        console.error('登録失敗...', error)
        toast.error('登録に失敗しました')
        return
      }
      
      toast.success('登録しました')
      setFormData({ name: '', hourly_wage: '', max_hours_per_week: '40' })
      fetchStaffList()
    } catch (err) {
      console.error('登録でエラー:', err)
      toast.error('エラーが発生しました')
    }
  }

  function handleDeleteClick(id, name) {
    setDeleteDialog({ open: true, staffId: id, staffName: name })
  }
  
  async function confirmDelete() {
    try {
      const { error } = await supabase.from('staff').delete().eq('id', deleteDialog.staffId)
      if (error) {
        console.error('削除できなかった:', error)
        toast.error('削除に失敗しました')
        return
      }
      toast.success('削除しました')
      fetchStaffList()
    } catch (err) {
      console.error('削除でエラー:', err)
      toast.error('エラーが発生しました')
    }
  }

  return (
    <div className='min-h-screen p-8 bg-gray-50'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-6'>
          <Link href='/' className='text-blue-600 hover:text-blue-700 hover:underline mb-4 inline-block'>← ホームに戻る</Link>
          <h1 className='text-3xl font-bold'>スタッフ管理</h1>
        </div>

        {errorMessage && (
          <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4'>
            <p className='font-semibold'>エラー</p>
            <p className='text-sm'>{errorMessage}</p>
          </div>
        )}

        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8'>
          <h2 className='text-xl font-semibold mb-4'>スタッフ登録</h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>名前 <span className='text-red-500'>*</span></label>
              <input type='text' name='name' value={formData.name} onChange={handleInputChange}
                className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow' placeholder='山田太郎' />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>時給（円） <span className='text-red-500'>*</span></label>
              <input type='number' name='hourly_wage' value={formData.hourly_wage} onChange={handleInputChange}
                className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow' placeholder='1000' min='1' />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>週の最大労働時間 <span className='text-red-500'>*</span></label>
              <input type='number' name='max_hours_per_week' value={formData.max_hours_per_week} onChange={handleInputChange}
                className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow' placeholder='40' min='1' />
              <p className='text-xs text-gray-500 mt-1'>労働基準法だと週40時間が上限（例外あり）</p>
            </div>
            <button type='submit' className='bg-blue-600 text-white px-6 py-2 rounded font-semibold transition-all duration-200 hover:bg-blue-700 hover:shadow-md'>登録</button>
          </form>
        </div>

        <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
          <h2 className='text-xl font-semibold mb-4'>スタッフ一覧</h2>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-gray-500'>読み込み中...</span>
            </div>
          ) : staffList.length === 0 ? (
            <p className='text-gray-500 text-center py-8'>まだスタッフがいません</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left font-semibold'>名前</th>
                    <th className='px-4 py-3 text-left font-semibold'>時給</th>
                    <th className='px-4 py-3 text-left font-semibold'>週の上限</th>
                    <th className='px-4 py-3 text-left font-semibold'>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id} className='border-t hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-3'>{staff.name}</td>
                      <td className='px-4 py-3'>{staff.hourly_wage.toLocaleString()}円</td>
                      <td className='px-4 py-3'>{staff.max_hours_per_week || 40}時間</td>
                      <td className='px-4 py-3'>
                        <button onClick={() => handleDeleteClick(staff.id, staff.name)} className='text-red-600 hover:text-red-700 font-medium transition-colors'>削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={confirmDelete}
        title='スタッフの削除'
        description={`${deleteDialog.staffName} を削除しますか？この操作は取り消せません。`}
        confirmText='削除' cancelText='キャンセル' variant='danger'
      />
    </div>
  )
}
