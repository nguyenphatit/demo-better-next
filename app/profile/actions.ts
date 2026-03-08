"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function updateProfileAction(prevState: any, formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return { error: "Not authenticated" };
	}

	const name = formData.get("name") as string;
	const image = formData.get("image") as string;

	if (!name) {
		return { error: "Name is required" };
	}

	try {
		await auth.api.updateUser({
			headers: await headers(),
			body: {
				name,
				image,
			},
		});

		return { success: "Profile updated successfully" };
	} catch (error) {
		console.error("Error updating profile:", error);
		return { error: "Failed to update profile" };
	}
}
