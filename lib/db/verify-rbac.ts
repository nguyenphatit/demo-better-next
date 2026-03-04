import { db } from "./index";
import { role, permission, rolePermission } from "./schema";
import { count, eq } from "drizzle-orm";

async function verify() {
	console.log("Verifying RBAC seeding...");

	const roleCount = await db.select({ value: count() }).from(role);
	console.log(`Roles: ${roleCount[0].value}`);

	const permCount = await db.select({ value: count() }).from(permission);
	console.log(`Permissions: ${permCount[0].value}`);

	const rolePermCount = await db.select({ value: count() }).from(rolePermission);
	console.log(`Role-Permissions associations: ${rolePermCount[0].value}`);

	const roles = await db.select().from(role);
	for (const r of roles) {
		const perms = await db
			.select({ name: permission.name })
			.from(rolePermission)
			.innerJoin(permission, eq(rolePermission.permissionId, permission.id))
			.where(eq(rolePermission.roleId, r.id));

		console.log(`Role: ${r.name}, Permissions: ${perms.map(p => p.name).join(", ")}`);
	}

	if (roleCount[0].value === 3 && permCount[0].value === 5) {
		console.log("Verification successful!");
	} else {
		console.error("Verification failed! Unexpected counts.");
	}
    process.exit(0);
}

verify().catch((err) => {
	console.error("Verification failed with error:", err);
	process.exit(1);
});
