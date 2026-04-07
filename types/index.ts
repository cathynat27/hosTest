export type ConversationStatus = "ACTIVE_AI" | "ESCALATED" | "HUMAN_ACTIVE" | "RESOLVED";

export type EscalationReason =
  | "rate_limit_exceeded"
  | "ai_failure"
  | "low_confidence"
  | "emergency"
  | "human_request"
  | "complaint"
  | "booking"
  | "repeated_frustration";

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
