import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const ARTIST_GENRES = [
  "Alternative",
  "Blues",
  "Christian",
  "Classical",
  "Country",
  "Dance",
  "Electronic",
  "Folk",
  "Funk",
  "Gospel",
  "Hip-Hop",
  "House",
  "Indie",
  "Jazz",
  "Latin",
  "Lo-fi",
  "Metal",
  "Pop",
  "Punk",
  "R&B",
  "Reggae",
  "Rock",
  "Soul",
  "Spoken Word",
  "World",
];

export function GenrePicker({
  value,
  onChange,
  max = 5,
}: {
  value: string[];
  onChange: (genres: string[]) => void;
  max?: number;
}) {
  const toggle = (genre: string) => {
    if (value.includes(genre)) onChange(value.filter((item) => item !== genre));
    else if (value.length < max) onChange([...value, genre]);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-10 w-full justify-between text-left font-normal"
        >
          <span className={cn("flex flex-wrap gap-1", !value.length && "text-muted-foreground")}>
            {value.length
              ? value.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-primary/12 px-2 py-0.5 text-xs text-primary"
                  >
                    {genre}
                  </span>
                ))
              : "Choose up to five genres"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] p-2">
        <p className="px-2 pb-2 text-xs text-muted-foreground">
          First selection is your primary genre · {value.length}/{max}
        </p>
        <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto">
          {ARTIST_GENRES.map((genre) => {
            const selected = value.includes(genre);
            const disabled = !selected && value.length >= max;
            return (
              <button
                key={genre}
                type="button"
                disabled={disabled}
                onClick={() => toggle(genre)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent",
                  selected && "bg-primary/10",
                  disabled && "cursor-not-allowed opacity-40",
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded border border-border">
                  {selected && <Check className="h-3 w-3 text-primary" />}
                </span>
                {genre}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
