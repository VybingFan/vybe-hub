import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasActiveCreatorFocus } from "@/features/membership/access";
import type { CreatorFocusCode } from "@/features/membership/creatorFocusAccess";
import { creatorFocusService } from "@/services/membership/creatorFocusService";

export function CreatorFocusGuard({ focus, title, description, children }: {
  focus: CreatorFocusCode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const access = useQuery({ queryKey: ["creator-focus-access"], queryFn: creatorFocusService.getMine });
  if (access.isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (!hasActiveCreatorFocus(focus, access.data?.access)) return (
    <div className="mx-auto max-w-2xl"><Card><CardContent className="p-8 text-center">
      <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <Button asChild className="mt-5"><Link to="/creator-focuses">Review Creator Focuses</Link></Button>
    </CardContent></Card></div>
  );
  return <>{children}</>;
}
