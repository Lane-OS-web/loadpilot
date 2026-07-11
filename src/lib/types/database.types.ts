// Auto-generated in real usage via:
//   supabase gen types typescript --project-id <id> --schema public
// Hand-written here to match supabase/migrations/0001_init.sql so the app
// compiles before the project is linked. Regenerate once Supabase is live.

export type LoadStatus =
  | "booked" | "dispatched" | "at_pickup" | "in_transit"
  | "at_delivery" | "delivered" | "invoiced" | "paid" | "cancelled";

export type DocumentType =
  | "rate_confirmation" | "bill_of_lading" | "proof_of_delivery"
  | "lumper_receipt" | "invoice" | "other";

export type DocumentStatus = "processing" | "filed" | "needs_review" | "missing";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: { id: string; name: string; mc_number: string | null; dot_number: string | null; created_at: string };
        Insert: { name: string; mc_number?: string | null; dot_number?: string | null };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: { id: string; company_id: string; role: "owner" | "dispatcher" | "driver"; full_name: string | null; phone: string | null; created_at: string };
        Insert: { id: string; company_id: string; role?: "owner" | "dispatcher" | "driver"; full_name?: string | null; phone?: string | null };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      trucks: {
        Row: { id: string; company_id: string; unit_number: string; vin: string | null; make: string | null; model: string | null; year: number | null; plate: string | null; eld_device_id: string | null; status: "active" | "maintenance" | "inactive"; created_at: string };
        Insert: { id?: string; company_id: string; unit_number: string; vin?: string | null; make?: string | null; model?: string | null; year?: number | null; plate?: string | null; eld_device_id?: string | null; status?: "active" | "maintenance" | "inactive" };
        Update: Partial<Database["public"]["Tables"]["trucks"]["Insert"]>;
        Relationships: [];
      };
      drivers: {
        Row: { id: string; company_id: string; profile_id: string | null; full_name: string; phone: string | null; email: string | null; cdl_number: string | null; cdl_state: string | null; cdl_expires_on: string | null; medical_card_expires_on: string | null; home_terminal: string | null; assigned_truck_id: string | null; status: "active" | "on_load" | "off_duty" | "inactive"; created_at: string };
        Insert: { id?: string; company_id: string; profile_id?: string | null; full_name: string; phone?: string | null; email?: string | null; cdl_number?: string | null; cdl_state?: string | null; cdl_expires_on?: string | null; medical_card_expires_on?: string | null; home_terminal?: string | null; assigned_truck_id?: string | null; status?: "active" | "on_load" | "off_duty" | "inactive" };
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>;
        Relationships: [];
      };
      facilities: {
        Row: { id: string; company_id: string; name: string; address_line1: string | null; city: string | null; state: string | null; zip: string | null; lat: number | null; lng: number | null; facility_type: string | null; avg_detention_minutes: number | null; detention_incident_rate: number | null; appointment_required: boolean; dock_notes: string | null; created_at: string };
        Insert: { id?: string; company_id: string; name: string; address_line1?: string | null; city?: string | null; state?: string | null; zip?: string | null; lat?: number | null; lng?: number | null; facility_type?: string | null; avg_detention_minutes?: number | null; detention_incident_rate?: number | null; appointment_required?: boolean; dock_notes?: string | null };
        Update: Partial<Database["public"]["Tables"]["facilities"]["Insert"]>;
        Relationships: [];
      };
      brokers: {
        Row: { id: string; company_id: string; name: string; mc_number: string | null; credit_rating: string | null; avg_days_to_pay: number | null; contact_name: string | null; contact_email: string | null; contact_phone: string | null; factoring_approved: boolean; notes: string | null; loads_booked_count: number; total_revenue: number; created_at: string };
        Insert: { id?: string; company_id: string; name: string; mc_number?: string | null; credit_rating?: string | null; avg_days_to_pay?: number | null; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; factoring_approved?: boolean; notes?: string | null };
        Update: Partial<Database["public"]["Tables"]["brokers"]["Insert"]>;
        Relationships: [];
      };
      loads: {
        Row: {
          id: string; company_id: string; load_number: string;
          broker_id: string | null; driver_id: string | null; truck_id: string | null;
          origin_facility_id: string | null; destination_facility_id: string | null;
          pickup_appointment: string | null; delivery_appointment: string | null;
          picked_up_at: string | null; delivered_at: string | null;
          equipment_type: string | null; weight_lbs: number | null; miles: number | null;
          rate_confirmed: number | null; rate_invoiced: number | null; rate_paid: number | null;
          detention_free_minutes: number; detention_rate_per_hour: number | null;
          status: LoadStatus; booked_via: string; source_board: string | null; notes: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; company_id: string; load_number: string;
          broker_id?: string | null; driver_id?: string | null; truck_id?: string | null;
          origin_facility_id?: string | null; destination_facility_id?: string | null;
          pickup_appointment?: string | null; delivery_appointment?: string | null;
          picked_up_at?: string | null; delivered_at?: string | null;
          equipment_type?: string | null; weight_lbs?: number | null; miles?: number | null;
          rate_confirmed?: number | null; rate_invoiced?: number | null; rate_paid?: number | null;
          detention_free_minutes?: number; detention_rate_per_hour?: number | null;
          status?: LoadStatus; booked_via?: string; source_board?: string | null; notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["loads"]["Insert"]>;
        Relationships: [];
      };
      documents: {
        Row: { id: string; company_id: string; load_id: string | null; uploaded_by: string | null; doc_type: DocumentType; status: DocumentStatus; storage_path: string; file_name: string | null; mime_type: string | null; ai_extracted_fields: Record<string, unknown> | null; ai_confidence: number | null; ai_model: string | null; created_at: string };
        Insert: { id?: string; company_id: string; load_id?: string | null; uploaded_by?: string | null; doc_type?: DocumentType; status?: DocumentStatus; storage_path: string; file_name?: string | null; mime_type?: string | null; ai_extracted_fields?: Record<string, unknown> | null; ai_confidence?: number | null; ai_model?: string | null };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      detention_events: {
        Row: { id: string; company_id: string; load_id: string; facility_id: string | null; check_in_at: string; check_out_at: string | null; free_minutes: number; billable_minutes: number; rate_per_hour: number | null; claim_status: string; created_at: string };
        Insert: { id?: string; company_id: string; load_id: string; facility_id?: string | null; check_in_at: string; check_out_at?: string | null; free_minutes?: number; rate_per_hour?: number | null; claim_status?: string };
        Update: Partial<Database["public"]["Tables"]["detention_events"]["Insert"]>;
        Relationships: [];
      };
      revenue_recovery_items: {
        Row: { id: string; company_id: string; load_id: string; type: "short_pay" | "unbilled_detention" | "unbilled_accessorial" | "duplicate_deduction"; expected_amount: number; actual_amount: number; variance: number; status: "flagged" | "disputed" | "recovered" | "written_off"; detected_by: string; resolved_at: string | null; created_at: string };
        Insert: { id?: string; company_id: string; load_id: string; type: "short_pay" | "unbilled_detention" | "unbilled_accessorial" | "duplicate_deduction"; expected_amount: number; actual_amount: number; status?: "flagged" | "disputed" | "recovered" | "written_off"; detected_by?: string; resolved_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["revenue_recovery_items"]["Insert"]>;
        Relationships: [];
      };
      email_parse_log: {
        Row: { id: string; company_id: string; from_address: string | null; subject: string | null; raw_body: string | null; ai_extracted: Record<string, unknown> | null; ai_confidence: number | null; status: "received" | "parsed" | "needs_review" | "linked" | "discarded"; linked_load_id: string | null; created_at: string };
        Insert: { id?: string; company_id: string; from_address?: string | null; subject?: string | null; raw_body?: string | null; ai_extracted?: Record<string, unknown> | null; ai_confidence?: number | null; status?: "received" | "parsed" | "needs_review" | "linked" | "discarded"; linked_load_id?: string | null };
        Update: Partial<Database["public"]["Tables"]["email_parse_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      create_company_and_owner: {
        Args: { company_name: string; owner_full_name: string };
        Returns: string;
      };
    };
  };
}
