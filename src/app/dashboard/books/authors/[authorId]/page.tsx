"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Globe,
  Loader2,
  UserRound,
} from "lucide-react";
import PageContainer from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAuthorByIdQuery } from "@/services/authorApi";

const PAGE_SIZE = 12;

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function AuthorDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <Card>
        <CardContent className="flex gap-5 p-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-60" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[3/4] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function AuthorDetailsPage() {
  const { authorId } = useParams<{ authorId: string }>();
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError } = useGetAuthorByIdQuery({
    id: authorId,
    page,
    limit: PAGE_SIZE,
  });

  const author = data?.data;
  const totalPages = Math.max(author?.totalPages ?? 1, 1);

  return (
    <PageContainer
      scrollable
      pageTitle="Author Details"
      pageDescription="View the author profile and every active book connected to it."
    >
      {isLoading ? (
        <AuthorDetailsSkeleton />
      ) : isError || !author ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
            <UserRound className="text-muted-foreground h-12 w-12" />
            <div>
              <h3 className="font-semibold">Author not found</h3>
              <p className="text-muted-foreground text-sm">
                The requested author may have been removed.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/books/authors">
                <ArrowLeft className="h-4 w-4" />
                Back to Authors
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/books/authors">
              <ArrowLeft className="h-4 w-4" />
              Back to Authors
            </Link>
          </Button>

          <Card>
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
              <div className="bg-primary/10 text-primary flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold">
                {getInitials(author.name)}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">{author.name}</h2>
                    {author.nameKh && (
                      <p className="text-muted-foreground">{author.nameKh}</p>
                    )}
                  </div>
                  <Badge className="gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    {author.totalBooks.toLocaleString()} books
                  </Badge>
                </div>

                <p className="text-muted-foreground max-w-3xl leading-relaxed">
                  {author.biography || "No biography has been added yet."}
                </p>

                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {author.website}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Books by {author.name}</h3>
              <p className="text-muted-foreground text-sm">
                {author.totalBooks.toLocaleString()} active books in the library
              </p>
            </div>
            {isFetching && (
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            )}
          </div>

          {author.books.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground flex min-h-56 flex-col items-center justify-center text-center">
                <BookOpen className="mb-3 h-10 w-10 opacity-40" />
                <p className="font-medium">No active books found</p>
                <p className="text-sm">
                  Books linked to this author will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {author.books.map((book) => (
                <Card
                  key={book.id}
                  className="group overflow-hidden transition-shadow hover:shadow-md"
                >
                  <Link href={`/dashboard/books/${book.id}`} className="block">
                    <div className="bg-muted relative aspect-[3/4] overflow-hidden">
                      {book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/books/${book.id}/cover`}
                          alt={`Cover of ${book.title}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-full items-center justify-center">
                          <BookOpen className="h-14 w-14 opacity-40" />
                        </div>
                      )}
                      {book.isPrimaryAuthor && (
                        <Badge className="absolute top-3 left-3">
                          Primary author
                        </Badge>
                      )}
                    </div>
                  </Link>

                  <CardHeader className="space-y-2 pb-3">
                    <CardTitle className="line-clamp-2 text-base">
                      <Link
                        href={`/dashboard/books/${book.id}`}
                        className="hover:underline"
                      >
                        {book.title}
                      </Link>
                    </CardTitle>
                    {book.titleKh && (
                      <p className="text-muted-foreground line-clamp-1 text-sm">
                        {book.titleKh}
                      </p>
                    )}
                  </CardHeader>

                  <CardFooter className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-xs">
                    {book.publicationYear && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {book.publicationYear}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {book.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3.5 w-3.5" />
                      {book.downloads.toLocaleString()}
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-muted-foreground text-xs">
                Page {page} of {totalPages} ·{" "}
                {author.totalBooks.toLocaleString()} books
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
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
