export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
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
          check_type: Database["public"]["Enums"]["api_check_type"];
          checked_at: string;
          id: number;
          id_number: string;
          response_payload: Json;
          status: Database["public"]["Enums"]["api_check_status"];
          vendor: Database["public"]["Enums"]["api_vendor"];
        };
        Insert: {
          check_type: Database["public"]["Enums"]["api_check_type"];
          checked_at?: string;
          id?: number;
          id_number: string;
          response_payload: Json;
          status: Database["public"]["Enums"]["api_check_status"];
          vendor: Database["public"]["Enums"]["api_vendor"];
        };
        Update: {
          check_type?: Database["public"]["Enums"]["api_check_type"];
          checked_at?: string;
          id?: number;
          id_number?: string;
          response_payload?: Json;
          status?: Database["public"]["Enums"]["api_check_status"];
          vendor?: Database["public"]["Enums"]["api_vendor"];
        };
        Relationships: [];
      };
      applications: {
        Row: {
          affordability: Json | null;
          application_amount: number | null;
          bank_account_holder: string | null;
          bank_account_number: string | null;
          bank_account_type:
            | Database["public"]["Enums"]["bank_account_type"]
            | null;
          bank_name: string | null;
          branch_code: string | null;
          city: string | null;
          created_at: string;
          date_of_birth: string | null;
          decline_reason: Json | null;
          dependants: number | null;
          employer_address: string | null;
          employer_contact_number: string | null;
          employer_name: string | null;
          employment_end_date: string | null;
          employment_type:
            | Database["public"]["Enums"]["employment_type"]
            | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          gender_other: string | null;
          home_address: string | null;
          id: number;
          id_number: string;
          job_title: string | null;
          language: string | null;
          loan_purpose: string | null;
          loan_purpose_reason: string | null;
          marital_status: Database["public"]["Enums"]["marital_status"] | null;
          monthly_income: number | null;
          nationality: string | null;
          next_of_kin_email: string | null;
          next_of_kin_name: string | null;
          next_of_kin_phone_number: string | null;
          phone_number: string | null;
          postal_code: string | null;
          status: Database["public"]["Enums"]["application_status"];
          term: number;
          updated_at: string;
          user_id: string;
          work_experience: string | null;
        };
        Insert: {
          affordability?: Json | null;
          application_amount?: number | null;
          bank_account_holder?: string | null;
          bank_account_number?: string | null;
          bank_account_type?:
            | Database["public"]["Enums"]["bank_account_type"]
            | null;
          bank_name?: string | null;
          branch_code?: string | null;
          city?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          decline_reason?: Json | null;
          dependants?: number | null;
          employer_address?: string | null;
          employer_contact_number?: string | null;
          employer_name?: string | null;
          employment_end_date?: string | null;
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          gender_other?: string | null;
          home_address?: string | null;
          id?: number;
          id_number: string;
          job_title?: string | null;
          language?: string | null;
          loan_purpose?: string | null;
          loan_purpose_reason?: string | null;
          marital_status?: Database["public"]["Enums"]["marital_status"] | null;
          monthly_income?: number | null;
          nationality?: string | null;
          next_of_kin_email?: string | null;
          next_of_kin_name?: string | null;
          next_of_kin_phone_number?: string | null;
          phone_number?: string | null;
          postal_code?: string | null;
          status: Database["public"]["Enums"]["application_status"];
          term: number;
          updated_at?: string;
          user_id: string;
          work_experience?: string | null;
        };
        Update: {
          affordability?: Json | null;
          application_amount?: number | null;
          bank_account_holder?: string | null;
          bank_account_number?: string | null;
          bank_account_type?:
            | Database["public"]["Enums"]["bank_account_type"]
            | null;
          bank_name?: string | null;
          branch_code?: string | null;
          city?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          decline_reason?: Json | null;
          dependants?: number | null;
          employer_address?: string | null;
          employer_contact_number?: string | null;
          employer_name?: string | null;
          employment_end_date?: string | null;
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          gender_other?: string | null;
          home_address?: string | null;
          id?: number;
          id_number?: string;
          job_title?: string | null;
          language?: string | null;
          loan_purpose?: string | null;
          loan_purpose_reason?: string | null;
          marital_status?: Database["public"]["Enums"]["marital_status"] | null;
          monthly_income?: number | null;
          nationality?: string | null;
          next_of_kin_email?: string | null;
          next_of_kin_name?: string | null;
          next_of_kin_phone_number?: string | null;
          phone_number?: string | null;
          postal_code?: string | null;
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
          },
        ];
      };
      profile_documents: {
        Row: {
          created_at: string;
          document_type: Database["public"]["Enums"]["document_type"];
          id: number;
          path: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          document_type: Database["public"]["Enums"]["document_type"];
          id?: number;
          path: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          document_type?: Database["public"]["Enums"]["document_type"];
          id?: number;
          path?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_documents_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          id_number: string | null;
          phone_number: string | null;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id: string;
          id_number?: string | null;
          phone_number?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          id_number?: string | null;
          phone_number?: string | null;
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
        Args:
          | { user_id: string; user_full_name: string }
          | { user_id: string; user_full_name: string; phone_number: string };
        Returns: undefined;
      };
    };
    Enums: {
      api_check_status: "passed" | "failed" | "pending";
      api_check_type:
        | "credit_bureau"
        | "fraud_check"
        | "bank_verification"
        | "dha_otv_facial"
        | "email_verification"
        | "employment_verification"
        | "address_verification"
        | "cellphone_verification"
        | "id_verification";
      api_vendor: "Experian" | "WhoYou" | "ThisIsMe";
      application_status:
        | "pre_qualifier"
        | "pending_documents"
        | "in_review"
        | "approved"
        | "declined"
        | "submitted_to_lender"
        | "submission_failed";
      bank_account_type: "savings" | "transaction" | "current" | "business";
      document_type:
        | "id"
        | "bank_statement"
        | "payslip"
        | "proof_of_residence"
        | "contract"
        | "photo"
        | "credit_report"
        | "other";
      employment_type:
        | "employed"
        | "self_employed"
        | "contract"
        | "unemployed"
        | "retired";
      gender: "male" | "female" | "rather not say" | "other";
      marital_status:
        | "single"
        | "married"
        | "divorced"
        | "widowed"
        | "life_partner";
      user_role: "customer" | "admin" | "editor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
        "email_verification",
        "employment_verification",
        "address_verification",
        "cellphone_verification",
        "id_verification",
      ],
      api_vendor: ["Experian", "WhoYou", "ThisIsMe"],
      application_status: [
        "pre_qualifier",
        "pending_documents",
        "in_review",
        "approved",
        "declined",
        "submitted_to_lender",
        "submission_failed",
      ],
      bank_account_type: ["savings", "transaction", "current", "business"],
      document_type: [
        "id",
        "bank_statement",
        "payslip",
        "proof_of_residence",
        "contract",
        "photo",
        "credit_report",
        "other",
      ],
      employment_type: [
        "employed",
        "self_employed",
        "contract",
        "unemployed",
        "retired",
      ],
      gender: ["male", "female", "rather not say", "other"],
      marital_status: [
        "single",
        "married",
        "divorced",
        "widowed",
        "life_partner",
      ],
      user_role: ["customer", "admin", "editor"],
    },
  },
} as const;
