import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDuration, type Track } from "@/features/music/schema";

interface Props {
  tracks: Track[];
  onEdit: (track: Track) => void;
  onDelete: (track: Track) => void;
  onToggleFeatured?: (track: Track) => void;
}

export function MusicTable({ tracks, onEdit, onDelete, onToggleFeatured }: Props) {
  const [confirm, setConfirm] = useState<Track | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Artist credit</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Release</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {t.is_featured && <Star className="h-3.5 w-3.5 text-primary" />}
                    <span className="line-clamp-1">{t.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {t.primary_artist_name || "—"}
                  {t.featured_artist_names?.length
                    ? ` feat. ${t.featured_artist_names.join(", ")}`
                    : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">{t.genre || "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={t.status === "published" ? "default" : "outline"}
                    className="capitalize"
                  >
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.release_date || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDuration(t.duration_sec)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(t)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      {onToggleFeatured && (
                        <DropdownMenuItem onClick={() => onToggleFeatured(t)}>
                          <Star className="mr-2 h-4 w-4" />
                          {t.is_featured ? "Clear profile lead" : "Set as profile lead"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => setConfirm(t)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{confirm?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The track and its audio file will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirm) onDelete(confirm);
                setConfirm(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
