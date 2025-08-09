"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Banknote, Shield } from "lucide-react";

export interface WhoYouBankVerificationResultsProps {
  data:
    | {
        code: number;
        detail?: {
          isWhoYouCache?: boolean;
          accountVerificationInformation?: Array<{
            id: string;
            idNumber: string;
            reference?: string;
            isNameValid?: boolean;
            supplierCode?: number;
            accountStatus?: string;
            canAcceptDebit?: boolean;
            canAcceptCredit?: boolean;
            isIdNumberValid?: boolean;
            isInitialsValid?: boolean;
            isAccountTypeValid?: boolean;
            isAccountNumberValid?: boolean;
            isOpenAtLeast3Months?: boolean;
          }>;
        };
      }
    | null
    | undefined;
}

function BoolPill({ value }: { value: boolean | undefined }) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">
        <CheckCircle2 className="h-3 w-3" /> Yes
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs">
        <XCircle className="h-3 w-3" /> No
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs">—</span>;
}

export function WhoYouBankVerificationResults({
  data,
}: WhoYouBankVerificationResultsProps) {
  if (!data?.detail) return null;
  const info = data.detail.accountVerificationInformation ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" /> WHOYou Bank Verification
          {typeof data.code === "number" && (
            <Badge
              variant={data.code === 0 ? "default" : "destructive"}
              className="ml-2"
            >
              Code: {data.code}
            </Badge>
          )}
          {data.detail.isWhoYouCache && (
            <Badge variant="outline" className="ml-2 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Cache
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {info.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No verification records.
          </div>
        ) : (
          <div className="space-y-4">
            {info.map((it) => (
              <div key={it.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      ID Number
                    </div>
                    <div className="font-medium">{it.idNumber}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Reference
                    </div>
                    <div className="font-medium">{it.reference || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Account Status
                    </div>
                    <div className="font-medium">{it.accountStatus || "—"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Name Valid
                    </div>
                    <BoolPill value={it.isNameValid} />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      ID Number Valid
                    </div>
                    <BoolPill value={it.isIdNumberValid} />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Initials Valid
                    </div>
                    <BoolPill value={it.isInitialsValid} />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Account Type Valid
                    </div>
                    <BoolPill value={it.isAccountTypeValid} />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Account Number Valid
                    </div>
                    <BoolPill value={it.isAccountNumberValid} />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Open ≥ 3 Months
                    </div>
                    <BoolPill value={it.isOpenAtLeast3Months} />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Can Accept Debit
                    </div>
                    <BoolPill value={it.canAcceptDebit} />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Can Accept Credit
                    </div>
                    <BoolPill value={it.canAcceptCredit} />
                  </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  Supplier Code: {it.supplierCode ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WhoYouBankVerificationResults;
