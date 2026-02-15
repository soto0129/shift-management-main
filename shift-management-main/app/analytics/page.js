// app/analytics/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  // スタッフ一覧
  const [staffList, setStaffList] = useState([])
  
  // シフトデータ
  const [shifts, setShifts] = useState([])
  
  // 集計データ
  const [analytics, setAnalytics] = useState([])
  
  // ローディング状態
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  // データ取得
  async function fetchData() {
    try {
      setIsLoading(true)
      
      // スタッフとシフトを並行取得
      const [staffResult, shiftsResult] = await Promise.all([
        supabase.from('staff').select('*').order('name'),
        supabase.from('shifts').select('*')
      ])
      
      if (staffResult.error) throw staffResult.error
      if (shiftsResult.error) throw shiftsResult.error
      
      const staff = staffResult.data || []
      const shiftsData = shiftsResult.data || []
      
      setStaffList(staff)
      setShifts(shiftsData)
      
      // 集計処理
      calculateAnalytics(staff, shiftsData)
      
    } catch (err) {
      console.error('データ取得エラー:', err)
      toast.error('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // スタッフ別の労働時間を集計
  function calculateAnalytics(staff, shiftsData) {
    // スタッフごとに集計
    const analyticsData = staff.map(s => {
      // このスタッフのシフトを抽出
      const staffShifts = shiftsData.filter(shift => shift.staff_id === s.id)
      
      // 労働時間を計算
      // 各シフトの時間を合計する
      const totalHours = staffShifts.reduce((sum, shift) => {
        // start_timeとend_timeから労働時間を計算
        // 簡易的に、09:00-17:00 = 8時間として計算
        const start = parseTime(shift.start_time)
        const end = parseTime(shift.end_time)
        const hours = (end - start) / 60 // 分を時間に変換
        return sum + hours
      }, 0)
      
      // 人件費を計算
      const totalCost = totalHours * s.hourly_wage
      
      return {
        staffId: s.id,
        staffName: s.name,
        totalHours: totalHours,
        totalCost: totalCost,
        shiftCount: staffShifts.length
      }
    })
    
    setAnalytics(analyticsData)
  }

  // 時刻を分に変換（例：09:00 → 540分）
  function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // 最大値を取得（グラフの高さ調整用）
  const maxHours = Math.max(...analytics.map(a => a.totalHours), 1)

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold">工数分析</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">読み込み中...</span>
          </div>
        ) : (
          <>
            {/* グラフ：スタッフ別労働時間 */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-6">スタッフ別労働時間</h2>
              
              {analytics.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  シフトデータがありません
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.map((data) => (
                    <div key={data.staffId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{data.staffName}</span>
                        <span className="text-gray-600">
                          {data.totalHours.toFixed(1)}時間 / {data.shiftCount}日
                        </span>
                      </div>
                      {/* 棒グラフ */}
                      <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full flex items-center justify-end px-2 text-white text-xs font-semibold transition-all duration-300"
                          style={{ width: `${(data.totalHours / maxHours) * 100}%` }}
                        >
                          {data.totalHours > 0 && `${data.totalHours.toFixed(1)}h`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* テーブル：詳細データ */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">詳細データ</h2>
              
              {analytics.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  データがありません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">スタッフ名</th>
                        <th className="px-4 py-3 text-left font-semibold">勤務日数</th>
                        <th className="px-4 py-3 text-left font-semibold">総労働時間</th>
                        <th className="px-4 py-3 text-left font-semibold">総人件費</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((data) => (
                        <tr key={data.staffId} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">{data.staffName}</td>
                          <td className="px-4 py-3">{data.shiftCount}日</td>
                          <td className="px-4 py-3">{data.totalHours.toFixed(1)}時間</td>
                          <td className="px-4 py-3">{data.totalCost.toLocaleString()}円</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr className="border-t-2">
                        <td className="px-4 py-3">合計</td>
                        <td className="px-4 py-3">
                          {analytics.reduce((sum, a) => sum + a.shiftCount, 0)}日
                        </td>
                        <td className="px-4 py-3">
                          {analytics.reduce((sum, a) => sum + a.totalHours, 0).toFixed(1)}時間
                        </td>
                        <td className="px-4 py-3">
                          {analytics.reduce((sum, a) => sum + a.totalCost, 0).toLocaleString()}円
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
