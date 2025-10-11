"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Search } from "lucide-react";
import { SendToMaxMoneyDialog } from "./send-to-maxmoney-dialog";
import { MaxMoneySearchDialog } from "./maxmoney-search-dialog";

interface LoanMaxMoneySectionProps {
  loan: {
    id: number;
    profile_id: string;
    approved_loan_amount: number | null;
    loan_term_days: number;
    application?: {
      max_money_id?: string | null;
      id_number?: string;
    } | null;
  };
}

export function LoanMaxMoneySection({ loan }: LoanMaxMoneySectionProps) {
  const [maxMoneyClientNumber, setMaxMoneyClientNumber] = useState<string>(
    loan.application?.max_money_id || ""
  );

  const handleClientFound = (clientData: any) => {
    if (clientData.client_no) {
      setMaxMoneyClientNumber(clientData.client_no);
    }
  };

  return (
    <div className="pt-4 border-t">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">MaxMoney Integration</h3>
          <p className="text-sm text-muted-foreground">
            Search for the client and send this loan application to MaxMoney system
          </p>
          {maxMoneyClientNumber && (
            <p className="text-xs text-green-600 mt-1">
              MaxMoney Client ID: {maxMoneyClientNumber}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Search MaxMoney Client */}
          <MaxMoneySearchDialog
            idNumber={loan.application?.id_number}
            currentMaxMoneyId={loan.application?.max_money_id}
            onClientFound={handleClientFound}
          >
            <Button variant="outline" disabled={!loan.application?.id_number}>
              <Search className="h-4 w-4 mr-2" />
              Search Client
            </Button>
          </MaxMoneySearchDialog>

          {/* Send to MaxMoney */}
          <SendToMaxMoneyDialog
            loan={{
              id: loan.id,
              profile_id: loan.profile_id,
              loan_amount: loan.approved_loan_amount || 0,
              term: loan.loan_term_days || 30,
              max_money_id: loan.application?.max_money_id
            }}
            maxMoneyClientNumber={maxMoneyClientNumber}
            onSuccess={() => window.location.reload()}
          >
            <Button disabled={!maxMoneyClientNumber}>
              <SendHorizonal className="h-4 w-4 mr-2" />
              Send to MaxMoney
            </Button>
          </SendToMaxMoneyDialog>
        </div>

        {!loan.application?.id_number && (
          <p className="text-xs text-orange-600">
            No ID number available from the original application. Cannot search MaxMoney.
          </p>
        )}
      </div>
    </div>
  );
}