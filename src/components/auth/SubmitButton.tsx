import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props extends ButtonProps {
  loading?: boolean;
}

export function SubmitButton({ loading, children, className, ...rest }: Props) {
  return (
    <Button
      type="submit"
      disabled={loading || rest.disabled}
      className={cn("w-full bg-gradient-brand text-primary-foreground shadow-glow", className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}
