import { auth } from "./lib/auth";
import { headers } from "next/headers";

async function test() {
  await auth.api.createInvitation({
      headers: await headers(),
      body: {
          email: "test@test.com",
          role: "member",
          organizationId: "org1",
      }
  });
}
