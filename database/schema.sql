-- Supabaseで実行するSQL文
-- Supabase → SQL Editor で実行してください

-- 1. スタッフテーブル
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hourly_wage INTEGER NOT NULL CHECK (hourly_wage > 0),
  max_hours_per_week INTEGER DEFAULT 40 CHECK (max_hours_per_week > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スタッフ名でインデックスを作成（検索の高速化）
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);

-- 2. 勤務可能時間テーブル
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  CONSTRAINT check_time_range CHECK (end_time > start_time)
);

-- 曜日の定義: 0=日曜日, 1=月曜日, ..., 6=土曜日
-- JavaScriptのDate.getDay()と同じ定義を使用
-- これにより、フロントエンドとバックエンドで曜日の扱いが統一される
COMMENT ON COLUMN availability.day_of_week IS '曜日: 0=日曜, 1=月曜, 2=火曜, 3=水曜, 4=木曜, 5=金曜, 6=土曜';

-- スタッフIDでインデックスを作成（JOIN高速化）
CREATE INDEX IF NOT EXISTS idx_availability_staff ON availability(staff_id);

-- 3. シフトテーブル
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_shift_time CHECK (end_time > start_time),
  -- 一意性制約: 同じスタッフが同じ日の同じ時間に重複してシフトに入らないようにする
  -- これにより、データの整合性を保証し、バグを防ぐ
  CONSTRAINT unique_staff_date_time UNIQUE (staff_id, date, start_time)
);

-- シフト検索用のインデックス（日付とスタッフID）
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_staff ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date_staff ON shifts(date, staff_id);

-- テーブル作成完了メッセージ
SELECT 'テーブル作成完了' AS message;
