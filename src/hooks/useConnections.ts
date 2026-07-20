import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectionService, type ConnectionInput, type ListenerConnection } from "@/services/connections/connectionService";

export function useMyConnections(creatorId?: string) {
  return useQuery({ queryKey: ["listener-connections", creatorId], queryFn: () => connectionService.listMine(creatorId!), enabled: !!creatorId, refetchInterval: 30_000 });
}

export function useSubmitConnection(slug: string) {
  return useMutation({ mutationFn: (input: ConnectionInput) => connectionService.submit(slug, input) });
}

export function useUpdateConnection(creatorId?: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: ListenerConnection["status"] }) => connectionService.updateStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["listener-connections", creatorId] }) });
}
