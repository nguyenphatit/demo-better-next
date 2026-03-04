import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
            organization: schema.organization,
            member: schema.member,
            invitation: schema.invitation,
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            tenantId: {
                type: "string",
                required: true,
            }
        }
    },
    plugins: [
        organization(),
    ],
});
