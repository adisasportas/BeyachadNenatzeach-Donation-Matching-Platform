import { isAdmin, ADMIN_UID } from "./admin";

describe("isAdmin", () => {
  test("recognizes the admin by UID in every supported shape", () => {
    expect(isAdmin(ADMIN_UID)).toBe(true);
    expect(isAdmin({ uid: ADMIN_UID })).toBe(true);
    expect(isAdmin({ id: ADMIN_UID })).toBe(true);
    expect(isAdmin({ docId: ADMIN_UID })).toBe(true);
  });

  test("does not trust the user name or full name", () => {
    expect(isAdmin({ uid: "someone-else", userName: "admin", fullName: "admin" })).toBe(false);
  });

  test("returns false when there is no user", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin({})).toBe(false);
  });
});
