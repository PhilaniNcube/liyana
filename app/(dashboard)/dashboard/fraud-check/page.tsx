"use client";

import { useState, useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react";
import { extractPdfFromZip, isBase64Zip } from "@/lib/utils/zip-extractor";
import {
  extractDateOfBirthFromSAID,
  extractGenderFromSAID,
  validateSAIDNumber,
} from "@/lib/utils/sa-id";

const fraudCheckSchema = z.object({
  idNumber: z
    .string()
    .min(6, "ID number must be at least 6 digits to extract date of birth")
    .max(13, "ID number must not exceed 13 digits"),
  forename: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  gender: z.enum(["M", "F"], { required_error: "Gender is required" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address1: z.string().min(1, "Address line 1 is required"),
  address2: z.string().optional(),
  address3: z.string().optional(),
  address4: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  homeTelCode: z.string().optional(),
  homeTelNo: z.string().optional(),
  workTelCode: z.string().optional(),
  workTelNo: z.string().optional(),
  cellTelNo: z.string().optional(),
});

type FraudCheckFormData = z.infer<typeof fraudCheckSchema>;

interface FraudCheckResult {
  status: "passed" | "failed" | "pending";
  data?: any;
  error?: string;
}

async function submitFraudCheck(
  prevState: any,
  formData: FraudCheckFormData
): Promise<FraudCheckResult> {
  try {
    const response = await fetch("/api/kyc/fraud-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to perform Credit Check");
    }

    return {
      status: data.pTransactionCompleted ? "passed" : "failed",
      data: data,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export default function FraudCheckPage() {
  const [result, setResult] = useState<FraudCheckResult | null>(null);
  const [state, formAction] = useActionState(submitFraudCheck, null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FraudCheckFormData>({
    resolver: zodResolver(fraudCheckSchema),
    defaultValues: {
      idNumber: "",
      forename: "",
      surname: "",
      gender: undefined,
      dateOfBirth: "",
      address1: "",
      address2: "",
      address3: "",
      address4: "",
      postalCode: "",
      homeTelCode: "",
      homeTelNo: "",
      workTelCode: "",
      workTelNo: "",
      cellTelNo: "",
    },
  });

  const idNumber = form.watch("idNumber");

  // Handle ID number changes and auto-fill date of birth from first 6 digits
  const handleIdNumberChange = (value: string) => {
    console.log("ID Number changed:", value, "Length:", value.length);

    // Extract date of birth from first 6 digits when we have at least 6 digits
    if (value.length >= 6) {
      console.log("Extracting date from first 6 digits...");

      // Extract and set date of birth
      const dateOfBirth = extractDateOfBirthFromSAID(value);
      console.log("Extracted date of birth:", dateOfBirth);
      if (dateOfBirth) {
        form.setValue("dateOfBirth", dateOfBirth);
        console.log("Date of birth set to:", dateOfBirth);
        toast.success("Date of birth extracted from ID number");
      }

      // Extract and set gender if we have at least 7 digits
      if (value.length >= 7) {
        const gender = extractGenderFromSAID(value);
        console.log("Extracted gender:", gender);
        if (gender) {
          form.setValue("gender", gender);
          console.log("Gender set to:", gender);
          toast.success("Gender extracted from ID number");
        }
      }
    } else {
      // Clear auto-filled values when ID has less than 6 digits
      if (form.getValues("dateOfBirth") || form.getValues("gender")) {
        console.log("Clearing auto-filled values for incomplete ID");
        form.setValue("dateOfBirth", "");
        form.resetField("gender");
      }
    }
  };

  const handleDownload = async (base64Data: string) => {
    if (!isBase64Zip(base64Data)) {
      toast.error("Invalid ZIP data format");
      return;
    }

    try {
      const success = await extractPdfFromZip(
        base64Data,
        `fraud-check-${new Date().toISOString().split("T")[0]}.pdf`
      );

      if (success) {
        toast.success("PDF extracted and downloaded successfully");
      } else {
        toast.error("Failed to extract PDF from ZIP data");
      }
    } catch (error) {
      toast.error("Error extracting PDF");
      console.error("PDF extraction error:", error);
    }
  };

  const onSubmit = async (data: FraudCheckFormData) => {
    setIsLoading(true);
    setResult(null);

    try {
      // Convert date of birth from YYYY-MM-DD to YYYYMMDD format for the API
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.replace(/-/g, "") : "",
      };

      console.log(
        "Submitting Credit Check with formatted date:",
        formattedData.dateOfBirth
      );

      const result = await submitFraudCheck(null, formattedData);
      setResult(result);

      if (result.status === "passed") {
        toast.success("Credit Check completed successfully");
      } else if (result.status === "failed") {
        toast.error(result.error || "Credit Check failed");
      }
    } catch (error) {
      toast.error("An error occurred during the Credit Check");
      setResult({
        status: "failed",
        error: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getResultIcon = () => {
    switch (result?.status) {
      case "passed":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "failed":
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      default:
        return <Shield className="h-6 w-6 text-blue-600" />;
    }
  };

  const getResultColor = () => {
    switch (result?.status) {
      case "passed":
        return "border-green-200 bg-green-50";
      case "failed":
        return "border-red-200 bg-red-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Credit Check</h1>
        <p className="text-muted-foreground">
          Perform on-demand Credit Checks using Experian
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Submit Credit Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Personal Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1234567890123"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e); // Update the form field
                              handleIdNumberChange(e.target.value); // Handle auto-fill logic
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            maxLength={13}
                            className={
                              field.value && field.value.length >= 6
                                ? "bg-green-50 border-green-200"
                                : ""
                            }
                          />
                        </FormControl>
                        {field.value && field.value.length >= 6 && (
                          <div className="space-y-1">
                            <p className="text-xs text-green-600">
                              ✓ Extracting data from ID number
                            </p>
                            <p className="text-xs text-blue-600">
                              Extracted DOB:{" "}
                              {extractDateOfBirthFromSAID(field.value)}
                              {field.value.length >= 7 && (
                                <>
                                  {" "}
                                  | Gender: {extractGenderFromSAID(field.value)}
                                </>
                              )}
                            </p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="forename"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={
                                  field.value
                                    ? "bg-green-50 border-green-200 w-full"
                                    : "w-full"
                                }
                              >
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">Male</SelectItem>
                              <SelectItem value="F">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          {field.value && (
                            <p className="text-xs text-green-600">
                              Auto-filled from ID number
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              readOnly
                              className={
                                field.value
                                  ? "bg-green-50 border-green-200 cursor-not-allowed"
                                  : "bg-gray-50 cursor-not-allowed"
                              }
                            />
                          </FormControl>
                          {field.value ? (
                            <p className="text-xs text-green-600">
                              Auto-filled from ID number
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">
                              Will be auto-filled when valid ID is entered
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Address Information</h3>

                  <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Apartment, suite, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Cape Town" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address4"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Western Cape" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="8001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Contact Information (Optional)
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="homeTelCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Tel Code</FormLabel>
                          <FormControl>
                            <Input placeholder="021" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="homeTelNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Tel Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="workTelCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Tel Code</FormLabel>
                          <FormControl>
                            <Input placeholder="021" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workTelNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Tel Number</FormLabel>
                          <FormControl>
                            <Input placeholder="7654321" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="cellTelNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cell Number</FormLabel>
                        <FormControl>
                          <Input placeholder="0821234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Submit Credit Check
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-8 text-muted-foreground">
                Submit a Credit Check to see results here
              </div>
            ) : (
              <div className={`p-4 rounded-lg border-2 ${getResultColor()}`}>
                <div className="flex items-center gap-2 mb-4">
                  {getResultIcon()}
                  <h3 className="text-lg font-semibold capitalize">
                    {result.status}
                  </h3>
                </div>

                {result.error && (
                  <div className="mb-4">
                    <p className="text-red-600 font-medium">Error:</p>
                    <p className="text-red-800">{result.error}</p>
                  </div>
                )}

                {result.data && (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Transaction Completed:</p>
                      <p
                        className={
                          result.data.pTransactionCompleted
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {result.data.pTransactionCompleted ? "Yes" : "No"}
                      </p>
                    </div>

                    {result.data.pRetData && (
                      <div>
                        <p className="font-medium">Response Data:</p>
                        <div className="space-y-2">
                          <div className="bg-gray-100 p-2 rounded text-xs font-mono max-h-40 overflow-y-auto">
                            Base64 encoded data available for
                            download/processing
                          </div>
                          <Button
                            onClick={() => handleDownload(result.data.pRetData)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Extract and Download PDF
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
