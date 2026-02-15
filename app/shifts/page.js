// app/shifts/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ShiftsPage() {
  // スタッフ一覧
  const [staffList, setStaffList] = useState([])
  
  // 制約条件の入力値
  const [constraints, setConstraints] = useState({
    startDate: '',
    endDate: '',
    minStaffPerDay: 2,
    maxStaffPerDay: 5,
  })
  
  // 生成されたシフト
  const [generatedShifts, setGeneratedShifts] = useState([])
  
  // ローディング状態
  // 自動生成中はtrueにして、ボタンを無効化する
  // 二重送信を防ぐため
  const [isGenerating, setIsGenerating] = useState(false)
  
  // エラーメッセージ
  const [errorMessage, setErrorMessage] = useState('')

  // 初期表示時にスタッフ一覧を取得
  useEffect(() => {
    fetchStaff()
  }, [])

  // スタッフ一覧を取得
  async function fetchStaff() {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name')
      
      if (error) throw error
      
      setStaffList(data || [])
    } catch (err) {
      console.error('スタッフ取得エラー:', err)
      toast.error('スタッフの取得に失敗しました')
    }
  }

  // 制約条件の入力変更
  function handleConstraintChange(e) {
    const { name, value } = e.target
    setConstraints(prev => ({
      ...prev,
      [name]: name.includes('Staff') ? parseInt(value) : value
    }))
  }

  // シフト自動生成
  async function handleGenerateShift() {
    setErrorMessage('')
    
    // バリデーション
    if (!constraints.startDate || !constraints.endDate) {
      toast.error('開始日と終了日を入力してください')
      return
    }
    
    if (new Date(constraints.startDate) > new Date(constraints.endDate)) {
      toast.error('終了日は開始日以降を指定してください')
      return
    }
    
    if (staffList.length < constraints.minStaffPerDay) {
      toast.error(`スタッフ数が足りません。最低${constraints.minStaffPerDay}名必要です。`)
      return
    }
    
    try {
      // ローディング中はボタンを無効化
      // 二重送信を防ぐため
      setIsGenerating(true)
      
      // 対象日付の配列を作成
      const dates = []
      const currentDate = new Date(constraints.startDate)
      const endDate = new Date(constraints.endDate)
      
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // APIリクエスト用のデータ
      const requestData = {
        staff: staffList.map(s => ({
          id: s.id,
          name: s.name,
          max_hours: s.max_hours_per_week || 40
        })),
        dates: dates,
        constraints: {
          min_staff_per_day: constraints.minStaffPerDay,
          max_staff_per_day: constraints.maxStaffPerDay,
        }
      }
      
      // シフト自動生成APIを呼び出す
      const response = await fetch('/api/generate-shift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        // エラーの場合
        toast.error(result.error || 'シフト生成に失敗しました')
        setErrorMessage(result.error || 'エラーが発生しました')
        return
      }
      
      // 生成成功
      toast.success(`シフトを生成しました（${result.shifts.length}件）`)
      setGeneratedShifts(result.shifts)
      
      // Supabaseに保存
      await saveShiftsToDatabase(result.shifts)
      
    } catch (err) {
      console.error('シフト生成エラー:', err)
      toast.error('シフト生成中にエラーが発生しました')
      setErrorMessage(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // 生成したシフトをデータベースに保存
  async function saveShiftsToDatabase(shifts) {
    try {
      // 既存のシフトを削除（同じ期間）
      const dates = [...new Set(shifts.map(s => s.date))]
      await supabase
        .from('shifts')
        .delete()
        .in('date', dates)
      
      // 新しいシフトを挿入
      const { error } = await supabase
        .from('shifts')
        .insert(shifts.map(s => ({
          staff_id: s.staff_id,
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          is_confirmed: false
        })))
      
      if (error) throw error
      
      toast.success('シフトをデータベースに保存しました')
    } catch (err) {
      console.error('保存エラー:', err)
      toast.error('データベースへの保存に失敗しました')
    }
  }

  // スタッフ名を取得（IDから）
  function getStaffName(staffId) {
    const staff = staffList.find(s => s.id === staffId)
    return staff ? staff.name : '不明'
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">シフト自動生成</h1>
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            <p className="font-semibold">エラー</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* 制約条件設定 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">制約条件の設定</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={constraints.startDate}
                onChange={handleConstraintChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                終了日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={constraints.endDate}
                onChange={handleConstraintChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                1日の最低人数
              </label>
              <input
                type="number"
                name="minStaffPerDay"
                value={constraints.minStaffPerDay}
                onChange={handleConstraintChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                1日の最大人数
              </label>
              <input
                type="number"
                name="maxStaffPerDay"
                value={constraints.maxStaffPerDay}
                onChange={handleConstraintChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerateShift}
              disabled={isGenerating}
              className={`
                px-6 py-3 rounded font-semibold text-white transition
                ${isGenerating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              ) : (
                'シフトを自動生成'
              )}
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            登録スタッフ数: {staffList.length}名
          </p>
        </div>

        {/* 生成されたシフト */}
        {generatedShifts.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">生成されたシフト</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">日付</th>
                    <th className="px-4 py-3 text-left font-semibold">スタッフ</th>
                    <th className="px-4 py-3 text-left font-semibold">時間</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedShifts.map((shift, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{shift.date}</td>
                      <td className="px-4 py-3">{getStaffName(shift.staff_id)}</td>
                      <td className="px-4 py-3">
                        {shift.start_time} - {shift.end_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
