export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_checks: {
        Row: {
          check_type: Database["public"]["Enums"]["api_check_type"]
          checked_at: string
          id: number
          id_number: string
          profile_id: string | null
          response_payload: Json
          status: Database["public"]["Enums"]["api_check_status"]
          vendor: Database["public"]["Enums"]["api_vendor"]
        }
        Insert: {
          check_type: Database["public"]["Enums"]["api_check_type"]
          checked_at?: string
          id?: number
          id_number: string
          profile_id?: string | null
          response_payload: Json
          status: Database["public"]["Enums"]["api_check_status"]
          vendor: Database["public"]["Enums"]["api_vendor"]
        }
        Update: {
          check_type?: Database["public"]["Enums"]["api_check_type"]
          checked_at?: string
          id?: number
          id_number?: string
          profile_id?: string | null
          response_payload?: Json
          status?: Database["public"]["Enums"]["api_check_status"]
          vendor?: Database["public"]["Enums"]["api_vendor"]
        }
        Relationships: [
          {
            foreignKeyName: "api_checks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          affordability: Json | null
          application_amount: number | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_account_type:
            | Database["public"]["Enums"]["bank_account_type"]
            | null
          bank_name: string | null
          branch_code: string | null
          bravelender_application_id: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          decline_reason: Json | null
          dependants: number | null
          employer_address: string | null
          employer_contact_number: string | null
          employer_name: string | null
          employment_end_date: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          gender: Database["public"]["Enums"]["gender"] | null
          gender_other: string | null
          home_address: string | null
          id: number
          id_number: string
          job_title: string | null
          language: string | null
          loan_purpose: string | null
          loan_purpose_reason: string | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          monthly_income: number | null
          nationality: string | null
          next_of_kin_email: string | null
          next_of_kin_name: string | null
          next_of_kin_phone_number: string | null
          phone_number: string | null
          postal_code: string | null
          salary_date: number | null
          status: Database["public"]["Enums"]["application_status"]
          term: number
          updated_at: string
          user_id: string
          work_experience: string | null
        }
        Insert: {
          affordability?: Json | null
          application_amount?: number | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?:
            | Database["public"]["Enums"]["bank_account_type"]
            | null
          bank_name?: string | null
          branch_code?: string | null
          bravelender_application_id?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          decline_reason?: Json | null
          dependants?: number | null
          employer_address?: string | null
          employer_contact_number?: string | null
          employer_name?: string | null
          employment_end_date?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          gender?: Database["public"]["Enums"]["gender"] | null
          gender_other?: string | null
          home_address?: string | null
          id?: number
          id_number: string
          job_title?: string | null
          language?: string | null
          loan_purpose?: string | null
          loan_purpose_reason?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          monthly_income?: number | null
          nationality?: string | null
          next_of_kin_email?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone_number?: string | null
          phone_number?: string | null
          postal_code?: string | null
          salary_date?: number | null
          status: Database["public"]["Enums"]["application_status"]
          term: number
          updated_at?: string
          user_id: string
          work_experience?: string | null
        }
        Update: {
          affordability?: Json | null
          application_amount?: number | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?:
            | Database["public"]["Enums"]["bank_account_type"]
            | null
          bank_name?: string | null
          branch_code?: string | null
          bravelender_application_id?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          decline_reason?: Json | null
          dependants?: number | null
          employer_address?: string | null
          employer_contact_number?: string | null
          employer_name?: string | null
          employment_end_date?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          gender?: Database["public"]["Enums"]["gender"] | null
          gender_other?: string | null
          home_address?: string | null
          id?: number
          id_number?: string
          job_title?: string | null
          language?: string | null
          loan_purpose?: string | null
          loan_purpose_reason?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          monthly_income?: number | null
          nationality?: string | null
          next_of_kin_email?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone_number?: string | null
          phone_number?: string | null
          postal_code?: string | null
          salary_date?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          term?: number
          updated_at?: string
          user_id?: string
          work_experience?: string | null
        }
        Relationships: []
      }
      approved_loans: {
        Row: {
          application_id: number
          approved_date: string
          approved_loan_amount: number | null
          created_at: string | null
          id: number
          initiation_fee: number
          interest_rate: number
          loan_term_days: number
          monthly_payment: number
          next_payment_date: string | null
          profile_id: string
          service_fee: number
          status: string
          total_repayment_amount: number
          updated_at: string | null
        }
        Insert: {
          application_id: number
          approved_date?: string
          approved_loan_amount?: number | null
          created_at?: string | null
          id?: number
          initiation_fee: number
          interest_rate: number
          loan_term_days: number
          monthly_payment: number
          next_payment_date?: string | null
          profile_id: string
          service_fee: number
          status?: string
          total_repayment_amount: number
          updated_at?: string | null
        }
        Update: {
          application_id?: number
          approved_date?: string
          approved_loan_amount?: number | null
          created_at?: string | null
          id?: number
          initiation_fee?: number
          interest_rate?: number
          loan_term_days?: number
          monthly_payment?: number
          next_payment_date?: string | null
          profile_id?: string
          service_fee?: number
          status?: string
          total_repayment_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_loans_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_approved_loans_profiles"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_payouts: {
        Row: {
          amount: number
          beneficiary_party_id: string
          claim_id: number
          created_at: string
          id: number
          payout_date: string
        }
        Insert: {
          amount: number
          beneficiary_party_id: string
          claim_id: number
          created_at?: string
          id?: number
          payout_date: string
        }
        Update: {
          amount?: number
          beneficiary_party_id?: string
          claim_id?: number
          created_at?: string
          id?: number
          payout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_payouts_beneficiary_party_id_fkey"
            columns: ["beneficiary_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_payouts_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claim_number: string
          claimant_party_id: string
          contact_details: Json | null
          created_at: string
          date_filed: string
          date_of_incident: string
          id: number
          policy_id: number
          status: Database["public"]["Enums"]["claim_status"]
        }
        Insert: {
          claim_number: string
          claimant_party_id: string
          contact_details?: Json | null
          created_at?: string
          date_filed: string
          date_of_incident: string
          id?: number
          policy_id: number
          status: Database["public"]["Enums"]["claim_status"]
        }
        Update: {
          claim_number?: string
          claimant_party_id?: string
          contact_details?: Json | null
          created_at?: string
          date_filed?: string
          date_of_incident?: string
          id?: number
          policy_id?: number
          status?: Database["public"]["Enums"]["claim_status"]
        }
        Relationships: [
          {
            foreignKeyName: "claims_claimant_party_id_fkey"
            columns: ["claimant_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: number
          document_type: Database["public"]["Enums"]["document_type"]
          id: number
          storage_path: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          application_id: number
          document_type: Database["public"]["Enums"]["document_type"]
          id?: number
          storage_path: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          application_id?: number
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: number
          storage_path?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          approved_loan_id: number
          created_at: string | null
          id: number
          payment_amount: number
          payment_date: string | null
          payment_method: string | null
          status: string
        }
        Insert: {
          approved_loan_id: number
          created_at?: string | null
          id?: never
          payment_amount: number
          payment_date?: string | null
          payment_method?: string | null
          status?: string
        }
        Update: {
          approved_loan_id?: number
          created_at?: string | null
          id?: never
          payment_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_approved_loan_id_fkey"
            columns: ["approved_loan_id"]
            isOneToOne: false
            referencedRelation: "approved_loans"
            referencedColumns: ["id"]
          },
        ]
      }
      otv_checks: {
        Row: {
          application_id: number
          created_at: string
          id: number
          id_number: string
          pin_code: string
        }
        Insert: {
          application_id: number
          created_at?: string
          id?: number
          id_number: string
          pin_code: string
        }
        Update: {
          application_id?: number
          created_at?: string
          id?: number
          id_number?: string
          pin_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "otv_checks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          address_details: Json | null
          banking_details: Json | null
          contact_details: Json | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          id: string
          id_number: string | null
          last_name: string | null
          organization_name: string | null
          party_type: Database["public"]["Enums"]["party_type"]
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          address_details?: Json | null
          banking_details?: Json | null
          contact_details?: Json | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          last_name?: string | null
          organization_name?: string | null
          party_type: Database["public"]["Enums"]["party_type"]
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address_details?: Json | null
          banking_details?: Json | null
          contact_details?: Json | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          id_number?: string | null
          last_name?: string | null
          organization_name?: string | null
          party_type?: Database["public"]["Enums"]["party_type"]
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          coverage_amount: number | null
          created_at: string
          employment_details: Json | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["frequency"]
          id: number
          policy_holder_id: string
          policy_status: Database["public"]["Enums"]["policy_status"]
          premium_amount: number | null
          product_type: Database["public"]["Enums"]["product_type"] | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coverage_amount?: number | null
          created_at?: string
          employment_details?: Json | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["frequency"]
          id?: number
          policy_holder_id: string
          policy_status: Database["public"]["Enums"]["policy_status"]
          premium_amount?: number | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          coverage_amount?: number | null
          created_at?: string
          employment_details?: Json | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["frequency"]
          id?: number
          policy_holder_id?: string
          policy_status?: Database["public"]["Enums"]["policy_status"]
          premium_amount?: number | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_policy_holder_id_fkey"
            columns: ["policy_holder_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_beneficiaries: {
        Row: {
          allocation_percentage: number
          beneficiary_party_id: string
          created_at: string
          id: number
          policy_id: number
          relation_type: Database["public"]["Enums"]["relation_type"]
        }
        Insert: {
          allocation_percentage: number
          beneficiary_party_id: string
          created_at?: string
          id?: number
          policy_id: number
          relation_type: Database["public"]["Enums"]["relation_type"]
        }
        Update: {
          allocation_percentage?: number
          beneficiary_party_id?: string
          created_at?: string
          id?: number
          policy_id?: number
          relation_type?: Database["public"]["Enums"]["relation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "policy_beneficiaries_beneficiary_party_id_fkey"
            columns: ["beneficiary_party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_beneficiaries_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_documents: {
        Row: {
          claim_id: number | null
          created_at: string
          document_type: Database["public"]["Enums"]["policy_document_type"]
          id: number
          path: string
          policy_id: number
          user_id: string
        }
        Insert: {
          claim_id?: number | null
          created_at?: string
          document_type: Database["public"]["Enums"]["policy_document_type"]
          id?: number
          path: string
          policy_id: number
          user_id?: string
        }
        Update: {
          claim_id?: number | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["policy_document_type"]
          id?: number
          path?: string
          policy_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_documents_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_versions: {
        Row: {
          created_at: string
          effective_from: string
          id: number
          policy_data: Json
          policy_id: number
          reason_for_change: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          effective_from: string
          id?: number
          policy_data: Json
          policy_id: number
          reason_for_change?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: number
          policy_data?: Json
          policy_id?: number
          reason_for_change?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "policy_versions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_applications: {
        Row: {
          application_id: number | null
          created_at: string
          credit_check_id: number
          credit_score: number
          expires_at: string | null
          id: number
          id_number: string
          profile_id: string
          status: Database["public"]["Enums"]["pre_application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: number | null
          created_at?: string
          credit_check_id: number
          credit_score: number
          expires_at?: string | null
          id?: number
          id_number: string
          profile_id: string
          status: Database["public"]["Enums"]["pre_application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: number | null
          created_at?: string
          credit_check_id?: number
          credit_score?: number
          expires_at?: string | null
          id?: number
          id_number?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["pre_application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_applications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_applications_credit_check_id_fkey"
            columns: ["credit_check_id"]
            isOneToOne: false
            referencedRelation: "api_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: number
          path: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          id?: number
          path: string
          profile_id: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: number
          path?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          id_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      resend_emails: {
        Row: {
          application_id: number | null
          created_at: string
          id: number
          loan_id: number | null
          policy_id: number | null
          profile_id: string
          resend_id: string
        }
        Insert: {
          application_id?: number | null
          created_at?: string
          id?: number
          loan_id?: number | null
          policy_id?: number | null
          profile_id: string
          resend_id: string
        }
        Update: {
          application_id?: number | null
          created_at?: string
          id?: number
          loan_id?: number | null
          policy_id?: number | null
          profile_id?: string
          resend_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resend_emails_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resend_emails_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "approved_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resend_emails_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resend_emails_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          created_at: string
          id: number
          message: string
          phone_number: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: string
          phone_number: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: string
          phone_number?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          payment_ref: string | null
          source_claim_payout_id: number | null
          source_loan_id: number | null
          source_policy_version_id: number | null
          transaction_status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_ref?: string | null
          source_claim_payout_id?: number | null
          source_loan_id?: number | null
          source_policy_version_id?: number | null
          transaction_status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_ref?: string | null
          source_claim_payout_id?: number | null
          source_loan_id?: number | null
          source_policy_version_id?: number | null
          transaction_status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_source_claim_payout_id_fkey"
            columns: ["source_claim_payout_id"]
            isOneToOne: false
            referencedRelation: "claim_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_source_loan_id_fkey"
            columns: ["source_loan_id"]
            isOneToOne: false
            referencedRelation: "approved_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_source_policy_version_id_fkey"
            columns: ["source_policy_version_id"]
            isOneToOne: false
            referencedRelation: "policy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user_signup: {
        Args:
          | { phone_number: string; user_full_name: string; user_id: string }
          | { user_full_name: string; user_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      api_check_status: "passed" | "failed" | "pending"
      api_check_type:
        | "credit_bureau"
        | "fraud_check"
        | "bank_verification"
        | "dha_otv_facial"
        | "email_verification"
        | "employment_verification"
        | "address_verification"
        | "cellphone_verification"
        | "id_verification"
        | "deceased_status"
      api_vendor: "Experian" | "WhoYou" | "ThisIsMe"
      application_status:
        | "pre_qualifier"
        | "pending_documents"
        | "in_review"
        | "approved"
        | "declined"
        | "submitted_to_lender"
        | "submission_failed"
      bank_account_type: "savings" | "transaction" | "current" | "business"
      claim_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "denied"
        | "paid"
      document_type:
        | "id"
        | "bank_statement"
        | "payslip"
        | "proof_of_residence"
        | "contract"
        | "photo"
        | "credit_report"
        | "other"
      employment_type:
        | "employed"
        | "self_employed"
        | "contract"
        | "unemployed"
        | "retired"
      frequency: "monthly" | "quarterly" | "annually"
      gender: "male" | "female" | "rather not say" | "other"
      marital_status:
        | "single"
        | "married"
        | "divorced"
        | "widowed"
        | "life_partner"
      party_type: "individual" | "organization"
      policy_document_type:
        | "birth_certificate"
        | "death_certificate"
        | "marriage_certificate"
        | "identity_document"
        | "passport"
        | "third_party_document"
        | "proof_of_banking"
        | "payslip"
        | "drivers_license"
      policy_status: "pending" | "active" | "lapsed" | "cancelled"
      pre_application_status:
        | "credit_passed"
        | "application_started"
        | "application_completed"
        | "abandoned"
        | "cancelled"
      product_type: "funeral_policy" | "life_insurance" | "payday_loan"
      relation_type:
        | "spouse"
        | "child"
        | "parent"
        | "sibling"
        | "cousin"
        | "grandparent"
        | "in-law"
      transaction_status: "pending" | "completed" | "failed"
      transaction_type:
        | "premium_payment"
        | "claim_payout"
        | "loan_disbursement"
        | "loan_repayment"
        | "refund"
      user_role: "customer" | "admin" | "editor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

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
        "deceased_status",
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
      claim_status: ["submitted", "under_review", "approved", "denied", "paid"],
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
      frequency: ["monthly", "quarterly", "annually"],
      gender: ["male", "female", "rather not say", "other"],
      marital_status: [
        "single",
        "married",
        "divorced",
        "widowed",
        "life_partner",
      ],
      party_type: ["individual", "organization"],
      policy_document_type: [
        "birth_certificate",
        "death_certificate",
        "marriage_certificate",
        "identity_document",
        "passport",
        "third_party_document",
        "proof_of_banking",
        "payslip",
        "drivers_license",
      ],
      policy_status: ["pending", "active", "lapsed", "cancelled"],
      pre_application_status: [
        "credit_passed",
        "application_started",
        "application_completed",
        "abandoned",
        "cancelled",
      ],
      product_type: ["funeral_policy", "life_insurance", "payday_loan"],
      relation_type: [
        "spouse",
        "child",
        "parent",
        "sibling",
        "cousin",
        "grandparent",
        "in-law",
      ],
      transaction_status: ["pending", "completed", "failed"],
      transaction_type: [
        "premium_payment",
        "claim_payout",
        "loan_disbursement",
        "loan_repayment",
        "refund",
      ],
      user_role: ["customer", "admin", "editor"],
    },
  },
} as const
