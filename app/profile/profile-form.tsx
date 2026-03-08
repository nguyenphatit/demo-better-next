"use client";

import { useActionState, useEffect } from "react";
import { updateProfileAction } from "./actions";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileFormProps {
	user: {
		name: string;
		email: string;
		image?: string | null;
	};
}

export function ProfileForm({ user }: ProfileFormProps) {
	const [state, action, isPending] = useActionState(updateProfileAction, null);

	useEffect(() => {
		if (state?.success) {
			toast.success(state.success);
			authClient.getSession();
		} else if (state?.error) {
			toast.error(state.error);
		}
	}, [state]);

	return (
		<form action={action}>
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Profile Management</CardTitle>
					<CardDescription>Update your display name and avatar.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" value={user.email} disabled />
					</div>
					<div className="space-y-2">
						<Label htmlFor="name">Display Name</Label>
						<Input id="name" name="name" defaultValue={user.name} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="image">Avatar URL</Label>
						<Input id="image" name="image" defaultValue={user.image || ""} placeholder="https://example.com/avatar.png" />
					</div>
				</CardContent>
				<CardFooter>
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Updating..." : "Update Profile"}
					</Button>
				</CardFooter>
			</Card>
		</form>
	);
}
