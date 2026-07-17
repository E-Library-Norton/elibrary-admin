"use client";

import { useState, useRef } from "react";
import { FormFileUpload } from "@/components/forms/form-file-upload";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, FileText, X, Video, Headphones } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import * as z from "zod";
import {
  useCreateBookMutation,
  useUpdateBookMutation,
  type Book,
} from "@/services/bookApi";
import {
  useUploadMultipleMutation,
  useUploadSingleMutation,
} from "@/services/uploadApi";
import { useGetCategoriesQuery } from "@/services/categoryApi";
import { useGetDepartmentsQuery } from "@/services/departmentApi";
import { useGetMaterialTypesQuery } from "@/services/materialTypeApi";

// ── Schema

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100 MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg"];
const formSchema = z.object({
  // cover image  →  multer field: "cover"
  coverUrl: z
    .any()
    .optional()
    .refine(
      (files) =>
        !files || files.length === 0 || files?.[0]?.size <= MAX_IMAGE_SIZE,
      "Max image size is 5MB.",
    )
    .refine(
      (files) =>
        !files ||
        files.length === 0 ||
        ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted.",
    ),
  // Primary PDF file  →  multer field: "pdf"
  pdfUrl: z
    .any()
    .optional()
    .refine(
      (files) =>
        !files || files.length === 0 || files?.[0]?.size <= MAX_PDF_SIZE,
      "Max PDF size is 50MB.",
    )
    .refine(
      (files) =>
        !files || files.length === 0 || files?.[0]?.type === "application/pdf",
      "Only PDF files are accepted.",
    ),
  // Video file (optional) → multer field: "video"
  videoUrl: z
    .any()
    .optional()
    .refine(
      (files) =>
        !files || files.length === 0 || files?.[0]?.size <= MAX_VIDEO_SIZE,
      "Max video size is 500MB.",
    )
    .refine(
      (files) =>
        !files ||
        files.length === 0 ||
        ACCEPTED_VIDEO_TYPES.includes(files?.[0]?.type),
      "Only MP4 and WebM video files are accepted.",
    ),
  // Audio file (optional) → multer field: "audio"
  audioUrl: z
    .any()
    .optional()
    .refine(
      (files) =>
        !files || files.length === 0 || files?.[0]?.size <= MAX_AUDIO_SIZE,
      "Max audio size is 100MB.",
    )
    .refine(
      (files) =>
        !files ||
        files.length === 0 ||
        ACCEPTED_AUDIO_TYPES.includes(files?.[0]?.type),
      "Only MP3, WAV, and OGG audio files are accepted.",
    ),
  title: z.string().min(2, "Book title must be at least 2 characters."),
  titleKh: z.string().optional(),
  isbn: z.string().optional(),
  publicationYear: z
    .union([z.number().int().min(1000).max(2100), z.literal("")])
    .optional(),
  pages: z.union([z.number().int().positive(), z.literal("")]).optional(),
  categoryId: z.string().min(1, "Please select a category."),
  departmentId: z.string().optional(),
  typeId: z.string().optional(),
  isActive: z.string().optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

// ── Helpers

const toOptions = (arr: any[]) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => item && item.id != null)
    .map((item) => ({
      value: String(item.id),
      label: String(item.name || item.title || item.code || "Unknown"),
    }));
};

// ── Component

