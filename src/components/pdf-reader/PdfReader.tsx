'use client';

import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

interface PdfReaderProps {
  fileUrl: string;
  title?: string;
  /** Book id — used to save/restore reading progress in localStorage */
  bookId?: string | number;
}

const storageKey = (id: string | number) => `pdf_page_${id}`;

export default function PdfReader({ fileUrl, title, bookId }: PdfReaderProps) {
  const savedPage = bookId
    ? parseInt(localStorage.getItem(storageKey(bookId)) ?? '1', 10) || 1
    : 1;

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => defaultTabs,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {title && (
        <div
          style={{
            background: '#1e293b',
            color: '#fff',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              background: '#3b82f6',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            PDF
          </span>
          {title}
          {bookId && savedPage > 1 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
              Resuming from page {savedPage}
            </span>
          )}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Worker workerUrl={WORKER_URL}>
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance]}
            defaultScale={SpecialZoomLevel.PageWidth}
            initialPage={savedPage - 1}
            onPageChange={bookId ? ({ currentPage }) => {
              localStorage.setItem(storageKey(bookId), String(currentPage + 1));
            } : undefined}
          />
        </Worker>
      </div>
    </div>
  );
}

