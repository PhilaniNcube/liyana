import { getApiChecks } from "@/lib/queries";
import { cn, getApiCheckStatusColor, getApiCheckStatusIcon } from "@/lib/utils";
import { ApiCheck } from "@/lib/schemas";
import { formatDate } from "date-fns";
import ExtractZip from "./_components/extract-zip";
import { Badge } from "lucide-react";

const APIChecks = async () => {
  const apiChecks = await getApiChecks();

  return (
    <div>
      {/* API Check History */}
      <h1 className="text-2xl font-bold mb-4">API Check History</h1>
      <ul className="space-y-4">
        {apiChecks.map((check) => (
          <li key={check.id} className="p-4 border rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {check.check_type === "fraud_check"
                    ? "Credit Report"
                    : check.check_type === "credit_bureau"
                      ? "Credit Score"
                      : "API Check"}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatDate(check.checked_at, "PPpp")}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {check.check_type === "fraud_check" ? (
                  <ExtractZip check={check as ApiCheck} />
                ) : (
                  <Badge
                    className={cn(
                      "px-3 py-1 rounded-full text-xs",
                      getApiCheckStatusColor(check.status)
                    )}
                  >
                    {getApiCheckStatusIcon(check.status)} {check.status}
                  </Badge>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default APIChecks;
