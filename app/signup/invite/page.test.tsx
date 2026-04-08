import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import InviteSignupPage from "./page";
import { ApiError, registerFromInvite, validateInviteToken } from "@/lib/api";
import { getToken, setAuthSession } from "@/lib/auth";

const replaceMock = vi.fn();
const routerMock = { replace: replaceMock };
const searchParamsMock = {
  get: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => searchParamsMock,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    validateInviteToken: vi.fn(),
    registerFromInvite: vi.fn(),
  };
});

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    getToken: vi.fn(),
    setAuthSession: vi.fn(),
  };
});

const mockGetToken = vi.mocked(getToken);
const mockValidateInviteToken = vi.mocked(validateInviteToken);
const mockRegisterFromInvite = vi.mocked(registerFromInvite);
const mockSetAuthSession = vi.mocked(setAuthSession);

describe("Invite signup page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockReturnValue(null);
    searchParamsMock.get.mockReturnValue("invite-token-123");
  });

  it("shows invite details when token is valid", async () => {
    mockValidateInviteToken.mockResolvedValue({
      email: "new@hotel.com",
      role: "STAFF",
      expiresAt: "2026-05-01T10:00:00.000Z",
      hotel: {
        id: "h_1",
        code: "HSC123",
        name: "Lake View",
      },
    });

    render(<InviteSignupPage />);

    expect(await screen.findByText("Invite Details")).toBeInTheDocument();
    expect(screen.getByText("new@hotel.com")).toBeInTheDocument();
    expect(screen.getByText("Lake View")).toBeInTheDocument();
    expect(screen.getByText("HSC123")).toBeInTheDocument();
  });

  it("shows clear message for expired invite token", async () => {
    mockValidateInviteToken.mockRejectedValue(new ApiError("Expired invite", 410));

    render(<InviteSignupPage />);

    expect(await screen.findByText("Invite link is invalid")).toBeInTheDocument();
    expect(screen.getByText("This invite has expired or was already used. Request a new invite.")).toBeInTheDocument();
  });

  it("shows missing token guidance when token is absent", async () => {
    searchParamsMock.get.mockReturnValue(null);

    render(<InviteSignupPage />);

    expect(await screen.findByText("Invite link is invalid")).toBeInTheDocument();
    expect(screen.getByText("Missing invite token. Use the exact link from your invite email.")).toBeInTheDocument();
  });

  it("registers from invite and redirects to dashboard", async () => {
    mockValidateInviteToken.mockResolvedValue({
      email: "new@hotel.com",
      role: "STAFF",
      expiresAt: "2026-05-01T10:00:00.000Z",
      hotel: {
        id: "h_1",
        code: "HSC123",
        name: "Lake View",
      },
    });

    mockRegisterFromInvite.mockResolvedValue({
      token: "jwt-token",
      user: {
        id: "u1",
        email: "new@hotel.com",
        role: "STAFF",
        hotelId: "h_1",
      },
    });

    render(<InviteSignupPage />);

    await waitFor(() => {
      expect(screen.queryByText("Validating your invite link...")).not.toBeInTheDocument();
    });

    fireEvent.change(await screen.findByLabelText("Password"), { target: { value: "Password123" } });
    fireEvent.change(await screen.findByLabelText("Confirm Password"), { target: { value: "Password123" } });

    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("Password123");
    expect((screen.getByLabelText("Confirm Password") as HTMLInputElement).value).toBe("Password123");

    fireEvent.submit((screen.getByLabelText("Password") as HTMLInputElement).closest("form") as HTMLFormElement);

    await waitFor(() => expect(mockRegisterFromInvite).toHaveBeenCalledWith({
      token: "invite-token-123",
      password: "Password123",
      fullName: undefined,
    }));

    expect(mockSetAuthSession).toHaveBeenCalledWith("jwt-token", {
      id: "u1",
      email: "new@hotel.com",
      role: "STAFF",
      hotelId: "h_1",
    });
    expect(replaceMock).toHaveBeenCalledWith("/dashboard");
  });
});
