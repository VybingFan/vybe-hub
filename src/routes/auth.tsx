import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/Logo";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="bg-gradient-hero absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/">
            <Logo variant="horizontal" />
          </Link>
          <div>
            <h2 className="max-w-md font-display text-4xl font-semibold leading-tight tracking-tight">
              Release music. Grow an audience. Get paid directly.
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              A creator platform built for independent artists — from Aision Labs.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/">
              <Logo variant="horizontal" />
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
