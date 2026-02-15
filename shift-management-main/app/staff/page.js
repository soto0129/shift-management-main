// app/staff/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function StaffPage() {
  // スタッフ一覧を管理するstate
  const [staffList, setStaffList] = useState([])
  
  // ローディング状態を管理
  // データ取得中はtrueにして、ユーザーに待機を促す
  const [isLoading, setIsLoading] = useState(true)
  
  // フォーム入力値を管理
  const [formData, setFormData] = useState({
    name: '',
    hourly_wage: '',
    max_hours_per_week: '40', // デフォルト値: 40時間
  })
  
  // エラーメッセージを管理
  // Toast通知と併用してUI上にも表示することで、ユーザーが詳細を確認できる
  const [errorMessage, setErrorMessage] = useState('')
  
  // 削除確認ダイアログの状態
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    staffId: null,
    staffName: ''
  })

  // 画面表示時に一度だけ実行される
  // スタッフ一覧を取得してくる
  useEffect(() => {
    fetchStaffList()
  }, [])

  // スタッフ一覧を取得する関数
  // Supabaseのstaffテーブルから全件取得
  async function fetchStaffList() {
    try {
      setIsLoading(true)
      setErrorMessage('') // エラーメッセージをクリア
      
      // Supabaseからデータ取得
      // .from('staff'): staffテーブルを指定
      // .select('*'): 全カラムを取得
      // .order(): 作成日時の新しい順に並び替え
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })
      
      // エラーが発生した場合
      if (error) {
        console.error('スタッフ取得エラー:', error)
        // Toast通知：即座のフィードバック
        toast.error('データの取得に失敗しました')
        // UI表示：詳細なエラー内容
        setErrorMessage(error.message)
        return
      }
      
      // 取得成功
      setStaffList(data || [])
    } catch (err) {
      console.error('予期しないエラー:', err)
      toast.error('エラーが発生しました')
      setErrorMessage(err.message)
    } finally {
      // 成功・失敗に関わらずローディングを終了
      setIsLoading(false)
    }
  }

  // フォーム入力値が変更された時の処理
  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // スタッフ登録処理
  async function handleSubmit(e) {
    e.preventDefault() // フォームのデフォルト送信を防ぐ
    
    setErrorMessage('') // エラーメッセージをクリア
    
    // バリデーション（必須チェックのみ）
    if (!formData.name || !formData.hourly_wage || !formData.max_hours_per_week) {
      toast.error('すべての項目を入力してください')
      return
    }
    
    // 時給が正の数かチェック
    if (parseInt(formData.hourly_wage) <= 0) {
      toast.error('時給は1円以上を入力してください')
      return
    }
    
    // 週最大労働時間が正の数かチェック
    if (parseInt(formData.max_hours_per_week) <= 0) {
      toast.error('週最大労働時間は1時間以上を入力してください')
      return
    }
    
    try {
      // Supabaseにデータを挿入
      // .insert(): データの挿入
      const { data, error } = await supabase
        .from('staff')
        .insert([
          {
            name: formData.name,
            hourly_wage: parseInt(formData.hourly_wage), // 数値に変換
            max_hours_per_week: parseInt(formData.max_hours_per_week), // 数値に変換
          }
        ])
      
      if (error) {
        console.error('登録エラー:', error)
        toast.error('登録に失敗しました')
        setErrorMessage(error.message)
        return
      }
      
      // 登録成功
      // Toast通知で即座にフィードバック
      toast.success('スタッフを登録しました')
      
      // フォームをリセット
      setFormData({ name: '', hourly_wage: '', max_hours_per_week: '40' })
      
      // 一覧を再取得して表示を更新
      fetchStaffList()
    } catch (err) {
      console.error('予期しないエラー:', err)
      toast.error('エラーが発生しました')
      setErrorMessage(err.message)
    }
  }

  // スタッフ削除処理
  // まず確認ダイアログを表示し、ユーザーが確認したら削除を実行
  function handleDeleteClick(id, name) {
    setDeleteDialog({
      open: true,
      staffId: id,
      staffName: name
    })
  }
  
  // 削除確定処理
  async function confirmDelete() {
    const { staffId } = deleteDialog
    
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId) // idが一致するレコードを削除
      
      if (error) {
        console.error('削除エラー:', error)
        toast.error('削除に失敗しました')
        setErrorMessage(error.message)
        return
      }
      
      toast.success('スタッフを削除しました')
      
      // 一覧を再取得
      fetchStaffList()
    } catch (err) {
      console.error('予期しないエラー:', err)
      toast.error('エラーが発生しました')
      setErrorMessage(err.message)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">スタッフ管理</h1>
        </div>

        {/* エラーメッセージ表示エリア */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            <p className="font-semibold">エラー</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* スタッフ登録フォーム */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">スタッフ登録</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="山田太郎"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                時給（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="hourly_wage"
                value={formData.hourly_wage}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                週最大労働時間 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="max_hours_per_week"
                value={formData.max_hours_per_week}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="40"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                労働基準法により、週40時間が上限です（特例あり）
              </p>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition font-semibold"
            >
              登録
            </button>
          </form>
        </div>

        {/* スタッフ一覧 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">スタッフ一覧</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">読み込み中...</span>
            </div>
          ) : staffList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">スタッフが登録されていません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">名前</th>
                    <th className="px-4 py-3 text-left font-semibold">時給</th>
                    <th className="px-4 py-3 text-left font-semibold">週最大労働時間</th>
                    <th className="px-4 py-3 text-left font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{staff.name}</td>
                      <td className="px-4 py-3">{staff.hourly_wage.toLocaleString()}円</td>
                      <td className="px-4 py-3">{staff.max_hours_per_week || 40}時間</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteClick(staff.id, staff.name)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={confirmDelete}
        title="スタッフの削除"
        description={`${deleteDialog.staffName} を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
        variant="danger"
      />
    </div>
  )
}
