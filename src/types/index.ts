export interface Profile {
  id: string
  email: string
  name: string
  account_size: number
  risk_per_trade: number
  created_at: string
}

export interface ChecklistData {
  // Step 1
  session: 'London' | 'New York' | 'Asian' | ''
  no_red_news_before: boolean
  no_red_news_after: boolean
  // Step 2
  higher_tf_trend: 'Bullish' | 'Bearish' | 'Ranging' | ''
  mid_tf_agrees: boolean
  entry_tf_aligned: boolean
  entry_timeframe: string
  all_tfs_aligned: boolean
  zone_marked: boolean
  confluences: number
  zone_fresh: boolean
  price_from_correct_side: boolean
  // Step 3
  model: 'Star' | 'Engulf' | ''
  star_candle_formed: boolean
  star_wick_2x: boolean
  star_closed_inside: boolean
  star_close_confirmed: boolean
  star_entry_within_30: boolean
  engulf_candle_formed: boolean
  engulf_opposite_visible: boolean
  engulf_ob_marked: boolean
  engulf_close_confirmed: boolean
  // Step 4
  instrument: 'XAU/USD' | 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'Other'
  direction: 'Long' | 'Short' | ''
  entry_price: number
  stop_loss: number
  stop_pips: number
  risk_amount: number
  position_size: number
  target_1: number
  target_2: number
  // Step 5 invalidation
  price_not_closed_through_poi: boolean
  wick_is_2x: boolean
  entry_not_stale: boolean
  stop_not_too_wide: boolean
}

export interface Trade {
  id: string
  user_id: string
  date: string
  session: 'London' | 'New York' | 'Asian'
  instrument: 'XAU/USD' | 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'Other'
  direction: 'Long' | 'Short'
  model: 'Star' | 'Engulf'
  timeframe: string
  confluences: number
  entry_price: number
  stop_loss: number
  target_1: number
  target_2: number
  stop_pips: number
  risk_amount: number
  position_size: number
  result: 'Win' | 'Loss' | 'Breakeven' | 'Pending'
  exit_price: number | null
  pnl: number
  rr_achieved: number | null
  closed_80_at_t1: boolean
  moved_to_be: boolean
  checklist_completed: boolean
  checklist_data: ChecklistData | null
  notes: string | null
  screenshot_url: string | null
  created_at: string
}

export interface Journal {
  id: string
  user_id: string
  date: string
  market_bias: 'Bullish' | 'Bearish' | 'Ranging' | 'Unclear'
  pre_market_notes: string
  post_market_notes: string
  emotional_state: 'Calm' | 'Anxious' | 'Confident' | 'Fearful' | 'Greedy' | 'Neutral'
  followed_rules: boolean
  mistakes: string
  lessons: string
  created_at: string
}

export interface SessionInfo {
  name: 'Asian' | 'London' | 'New York' | 'Off-Hours'
  istStart: string
  istEnd: string
  isActive: boolean
  isPrimary: boolean
}
