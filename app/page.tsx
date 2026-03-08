import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Shield, Zap, Users, Globe } from "lucide-react";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container space-y-6 py-24 md:py-32 lg:py-48 text-center">
          <Badge variant="secondary" className="mb-4">
            New Version 2.0 is out!
          </Badge>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Build your next SaaS <br className="hidden sm:inline" />
            faster than ever before.
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            The modern starter kit for production-ready applications. Fully
            integrated with Better Auth, Drizzle ORM, and Shadcn UI.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything you need
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground">
              Powerful features to help you launch and scale your business quickly and efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Built with Next.js App Router and optimized for performance from day one.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Secure by Default</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enterprise-grade authentication and RBAC powered by Better Auth.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Multi-tenancy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full support for organizations, team members, and role-based permissions.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Global Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Deploy worldwide with Vercel and Edge-ready database connections.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24">
          <div className="bg-primary rounded-3xl py-16 px-8 text-center text-primary-foreground space-y-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to start your journey?
            </h2>
            <p className="mx-auto max-w-[600px] opacity-90 md:text-xl">
              Join thousands of developers building amazing products with our platform.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-12 px-8">
                Join Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
