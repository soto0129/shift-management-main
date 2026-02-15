// components/ConfirmDialog.js
'use client'

import { useState, useEffect } from 'react'

/**
 * 確認ダイアログコンポーネント
 * window.confirmの代わりに使用する、モダンなUIのダイアログ
 * 
 * 使い方:
 * const [showDialog, setShowDialog] = useState(false)
 * 
 * <ConfirmDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   onConfirm={() => { 削除処理 }}
 *   title="削除確認"
 *   description="本当に削除しますか？"
 * />
 */
export function ConfirmDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = '確認',
  description = 'この操作を実行しますか？',
  confirmText = '実行',
  cancelText = 'キャンセル',
  variant = 'danger' // 'danger' または 'default'
}) {
  // ESCキーでダイアログを閉じる
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    
    if (open) {
      document.addEventListener('keydown', handleEscape)
      // ダイアログが開いている間、背景のスクロールを無効化
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])
  
  // ダイアログが開いていない場合は何も表示しない
  if (!open) return null
  
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }
  
  const handleCancel = () => {
    onOpenChange(false)
  }
  
  return (
    <>
      {/* 背景のオーバーレイ */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleCancel}
      />
      
      {/* ダイアログ本体 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 mx-4">
          {/* タイトル */}
          <h2 className="text-lg font-semibold mb-2">
            {title}
          </h2>
          
          {/* 説明 */}
          <p className="text-sm text-gray-600 mb-6">
            {description}
          </p>
          
          {/* ボタン */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
            >
              {cancelText}
            </button>
            
            <button
              onClick={handleConfirm}
              className={`
                px-4 py-2 text-sm font-medium text-white rounded transition
                ${variant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
