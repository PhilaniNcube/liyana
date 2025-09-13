import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SmsLogRecord } from "@/lib/queries/sms";

export interface UseSmsHistoryOptions {
  profileId: string;
  enabled?: boolean;
  initialData?: SmsLogRecord[];
}

export function useSmsHistory({ profileId, enabled = true, initialData }: UseSmsHistoryOptions) {
  return useQuery({
    queryKey: ["sms-history", profileId],
    queryFn: async (): Promise<SmsLogRecord[]> => {
      const response = await fetch(`/api/sms/history?profileId=${profileId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch SMS history");
      }
      
      const data = await response.json();
      return data.data || [];
    },
    enabled: enabled && !!profileId,
    initialData,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

export function useRefreshSmsHistory() {
  const queryClient = useQueryClient();
  
  return (profileId: string) => {
    queryClient.invalidateQueries({
      queryKey: ["sms-history", profileId],
    });
  };
}