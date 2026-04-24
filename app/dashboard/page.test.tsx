import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "./page";
import {
  assignConversation,
  getConversationById,
  getConversations,
  getTeamMembers,
} from "@/lib/api";
import {
  clearAuthSession,
  decodeJwtPayload,
  getCurrentUser,
  getToken,
  handleAuthFailure,
} from "@/lib/auth";
import { getSocket, isSocketAuthError } from "@/lib/socket";
import { Conversation, ConversationDetail, TeamMember } from "@/types";

const replaceMock = vi.fn();

const socketMock = {
  on: vi.fn(),
  off: vi.fn(),
  io: {
    on: vi.fn(),
    off: vi.fn(),
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getConversations: vi.fn(),
    getConversationById: vi.fn(),
    getTeamMembers: vi.fn(),
    assignConversation: vi.fn(),
  };
});

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getToken: vi.fn(),
    getCurrentUser: vi.fn(),
    decodeJwtPayload: vi.fn(),
    clearAuthSession: vi.fn(),
    handleAuthFailure: vi.fn(),
  };
});

vi.mock("@/lib/socket", async () => {
  const actual = await vi.importActual<typeof import("@/lib/socket")>("@/lib/socket");
  return {
    ...actual,
    getSocket: vi.fn(),
    isSocketAuthError: vi.fn(),
  };
});

const mockGetConversations = vi.mocked(getConversations);
const mockGetConversationById = vi.mocked(getConversationById);
const mockGetTeamMembers = vi.mocked(getTeamMembers);
const mockAssignConversation = vi.mocked(assignConversation);
const mockGetToken = vi.mocked(getToken);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockDecodeJwtPayload = vi.mocked(decodeJwtPayload);
const mockGetSocket = vi.mocked(getSocket);
const mockIsSocketAuthError = vi.mocked(isSocketAuthError);
const mockHandleAuthFailure = vi.mocked(handleAuthFailure);
const mockClearAuthSession = vi.mocked(clearAuthSession);

const baseConversation: Conversation = {
  id: "conv-1",
  status: "HUMAN_ACTIVE",
  assigned_to: null,
  assigned_staff_id: null,
  bot_active: false,
  booking_confirmed: false,
  booking_amount: null,
  last_message_at: "2026-04-24T08:00:00.000Z",
  created_at: "2026-04-24T07:00:00.000Z",
  guest: {
    id: "guest-1",
    whatsapp_number: "+256700000000",
    phone_number: "+256700000000",
    name: "Guest One",
  },
  latest_message: "Need room rates",
};

const detailConversation: ConversationDetail = {
  ...baseConversation,
  messages: [],
};

const teamMembers: TeamMember[] = [
  {
    id: "staff-2",
    email: "agent@hoscover.com",
    name: "Agent Two",
    role: "STAFF",
    is_active: true,
    last_login_at: null,
  },
];

async function openConversationDetail(): Promise<HTMLSelectElement> {
  render(<DashboardPage />);

  await waitFor(() => {
    expect(mockGetConversations).toHaveBeenCalledTimes(1);
  });

  fireEvent.click(await screen.findByRole("button", { name: /need room rates/i }));

  await waitFor(() => {
    expect(mockGetConversationById).toHaveBeenCalledWith("conv-1");
  });

  return await screen.findByLabelText(
    "Assign conversation to staff member",
  ) as HTMLSelectElement;
}

describe("Dashboard conversation resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetToken.mockReturnValue("jwt-token");
    mockGetCurrentUser.mockReturnValue({
      id: "admin-1",
      email: "admin@hoscover.com",
      role: "ADMIN",
      hotelId: "hotel-1",
    });
    mockDecodeJwtPayload.mockReturnValue(null);
    mockGetConversations.mockResolvedValue([baseConversation]);
    mockGetConversationById.mockResolvedValue(detailConversation);
    mockGetTeamMembers.mockResolvedValue(teamMembers);
    mockGetSocket.mockReturnValue(socketMock as never);
    mockIsSocketAuthError.mockReturnValue(false);
    mockHandleAuthFailure.mockImplementation(() => {
      throw new Error("auth-failure");
    });
    mockClearAuthSession.mockImplementation(() => {});
  });

  it("applies valid mutation payload to state", async () => {
    mockAssignConversation.mockResolvedValue({
      ...baseConversation,
      assigned_to: "staff-2",
      assigned_staff_id: "staff-2",
      latest_message: "Assigned to Agent Two",
    });

    const assignSelect = await openConversationDetail();

    fireEvent.change(assignSelect, { target: { value: "staff-2" } });

    await waitFor(() => {
      expect(mockAssignConversation).toHaveBeenCalledWith("conv-1", "staff-2");
    });

    expect(assignSelect.value).toBe("staff-2");
    expect(screen.queryByText(/conversation update received incomplete data/i)).not.toBeInTheDocument();
  });

  it("does not crash when guest or latest_message is missing", async () => {
    mockAssignConversation.mockResolvedValue({
      id: "conv-1",
      status: "HUMAN_ACTIVE",
      assigned_to: "staff-2",
      bot_active: false,
      booking_confirmed: false,
      booking_amount: null,
      last_message_at: "2026-04-24T09:00:00.000Z",
      created_at: "2026-04-24T07:00:00.000Z",
    });

    const assignSelect = await openConversationDetail();

    fireEvent.change(assignSelect, { target: { value: "staff-2" } });

    expect(await screen.findByText(/conversation update received incomplete data/i)).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(assignSelect.value).toBe("");
  });

  it("preserves prior state and shows warning for invalid mutation payload", async () => {
    mockAssignConversation.mockResolvedValue({ malformed: true });

    const assignSelect = await openConversationDetail();

    expect(assignSelect.value).toBe("");

    fireEvent.change(assignSelect, { target: { value: "staff-2" } });

    expect(await screen.findByText(/conversation update received incomplete data/i)).toBeInTheDocument();
    expect(assignSelect.value).toBe("");
    expect(screen.getByText("Inbox")).toBeInTheDocument();
  });
});
