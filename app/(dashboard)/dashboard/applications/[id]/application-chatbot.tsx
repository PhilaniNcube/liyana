"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Paperclip, Minimize2, FileText, Loader2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { Database } from "@/lib/types";
import { DefaultChatTransport } from "ai";
import { createClient } from "@/lib/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";





interface ApplicationChatbotProps {
  documents: Database["public"]["Tables"]["documents"]["Row"][];
  applicationId: number;
}

interface Attachment {
  name: string;
  contentType: string;
  path: string;
}

export function ApplicationChatbot({
  documents,
  applicationId,
}: ApplicationChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<Attachment[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const [input, setInput] = useState("");
  
  // Use `append` instead of `sendMessage` for better compatibility with Vercel AI SDK
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat/${applicationId}`,
    }),
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = async (doc: Database["public"]["Tables"]["documents"]["Row"]) => {
      // Handle both application documents (storage_path) and profile documents (file_path)
      const path = doc.storage_path || (doc as any).file_path;
      
      console.log("Selecting file:", { doc, path });

      if (!path) {
        console.error("Document path is missing");
        return;
      }

      setSelectedFiles(prev => [...prev, {
        name: doc.storage_path?.split('/').pop() || (doc as any).file_path?.split('/').pop() || 'document',
        contentType: doc.document_type === 'payslip' ? 'application/pdf' : 'application/octet-stream', // heuristic for now, ideal if stored
        path: path
      }]);
  };

  const fileToDataURL = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fetchFileAsDataURL = async (storagePath: string): Promise<string | null> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from('documents')
        .download(storagePath);

      if (error || !data) {
        console.error("Failed to download file from Supabase:", error);
        return null;
      }

      // Convert blob to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });
    } catch (error) {
      console.error("Error fetching file:", error);
      return null;
    }
  };

  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setIsLoadingFile(true);
        const file = e.target.files[0];
        try {
            const dataUrl = await fileToDataURL(file);
            setSelectedFiles(prev => [...prev, {
                name: file.name,
                contentType: file.type,
                path: dataUrl
            }]);
        } catch (error) {
            console.error("Error reading file:", error);
        } finally {
            setIsLoadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset input
            }
        }
    }
  };


  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0) return;

    const messageParts: any[] = [];

    // Process attachments first (similar to example where file comes before text)
    for (const file of selectedFiles) {
        if (file.path.startsWith('data:')) {
             // It's a local file or already converted to Data URL
             messageParts.push({
                type: 'file' as const,
                mediaType: file.contentType,
                url: file.path
            });
        } else {
            // It's a server-side document - fetch the actual file content
            console.log("Fetching file from Supabase:", file.path);
            const dataUrl = await fetchFileAsDataURL(file.path);
            
            if (dataUrl) {
                messageParts.push({
                    type: 'file' as const,
                    mediaType: file.contentType,
                    url: dataUrl
                });
            } else {
                console.error("Failed to fetch file, skipping:", file.path);
            }
        }
    }

    // Add text part at the end
    if (input.trim()) {
        messageParts.push({
            type: 'text' as const,
            text: input
        });
    }

    await sendMessage({
       role: 'user',
       parts: messageParts,
    });

    setInput("");
    setSelectedFiles([]);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0 hover:scale-105 transition-transform"
        size="icon"
      >
        <MessageCircle className="h-8 w-8" />
        <span className="sr-only">Open Chatbot</span>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl z-50 flex flex-col border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <CardHeader className="p-4 border-b bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return <span key={i} className="whitespace-pre-wrap">{part.text}</span>;
                      case 'file':
                        return (
                          <div key={i} className="flex items-center gap-1 italic opacity-80 mt-1">
                            <FileText className="h-3 w-3" />
                            <span>File attached</span>
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t bg-background flex flex-col gap-2">
        {selectedFiles.length > 0 && (
            <div className="flex w-full flex-wrap gap-2">
                {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                        <span className="truncate max-w-[100px]">{file.name}</span>
                        <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-center gap-2"
        >
           <Input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleLocalFileSelect}
                // accept=".pdf,.png,.jpg,.jpeg,.txt" // Optional: restrict types if needed
           />
           <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon" disabled={isLoadingFile}>
                    {isLoadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        className="w-full justify-start h-8 text-xs font-semibold"
                        onClick={() => fileInputRef.current?.click()}
                    >
                         <FileText className="mr-2 h-3 w-3" />
                         Upload from computer
                    </Button>
                    <div className="h-px bg-border my-1" />
                    <p className="text-xs text-muted-foreground px-2 pb-2">Attach from application:</p>
                    {documents.length === 0 && <p className="text-xs px-2">No documents available.</p>}
                    {documents.map((doc) => (
                        <Button
                            key={doc.id}
                            variant="ghost"
                            className="w-full justify-start h-8 text-xs truncate capitalize"
                            onClick={() => handleFileSelect(doc)}
                        >
                            <FileText className="mr-2 h-3 w-3" />
                            {doc.document_type}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
           </Popover>

           <Input
            value={input}
            onChange={event => {
            setInput(event.target.value);
            }}
             placeholder="Type a message..."
             className="flex-1"
        />
          <Button type="submit" size="icon" disabled={(!input.trim() && selectedFiles.length === 0)}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
