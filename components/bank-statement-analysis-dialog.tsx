"use client";

import { useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sparkles, Loader2, FileText } from "lucide-react";
import { createClient } from "@/lib/client";
import { toast } from "sonner";
import type { Database } from "@/lib/types";


type Document = Database["public"]["Tables"]["documents"]["Row"];

interface BankStatementAnalysisDialogProps {
  document: Document;
}

export function BankStatementAnalysisDialog({
  document,
}: BankStatementAnalysisDialogProps) {

  const [isOpen, setIsOpen] = useState(false);
  const { messages, status, stop, error, sendMessage, clearError, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/google/bank-statement",
    }),
    onError: (error) => {
      toast.error(error.message || "Failed to analyze bank statement");
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && isLoading) {
      stop();
    }
  };

  const handleAnalyze = async () => {
    try {
      const supabase = createClient();

      // 1. Download the file from Supabase
      console.log("Downloading file from Supabase...", document.storage_path);
      const { data, error } = await supabase.storage
        .from("documents")
        .download(document.storage_path);

      if (error) throw error;
      if (!data) throw new Error("No data received");
      console.log("File downloaded successfully, size:", data.size);

      // 2. Convert to base64
      const buffer = await data.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = data.type;

      // 3. Send to API via useChat with file attachment
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      sendMessage({
        role: "user",
        parts: [
          {
            type: "text",
            text: "Please analyze this bank statement.",
          },
          {
            type: "file",
            url: dataUrl,
            mediaType: mimeType,
          },
        ],
      });

    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze bank statement";
      toast.error(errorMessage);
    }
  };

  // Get the assistant message content to display
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const analysis = assistantMessages.length > 0 
    ? assistantMessages.map(m => 
        m.parts
          .filter(p => p.type === 'text')
          .map(p => p.text)
          .join('')
      ).join('\n') 
    : "";  

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span className="sr-only">Analyze</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bank Statement Analysis
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of your bank statement to identify income, expenses, and spending patterns.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              <p className="font-medium">Analysis Failed</p>
              <p>{error.message}</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    clearError();
                    regenerate();
                  }}
                  className="border-red-200 hover:bg-red-100 text-red-700"
                >
                  Try Again
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearError}
                  className="text-red-700"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {!analysis && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="p-4 bg-purple-50 rounded-full">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Ready to Analyze</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Click the button below to start the AI analysis of this bank statement. 
                  This process may take a few moments.
                </p>
              </div>
              <Button onClick={handleAnalyze} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Start Analysis
              </Button>
            </div>
          )}

          {isLoading && !analysis && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-sm text-muted-foreground">
                Analyzing document...
              </p>
              <Button variant="outline" size="sm" onClick={stop}>
                Stop Analysis
              </Button>
            </div>
          )}

          {analysis && (
            <div className="flex flex-col flex-1 gap-2 overflow-hidden min-h-0">
                <ScrollArea className="flex-1 min-h-0 border rounded-md bg-muted/50">
                  <div className="p-4 prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {analysis}
                  </div>
                </ScrollArea>
                {isLoading && (
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Generating analysis...</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={stop} className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                            Stop
                        </Button>
                    </div>
                )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
