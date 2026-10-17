import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
})

export type Tutor = {
  id: string
  user_id?: string
  title?: string
  surname: string
  subjects: string[]
  levels: string[]
  languages: string[]
  qualifications?: string[]
  qualification_detail?: string | null
  description?: string
  years_experience?: number
  photo_url?: string | null
  video_url?: string | null
  cv_url?: string
  gender?: string | null
  is_live: boolean
  no_show_count: number
  created_at: string
}

export type Booking = {
  id: string
  tutor_id: string
  parent_user_id?: string | null
  parent_email: string
  parent_name?: string
  slot_date: string
  start_time: string
  is_recurring: boolean
  status: string
  created_at: string
}

/** Fallback select used only before the media-review SQL is applied. After that, photo_url and video_url are revoked and public pages use list_tutors / get_tutor. */
export const PUBLIC_TUTOR_COLUMNS =
  'id, user_id, title, surname, subjects, levels, languages, qualifications, description, years_experience, photo_url, video_url, cv_url, is_live, no_show_count, created_at'

/** Profile editor columns. Raw photo and video paths stay off this list. */
export const EDITOR_TUTOR_COLUMNS =
  'id, user_id, title, surname, subjects, levels, languages, qualifications, qualification_detail, description, years_experience, gender'
