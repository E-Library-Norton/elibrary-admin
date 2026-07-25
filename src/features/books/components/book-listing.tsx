import { searchParamsCache } from '@/lib/searchparams';
import { BookTable } from './book-tables';
import type { Book } from '@/services/bookApi';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function getBooks(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.set(k, String(v));
  });

  try {
    const res = await fetch(`${BACKEND_URL}/books?${query}`, { cache: 'no-store' });
    if (!res.ok) return { books: [] as Book[], total: 0 };
    const json = await res.json();
    return {
      books: (json.data?.books ?? []) as Book[],
      total: (json.data?.total ?? 0) as number
    };
  } catch {
    return { books: [] as Book[], total: 0 };
  }
}

async function getCategories(): Promise<{ value: string; label: string }[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/categories?limit=200`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    // categoryController returns ResponseFormatter.success(res, categories) → data is array
    const raw = json.data;
    const list: { id: string; name: string }[] = Array.isArray(raw) ? raw : (raw?.categories ?? []);
    return list.map((c) => ({ value: c.name, label: c.name }));
  } catch {
    return [];
  }
}

export default async function BookListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const categories = searchParamsCache.get('category');
  const sortBy = searchParamsCache.get('sortBy');
  const sortOrder = searchParamsCache.get('sortOrder');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(categories && { categoryName: categories }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder })
  };

  const [{ books, total }, categoryOptions] = await Promise.all([
    getBooks(filters),
    getCategories(),
  ]);

  return (
    <BookTable
      data={books}
      totalItems={total}
      categoryOptions={categoryOptions}
    />
  );
}
