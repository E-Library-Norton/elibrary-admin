'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconStar,
  IconStarFilled,
  IconSearch,
  IconTrash,
  IconEye,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconBook,
  IconUser,
  IconMessageCircle,
} from '@tabler/icons-react';
import { MoreHorizontal } from 'lucide-react';
import {
  useGetReviewsQuery,
  useGetReviewStatsQuery,
  useDeleteReviewMutation,
  type Review,
} from '@/services/reviewApi';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? (
          <IconStarFilled key={i} className='h-3.5 w-3.5 text-amber-500' />
        ) : (
          <IconStar key={i} className='h-3.5 w-3.5 text-muted-foreground/30' />
        )
      )}
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  // List state
  const [page, setPage]           = useState(1);
  const [ratingFilter, setRating] = useState('all');
  const [search, setSearch]       = useState('');
  const [searchDebounced, setSD]  = useState('');

  // Detail dialog
  const [selectedReview, setSelected] = useState<Review | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Auto-debounce main search (400 ms)
  useEffect(() => {
    const t = setTimeout(() => { setSD(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Queries
  const { data, isLoading, isFetching, refetch } = useGetReviewsQuery({
    page,
    limit: 10,
    rating: ratingFilter !== 'all' ? Number(ratingFilter) : undefined,
    search: searchDebounced || undefined,
  });
  const { data: statsData } = useGetReviewStatsQuery();

  // Mutations
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const reviews    = data?.data.reviews    ?? [];
  const total      = data?.data.total      ?? 0;
  const totalPages = data?.data.totalPages ?? 1;
  const stats      = statsData?.data;

  // Handlers
  const openDetail = (r: Review) => {
    setSelected(r);
    setDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReview(id).unwrap();
      toast.success('Review deleted successfully');
      setDeleteId(null);
      if (detailOpen) setDetailOpen(false);
    } catch {
      toast.error('Failed to delete review');
    }
  };

  return (
    <PageContainer scrollable pageTitle='Reviews' pageDescription='View and manage all book reviews submitted by users.'>
      <div className='space-y-6'>

        {/* ── Stats Cards ── */}
        {stats && (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7'>
            {/* Total */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total</CardTitle>
                <IconMessageCircle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.total}</div>
              </CardContent>
            </Card>
            {/* Avg */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Avg Rating</CardTitle>
                <IconStarFilled className='h-4 w-4 text-amber-400' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.averageRating ?? '—'}</div>
              </CardContent>
            </Card>
            {/* Per star */}
            {[5, 4, 3, 2, 1].map((star) => (
              <Card key={star}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>{star} Star{star > 1 ? 's' : ''}</CardTitle>
                  <IconStarFilled className='h-4 w-4 text-amber-400' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{stats.byRating[star] ?? 0}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative flex-1 min-w-[200px] max-w-sm'>
            <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search book title or username…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>
          <Select value={ratingFilter} onValueChange={(v) => { setRating(v); setPage(1); }}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='All Ratings' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={r.toString()}>
                  {'★'.repeat(r)}{'☆'.repeat(5 - r)} {r} star{r > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant='outline' size='icon' onClick={() => refetch()} disabled={isFetching}>
            <IconRefresh className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* ── Table ── */}
        <Card>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='flex items-center justify-center p-16 text-muted-foreground'>
                <IconRefresh className='mr-2 h-5 w-5 animate-spin' /> Loading…
              </div>
            ) : reviews.length === 0 ? (
              <div className='flex flex-col items-center justify-center p-16 text-muted-foreground'>
                <IconMessageCircle className='mb-3 h-10 w-10 opacity-30' />
                <p className='text-sm'>No reviews found</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      <th className='px-4 py-3 text-left font-medium'>Book</th>
                      <th className='hidden sm:table-cell px-4 py-3 text-left font-medium'>Comment</th>
                      <th className='px-4 py-3 text-left font-medium'>Rating</th>
                      <th className='hidden md:table-cell px-4 py-3 text-left font-medium'>From</th>
                      <th className='hidden lg:table-cell px-4 py-3 text-left font-medium'>Date</th>
                      <th className='px-4 py-3 text-right font-medium'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => (
                      <tr
                        key={review.id}
                        className='border-b transition-colors hover:bg-muted/30 cursor-pointer'
                        onClick={() => openDetail(review)}
                      >
                        {/* Book */}
                        <td className='px-4 py-3 max-w-[160px] sm:max-w-[200px]'>
                          <div className='flex items-center gap-2'>
                            {review.Book ? (
                              <img
                                src={`/api/books/${review.Book.id}/cover`}
                                alt={review.Book.title}
                                className='h-10 w-7 rounded object-cover shrink-0 bg-muted'
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`h-10 w-7 rounded bg-muted flex items-center justify-center shrink-0 ${review.Book ? 'hidden' : ''}`}>
                              <IconBook className='h-3.5 w-3.5 text-muted-foreground' />
                            </div>
                            <div className='min-w-0'>
                              <span className='truncate font-medium text-xs block'>
                                {review.Book?.title ?? '—'}
                              </span>
                              {/* Show comment + user inline on mobile */}
                              <span className='truncate text-xs text-muted-foreground block sm:hidden'>
                                {review.comment || 'No comment'}
                              </span>
                              <span className='text-xs text-muted-foreground block md:hidden'>
                                {review.User ? `${review.User.firstName ?? ''} ${review.User.lastName ?? review.User.username}`.trim() : 'Anonymous'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Comment */}
                        <td className='hidden sm:table-cell px-4 py-3 max-w-[220px]'>
                          {review.comment ? (
                            <p className='truncate text-xs text-muted-foreground'>{review.comment}</p>
                          ) : (
                            <span className='text-xs text-muted-foreground/50 italic'>No comment</span>
                          )}
                        </td>

                        {/* Rating */}
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-1.5'>
                            <StarRatingDisplay rating={review.rating} />
                            <Badge variant='outline' className='text-xs px-1.5 py-0 hidden sm:inline-flex'>
                              {review.rating}/5
                            </Badge>
                          </div>
                        </td>

                        {/* From */}
                        <td className='hidden md:table-cell px-4 py-3 text-xs'>
                          {review.User ? (
                            <span className='font-medium'>
                              {review.User.firstName ?? ''} {review.User.lastName ?? review.User.username}
                            </span>
                          ) : (
                            <span className='text-muted-foreground'>Anonymous</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className='hidden lg:table-cell px-4 py-3 text-xs text-muted-foreground whitespace-nowrap'>
                          {formatDate(review.created_at)}
                        </td>

                        {/* Actions */}
                        <td className='px-4 py-3 text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(review); }}>
                                <IconEye className='mr-2 h-3.5 w-3.5' /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive focus:text-destructive'
                                onClick={(e) => { e.stopPropagation(); setDeleteId(review.id); }}
                              >
                                <IconTrash className='mr-2 h-3.5 w-3.5' /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages >= 1 && (
              <div className='flex items-center justify-between border-t px-4 py-3 text-sm'>
                <p className='text-muted-foreground text-xs'>
                  Page {page} of {totalPages} · {total} total
                </p>
                <div className='flex items-center gap-1'>
                  <Button variant='outline' size='icon' className='h-8 w-8' disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <IconChevronLeft className='h-4 w-4' />
                  </Button>
                  {(() => {
                    const half  = 3;
                    const start = Math.max(1, Math.min(page - half, totalPages - 5));
                    const end   = Math.min(totalPages, start + 5);
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                      <Button key={p} variant={page === p ? 'default' : 'outline'} size='icon' className='h-8 w-8 text-xs' onClick={() => setPage(p)}>
                        {p}
                      </Button>
                    ));
                  })()}
                  <Button variant='outline' size='icon' className='h-8 w-8' disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <IconChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className='max-w-lg max-h-[85vh] overflow-y-auto'>
          {selectedReview && (
            <>
              <DialogHeader>
                <div className='flex items-center gap-2 mb-1'>
                  <StarRatingDisplay rating={selectedReview.rating} />
                  <Badge variant='outline'>{selectedReview.rating}/5</Badge>
                </div>
                <DialogTitle className='text-lg'>
                  {selectedReview.Book?.title ?? 'Unknown Book'}
                </DialogTitle>
                <DialogDescription className='text-xs'>
                  {formatDate(selectedReview.created_at)}
                  {selectedReview.User && (
                    <> · By{' '}
                      <span className='font-medium'>
                        {selectedReview.User.firstName ?? ''} {selectedReview.User.lastName ?? selectedReview.User.username}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                {/* Book info */}
                {selectedReview.Book && (
                  <div className='flex items-center gap-3 rounded-lg bg-muted/50 p-3'>
                      <img
                        src={`/api/books/${selectedReview.Book.id}/cover`}
                        alt={selectedReview.Book.title}
                        className='h-16 w-12 rounded object-cover shrink-0 bg-muted'
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
                        }}
                      />
                      <div className='h-16 w-12 rounded bg-muted hidden items-center justify-center shrink-0'>
                        <IconBook className='h-6 w-6 text-muted-foreground' />
                      </div>
                    <div>
                      <p className='font-medium text-sm'>{selectedReview.Book.title}</p>
                      {selectedReview.Book.titleKh && (
                        <p className='text-xs text-muted-foreground'>{selectedReview.Book.titleKh}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Comment */}
                {selectedReview.comment ? (
                  <div className='rounded-lg bg-muted/50 p-4'>
                    <p className='text-sm whitespace-pre-wrap'>{selectedReview.comment}</p>
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground italic'>No comment provided.</p>
                )}

                {/* User */}
                {selectedReview.User && (
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <IconUser className='h-3.5 w-3.5' />
                    <span>
                      {selectedReview.User.firstName ?? ''} {selectedReview.User.lastName ?? ''} (@{selectedReview.User.username})
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter className='gap-2'>
                <Button variant='destructive' size='sm' onClick={() => { setDeleteId(selectedReview.id); setDetailOpen(false); }}>
                  <IconTrash className='h-4 w-4 mr-1' /> Delete
                </Button>
                <Button variant='outline' size='sm' onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Review?</DialogTitle>
            <DialogDescription>This action cannot be undone. The review will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant='destructive' disabled={isDeleting} onClick={() => deleteId && handleDelete(deleteId)}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </PageContainer>
  );
}
