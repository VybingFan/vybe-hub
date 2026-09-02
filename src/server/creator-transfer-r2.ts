import { env as cloudflareEnv } from "cloudflare:workers";

type R2UploadedPart = { partNumber:number; etag:string };
type R2MultipartUpload = { uploadId:string; uploadPart(partNumber:number,body:ReadableStream|ArrayBuffer|Blob):Promise<{partNumber:number;etag:string}>; complete(parts:R2UploadedPart[]):Promise<unknown>; abort():Promise<void> };
type R2Object = { body:ReadableStream; size:number };
type R2Bucket = { createMultipartUpload(key:string,options?:{httpMetadata?:{contentType?:string}}):Promise<R2MultipartUpload>; resumeMultipartUpload(key:string,uploadId:string):R2MultipartUpload; get(key:string):Promise<R2Object|null> };
type TransferEnv = { VYBE_CREATOR_TRANSFERS?:R2Bucket; SUPABASE_URL?:string; SUPABASE_PUBLISHABLE_KEY?:string; VITE_SUPABASE_URL?:string; VITE_SUPABASE_PUBLISHABLE_KEY?:string };

const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json"}});
const cleanFileName=(value:string)=>value.replace(/[\r\n]/g," ").slice(0,255);
function config(env:TransferEnv){const url=env.SUPABASE_URL||env.VITE_SUPABASE_URL||import.meta.env.VITE_SUPABASE_URL;const key=env.SUPABASE_PUBLISHABLE_KEY||env.VITE_SUPABASE_PUBLISHABLE_KEY||import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error("Supabase server environment is not configured.");return{url,key};}
async function rpc(env:TransferEnv,token:string,name:string,args:Record<string,unknown>){const{url,key}=config(env);const res=await fetch(`${url}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:key,authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify(args)});if(!res.ok)throw new Error(await res.text());return await res.json();}
async function publicRpc(env:TransferEnv,name:string,args:Record<string,unknown>){const{url,key}=config(env);const res=await fetch(`${url}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:key,"content-type":"application/json"},body:JSON.stringify(args)});if(!res.ok)throw new Error(await res.text());return await res.json();}
function bearer(request:Request){const h=request.headers.get("authorization")||"";if(!h.startsWith("Bearer "))throw new Error("Authentication required.");return h.slice(7);}
async function authorizedFile(env:TransferEnv,token:string,fileId:string){const rows=await rpc(env,token,"creator_transfer_authorize_upload",{p_file_id:fileId}) as Array<{object_key:string;size_bytes:number}>;if(!rows[0])throw new Error("Upload is not authorized.");return rows[0];}
function resolveEnv(rawEnv:unknown):TransferEnv{
 const candidate=(rawEnv && typeof rawEnv==="object") ? rawEnv as TransferEnv : cloudflareEnv as unknown as TransferEnv;
 return candidate;
}

export async function handleCreatorTransferRequest(request:Request,rawEnv?:unknown):Promise<Response|null>{
 const url=new URL(request.url);if(!url.pathname.startsWith("/api/creator-transfer/"))return null;
 const env=resolveEnv(rawEnv);const bucket=env?.VYBE_CREATOR_TRANSFERS;if(!bucket)return json({error:"VYBE Creator Transfer R2 binding is not configured."},503);
 try{
  if(url.pathname.endsWith("/download")&&request.method==="GET"){
   const ticket=url.searchParams.get("ticket")||"";if(!ticket)return json({error:"Download ticket required."},400);
   const rows=await publicRpc(env,"creator_transfer_consume_download_ticket",{p_ticket:ticket}) as Array<{object_key:string;file_name:string;content_type:string;size_bytes:number}>;const f=rows[0];if(!f)return json({error:"File is unavailable, expired, or the ticket was already used."},404);
   const obj=await bucket.get(f.object_key);if(!obj)return json({error:"Stored file not found."},404);
   return new Response(obj.body,{headers:{"content-type":f.content_type||"application/octet-stream","content-disposition":`attachment; filename*=UTF-8''${encodeURIComponent(cleanFileName(f.file_name))}`,"cache-control":"private, no-store"}});
  }
  const token=bearer(request);
  if(url.pathname.endsWith("/upload/create")&&request.method==="POST"){const body=await request.json() as {fileId:string};const f=await authorizedFile(env,token,body.fileId);const upload=await bucket.createMultipartUpload(f.object_key);return json({uploadId:upload.uploadId});}
  if(url.pathname.endsWith("/upload/part")&&request.method==="PUT"){const fileId=url.searchParams.get("fileId")||"";const uploadId=url.searchParams.get("uploadId")||"";const partNumber=Number(url.searchParams.get("partNumber"));if(!uploadId||!Number.isInteger(partNumber)||partNumber<1)return json({error:"Invalid upload part."},400);const f=await authorizedFile(env,token,fileId);const part=await bucket.resumeMultipartUpload(f.object_key,uploadId).uploadPart(partNumber,request.body as ReadableStream);return json({partNumber:part.partNumber,etag:part.etag});}
  if(url.pathname.endsWith("/upload/complete")&&request.method==="POST"){const body=await request.json() as {fileId:string;uploadId:string;parts:R2UploadedPart[]};const f=await authorizedFile(env,token,body.fileId);await bucket.resumeMultipartUpload(f.object_key,body.uploadId).complete(body.parts);return json({ok:true});}
  if(url.pathname.endsWith("/upload/abort")&&request.method==="POST"){const body=await request.json() as {fileId:string;uploadId:string};const f=await authorizedFile(env,token,body.fileId);await bucket.resumeMultipartUpload(f.object_key,body.uploadId).abort();return json({ok:true});}
  return json({error:"Not found"},404);
 }catch(error){console.error("[creator-transfer]",error);return json({error:error instanceof Error?error.message:"Transfer request failed"},400);}
}
