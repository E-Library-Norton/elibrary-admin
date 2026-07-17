// src/services/uploadApi.ts
import { api } from './api';

export interface UploadedFileInfo {
  cover_url?:  string;   // present when field = "cover"
  pdf_url?:    string;   // present when field = "pdf"
  avatar_url?: string;   // present when field = "avatar"
  video_url?:  string;   // present when field = "video"
  audio_url?:  string;   // present when field = "audio"
  url?:        string;   // present for generic "file" field
  key:            string;   // R2 object key (was public_id with Cloudinary)
  format?:        string;
  resource_type:  string;
  originalName:   string;
  size:           number;
  formattedSize:  string;
}

export interface UploadSingleResponse {
  success:  boolean;
  data:     UploadedFileInfo;
  message?: string;
}

export interface UploadMultipleData {
  cover_url?: string;
  pdf_url?:   string;
  pdf_urls?:  string[];
  files: {
    cover?: UploadedFileInfo;
    pdf?:   UploadedFileInfo;
    pdfs?:  UploadedFileInfo[];
  };
}

export interface UploadMultipleResponse {
  success:  boolean;
  data:     UploadMultipleData;
  message?: string;
}

export const uploadApi = api.injectEndpoints({overrideExisting: true,
  endpoints: (builder) => ({
    // POST /uploads/single   field: "cover" | "pdf" | "avatar" | "file"
    uploadSingle: builder.mutation<UploadSingleResponse, FormData>({
      query: (formData) => ({
        url:    '/uploads/single',
        method: 'POST',
        body:   formData,
      }),
    }),
    // POST /uploads/multiple: cover (1), pdf (1), pdfs (up to 4)
    uploadMultiple: builder.mutation<UploadMultipleResponse, FormData>({
      query: (formData) => ({
        url:    '/uploads/multiple',
        method: 'POST',
        body:   formData,
      }),
    }),
  }),
});

export const { useUploadSingleMutation, useUploadMultipleMutation } = uploadApi;
