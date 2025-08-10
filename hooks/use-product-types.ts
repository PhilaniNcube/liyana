import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

export type ProductType = { id: number; name: string };

export function useProductTypes() {
  const [data, setData] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    (async () => {
      try {
        const { data, error } = await supabase
          .from("product_types")
          .select("id, name")
          .order("name", { ascending: true });
        if (!mounted) return;
        if (error) {
          setError(error.message);
        } else {
          setData(data ?? []);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
