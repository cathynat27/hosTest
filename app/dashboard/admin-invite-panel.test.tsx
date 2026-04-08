import { render, screen } from "@testing-library/react";
import AdminInvitePanel from "./admin-invite-panel";

describe("AdminInvitePanel", () => {
  it("is hidden for staff users", () => {
    render(<AdminInvitePanel isAdmin={false} />);

    expect(screen.queryByText("Admin Invites")).not.toBeInTheDocument();
  });

  it("is visible for admin users", () => {
    render(<AdminInvitePanel isAdmin />);

    expect(screen.getByText("Admin Invites")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send staff invite/i })).toBeInTheDocument();
  });
});
