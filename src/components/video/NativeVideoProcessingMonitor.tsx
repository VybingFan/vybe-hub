import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { CreatorVideo } from "@/features/video/schema";

export function NativeVideoProcessingMonitor({creatorId,videos}:{creatorId?:string;videos:CreatorVideo[]}){
 const client=useQueryClient();const processing=videos.filter(video=>video.provider==="cloudflare_stream"&&video.status==="processing");
 useEffect(()=>{if(!creatorId||!processing.length)return;let active=true;const check=async()=>{const{data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)return;let changed=false;for(const video of processing){const response=await fetch("/api/video-status",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({videoId:video.id})});if(response.ok){const result=await response.json() as {state?:string};if(result.state==="ready"||result.state==="error")changed=true;}}if(active&&(changed||processing.length))await client.invalidateQueries({queryKey:["creator-videos",creatorId]});};void check();const timer=window.setInterval(()=>void check(),8000);return()=>{active=false;window.clearInterval(timer)}},[client,creatorId,processing.map(video=>video.id).join(",")]);
 if(!processing.length)return null;return <div className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-sm"><Loader2 className="h-4 w-4 animate-spin text-cyan-500"/><span>{processing.length} native video{processing.length===1?" is":"s are"} being processed. Publishing unlocks after Stream confirms playback readiness.</span></div>;
}
