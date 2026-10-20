import { missingRpc } from '@/lib/media-schema'
import { supabase } from '@/lib/supabase'

export const EMAIL_VERIFICATION_LIMIT_MESSAGE =
  'You have reached the limit of 3 verification emails today. Please try again tomorrow.'

const SCHEMA_HINT =
  'In the Supabase SQL editor, run the email verification limit section at the end of supabase/schema.sql, then try again.'

export async function allowVerificationEmail(email: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('check_email_verification_limit', {
    p_email: email.trim(),
  })

  if (error) {
    return { ok: false, message: missingRpc(error.message) ? SCHEMA_HINT : error.message }
  }

  if (data !== true) {
    return { ok: false, message: EMAIL_VERIFICATION_LIMIT_MESSAGE }
  }

  return { ok: true }
}
