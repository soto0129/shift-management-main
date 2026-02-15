// app/shifts/calendar/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ShiftCalendarPage() {
  const [shifts, setShifts] = useState([])
  const [staffList, setStaffList] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchStaff()
    fetchShifts()
  }, [currentMonth])

  async function fetchStaff() {
    const { data } = await supabase.from('staff').select('*').order('name')
    setStaffList(data || [])
  }

  async function fetchShifts() {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('shifts')
      .select('*, staff:staff_id(name)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time')

    if (error) {
      console.error('シフト取得エラー:', error)
      return
    }
    setShifts(data || [])
  }

  // カレンダーの日付を生成
  function getCalendarDays() {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // 前月の日を追加（週の開始を日曜に）
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // 当月の日を追加
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  // 指定日のシフトを取得
  function getShiftsForDate(date) {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return shifts.filter(s => s.date === dateStr)
  }

  // 月を変更
  function changeMonth(delta) {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + delta)
      return newDate
    })
  }

  // シフト削除
  async function handleDeleteShift(shiftId) {
    if (!confirm('このシフトを削除しますか？')) return

    const { error } = await supabase.from('shifts').delete().eq('id', shiftId)
    if (error) {
      toast.error('削除に失敗しました')
      return
    }
    toast.success('シフトを削除しました')
    fetchShifts()
  }

  // シフト更新
  async function handleUpdateShift(e) {
    e.preventDefault()
    const formData = new FormData(e.target)

    const { error } = await supabase
      .from('shifts')
      .update({
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
      })
      .eq('id', selectedShift.id)

    if (error) {
      toast.error('更新に失敗しました')
      return
    }
    toast.success('シフトを更新しました')
    setIsEditModalOpen(false)
    fetchShifts()
  }

  // 印刷
  function handlePrint() {
    window.print()
  }

  const calendarDays = getCalendarDays()
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex justify-between items-center print:hidden">
          <div>
            <Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
              ← ホームに戻る
            </Link>
            <h1 className="text-3xl font-bold">シフトカレンダー</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/shifts"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              シフト生成
            </Link>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🖨️ 印刷
            </button>
          </div>
        </div>

        {/* 印刷用ヘッダー */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-center">
            シフト表 {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </h1>
        </div>

        {/* 月切り替え */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 print:hidden"
          >
            ← 前月
          </button>
          <h2 className="text-2xl font-semibold">
            {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 print:hidden"
          >
            翌月 →
          </button>
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 bg-gray-100">
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={`p-2 text-center font-semibold border-b ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const dayShifts = getShiftsForDate(date)
              const isToday = date && date.toDateString() === new Date().toDateString()
              const dayOfWeek = date ? date.getDay() : null

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border p-1 ${
                    !date ? 'bg-gray-50' : ''
                  } ${isToday ? 'bg-yellow-50' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-semibold mb-1 ${
                        dayOfWeek === 0 ? 'text-red-500' : 
                        dayOfWeek === 6 ? 'text-blue-500' : ''
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayShifts.map(shift => (
                          <div
                            key={shift.id}
                            className="text-xs p-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 print:cursor-default"
                            onClick={() => {
                              setSelectedShift(shift)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <div className="font-semibold truncate">
                              {shift.staff?.name || '不明'}
                            </div>
                            <div className="text-gray-600">
                              {shift.start_time?.slice(0, 5)}-{shift.end_time?.slice(0, 5)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* スタッフ別集計 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6 print:break-before-page">
          <h3 className="text-xl font-semibold mb-4">スタッフ別勤務日数</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {staffList.map(staff => {
              const count = shifts.filter(s => s.staff_id === staff.id).length
              return (
                <div key={staff.id} className="p-3 bg-gray-50 rounded">
                  <div className="font-semibold">{staff.name}</div>
                  <div className="text-2xl text-blue-600">{count}日</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 編集モーダル */}
      {isEditModalOpen && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center print:hidden">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">シフト編集</h3>
            <form onSubmit={handleUpdateShift}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">スタッフ</label>
                <div className="p-2 bg-gray-100 rounded">
                  {selectedShift.staff?.name || '不明'}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">日付</label>
                <div className="p-2 bg-gray-100 rounded">{selectedShift.date}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">開始時間</label>
                  <input
                    type="time"
                    name="start_time"
                    defaultValue={selectedShift.start_time?.slice(0, 5)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">終了時間</label>
                  <input
                    type="time"
                    name="end_time"
                    defaultValue={selectedShift.end_time?.slice(0, 5)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  更新
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteShift(selectedShift.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  削除
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  閉じる
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 印刷用スタイル */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  )
}
