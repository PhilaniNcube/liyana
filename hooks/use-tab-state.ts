'use client';

import { useQueryState, parseAsStringEnum } from 'nuqs';

// Define the valid tab values
const TAB_VALUES = [
  'personal',
  'policy', 
  'employment',
  'beneficiaries',
  'claims',
  'payments',
  'documents',
  'email',
  'sms',
];

type TabValue = string;

/**
 * Custom hook to manage tab state with URL synchronization using nuqs
 * @param defaultTab - The default tab to show when no URL parameter is present
 * @returns An array containing the current tab value and a setter function
 */
export function useTabState(defaultTab: TabValue = 'personal') {
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringEnum(TAB_VALUES).withDefault(defaultTab)
  );

  return [tab, setTab] as const;
}

export type { TabValue };
export { TAB_VALUES };