"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function TutorHeartbeat() {
  useEffect(() => {
    const beat = () => { supabase.rpc("tutor_heartbeat").then(() => {}); };
    beat();
    const t = setInterval(beat, 120000);
    return () => clearInterval(t);
  }, []);
  return null;
}
