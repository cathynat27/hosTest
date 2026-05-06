export type ConversationStatus = "ACTIVE_AI" | "ESCALATED" | "HUMAN_ACTIVE" | "RESOLVED";

export type EscalationReason =
  | "rate_limit_exceeded"
  | "ai_failure"
  | "low_confidence"
  | "emergency"
  | "human_request"
  | "complaint"
  | "booking"
  | "repeated_frustration"
  | "escalated_state"
  | "injection_attempt";

export type Guest = {
  id: string;
  whatsapp_number: string;
  phone_number: string;
  name: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_type: "guest" | "ai" | "staff";
  sender_id?: string | null;
  body: string;
  is_note?: boolean;
  ai_draft_text?: string;
  sent_at: string;
};

export type Conversation = {
  id: string;
  status: ConversationStatus;
  escalation_reason?: EscalationReason;
  assigned_to: string | null;
  assigned_staff_id?: string | null;
  bot_active: boolean;
  booking_confirmed: boolean;
  booking_amount: number | null;
  last_message_at: string;
  created_at: string;
  guest: Guest;
  latest_message: string;
};

export type ConversationDetail = Conversation & {
  messages: Message[];
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "STAFF";
    hotelId: string;
  };
};

export type UserRole = "ADMIN" | "STAFF";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  hotelId: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type RegisterRequest = {
  email: string;
  password: string;
  hotelId: string;
  role?: "ADMIN" | "STAFF";
};

export type OnboardHotelRequest = {
  hotelName: string;
  contactName?: string;
  contactPhone: string;
  location: string;
  whatsappNumber: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  adminEmail: string;
  knowledge_text: string;
};

export type OnboardHotelResponse = {
  hotelCode: string;
  message: string;
};

export type InviteRole = UserRole;

export type CreateInviteRequest = {
  email: string;
  role?: InviteRole;
};

export type CreateInviteResponse = {
  email: string;
  role: InviteRole;
  expiresAt: string;
  message: string;
};

export type InviteTokenValidation = {
  email: string;
  status: "pending" | "cancelled" | "expired" | "accepted";
  role: InviteRole;
  expiresAt: string;
  hotel: {
    id: string;
    code: string;
    name: string;
  };
};

export type RegisterFromInviteRequest = {
  token: string;
  password: string;
  fullName?: string;
};

export type EscalationAlertPayload = {
  conversationId: string;
  hotelId: string;
  escalationReason: EscalationReason;
  timestamp: string;
};

export type ConversationUpdatedPayload = {
  conversationId: string;
  status: ConversationStatus;
  assignedStaffId?: string;
};

// ─── Automations ─────────────────────────────────────────────────────────────

export type AutomationTriggerType = "keyword" | "first_message" | "after_hours";

export type Automation = {
  id: string;
  hotel_id: string;
  name: string;
  trigger_type: AutomationTriggerType;
  trigger_value: string | null;
  response_message: string;
  delay_seconds: number;
  follow_up_message: string | null;
  follow_up_delay_seconds: number | null;
  is_active: boolean;
  updated_at: string;
};

export type CreateAutomationRequest = {
  name: string;
  trigger_type: AutomationTriggerType;
  trigger_value?: string;
  response_message: string;
  delay_seconds?: number;
  follow_up_message?: string;
  follow_up_delay_seconds?: number;
  is_active?: boolean;
};

// ─── Guests ───────────────────────────────────────────────────────────────────

export type GuestSource = "whatsapp_inbound" | "csv_import" | "manual";

export type StayHistoryEntry = {
  check_in: string;
  check_out: string;
  room_type: string;
  amount: number;
};

export type GuestProfile = {
  id: string;
  hotel_id: string;
  whatsapp_number: string;
  name: string | null;
  email: string | null;
  notes: string | null;
  source: GuestSource;
  stay_history: StayHistoryEntry[];
  first_contact_at: string;
  last_contact_at: string;
  total_conversations: number;
};

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnalyticsDateRange = "today" | "last_7_days" | "last_30_days" | "custom";

