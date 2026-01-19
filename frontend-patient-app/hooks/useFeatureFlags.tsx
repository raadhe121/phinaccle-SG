import { getFeatureFlagsApiUserfeatureFlagsGet } from "@/services/client";
import { useQuery } from "@tanstack/react-query";

export const useFeatureFlags = () => {
  const { data } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: getFeatureFlagsApiUserfeatureFlagsGet
  })
  return data?.flags ?? [];
}
