"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CreditCard,
  Loader2,
  User,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  UserSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Validation schema
const creditScoreSchema = z.object({
  idNumber: z.string().min(1, "ID Number is required"),
  profileId: z.string().optional(),
});

type CreditScoreFormData = z.infer<typeof creditScoreSchema>;

interface CreditScoreResponse {
  success: boolean;
  score?: number;
  band?: string;
  factors?: string[];
  timestamp?: string;
  checkId?: number;
  profileId?: string | null;
  error?: string;
  message?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  created_at: string;
}

const GetCreditScore = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreditScoreResponse | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<CreditScoreFormData>({
    resolver: zodResolver(creditScoreSchema),
    defaultValues: {
      idNumber: "",
      profileId: "",
    },
  });

  // Actual search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUserProfiles([]);
      setSearchingUsers(false);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}&limit=20`
      );
      const data = await response.json();

      console.log("API Response:", data);
      console.log("Response status:", response.status);
      console.log("Profiles received:", data.profiles);

      if (data.success) {
        setUserProfiles(data.profiles);
        console.log("Set user profiles:", data.profiles);
      } else {
        console.error("Failed to search users:", data.error);
        setUserProfiles([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setUserProfiles([]);
    } finally {
      setSearchingUsers(false);
    }
  }, []);

  // Debounced search function
  const searchUsers = useCallback(
    (searchQuery: string) => {
      setSearchQuery(searchQuery);

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // If empty query, clear results immediately
      if (!searchQuery.trim()) {
        setUserProfiles([]);
        setSearchingUsers(false);
        return;
      }

      // Set searching state immediately for better UX
      setSearchingUsers(true);

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300); // 300ms debounce
    },
    [performSearch]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Debug: Track userProfiles changes
  useEffect(() => {
    console.log("userProfiles state changed:", userProfiles);
  }, [userProfiles]);

  // Handle user selection
  const handleUserSelect = useCallback(
    (user: UserProfile) => {
      setSelectedUser(user);
      form.setValue("profileId", user.id);

      setUserSearchOpen(false);
      toast.success(`Selected user: ${user.full_name}`);
    },
    [form]
  );

  // Clear user selection
  const clearUserSelection = useCallback(() => {
    setSelectedUser(null);
    form.setValue("profileId", "");
    toast.info("User selection cleared");
  }, [form]);

  const handleSubmit = async (data: CreditScoreFormData) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/credit-score/adhoc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      setResult(responseData);

      if (responseData.success) {
        toast.success("Credit score query completed successfully");
      } else {
        toast.error(responseData.message || "Credit score query failed");
      }
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setResult({
        success: false,
        error,
        message: error,
      });
      toast.error("Failed to perform credit score check");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setResult(null);
    setSelectedUser(null);
    setUserProfiles([]);
    toast.info("Form reset");
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return "text-green-600";
    if (score >= 700) return "text-green-500";
    if (score >= 650) return "text-yellow-600";
    if (score >= 600) return "text-orange-600";
    return "text-red-600";
  };

  const getBandColor = (band: string) => {
    switch (band) {
      case "Excellent":
        return "bg-green-100 text-green-800";
      case "Good":
        return "bg-green-50 text-green-700";
      case "Fair":
        return "bg-yellow-100 text-yellow-800";
      case "Poor":
        return "bg-orange-100 text-orange-800";
      case "Very Poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Adhoc Credit Score Query
        </h1>
        <p className="text-gray-600">
          Perform credit score checks using Experian for administrative
          purposes. Only an ID number is required. Optionally select a customer
          profile to associate the check.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Credit Score Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                {/* User Search */}
                <div className="space-y-2">
                  <Label>Search Customer (Optional)</Label>
                  <Popover
                    open={userSearchOpen}
                    onOpenChange={setUserSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedUser ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="truncate">
                              {selectedUser.full_name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <UserSearch className="h-4 w-4" />
                            <span>Search for a customer by name...</span>
                          </div>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search by name..."
                          onValueChange={searchUsers}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {searchingUsers
                              ? "Searching..."
                              : "No customers found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {userProfiles.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.full_name}
                                onSelect={() => handleUserSelect(user)}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">
                                      {user.full_name}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.email}
                                    {user.phone_number &&
                                      ` • ${user.phone_number}`}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {selectedUser && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Selected: {selectedUser.full_name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearUserSelection}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {/* ID Number Input */}
                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Number *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter South African ID Number"
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Querying Credit Score...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Get Credit Score
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Credit Score Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-muted-foreground">
                    Performing credit score check...
                  </p>
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">
                  Enter ID number and click "Get Credit Score" to begin
                </p>
              </div>
            )}

            {result && !result.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Credit Score Check Failed</AlertTitle>
                <AlertDescription>
                  {result.message ||
                    result.error ||
                    "An error occurred during the credit score check"}
                </AlertDescription>
              </Alert>
            )}

            {result && result.success && result.score !== undefined && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Credit Score Retrieved Successfully</AlertTitle>
                  <AlertDescription>
                    The credit score check has been completed and saved to the
                    database.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">
                      Credit Score
                    </Label>
                    <div
                      className={cn(
                        "text-3xl font-bold",
                        getScoreColor(result.score)
                      )}
                    >
                      {result.score}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">
                      Credit Band
                    </Label>
                    <div className="mt-1">
                      <Badge className={getBandColor(result.band || "Unknown")}>
                        {result.band || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {result.factors && result.factors.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">
                      Key Factors
                    </Label>
                    <ul className="space-y-1">
                      {result.factors.map((factor, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 flex items-start gap-2"
                        >
                          <span className="text-gray-400">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <Label className="font-medium">Timestamp</Label>
                    <p>
                      {result.timestamp
                        ? new Date(result.timestamp).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Check ID</Label>
                    <p>{result.checkId || "N/A"}</p>
                  </div>
                </div>

                {selectedUser && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Label className="text-sm font-medium text-blue-800">
                      Associated Customer
                    </Label>
                    <p className="text-sm text-blue-700">
                      {selectedUser.full_name}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GetCreditScore;
