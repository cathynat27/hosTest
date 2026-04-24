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
