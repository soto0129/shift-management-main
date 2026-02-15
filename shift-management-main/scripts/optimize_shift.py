#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
シフト最適化スクリプト
PuLPを使った線形計画法でシフトを自動生成する

入力：JSON形式（標準入力）
  - スタッフ情報
  - 対象日
  - 制約条件

出力：JSON形式（標準出力）
  - 最適化されたシフト
"""

import sys
import json
from pulp import LpProblem, LpVariable, LpMaximize, lpSum, value, LpStatus

def optimize_shift(input_data):
    """
    シフトを最適化する関数
    
    スタッフの希望優先度を考慮しつつ、制約条件を満たす最適なシフトを生成する
    
    Args:
        input_data (dict): 入力データ
        
    Returns:
        dict: 最適化結果
    """
    
    # 入力データの取得
    staff_list = input_data.get('staff', [])
    dates = input_data.get('dates', [])
    constraints = input_data.get('constraints', {})
    
    # 制約条件の取得
    min_staff_per_day = constraints.get('min_staff_per_day', 2)
    max_staff_per_day = constraints.get('max_staff_per_day', 5)
    
    # スタッフIDのリストを作成
    staff_ids = [s['id'] for s in staff_list]
    
    # 最適化問題を作成
    # LpMaximize: 目的関数を最大化する
    # スタッフの希望を最大限考慮するため、希望度のスコア合計を最大化
    prob = LpProblem("ShiftScheduling", LpMaximize)
    
    # 決定変数を作成
    # x[i][j] = スタッフiが日jに勤務する場合1、しない場合0（0-1整数変数）
    # この変数を使って、誰がいつ働くかを決定する
    x = {}
    for staff_id in staff_ids:
        x[staff_id] = {}
        for date in dates:
            # LpVariable: 0または1の値を取る変数
            # cat='Binary': 0-1整数変数
            x[staff_id][date] = LpVariable(
                f"x_{staff_id}_{date}", 
                cat='Binary'
            )
    
    # 目的関数の設定
    # スタッフの希望を考慮した重み付け
    # 将来的には、スタッフの希望優先度（priority）をデータベースから取得して使用
    # 現時点では全て同じ重み（1）として扱うが、構造は用意しておく
    objective = lpSum([
        x[staff_id][date] * 1  # 重み: 将来的に希望優先度で変更可能
        for staff_id in staff_ids 
        for date in dates
    ])
    prob += objective
    
    # 制約条件1: 各日の最低必要人数
    # 各日について、勤務するスタッフの合計が最低人数以上である必要がある
    # これにより、営業に必要な最低人数を確保
    for date in dates:
        prob += (
            lpSum([x[staff_id][date] for staff_id in staff_ids]) >= min_staff_per_day,
            f"MinStaff_{date}"
        )
    
    # 制約条件2: 各日の最大配置人数
    # 各日について、勤務するスタッフの合計が最大人数以下である必要がある
    # 人件費の抑制や、過剰な人員配置を防ぐ
    for date in dates:
        prob += (
            lpSum([x[staff_id][date] for staff_id in staff_ids]) <= max_staff_per_day,
            f"MaxStaff_{date}"
        )
    
    # 制約条件3: 各スタッフの週最大労働日数（オプション）
    # スタッフごとの max_hours や労働基準法を考慮
    # 今後の拡張として、週の労働日数制限を追加可能
    # 例: 1週間に5日まで
    # max_days_per_staff = constraints.get('max_days_per_staff', len(dates))
    # for staff_id in staff_ids:
    #     prob += (
    #         lpSum([x[staff_id][date] for date in dates]) <= max_days_per_staff,
    #         f"MaxDays_{staff_id}"
    #     )
    
    # ソルバーで最適化を実行
    # solve(): 制約を満たす解を探す
    # デフォルトのソルバー（CBC）を使用
    prob.solve()
    
    # 解の状態をチェック
    # Optimal: 最適解が見つかった
    # Infeasible: 制約を満たす解が存在しない
    # Unbounded: 解が無限に大きくなる（通常は発生しない）
    status = LpStatus[prob.status]
    
    if status != 'Optimal':
        # 制約を満たす解が見つからなかった場合
        return {
            'success': False,
            'error': '制約条件を満たすシフトが見つかりませんでした。最低人数や最大人数を見直してください。',
            'status': status
        }
    
    # 最適解からシフトを生成
    # x[staff_id][date] == 1 のものを抽出する
    shifts = []
    for staff_id in staff_ids:
        for date in dates:
            # value(): 変数の値を取得
            if value(x[staff_id][date]) == 1:
                # そのスタッフはその日に勤務する
                shifts.append({
                    'staff_id': staff_id,
                    'date': date,
                    'start_time': '09:00',  # デフォルトの開始時刻
                    'end_time': '17:00'     # デフォルトの終了時刻
                })
    
    return {
        'success': True,
        'shifts': shifts,
        'status': status,
        'objective_value': value(prob.objective)  # 目的関数の値（希望度の合計）
    }


if __name__ == '__main__':
    try:
        # 標準入力からJSONを読み込む
        input_data = json.load(sys.stdin)
        
        # 最適化を実行
        result = optimize_shift(input_data)
        
        # 結果をJSONで標準出力に出力
        print(json.dumps(result, ensure_ascii=False))
        
    except json.JSONDecodeError as e:
        # JSON解析エラー
        error_result = {
            'success': False,
            'error': f'JSON解析エラー: {str(e)}'
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)
        
    except Exception as e:
        # その他のエラー
        error_result = {
            'success': False,
            'error': f'エラーが発生しました: {str(e)}'
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)
