"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { CrudFormDialog } from "@/components/crud/crud-form-dialog";
import { KhBadge } from "@/components/crud/crud-table";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateAuthorMutation,
  useDeleteAuthorMutation,
  useGetAuthorsQuery,
  useUpdateAuthorMutation,
  type Author,
} from "@/services/authorApi";

const PAGE_SIZE = 10;

type AuthorForm = {
  name: string;
  nameKh: string;
  biography: string;
  website: string;
};

function emptyForm(): AuthorForm {
  return { name: "", nameKh: "", biography: "", website: "" };
}

function getErrorMessage(error: unknown, fallback: string) {
  const response = error as {
    data?: {
      message?: string;
      error?: { message?: string };
    };
  };
  return response.data?.error?.message ?? response.data?.message ?? fallback;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const visiblePages = 7;
  const half = Math.floor(visiblePages / 2);
  const start = Math.max(
    1,
    Math.min(currentPage - half, totalPages - visiblePages + 1),
  );
  const end = Math.min(totalPages, start + visiblePages - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function AuthorsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [form, setForm] = useState<AuthorForm>(emptyForm);
  const [deleteAuthor, setDeleteAuthor] = useState<Author | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useGetAuthorsQuery({
    page,
    limit: PAGE_SIZE,
    search,
  });
  const [createAuthor, { isLoading: isCreating }] = useCreateAuthorMutation();
  const [updateAuthor, { isLoading: isUpdating }] = useUpdateAuthorMutation();
  const [removeAuthor, { isLoading: isDeleting }] = useDeleteAuthorMutation();

  const authors = data?.data.authors ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = Math.max(data?.data.totalPages ?? 1, 1);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(author: Author) {
    setEditing(author);
    setForm({
      name: author.name,
      nameKh: author.nameKh ?? "",
      biography: author.biography ?? "",
      website: author.website ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    const payload = {
      name: form.name.trim(),
      nameKh: form.nameKh.trim() || undefined,
      biography: form.biography.trim() || undefined,
      website: form.website.trim() || undefined,
    };

    if (!payload.name) {
      toast.error("Name is required");
      return;
    }

    try {
      if (editing) {
        await updateAuthor({ id: editing.id, data: payload }).unwrap();
        toast.success("Author updated successfully");
      } else {
        await createAuthor(payload).unwrap();
        toast.success("Author created successfully");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save author"));
    }
  }

  async function handleDelete() {
    if (!deleteAuthor) return;

    try {
      await removeAuthor(deleteAuthor.id).unwrap();
      toast.success("Author deleted successfully");
      setDeleteAuthor(null);
      if (authors.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete author"));
    }
  }

  return (
    <PageContainer
      scrollable
      pageTitle="Authors"
      pageDescription="Manage authors and view every book linked to each contributor."
      pageHeaderAction={
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Author
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search author name…"
            className="pl-9"
          />
          {isFetching && !isLoading && (
            <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>

        <Card>
          <CardHeader className="border-b py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Author Directory</h3>
                <p className="text-muted-foreground text-sm">
                  {total.toLocaleString()} authors
                </p>
              </div>
              <Badge variant="secondary" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Active books only
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">#</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Name (KH)</TableHead>
                    <TableHead className="text-center">Total Books</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead className="w-16">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 6 }).map((__, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : authors.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground h-40 text-center"
                      >
                        No authors found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    authors.map((author, index) => (
                      <TableRow key={author.id}>
                        <TableCell className="text-muted-foreground text-center text-sm">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/books/authors/${author.id}`}
                            className="font-medium hover:underline"
                          >
                            {author.name}
                          </Link>
                          {author.biography && (
                            <p className="text-muted-foreground mt-0.5 max-w-xs truncate text-xs">
                              {author.biography}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <KhBadge value={author.nameKh} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="secondary" size="sm" asChild>
                            <Link
                              href={`/dashboard/books/authors/${author.id}`}
                              className="gap-1.5"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              {author.totalBooks.toLocaleString()}
                            </Link>
                          </Button>
                        </TableCell>
                        <TableCell>
                          {author.website ? (
                            <a
                              href={author.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary block max-w-52 truncate text-sm hover:underline"
                            >
                              {author.website}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Author actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/books/authors/${author.id}`}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEdit(author)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteAuthor(author)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-muted-foreground text-xs">
              Page {page} of {totalPages} · {total.toLocaleString()} total
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Previous page"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {getPageNumbers(page, totalPages).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={page === pageNumber ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  aria-current={page === pageNumber ? "page" : undefined}
                  disabled={isFetching}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Next page"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <CrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Author" : "New Author"}
        isSubmitting={isCreating || isUpdating}
        onSubmit={handleSubmit}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name (English) *</Label>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Robert C. Martin"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Name (Khmer)</Label>
            <Input
              value={form.nameKh}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nameKh: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input
              type="url"
              value={form.website}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  website: event.target.value,
                }))
              }
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Biography</Label>
            <Textarea
              value={form.biography}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  biography: event.target.value,
                }))
              }
              placeholder="Short biography…"
              rows={4}
            />
          </div>
        </div>
      </CrudFormDialog>

      <AlertDialog
        open={Boolean(deleteAuthor)}
        onOpenChange={(open) => !open && setDeleteAuthor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this author?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAuthor?.name} will be permanently removed. Existing books
              will remain in the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
