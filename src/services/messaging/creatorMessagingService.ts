import { supabase } from "@/integrations/supabase/client";

export type CreatorDirectoryEntry = { user_id:string; artist_name:string; username:string|null; avatar_url:string|null };
export type CreatorThread = { thread_id:string; other_user_id:string; other_name:string; other_username:string|null; other_avatar:string|null; last_message_at:string|null; last_preview:string|null; unread_count:number };
export type CreatorMessage = { message_id:string; sender_user_id:string; body:string|null; created_at:string; transfer_id:string|null; file_id:string|null; file_name:string|null; size_bytes:number|null; content_type:string|null; expires_at:string|null; transfer_status:string|null };
export type TransferSummary = { plan_code:string; monthly_bytes:number; used_bytes:number; remaining_bytes:number; max_file_bytes:number; retention_days:number };
export type CreatorUnreadSummary = { unread_count:number; latest_thread_id:string|null; latest_sender_name:string|null; latest_preview:string|null; latest_kind:string|null };

type PreparedTransfer = { transfer_id:string; file_id:string; object_key:string; expires_at:string };
const db = supabase as any;
const unwrap = <T,>(value:{data:T|null;error?:{message?:string}|null}) => { if(value.error) throw new Error(value.error.message||"VYBE request failed"); return value.data as T; };

async function rpc<T>(name:string,args:Record<string,unknown>={}) { return unwrap<T>(await db.rpc(name,args)); }
async function token() { const {data,error}=await supabase.auth.getSession(); if(error) throw error; const access=data.session?.access_token; if(!access) throw new Error("Sign in again to continue."); return access; }

export const creatorMessagingService = {
  directory:(query="")=>rpc<CreatorDirectoryEntry[]>("creator_message_directory",{p_query:query}),
  threads:()=>rpc<CreatorThread[]>("creator_message_threads_list_v2"),
  messages:(threadId:string)=>rpc<CreatorMessage[]>("creator_message_thread_messages",{p_thread_id:threadId}),
  start:(otherUserId:string)=>rpc<string>("creator_message_start",{p_other_user_id:otherUserId}),
  send:(threadId:string,body:string)=>rpc<string>("creator_message_send",{p_thread_id:threadId,p_body:body}),
  markRead:(threadId:string)=>rpc<number>("creator_message_mark_read",{p_thread_id:threadId}),
  unreadCount:()=>rpc<number>("creator_message_unread_count"),
  unreadSummary:async()=>{ const rows=await rpc<CreatorUnreadSummary[]>("creator_message_unread_summary"); return rows[0] ?? { unread_count:0, latest_thread_id:null, latest_sender_name:null, latest_preview:null, latest_kind:null }; },
  summary:async()=>{ const rows=await rpc<TransferSummary[]>("creator_transfer_summary"); return rows[0]; },
  setLargeFilePreference:async(allow:boolean)=>{ const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("Sign in again to continue."); const {error}=await db.from("creator_transfer_preferences").upsert({user_id:user.id,allow_large_files:allow,updated_at:new Date().toISOString()}); if(error) throw error; },
  async upload(threadId:string,file:File,onProgress?:(pct:number)=>void) {
    const rows=await rpc<PreparedTransfer[]>("creator_transfer_prepare",{p_thread_id:threadId,p_file_name:file.name,p_size_bytes:file.size,p_content_type:file.type||"application/octet-stream"});
    const prepared=rows[0]; if(!prepared) throw new Error("Could not prepare transfer.");
    const auth=await token();
    const create=await fetch("/api/creator-transfer/upload/create",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${auth}`},body:JSON.stringify({fileId:prepared.file_id})});
    if(!create.ok) throw new Error((await create.text())||"Could not start upload.");
    const {uploadId}=await create.json() as {uploadId:string};
    const chunkSize=8*1024*1024; const parts:{partNumber:number;etag:string}[]=[]; let sent=0;
    try {
      for(let offset=0,partNumber=1;offset<file.size;offset+=chunkSize,partNumber++) {
        const chunk=file.slice(offset,Math.min(offset+chunkSize,file.size));
        const res=await fetch(`/api/creator-transfer/upload/part?fileId=${encodeURIComponent(prepared.file_id)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`,{method:"PUT",headers:{authorization:`Bearer ${auth}`},body:chunk});
        if(!res.ok) throw new Error((await res.text())||`Upload part ${partNumber} failed.`);
        const body=await res.json() as {etag:string}; parts.push({partNumber,etag:body.etag}); sent+=chunk.size; onProgress?.(Math.round(sent/file.size*100));
      }
      const complete=await fetch("/api/creator-transfer/upload/complete",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${auth}`},body:JSON.stringify({fileId:prepared.file_id,uploadId,parts})});
      if(!complete.ok) throw new Error((await complete.text())||"Could not complete upload.");
      await rpc<string>("creator_transfer_finish",{p_file_id:prepared.file_id}); onProgress?.(100); return prepared;
    } catch(error) {
      void fetch("/api/creator-transfer/upload/abort",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${auth}`},body:JSON.stringify({fileId:prepared.file_id,uploadId})}).catch(()=>undefined); throw error;
    }
  },
  async download(fileId:string) { const ticket=await rpc<string>("creator_transfer_create_download_ticket",{p_file_id:fileId}); if(!ticket) throw new Error("Download unavailable."); window.location.assign(`/api/creator-transfer/download?ticket=${encodeURIComponent(ticket)}`); }
};

export const formatTransferBytes=(bytes:number)=>{ if(bytes>=1024**3)return `${(bytes/1024**3).toFixed(bytes>=10*1024**3?0:1)} GB`; if(bytes>=1024**2)return `${(bytes/1024**2).toFixed(1)} MB`; return `${Math.max(1,Math.round(bytes/1024))} KB`; };
