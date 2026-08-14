import { supabase } from "@/integrations/supabase/client";
const db = supabase as any;
export type FilmProjectType = "feature"|"short_film"|"documentary"|"series"|"episode"|"music_video"|"trailer"|"other";
export type FilmStage = "concept"|"development"|"pre_production"|"production"|"post_production"|"festival"|"released"|"archived";
export interface FilmProject { id:string; creator_id:string; title:string; project_type:FilmProjectType; production_stage:FilmStage; synopsis:string; release_year:number|null; poster_url:string|null; visibility:"draft"|"public"|"private"; created_at:string; film_watch_destinations:Array<{id:string;label:string;destination_url:string;destination_kind:string}>; }
export interface CreateFilmProjectInput { title:string; projectType:FilmProjectType; stage:FilmStage; synopsis:string; releaseYear?:number; posterUrl?:string; watchLabel?:string; watchUrl?:string; }
export const filmProjectService = {
  async listMine(creatorId:string):Promise<FilmProject[]> { const {data,error}=await db.from("film_projects").select("*,film_watch_destinations(*)").eq("creator_id",creatorId).order("created_at",{ascending:false}); if(error)throw error; return (data||[]) as FilmProject[]; },
  async create(creatorId:string,input:CreateFilmProjectInput) {
    const {data,error}=await db.from("film_projects").insert({creator_id:creatorId,title:input.title.trim(),project_type:input.projectType,production_stage:input.stage,synopsis:input.synopsis.trim(),release_year:input.releaseYear||null,poster_url:input.posterUrl?.trim()||null,visibility:"draft"}).select("id").single(); if(error)throw error;
    if(input.watchUrl?.trim()){ const {error:linkError}=await db.from("film_watch_destinations").insert({project_id:data.id,creator_id:creatorId,label:input.watchLabel?.trim()||"Watch this project",destination_url:input.watchUrl.trim(),destination_kind:"official"}); if(linkError){await db.from("film_projects").delete().eq("id",data.id);throw linkError;} }
    return data as {id:string};
  },
  async setStage(creatorId:string,projectId:string,stage:FilmStage){const {error}=await db.from("film_projects").update({production_stage:stage,updated_at:new Date().toISOString()}).eq("id",projectId).eq("creator_id",creatorId);if(error)throw error;},
  async remove(creatorId:string,projectId:string){const {error}=await db.from("film_projects").delete().eq("id",projectId).eq("creator_id",creatorId);if(error)throw error;},
};
