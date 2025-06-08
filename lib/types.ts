export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      api_checks: {
        Row: {
          application_id: number;
          check_type: Database["public"]["Enums"]["api_check_type"];
          checked_at: string;
          id: number;
          response_payload: Json;
          status: Database["public"]["Enums"]["api_check_status"];
          vendor: Database["public"]["Enums"]["api_vendor"];
        };
        Insert: {
          application_id: number;
          check_type: Database["public"]["Enums"]["api_check_type"];
          checked_at?: string;
          id?: number;
          response_payload: Json;
          status: Database["public"]["Enums"]["api_check_status"];
          vendor: Database["public"]["Enums"]["api_vendor"];
        };
        Update: {
          application_id?: number;
          check_type?: Database["public"]["Enums"]["api_check_type"];
          checked_at?: string;
          id?: number;
          response_payload?: Json;
          status?: Database["public"]["Enums"]["api_check_status"];
          vendor?: Database["public"]["Enums"]["api_vendor"];
        };
        Relationships: [
          {
            foreignKeyName: "api_checks_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          }
        ];
      };
      applications: {
        Row: {
          application_amount: number | null;
          city: string | null;
          created_at: string;
          date_of_birth: string | null;
          decline_reason: Json | null;
          employer_address: string | null;
          employer_contact_number: string | null;
          employer_name: string | null;
          employment_type:
            | Database["public"]["Enums"]["employment_type"]
            | null;
          home_address: string | null;
          id: number;
          id_number: string;
          job_title: string | null;
          loan_purpose: string | null;
          monthly_income: number | null;
          next_of_kin_email: string | null;
          next_of_kin_name: string | null;
          next_of_kin_phone_number: string | null;
          status: Database["public"]["Enums"]["application_status"];
          term: number;
          updated_at: string;
          user_id: string;
          work_experience: string | null;
        };
        Insert: {
          application_amount?: number | null;
          city?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          decline_reason?: Json | null;
          employer_address?: string | null;
          employer_contact_number?: string | null;
          employer_name?: string | null;
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null;
          home_address?: string | null;
          id?: number;
          id_number: string;
          job_title?: string | null;
          loan_purpose?: string | null;
          monthly_income?: number | null;
          next_of_kin_email?: string | null;
          next_of_kin_name?: string | null;
          next_of_kin_phone_number?: string | null;
          status: Database["public"]["Enums"]["application_status"];
          term: number;
          updated_at?: string;
          user_id: string;
          work_experience?: string | null;
        };
        Update: {
          application_amount?: number | null;
          city?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          decline_reason?: Json | null;
          employer_address?: string | null;
          employer_contact_number?: string | null;
          employer_name?: string | null;
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null;
          home_address?: string | null;
          id?: number;
          id_number?: string;
          job_title?: string | null;
          loan_purpose?: string | null;
          monthly_income?: number | null;
          next_of_kin_email?: string | null;
          next_of_kin_name?: string | null;
          next_of_kin_phone_number?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          term?: number;
          updated_at?: string;
          user_id?: string;
          work_experience?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          application_id: number;
          document_type: Database["public"]["Enums"]["document_type"];
          id: number;
          storage_path: string;
          uploaded_at: string;
          user_id: string;
        };
        Insert: {
          application_id: number;
          document_type: Database["public"]["Enums"]["document_type"];
          id?: number;
          storage_path: string;
          uploaded_at?: string;
          user_id: string;
        };
        Update: {
          application_id?: number;
          document_type?: Database["public"]["Enums"]["document_type"];
          id?: number;
          storage_path?: string;
          uploaded_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      handle_new_user_signup: {
        Args: { user_id: string; user_full_name: string };
        Returns: undefined;
      };
    };
    Enums: {
      api_check_status: "passed" | "failed" | "pending";
      api_check_type:
        | "credit_bureau"
        | "fraud_check"
        | "bank_verification"
        | "dha_otv_facial";
      api_vendor: "Experian" | "WhoYou" | "ThisIsMe";
      application_status:
        | "pre_qualifier"
        | "pending_documents"
        | "in_review"
        | "approved"
        | "declined";
      document_type: "id" | "bank_statement" | "payslip" | "proof_of_residence";
      employment_type:
        | "employed"
        | "self_employed"
        | "contract"
        | "unemployed"
        | "retired";
      user_role: "customer" | "admin" | "editor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      api_check_status: ["passed", "failed", "pending"],
      api_check_type: [
        "credit_bureau",
        "fraud_check",
        "bank_verification",
        "dha_otv_facial",
      ],
      api_vendor: ["Experian", "WhoYou", "ThisIsMe"],
      application_status: [
        "pre_qualifier",
        "pending_documents",
        "in_review",
        "approved",
        "declined",
      ],
      document_type: ["id", "bank_statement", "payslip", "proof_of_residence"],
      employment_type: [
        "employed",
        "self_employed",
        "contract",
        "unemployed",
        "retired",
      ],
      user_role: ["customer", "admin", "editor"],
    },
  },
} as const;
