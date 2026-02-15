// app/api/optimize/route.js
import { NextResponse } from 'next/server';

function optimizeShift(inputData) {
  const { staff: staffList = [], dates = [], constraints = {} } = inputData;

  // バリデーション
  if (!staffList || staffList.length === 0) {
    return { success: false, error: 'スタッフが登録されていません' };
  }
  if (!dates || dates.length === 0) {
    return { success: false, error: '日付が指定されていません' };
  }

  // 制約条件
  const minStaff = constraints.min_staff_per_day ?? 1;
  const maxStaff = constraints.max_staff_per_day ?? staffList.length;

  // 結果格納用
  const schedule = {};
  dates.forEach(date => { schedule[date] = []; });
  
  const staffWorkCount = {};

  // スタッフ情報を整理
  const staffInfo = {};
  staffList.forEach(staff => {
    const staffId = staff.id || staff.name || `staff_${Math.random().toString(36).slice(2, 8)}`;
    staffInfo[staffId] = {
      preferredDates: new Set(staff.preferred_dates || []),
      unavailableDates: new Set(staff.unavailable_dates || []),
      maxDays: staff.max_days ?? dates.length,
    };
    staffWorkCount[staffId] = 0;
  });

  // 各日付に対してスタッフを割り当て
  for (const date of dates) {
    const availableStaff = [];

    for (const [staffId, info] of Object.entries(staffInfo)) {
      if (info.unavailableDates.has(date)) continue;
      if (staffWorkCount[staffId] >= info.maxDays) continue;

      let score = staffWorkCount[staffId] * 10;
      if (info.preferredDates.has(date)) score -= 100;

      availableStaff.push({ id: staffId, score });
    }

    availableStaff.sort((a, b) => a.score - b.score);

    let assignedCount = 0;
    for (const { id: staffId } of availableStaff) {
      if (assignedCount >= maxStaff) break;
      schedule[date].push(staffId);
      staffWorkCount[staffId]++;
      assignedCount++;
    }
  }

  // 結果を整形
  const resultSchedule = [];
  const warnings = [];

  for (const date of dates) {
    const assigned = schedule[date];
    resultSchedule.push({ date, staff: assigned, count: assigned.length });
    if (assigned.length < minStaff) {
      warnings.push(`${date}: 最低人数 ${minStaff}人を満たせません（${assigned.length}人）`);
    }
  }

  const totalAssignments = Object.values(staffWorkCount).reduce((sum, count) => sum + count, 0);

  return {
    success: true,
    schedule: resultSchedule,
    stats: {
      total_assignments: totalAssignments,
      staff_distribution: staffWorkCount,
      average_per_staff: staffList.length > 0 ? Math.round((totalAssignments / staffList.length) * 10) / 10 : 0,
      days_with_shortage: warnings.length,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function POST(request) {
  try {
    const inputData = await request.json();
    const result = optimizeShift(inputData);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Shift optimization API is running',
    version: '2.0.0',
    engine: 'javascript-heuristic',
  });
}