export default function BookForm({
  initialData,
  pageTitle,
}: {
  initialData: Book | null;
  pageTitle: string;
}) {
  const router = useRouter();

  const [createBook, { isLoading: isCreating }] = useCreateBookMutation();
  const [updateBook, { isLoading: isUpdating }] = useUpdateBookMutation();
  const [uploadSingle] = useUploadSingleMutation();
  const [uploadMultiple] = useUploadMultipleMutation();
  const [isUploading, setIsUploading] = useState(false);
  const isSaving = isCreating || isUpdating || isUploading;

  // Local cover preview (object URL after user selects a new file)
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  // Cache-bust key for the cover proxy URL (bumped after successful save)
  const [coverVersion, setCoverVersion] = useState(() => Date.now());
  // ── Authors tag-input state
  const authorInputRef = useRef<HTMLInputElement>(null);
  const [authorNames, setAuthorNames] = useState<string[]>(
    () => initialData?.Authors?.map((a) => a.name) ?? [],
  );
  const [authorInput, setAuthorInput] = useState("");

  // ── Editors tag-input state
  const editorInputRef = useRef<HTMLInputElement>(null);
  const [editorNames, setEditorNames] = useState<string[]>(
    () => initialData?.Editors?.map((e) => e.name) ?? [],
  );
  const [editorInput, setEditorInput] = useState("");

  // ── Publishers tag-input state
  const publisherInputRef = useRef<HTMLInputElement>(null);
  const [publisherNames, setPublisherNames] = useState<string[]>(
    () =>
      initialData?.Publishers?.map((p) => p.name) ??
      (initialData?.Publisher ? [initialData.Publisher.name] : []),
  );
  const [publisherInput, setPublisherInput] = useState("");

  // ── Dropdown data
  const { data: catData } = useGetCategoriesQuery();
  const { data: deptData } = useGetDepartmentsQuery();
  const { data: typeData } = useGetMaterialTypesQuery();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coverUrl: undefined,
      pdfUrl: undefined,
      title: initialData?.title ?? "",
      titleKh: initialData?.titleKh ?? "",
      isbn: initialData?.isbn ?? "",
      publicationYear: initialData?.publicationYear ?? "",
      categoryId: initialData?.Category?.id
        ? String(initialData.Category.id)
        : "",
      departmentId: initialData?.Department?.id
        ? String(initialData.Department.id)
        : "",
      typeId: initialData?.MaterialType?.id
        ? String(initialData.MaterialType.id)
        : "",
      isActive: initialData ? String(initialData.isActive) : "true",
      pages: initialData?.pages ?? "",
      description: initialData?.description ?? "",
    },
  });

  // ── Authors tag-input helpers
  const addAuthorTag = (raw: string) => {
    const names = raw
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    setAuthorNames((prev) => {
      const existing = new Set(prev);
      return [...prev, ...names.filter((n) => !existing.has(n))];
    });
  };

  const handleAuthorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (authorInput.trim()) {
        addAuthorTag(authorInput);
        setAuthorInput("");
      }
    } else if (e.key === "Backspace" && authorInput === "") {
      setAuthorNames((prev) => prev.slice(0, -1));
    }
  };

  // ── Editors tag-input helpers
  const addEditorTag = (raw: string) => {
    const names = raw
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    setEditorNames((prev) => {
      const existing = new Set(prev);
      return [...prev, ...names.filter((n) => !existing.has(n))];
    });
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (editorInput.trim()) {
        addEditorTag(editorInput);
        setEditorInput("");
      }
    } else if (e.key === "Backspace" && editorInput === "") {
      setEditorNames((prev) => prev.slice(0, -1));
    }
  };

  // ── Publishers tag-input helpers
  const addPublisherTag = (raw: string) => {
    const names = raw
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    setPublisherNames((prev) => {
      const existing = new Set(prev);
      return [...prev, ...names.filter((n) => !existing.has(n))];
    });
  };

  const handlePublisherKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (publisherInput.trim()) {
        addPublisherTag(publisherInput);
        setPublisherInput("");
      }
    } else if (e.key === "Backspace" && publisherInput === "") {
      setPublisherNames((prev) => prev.slice(0, -1));
    }
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsUploading(true);

      const hasCover = values.coverUrl?.[0] instanceof File;
      const hasPdf = values.pdfUrl?.[0] instanceof File;
      const hasVideo = values.videoUrl?.[0] instanceof File;
      const hasAudio = values.audioUrl?.[0] instanceof File;

      // Create local cover preview immediately
      if (hasCover) {
        const localPreview = URL.createObjectURL(values.coverUrl![0]);
        setCoverPreview(localPreview);
      }

      // Upload the cover and primary PDF together when either is selected.
      const uploadPromises: Promise<any>[] = [];
      const uploadKeys: string[] = [];

      if (hasCover || hasPdf) {
        const fd = new FormData();
        if (hasCover) fd.append("cover", values.coverUrl![0]);
        if (hasPdf) fd.append("pdf", values.pdfUrl![0]);
        uploadPromises.push(uploadMultiple(fd).unwrap());
        uploadKeys.push("book_files");
      }

      if (hasVideo) {
        const fd = new FormData();
        fd.append("video", values.videoUrl![0]);
        uploadPromises.push(uploadSingle(fd).unwrap());
        uploadKeys.push("video");
      }

      if (hasAudio) {
        const fd = new FormData();
        fd.append("audio", values.audioUrl![0]);
        uploadPromises.push(uploadSingle(fd).unwrap());
        uploadKeys.push("audio");
      }

      // Execute all uploads concurrently
      const uploadResults = await Promise.all(uploadPromises);
      setIsUploading(false);

      // Distribute upload results
      let coverUrl: string | undefined = initialData?.coverUrl ?? undefined;
      let pdfUrl: string | undefined = initialData?.pdfUrl ?? undefined;
      let videoUrl: string | undefined = initialData?.videoUrl ?? undefined;
      let audioUrl: string | undefined = initialData?.audioUrl ?? undefined;

      uploadResults.forEach((res, index) => {
        const key = uploadKeys[index];
        if (key === "book_files") {
          if (res.data.cover_url) coverUrl = res.data.cover_url;
          if (res.data.pdf_url) pdfUrl = res.data.pdf_url;
        } else if (key === "video") {
          videoUrl = res.data.video_url;
        } else if (key === "audio") {
          audioUrl = res.data.audio_url;
        }
      });

      // ── Step 3: Collect final author names + build JSON payload
      const pendingNames = authorInput.trim()
        ? authorInput
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean)
        : [];
      const finalAuthorNames = [
        ...authorNames,
        ...pendingNames.filter((n) => !authorNames.includes(n)),
      ];

      // ── Step 4: Collect final editor names ─────
      const pendingEditorNames = editorInput.trim()
        ? editorInput
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean)
        : [];
      const finalEditorNames = [
        ...editorNames,
        ...pendingEditorNames.filter((n) => !editorNames.includes(n)),
      ];

      // ── Step 5: Collect final publisher names ────
      const pendingPublisherNames = publisherInput.trim()
        ? publisherInput
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean)
        : [];
      const finalPublisherNames = [
        ...publisherNames,
        ...pendingPublisherNames.filter((n) => !publisherNames.includes(n)),
      ];

      const payload = {
        title: values.title,
        ...(values.titleKh && { titleKh: values.titleKh }),
        ...(values.isbn && { isbn: values.isbn }),
        ...(values.publicationYear && {
          publicationYear: Number(values.publicationYear),
        }),
        ...(values.pages && { pages: Number(values.pages) }),
        categoryId: values.categoryId,
        ...(values.departmentId && { departmentId: values.departmentId }),
        ...(values.typeId && { typeId: values.typeId }),
        ...(values.description && { description: values.description }),
        isActive: values.isActive === "true",
        ...(finalAuthorNames.length > 0 && { authorNames: finalAuthorNames }),
        ...(finalEditorNames.length > 0 && { editorNames: finalEditorNames }),
        ...(finalPublisherNames.length > 0 && {
          publisherNames: finalPublisherNames,
        }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(pdfUrl !== undefined && { pdfUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(audioUrl !== undefined && { audioUrl }),
      };

      if (initialData?.id) {
        await updateBook({ id: initialData.id, data: payload }).unwrap();
        // Bump the cover version so the proxy image reloads with the new file
        setCoverVersion(Date.now());
        router.refresh(); // invalidate Next.js Router Cache so list re-fetches fresh data
        toast.success("Book updated successfully!");
      } else {
        await createBook(payload).unwrap();
        toast.success("Book created successfully!");
      }
      router.push("/dashboard/books");
    } catch (err: any) {
      setIsUploading(false);
      console.error("Failed to save book:", err);
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        "Failed to save book. Please try again.";
      toast.error(msg);
      if (msg.toLowerCase().includes("isbn")) {
        form.setError("isbn", {
          type: "manual",
          message: msg,
        });
      }
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          {/* Cover image + PDF upload */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormFileUpload
              control={form.control}
              name="coverUrl"
              label="Book Cover Image"
              description="JPEG / PNG / WebP — max 5 MB"
              config={{
                maxSize: 5 * 1024 * 1024,
                maxFiles: 1,
                acceptedTypes: [
                  "image/jpeg",
                  "image/jpg",
                  "image/png",
                  "image/webp",
                ],
              }}
            />
            <FormFileUpload
              control={form.control}
              name="pdfUrl"
              label="Primary PDF File"
              description="PDF only — max 50 MB"
              config={{
                maxSize: 50 * 1024 * 1024,
                maxFiles: 1,
                acceptedTypes: ["application/pdf"],
              }}
            />
          </div>

          {/* Video and Audio media files */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormFileUpload
              control={form.control}
              name="videoUrl"
              label="Book Introduction Video (optional)"
              description="MP4, WebM — max 500 MB"
              config={{
                maxSize: MAX_VIDEO_SIZE,
                maxFiles: 1,
                acceptedTypes: ACCEPTED_VIDEO_TYPES,
              }}
            />
            <FormFileUpload
              control={form.control}
              name="audioUrl"
              label="Book Audio Narration (optional)"
              description="MP3, WAV, OGG — max 100 MB"
              config={{
                maxSize: MAX_AUDIO_SIZE,
                maxFiles: 1,
                acceptedTypes: ACCEPTED_AUDIO_TYPES,
              }}
            />
          </div>

          {/* Current files — shown only when editing and files already exist */}
          {initialData &&
            (initialData.coverUrl ||
              initialData.pdfUrl ||
              initialData.videoUrl ||
              initialData.audioUrl) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {initialData.coverUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current Cover</p>
                    <div className="relative h-36 w-28 overflow-hidden rounded-lg border">
                      <Image
                        src={
                          coverPreview
                            ? coverPreview
                            : `/api/books/${initialData.id}/cover?v=${coverVersion}`
                        }
                        alt={initialData.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a new image to replace
                    </p>
                  </div>
                )}
                {initialData.pdfUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current PDF</p>
                    <div className="flex flex-col gap-1.5">
                      {initialData.pdfUrl && (
                        <a
                          href={`/api/books/${initialData.id}/stream`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <FileText className="h-4 w-4 text-red-500" />
                          Primary PDF
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a new PDF to replace
                    </p>
                  </div>
                )}
                {initialData.videoUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current Video</p>
                    <a
                      href={initialData.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Video className="h-4 w-4 text-purple-500" />
                      View Video
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Upload a new video to replace
                    </p>
                  </div>
                )}
                {initialData.audioUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current Audio</p>
                    <a
                      href={initialData.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Headphones className="h-4 w-4 text-green-500" />
                      Listen to Audio
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Upload a new audio to replace
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* Title */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormInput
              control={form.control}
              name="title"
              label="Book Title"
              placeholder="Enter book title"
              required
            />
            <FormInput
              control={form.control}
              name="titleKh"
              label="Khmer Title"
              placeholder="ចំណងជើងជាភាសាខ្មែរ"
            />
          </div>

          {/* ISBN / Year / Pages */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 ">
            <FormInput
              control={form.control}
              name="isbn"
              label="ISBN"
              placeholder="e.g. 978-3-16-148410-0"
            />
            <FormInput
              control={form.control}
              name="publicationYear"
              label="Publication Year"
              placeholder="e.g. 2024"
              type="number"
              min={1000}
              max={2100}
            />
            <FormInput
              control={form.control}
              name="pages"
              label="Pages"
              placeholder="e.g. 350"
              type="number"
              min={1}
            />
          </div>

          {/* Category / Department / Material Type / Publisher / Status */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormSelect
              control={form.control}
              name="categoryId"
              label="Category"
              placeholder="Select category"
              options={toOptions(catData?.data ?? [])}
              required
            />
            <FormSelect
              control={form.control}
              name="departmentId"
              label="Department"
              placeholder="Select department"
              options={toOptions(deptData?.data ?? [])}
            />
            <FormSelect
              control={form.control}
              name="typeId"
              label="Material Type"
              placeholder="Select type"
              options={toOptions(typeData?.data ?? [])}
            />
            {/* Status */}
            <FormSelect
              control={form.control}
              name="isActive"
              label="Status"
              placeholder="Select status"
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Authors tag-input */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Authors
              </label>
              <div
                className="flex flex-wrap gap-1.5 min-h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring cursor-text"
                onClick={() => authorInputRef.current?.focus()}
              >
                {authorNames.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium shrink-0"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() =>
                        setAuthorNames((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="hover:text-destructive transition-colors leading-none"
                      aria-label={`Remove ${name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={authorInputRef}
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onKeyDown={handleAuthorKeyDown}
                  onBlur={() => {
                    if (authorInput.trim()) {
                      addAuthorTag(authorInput);
                      setAuthorInput("");
                    }
                  }}
                  placeholder={
                    authorNames.length === 0
                      ? "Type author name, press Enter or comma to add…"
                      : ""
                  }
                  className="flex-1 min-w-[8rem] outline-none bg-transparent placeholder:text-muted-foreground text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Press{" "}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                or{" "}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">
                  ,
                </kbd>{" "}
                to add each name — Backspace removes the last tag
              </p>
            </div>

            {/* Editors tag-input */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Editors
              </label>
              <div
                className="flex flex-wrap gap-1.5 min-h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring cursor-text"
                onClick={() => editorInputRef.current?.focus()}
              >
                {editorNames.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-secondary/60 text-secondary-foreground rounded px-2 py-0.5 text-xs font-medium shrink-0"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() =>
                        setEditorNames((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="hover:text-destructive transition-colors leading-none"
                      aria-label={`Remove ${name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={editorInputRef}
                  value={editorInput}
                  onChange={(e) => setEditorInput(e.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  onBlur={() => {
                    if (editorInput.trim()) {
                      addEditorTag(editorInput);
                      setEditorInput("");
                    }
                  }}
                  placeholder={
                    editorNames.length === 0
                      ? "Type editor name, press Enter or comma to add…"
                      : ""
                  }
                  className="flex-1 min-w-[8rem] outline-none bg-transparent placeholder:text-muted-foreground text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Press{" "}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                or{" "}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">
                  ,
                </kbd>{" "}
                to add each name — Backspace removes the last tag
              </p>
            </div>

            {/* Publishers tag-input */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Publishers
              </label>
              <div
                className="flex flex-wrap gap-1.5 min-h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring cursor-text"
                onClick={() => publisherInputRef.current?.focus()}
              >
                {publisherNames.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-accent/60 text-accent-foreground rounded px-2 py-0.5 text-xs font-medium shrink-0"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() =>
                        setPublisherNames((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="hover:text-destructive transition-colors leading-none"
                      aria-label={`Remove ${name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={publisherInputRef}
                  value={publisherInput}
                  onChange={(e) => setPublisherInput(e.target.value)}
                  onKeyDown={handlePublisherKeyDown}
                  onBlur={() => {
                    if (publisherInput.trim()) {
                      addPublisherTag(publisherInput);
                      setPublisherInput("");
                    }
                  }}
                  placeholder={
                    publisherNames.length === 0
                      ? "Type publisher name, press Enter or comma to add…"
                      : ""
                  }
                  className="flex-1 min-w-[8rem] outline-none bg-transparent placeholder:text-muted-foreground text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Press{" "}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                or{" "}
                <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">
                  ,
                </kbd>{" "}
                to add each name — Backspace removes the last tag
              </p>
            </div>
          </div>
          {/* Description */}
          <FormTextarea
            control={form.control}
            name="description"
            label="Description"
            placeholder="Enter book description"
            config={{ maxLength: 500, showCharCount: true, rows: 4 }}
          />

          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? "Save Changes" : "Add Book"}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
