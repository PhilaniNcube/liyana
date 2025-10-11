import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Search, CheckCircle, XCircle } from "lucide-react";

interface MaxMoneySearchDialogProps {
  idNumber?: string;
  currentMaxMoneyId?: string | null;
  children: React.ReactNode;
  onClientFound?: (clientData: any) => void;
}

export function MaxMoneySearchDialog({
  idNumber,
  currentMaxMoneyId,
  children,
  onClientFound,
}: MaxMoneySearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!idNumber) {
      toast.error("ID number is required to search MaxMoney");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const response = await fetch("/api/max_money/search_client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_number: idNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to search MaxMoney client");
      }

      setSearchResult(result);
      
      if (result.return_code === 0 && result.client_no) {
        toast.success("Client found in MaxMoney");
        onClientFound?.(result);
      } else {
        toast.info("Client not found in MaxMoney");
      }
    } catch (error) {
      console.error("Error searching MaxMoney:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search MaxMoney Client
          </DialogTitle>
          <DialogDescription>
            Search for the client in MaxMoney system using ID number: {idNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          {currentMaxMoneyId && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    Current MaxMoney ID: {currentMaxMoneyId}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !idNumber}
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Client
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Search Failed</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {searchResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Search className="h-4 w-4" />
                  MaxMoney Search Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {searchResult.return_code === 0 && searchResult.client_no ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Client Found
                      </Badge>
                      {currentMaxMoneyId && currentMaxMoneyId !== searchResult.client_no && (
                        <Badge className="bg-orange-100 text-orange-800">
                          Different ID
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Client Number</p>
                        <p className="text-muted-foreground">{searchResult.client_no}</p>
                      </div>
                      <div>
                        <p className="font-medium">Full Name</p>
                        <p className="text-muted-foreground">
                          {searchResult.client_data?.full_name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">ID Number</p>
                        <p className="text-muted-foreground">
                          {searchResult.client_data?.id_number || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Status</p>
                        <p className="text-muted-foreground">
                          {searchResult.client_data?.status || "N/A"}
                        </p>
                      </div>
                    </div>

                    {searchResult.client_data?.phone_number && (
                      <div className="text-sm">
                        <p className="font-medium">Phone Number</p>
                        <p className="text-muted-foreground">
                          {searchResult.client_data.phone_number}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-700">
                    <XCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Client Not Found</p>
                      <p className="text-sm text-orange-600">
                        {searchResult.return_reason || "No client found with the provided ID number"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}