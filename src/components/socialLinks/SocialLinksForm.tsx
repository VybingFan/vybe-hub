import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SOCIAL_FIELDS, type CreatorProfileInput } from "@/features/profile/schema";

interface Props {
  control: Control<CreatorProfileInput>;
  register: UseFormRegister<CreatorProfileInput>;
  errors: FieldErrors<CreatorProfileInput>;
}

export function SocialLinksForm({ control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "personal_links" });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Website" error={errors.website?.message}>
          <Input placeholder="https://your-site.com" {...register("website")} />
        </Field>
        {SOCIAL_FIELDS.map((f) => (
          <Field key={f.key} label={f.label} error={errors[f.key]?.message}>
            <Input placeholder={f.placeholder} {...register(f.key)} />
          </Field>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Personal links</Label>
            <p className="text-xs text-muted-foreground">Add up to 10 custom links.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: "", url: "" })}
            disabled={fields.length >= 10}
          >
            <Plus className="mr-1 h-4 w-4" /> Add link
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
            <Input placeholder="Label" {...register(`personal_links.${index}.label` as const)} />
            <Input placeholder="https://…" {...register(`personal_links.${index}.url` as const)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
