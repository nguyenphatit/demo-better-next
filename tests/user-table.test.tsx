import { render, screen } from "@testing-library/react";
import { UserTable } from "@/components/admin/user-table";
import { describe, it, expect, vi } from "vitest";

const mockData = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    status: "Active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "member",
    status: "Pending",
  },
];

describe("UserTable", () => {
  it("renders the table with correct headers", () => {
    render(<UserTable data={mockData} />);
    expect(screen.getByText("Display Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders user data correctly", () => {
    render(<UserTable data={mockData} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders roles and status with badges", () => {
    render(<UserTable data={mockData} />);
    const adminBadge = screen.getByText("admin");
    const activeBadge = screen.getByText("Active");
    expect(adminBadge).toBeInTheDocument();
    expect(activeBadge).toBeInTheDocument();
  });

  it("renders 'No results' when data is empty", () => {
    render(<UserTable data={[]} />);
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("hides actions when permissions are missing", () => {
    const { queryByRole } = render(
      <UserTable data={mockData} currentUserRole="admin" permissions={[]} />
    );
    // The "Open menu" button should not be present
    expect(queryByRole("button", { name: /open menu/i })).not.toBeInTheDocument();
  });

  it("shows actions when permissions are present", () => {
    const { getAllByRole } = render(
      <UserTable data={mockData} currentUserRole="admin" permissions={["user.update"]} />
    );
    // There are 2 users in mockData, both should have the actions menu since admin is higher role
    expect(getAllByRole("button", { name: /open menu/i })).toHaveLength(2);
  });
});
