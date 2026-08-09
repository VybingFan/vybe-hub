import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videoService } from "@/services/video/videoService";
import type { CreateVideoInput } from "@/features/video/schema";
const refresh = (qc:ReturnType<typeof useQueryClient>, creatorId?:string) => qc.invalidateQueries({ queryKey:["creator-videos",creatorId] });
export function useMyVideos(creatorId?:string){return useQuery({queryKey:["creator-videos",creatorId],queryFn:()=>videoService.listMine(creatorId!),enabled:!!creatorId});}
export function useCreateVideo(creatorId?:string){const qc=useQueryClient();return useMutation({mutationFn:(input:CreateVideoInput)=>videoService.create(creatorId!,input),onSuccess:()=>refresh(qc,creatorId)});}
export function useCreateNativeVideo(creatorId?:string){const qc=useQueryClient();return useMutation({mutationFn:(input:Parameters<typeof videoService.createNative>[1])=>videoService.createNative(creatorId!,input),onSuccess:()=>refresh(qc,creatorId)});}
export function useUpdateVideo(creatorId?:string){const qc=useQueryClient();return useMutation({mutationFn:({id,input,thumbnail}:{id:string;input:Parameters<typeof videoService.update>[2];thumbnail?:File|null})=>videoService.update(id,creatorId!,input,thumbnail),onSuccess:()=>refresh(qc,creatorId)});}
export function useSetVideoPublished(creatorId?:string){const qc=useQueryClient();return useMutation({mutationFn:({id,published}:{id:string;published:boolean})=>videoService.setPublished(id,published),onSuccess:()=>refresh(qc,creatorId)});}
export function useDeleteVideo(creatorId?:string){const qc=useQueryClient();return useMutation({mutationFn:videoService.remove,onSuccess:()=>refresh(qc,creatorId)});}
export function usePublicVideo(id:string){return useQuery({queryKey:["public-video",id],queryFn:()=>videoService.getPublic(id)});}
export function usePublishedVideos(creatorId?:string){return useQuery({queryKey:["published-videos",creatorId||"all"],queryFn:()=>videoService.listPublished(creatorId)});}
