import { useQuery } from "@tanstack/react-query";
import { membershipService } from "@/services/membership/membershipService";

export function useMembershipAdjustment() {
  return useQuery({
    queryKey: ["creator-membership-adjustment"],
    queryFn: () => membershipService.getAdjustment(),
  });
}
