import { supabase } from "@/integrations/supabase/client";
import type { CreatorVideo } from "@/features/video/schema";
const db=supabase as any;
export type FilmMediaRole="trailer"|"clip"|"scene"|"rough_cut"|"teaser"|"behind_the_scenes"|"other";
export type CompletionState="unfinished"|"finished";
export interface ProjectOption{id:string;title:string;production_stage:string}
export interface ProjectMedia{id:string;project_id:string;video_id:string;media_role:FilmMediaRole;completion_state:CompletionState;creator_note:string;sort_order:number;creator_videos:CreatorVideo|null}
export interface ReviewBrief{id:string;project_id:string;title:string;purpose:string;instructions:string;status:"draft"|"revoked";playlist_id:string|null;created_at:string}
function fail(error:unknown):never{throw new Error(error&&typeof error==="object"&&"message" in error?String((error as {message:unknown}).message):"Film project media could not be updated.")}
export const filmProjectMediaService={
 async listProjects(creatorId:string):Promise<ProjectOption[]>{const{data,error}=await db.from("film_projects").select("id,title,production_stage").eq("creator_id",creatorId).order("created_at",{ascending:false});if(error)fail(error);return data||[];},
 async listVideos(creatorId:string):Promise<CreatorVideo[]>{const{data,error}=await db.from("creator_videos").select("*").eq("creator_id",creatorId).order("created_at",{ascending:false});if(error)fail(error);return data||[];},
 async listMedia(creatorId:string):Promise<ProjectMedia[]>{const{data,error}=await db.from("film_project_media").select("*,creator_videos(*)").eq("creator_id",creatorId).order("sort_order").order("created_at");if(error)fail(error);return data||[];},
 async attach(creatorId:string,input:{projectId:string;videoId:string;role:FilmMediaRole;completion:CompletionState;note:string}){const{error}=await db.from("film_project_media").insert({creator_id:creatorId,project_id:input.projectId,video_id:input.videoId,media_role:input.role,completion_state:input.completion,creator_note:input.note.trim()});if(error)fail(error);},
 async detach(creatorId:string,id:string){const{error}=await db.from("film_project_media").delete().eq("id",id).eq("creator_id",creatorId);if(error)fail(error);},
 async listBriefs(creatorId:string):Promise<ReviewBrief[]>{const{data,error}=await db.from("film_project_review_briefs").select("*").eq("creator_id",creatorId).order("created_at",{ascending:false});if(error)fail(error);return data||[];},
 async createBrief(creatorId:string,input:{projectId:string;title:string;purpose:string;instructions:string}){const{error}=await db.from("film_project_review_briefs").insert({creator_id:creatorId,project_id:input.projectId,title:input.title.trim(),purpose:input.purpose,instructions:input.instructions.trim(),status:"draft"});if(error)fail(error);},
};
