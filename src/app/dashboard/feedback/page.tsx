'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  IconMessageCircle,
  IconBug,
  IconBulb,
  IconBook,
  IconUser,
  IconStar,
  IconStarFilled,
  IconSearch,
  IconTrash,
  IconEye,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconInbox,
  IconChecks,
  IconClock,
  IconCircleCheck,
  IconX,
} from '@tabler/icons-react';
import { MoreHorizontal } from 'lucide-react';
import {
  useGetFeedbackQuery,
  useGetFeedbackStatsQuery,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
  type Feedback,
} from '@/services/feedbackApi';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof IconInbox }> = {
  new:         { label: 'New',         color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',     icon: IconInbox },
  reviewed:    { label: 'Reviewed',    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: IconEye },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: IconClock },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',   icon: IconCircleCheck },
  closed:      { label: 'Closed',      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',       icon: IconChecks },
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof IconMessageCircle }> = {
  general: { label: 'General',  icon: IconMessageCircle },
  bug:     { label: 'Bug',      icon: IconBug },
  feature: { label: 'Feature',  icon: IconBulb },
  content: { label: 'Content',  icon: IconBook },
  account: { label: 'Account',  icon: IconUser },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <Badge variant="outline" className={`${cfg.color} border-0 gap-1 text-xs font-medium`}>
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
  return (
    <Badge variant="secondary" className="gap-1 text-xs font-medium">
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <IconStarFilled key={s} className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <IconStar key={s} className="h-3.5 w-3.5 text-muted-foreground/30" />
        )
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  // State
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  // Queries
  const { data: feedbackData, isLoading, isFetching, refetch } = useGetFeedbackQuery({
    page,
    limit: 5,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type:   typeFilter   !== 'all' ? typeFilter   : undefined,
    search: searchDebounced || undefined,
  });
  const { data: statsData } = useGetFeedbackStatsQuery();

  // Mutations
  const [updateFeedback, { isLoading: isUpdating }] = useUpdateFeedbackMutation();
  const [deleteFeedback, { isLoading: isDeleting }] = useDeleteFeedbackMutation();

  const feedbackList  = feedbackData?.data.feedbacks ?? [];
  const total         = feedbackData?.data.total ?? 0;
  const totalPages    = feedbackData?.data.totalPages ?? 1;
  const stats         = statsData?.data;

  // Handlers
  const openDetail = (fb: Feedback) => {
    setSelectedFeedback(fb);
    setAdminNotes(fb.adminNotes ?? '');
    setUpdateStatus(fb.status);
    setDetailOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedFeedback) return;
    try {
      await updateFeedback({
        id: selectedFeedback.id,
        data: {
          status:     updateStatus !== selectedFeedback.status ? updateStatus : undefined,
          adminNotes: adminNotes !== (selectedFeedback.adminNotes ?? '') ? adminNotes : undefined,
        },
      }).unwrap();
      toast.success('Feedback updated successfully');
      setDetailOpen(false);
    } catch {
      toast.error('Failed to update feedback');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFeedback(id).unwrap();
      toast.success('Feedback deleted');
      setDeleteConfirm(null);
      if (detailOpen) setDetailOpen(false);
    } catch {
      toast.error('Failed to delete feedback');
    }
  };

  return (
    <PageContainer scrollable pageTitle="Feedback" pageDescription="Manage student feedback, feature requests and bug reports.">
      <div className="space-y-6">

        {/* ── Stats Cards ── */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{cfg.label}</CardTitle>
                  <cfg.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.byStatus[key] ?? 0}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subject, message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <IconRefresh className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* ── Feedback Table ── */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-16 text-muted-foreground">
                <IconRefresh className="mr-2 h-5 w-5 animate-spin" /> Loading…
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
                <IconInbox className="mb-3 h-10 w-10" />
                <p className="text-sm">No feedback found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Subject</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left font-medium">Rating</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left font-medium">From</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackList.map((fb) => (
                      <tr
                        key={fb.id}
                        className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() => openDetail(fb)}
                      >
                        <td className="px-4 py-3 max-w-[180px] sm:max-w-[250px]">
                          <p className="truncate font-medium">{fb.subject}</p>
                          <p className="truncate text-xs text-muted-foreground mt-0.5">{fb.message}</p>
                          {/* Show type+rating inline on mobile */}
                          <div className="flex items-center gap-2 mt-1 sm:hidden">
                            <TypeBadge type={fb.type} />
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3"><TypeBadge type={fb.type} /></td>
                        <td className="px-4 py-3"><StatusBadge status={fb.status} /></td>
                        <td className="hidden md:table-cell px-4 py-3"><StarRating rating={fb.rating} /></td>
                        <td className="hidden lg:table-cell px-4 py-3 text-xs">
                          {fb.User ? (
                            <span className="font-medium">
                              {fb.User.firstName ?? ''} {fb.User.lastName ?? fb.User.username}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{fb.name || fb.email || 'Anonymous'}</span>
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(fb.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetail(fb); }}>
                                <IconEye className="mr-2 h-3.5 w-3.5" /> View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(fb.id); }}
                              >
                                <IconTrash className="mr-2 h-3.5 w-3.5" /> Delete
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

            {/* Pagination — always visible */}
            {totalPages >= 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                <p className="text-muted-foreground text-xs">
                  Page {page} of {totalPages} · {total} total
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                  </Button>
                  {(() => {
                    const half  = 3;
                    const start = Math.max(1, Math.min(page - half, totalPages - 5));
                    const end   = Math.min(totalPages, start + 5);
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                      <Button
                        key={p}
                        variant={page === p ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8 text-xs"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ));
                  })()}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <TypeBadge type={selectedFeedback.type} />
                  <StatusBadge status={selectedFeedback.status} />
                </div>
                <DialogTitle className="text-lg">{selectedFeedback.subject}</DialogTitle>
                <DialogDescription className="text-xs">
                  {formatDate(selectedFeedback.created_at)}
                  {selectedFeedback.User && (
                    <> · By <span className="font-medium">{selectedFeedback.User.firstName ?? ''} {selectedFeedback.User.lastName ?? selectedFeedback.User.username}</span></>
                  )}
                  {!selectedFeedback.User && selectedFeedback.name && (
                    <> · By <span className="font-medium">{selectedFeedback.name}</span></>
                  )}
                  {!selectedFeedback.User && selectedFeedback.email && (
                    <> · {selectedFeedback.email}</>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Rating */}
                {selectedFeedback.rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Rating:</span>
                    <StarRating rating={selectedFeedback.rating} />
                  </div>
                )}

                {/* Message */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>

                {/* Resolver info */}
                {selectedFeedback.Resolver && (
                  <p className="text-xs text-muted-foreground">
                    Resolved by <span className="font-medium">{selectedFeedback.Resolver.firstName ?? selectedFeedback.Resolver.username}</span>
                    {selectedFeedback.resolvedAt && <> on {formatDate(selectedFeedback.resolvedAt)}</>}
                  </p>
                )}

                {/* Update status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Status</label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea
                    rows={3}
                    placeholder="Internal notes about this feedback…"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirm(selectedFeedback.id)}
                  disabled={isDeleting}
                >
                  <IconTrash className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving…' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Feedback?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The feedback will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
