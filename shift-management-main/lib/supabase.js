// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// 環境変数から接続情報を取得
// .env.localファイルに記載した値が自動的に読み込まれる
// セキュリティ：APIキーをコードに直接書かない
// 環境切り替え：開発/本番で異なる設定を簡単に切り替えられる
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 環境変数が設定されていない場合はエラー
// 開発初期に設定ミスを防ぐため
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '環境変数が設定されていません。.env.exampleを参考に.env.localを作成してください。'
  )
}

// Supabaseクライアントを作成
// このクライアントを使って全てのデータベース操作を行う
export const supabase = createClient(supabaseUrl, supabaseKey)
