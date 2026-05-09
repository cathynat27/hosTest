import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OnboardingPage from "./page";
import { onboardHotel } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    onboardHotel: vi.fn(),
  };
});

const mockOnboardHotel = vi.mocked(onboardHotel);

describe("Hotel onboarding page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation errors for required fields", async () => {
    render(<OnboardingPage />);

    fireEvent.click(screen.getByRole("button", { name: "Onboard Hotel" }));

    expect(await screen.findByText("Hotel name is required.")).toBeInTheDocument();
    expect(screen.getByText("Admin email is required.")).toBeInTheDocument();
    expect(mockOnboardHotel).not.toHaveBeenCalled();
  });

  it("submits successfully and shows hotel code", async () => {
    mockOnboardHotel.mockResolvedValue({
      hotelCode: "HSC-9081",
      message: "Invite sent to admin email",
    });

    render(<OnboardingPage />);

    fireEvent.change(screen.getByLabelText("Hotel Name *"), { target: { value: "Lake View Hotel" } });
    fireEvent.change(screen.getByLabelText("Contact Phone *"), { target: { value: "+256700000000" } });
    fireEvent.change(screen.getByLabelText("Location *"), { target: { value: "Kampala" } });
    fireEvent.change(screen.getByLabelText("WhatsApp Number *"), { target: { value: "+256700000001" } });
    fireEvent.change(screen.getByLabelText("WhatsApp Phone Number ID *"), { target: { value: "123456789" } });
    fireEvent.change(screen.getByLabelText("WhatsApp Access Token *"), { target: { value: "token-abc" } });
    fireEvent.change(screen.getByLabelText("Admin Email *"), { target: { value: "admin@lakeview.com" } });

    fireEvent.click(screen.getByRole("button", { name: "Onboard Hotel" }));

    await waitFor(() => expect(mockOnboardHotel).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Onboarding Complete")).toBeInTheDocument();
    expect(screen.getByText("HSC-9081")).toBeInTheDocument();
  });
});