export type AnalyticsOverview = {
  total_conversations: number;
  new_guests: number;
  avg_first_response_time_minutes: number;
  resolution_rate: number;
  bookings_attributed: number;
  revenue_attributed: number;
};

// ─── Team ─────────────────────────────────────────────────────────────────────

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
};

// ─── Campaigns ────────────────────────────────────────────────────────────────
// WhatsApp Newsletter / Campaign Messaging module.
// A Campaign is a scheduled, template-based one-to-many message sent to opted-in
// guests with the explicit purpose of driving a revenue action.

/** The six revenue-intent categories a campaign must belong to. */
export type CampaignType =
  | "pre_arrival_upsell"
  | "in_stay_offer"
  | "fnb_promotion"
  | "late_checkout"
  | "post_stay_reengagement"
  | "seasonal_event";

/** Lifecycle states of a campaign from draft through to completion. */
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "processing"
  | "completed"
  | "cancelled"
  | "failed";

/** Meta's approval state for a WhatsApp Business message template. */
export type TemplateStatus = "approved" | "pending" | "rejected" | "paused";

/** Per-message delivery lifecycle tracked via Meta webhooks. */
export type CampaignMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped";

/**
 * Segment filters the hotel staff applies in Stage 2 of the creation wizard.
 * All fields are optional; the opt-in check is always enforced server-side.
 */
export type AudienceFilters = {
  check_in_from?: string;   // ISO date string
  check_in_to?: string;
  check_out_from?: string;
  check_out_to?: string;
  min_stay_nights?: number;
  room_type?: string;
  repeat_guest?: boolean;
};

/** A Meta-approved message template synced from the WhatsApp Business API. */
export type Template = {
  id: string;
  hotel_id: string;
  meta_template_name: string;
  meta_template_id: string;
  language_code: string;
  campaign_type: CampaignType;
  status: TemplateStatus;
  body_text: string;
  /** Each entry maps a placeholder key to its auto-source on the guest record. */
  variable_definitions: Array<{ key: string; source: string }>;
  has_header: boolean;
  has_cta_buttons: boolean;
  has_quick_reply_buttons: boolean;
  created_at: string;
  approved_at: string | null;
};

/** A send job created by hotel staff — one record per campaign. */
export type Campaign = {
  id: string;
  hotel_id: string;
  name: string;
  campaign_type: CampaignType;
  template_id: string | null;
  variable_overrides: Record<string, string>;
  audience_filters: AudienceFilters;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  created_by: string;
  recipient_count_targeted: number;
  recipient_count_sent: number;
  recipient_count_skipped: number;
  created_at: string;
};

/**
 * One record per individual message sent to a guest within a campaign.
 * This is the atomic tracking unit for delivery reporting.
 */
export type CampaignMessage = {
  id: string;
  campaign_id: string;
  guest_id: string;
  hotel_id: string;
  phone_number: string;
  resolved_message_body: string;
  meta_message_id: string | null;
  status: CampaignMessageStatus;
  failure_reason: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
  conversation_id: string | null;
};

/** Campaign with its per-recipient messages and resolved template. */
export type CampaignDetail = Campaign & {
  messages: CampaignMessage[];
  template: Template | null;
};

export type CreateCampaignRequest = {
  name: string;
  campaign_type: CampaignType;
};

export type UpdateCampaignRequest = {
  name?: string;
  campaign_type?: CampaignType;
  template_id?: string;
  variable_overrides?: Record<string, string>;
  audience_filters?: AudienceFilters;
  scheduled_at?: string | null;
};

export type LaunchCampaignRequest = {
  send_immediately: boolean;
  scheduled_at?: string;
};

/** Live audience size preview returned before campaign creation. */
export type AudiencePreview = {
  total_matched: number;
  opted_in_count: number;
};
