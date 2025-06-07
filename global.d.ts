import type { Database as DatabaseType } from "@/lib/types";

declare global {
  type Database = DatabaseType;
}

export {};
