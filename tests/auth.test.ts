import { auth } from "../lib/auth";

describe("Auth Setup", () => {
    it("should have auth initialized with emailAndPassword enabled", () => {
        expect(auth.options.emailAndPassword?.enabled).toBe(true);
    });

    it("should have drizzle adapter configured", () => {
        expect(auth.options.database).toBeDefined();
    });
});
