import { useQuery } from "@tanstack/react-query";
import { membershipService } from "@/services/membership/membershipService";

export function useMembership(enabled = true) {
  return useQuery({
    queryKey: ["creator-membership"],
    queryFn: () => membershipService.getMine(),
    enabled,
  });
}
