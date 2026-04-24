import { Conversation, ConversationStatus, Guest } from "@/types";

const CONVERSATION_STATUSES: ConversationStatus[] = [
  "ACTIVE_AI",
  "ESCALATED",
  "HUMAN_ACTIVE",
  "RESOLVED",
];

export type ConversationValidationResult = {
  ok: boolean;
  missingFields: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isStatus(value: unknown): value is ConversationStatus {
  return typeof value === "string" && CONVERSATION_STATUSES.includes(value as ConversationStatus);
}

export function validateConversationPayload(value: unknown): ConversationValidationResult {
  if (!isRecord(value)) {
    return { ok: false, missingFields: ["conversation"] };
  }

  const missingFields: string[] = [];

  if (typeof value.id !== "string" || !value.id.trim()) missingFields.push("id");
  if (!isStatus(value.status)) missingFields.push("status");

  const hasAssignedTo =
    value.assigned_to === null ||
    typeof value.assigned_to === "string" ||
    value.assigned_staff_id === null ||
    typeof value.assigned_staff_id === "string";
  if (!hasAssignedTo) missingFields.push("assigned_to");

  if (typeof value.bot_active !== "boolean") missingFields.push("bot_active");
  if (typeof value.booking_confirmed !== "boolean") missingFields.push("booking_confirmed");

  const hasBookingAmount =
    value.booking_amount === null ||
    value.booking_amount === undefined ||
    typeof value.booking_amount === "number";
  if (!hasBookingAmount) missingFields.push("booking_amount");

  if (typeof value.last_message_at !== "string" || !value.last_message_at.trim()) {
    missingFields.push("last_message_at");
  }
  if (typeof value.created_at !== "string" || !value.created_at.trim()) {
    missingFields.push("created_at");
  }

  const guest = value.guest;
  if (!isRecord(guest)) {
    missingFields.push("guest");
  } else {
    if (typeof guest.id !== "string" || !guest.id.trim()) missingFields.push("guest.id");
    const phoneCandidate =
      typeof guest.whatsapp_number === "string"
        ? guest.whatsapp_number
        : typeof guest.phone_number === "string"
          ? guest.phone_number
          : "";
    if (!phoneCandidate.trim()) missingFields.push("guest.whatsapp_number");
    if (typeof guest.name !== "string" && guest.name !== null) missingFields.push("guest.name");
  }

  if (typeof value.latest_message !== "string") missingFields.push("latest_message");

  return { ok: missingFields.length === 0, missingFields };
}

function normalizeGuest(value: unknown): Guest {
  if (!isRecord(value)) {
    return {
      id: "unknown-guest",
      whatsapp_number: "Unknown",
      phone_number: "Unknown",
      name: "Unknown guest",
    };
  }

  const whatsappNumber =
    typeof value.whatsapp_number === "string" && value.whatsapp_number.trim()
      ? value.whatsapp_number
      : typeof value.phone_number === "string" && value.phone_number.trim()
        ? value.phone_number
        : "Unknown";

  const name = typeof value.name === "string" ? value.name : null;

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : "unknown-guest",
    whatsapp_number: whatsappNumber,
    phone_number: whatsappNumber,
    name,
  };
}

export function normalizeConversation(value: unknown): Conversation {
  const source = isRecord(value) ? value : {};
  const nowIso = new Date().toISOString();

  const assignedToCandidate =
    source.assigned_to === null || typeof source.assigned_to === "string"
      ? source.assigned_to
      : source.assigned_staff_id === null || typeof source.assigned_staff_id === "string"
        ? source.assigned_staff_id
        : null;

  const status = isStatus(source.status) ? source.status : "ACTIVE_AI";

  const conversation: Conversation = {
    id: typeof source.id === "string" && source.id.trim() ? source.id : "unknown-conversation",
    status,
    escalation_reason: typeof source.escalation_reason === "string" ? source.escalation_reason : undefined,
    assigned_to: assignedToCandidate,
    assigned_staff_id: assignedToCandidate,
    bot_active: typeof source.bot_active === "boolean" ? source.bot_active : status === "ACTIVE_AI",
    booking_confirmed:
      typeof source.booking_confirmed === "boolean" ? source.booking_confirmed : false,
    booking_amount:
      typeof source.booking_amount === "number" && Number.isFinite(source.booking_amount)
        ? source.booking_amount
        : null,
    last_message_at:
      typeof source.last_message_at === "string" && source.last_message_at.trim()
        ? source.last_message_at
        : nowIso,
    created_at:
      typeof source.created_at === "string" && source.created_at.trim()
        ? source.created_at
        : nowIso,
    guest: normalizeGuest(source.guest),
    latest_message: typeof source.latest_message === "string" ? source.latest_message : "",
  };

  return conversation;
}
