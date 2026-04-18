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
  phone_number: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_type: "guest" | "ai" | "staff";
  body: string;
  ai_draft_text?: string;
  sent_at: string;
};

export type Conversation = {
  id: string;
  status: ConversationStatus;
  escalation_reason?: EscalationReason;
  assigned_staff_id?: string;
  last_message_at: string;
  created_at: string;
  guest: Guest;
  latest_message?: string;
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
