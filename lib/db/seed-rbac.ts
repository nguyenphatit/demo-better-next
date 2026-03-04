import { db } from "./index";
import { role, permission, rolePermission } from "./schema";
import { v4 as uuidv4 } from "uuid";
import { eq, and, isNull } from "drizzle-orm";

async function seed() {
	console.log("Seeding default roles and permissions...");

	const permissions = [
		{ id: uuidv4(), name: "user.create", description: "Create users" },
		{ id: uuidv4(), name: "user.read", description: "Read users" },
		{ id: uuidv4(), name: "user.update", description: "Update users" },
		{ id: uuidv4(), name: "user.delete", description: "Delete users" },
		{ id: uuidv4(), name: "org.update", description: "Update organization" },
	];

	for (const p of permissions) {
		await db.insert(permission).values({
			...p,
			createdAt: new Date(),
			updatedAt: new Date(),
		}).onConflictDoUpdate({
            target: permission.name,
            set: { description: p.description, updatedAt: new Date() }
        });
	}

	const roles = [
		{ id: uuidv4(), name: "Admin", description: "Administrator with full access" },
		{ id: uuidv4(), name: "Manager", description: "Manager with elevated access" },
		{ id: uuidv4(), name: "User", description: "Regular user with limited access" },
	];

	const permissionRecords = await db.select().from(permission);
	const permMap = new Map(permissionRecords.map(p => [p.name, p.id]));

	for (const r of roles) {
        // Check if role exists (system role has no organizationId)
        let existingRole = await db.query.role.findFirst({
            where: and(eq(role.name, r.name), isNull(role.organizationId))
        });

        let roleId: string;
        if (!existingRole) {
            const [insertedRole] = await db.insert(role).values({
                ...r,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();
            roleId = insertedRole.id;
        } else {
            await db.update(role).set({
                description: r.description,
                updatedAt: new Date()
            }).where(eq(role.id, existingRole.id));
            roleId = existingRole.id;
        }

		let rolePerms: string[] = [];
		if (r.name === "Admin") {
			rolePerms = ["user.create", "user.read", "user.update", "user.delete", "org.update"];
		} else if (r.name === "Manager") {
			rolePerms = ["user.create", "user.read", "user.update"];
		} else if (r.name === "User") {
			rolePerms = ["user.read"];
		}

		for (const permName of rolePerms) {
			const permId = permMap.get(permName);
			if (permId) {
                // Check if association already exists to prevent duplicates
                const existingAssoc = await db.query.rolePermission.findFirst({
                    where: and(
                        eq(rolePermission.roleId, roleId),
                        eq(rolePermission.permissionId, permId)
                    )
                });

                if (!existingAssoc) {
                    await db.insert(rolePermission).values({
                        id: uuidv4(),
                        roleId: roleId,
                        permissionId: permId,
                        createdAt: new Date(),
                    });
                }
			}
		}
	}

	console.log("Seeding completed successfully.");
    process.exit(0);
}

seed().catch((err) => {
	console.error("Seeding failed:", err);
	process.exit(1);
});
