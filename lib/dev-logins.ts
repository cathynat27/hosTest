// TODO: This file should be removed before production
export type DevTestUser = {
  email: string;
  password: string;
  role: "ADMIN" | "STAFF";
  label: string;
};

export const TEST_USERS: DevTestUser[] = [
  { email: "test-admin@hoscover.com", password: "password", role: "ADMIN", label: "Admin" },
  { email: "test-staff@hoscover.com", password: "password", role: "STAFF", label: "Staff" },
];
