import { useQuery } from "@tanstack/react-query";
import { publicCreatorService } from "@/services/creator/publicCreatorService";

export function usePublicCreator(username: string) {
  return useQuery({
    queryKey: ["public-creator", username.toLowerCase()],
    queryFn: () => publicCreatorService.fetch(username),
  });
}
