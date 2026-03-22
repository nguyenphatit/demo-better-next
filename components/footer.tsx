export function Footer() {
  return (
    <footer className="border-t bg-background py-4">
      <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} SaaS Starter. All rights reserved.</p>
      </div>
    </footer>
  );
}
