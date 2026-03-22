"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    const { data, error } = await authClient.organization.create({
      name,
      slug,
    });

    if (error) {
      setLoading(false);
      toast.error(error.message || "Failed to create organization. Please try again.");
      return;
    }

    if (data?.id) {
      await authClient.organization.setActive({ organizationId: data.id });
    }

    setLoading(false);

    toast.success("Organization created successfully!");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create Organization</CardTitle>
          <CardDescription className="text-center">
            Enter the details for your new organization
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Acme Corp"
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Organization Slug</Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="acme-corp"
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
