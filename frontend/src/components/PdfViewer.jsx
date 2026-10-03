import { Component, useCallback, useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { account } from '../lib/appwrite';

// Local worker (no CDN, no version mismatch). Needs: npm install pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// =========================================================
// Fetch the PDF with the logged-in user's JWT, so a private
// Appwrite bucket does not answer 401.
// =========================================================

function useAuthedPdf(url) {
  const [state, setState] = useState({ src: null, error: null });

  useEffect(() => {
    if (!url) return undefined;

    let cancelled = false;
    let objectUrl = null;

    setState({ src: null, error: null });

    (async () => {
      try {
        // Not an Appwrite storage URL: let pdf.js load it directly.
        if (!url.includes('/storage/buckets/')) {
          if (!cancelled) setState({ src: url, error: null });
          return;
        }

        const parsed = new URL(url);
        parsed.searchParams.delete('impersonateuserid');
        const project = parsed.searchParams.get('project');

        const { jwt } = await account.createJWT();

        const response = await fetch(parsed.toString(), {
          headers: {
            'X-Appwrite-Project': project,
            'X-Appwrite-JWT': jwt,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(
          new Blob([blob], { type: 'application/pdf' })
        );
        setState({ src: objectUrl, error: null });
      } catch (error) {
        console.error('[PdfViewer] load failed:', error);
        if (!cancelled) {
          setState({
            src: null,
            error: error?.message || 'Failed to load PDF',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return state;
}

// =========================================================
// Error boundary: a broken PDF must never crash the page.
// =========================================================

class ViewerBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('[PdfViewer] render error:', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="text-sm text-red-400">
          This PDF could not be displayed.
        </p>
      );
    }
    return this.props.children;
  }
}

// =========================================================
// Viewer (read-only: no download, no print, no right-click)
// =========================================================

function PdfViewer({ url, title, onClose }) {
  const { src, error } = useAuthedPdf(url);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [docError, setDocError] = useState(null);

  const goPrev = useCallback(
    () => setPage((current) => Math.max(1, current - 1)),
    []
  );
  const goNext = useCallback(
    () => setPage((current) => Math.min(numPages || 1, current + 1)),
    [numPages]
  );
  const zoomIn = () => setScale((s) => Math.min(2, +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)));

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();

      // Block save / print shortcuts while the viewer is open
      if (
        (event.ctrlKey || event.metaKey) &&
        ['s', 'p'].includes(event.key.toLowerCase())
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext, onClose]);

  const baseWidth = Math.min(window.innerWidth - 48, 800);
  const failure = error || docError;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gray-900/95 print:hidden"
      onContextMenu={(event) => event.preventDefault()}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'PDF viewer'}
    >
      {/* TOP BAR */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-700 bg-gray-800 px-4 py-3">
        <h2 className="min-w-0 truncate text-sm font-semibold text-violet-100">
          {title || 'Document'}
        </h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            aria-label="Zoom out"
            className="rounded p-2 text-gray-200 hover:bg-gray-700 disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs text-gray-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= 2}
            aria-label="Zoom in"
            className="rounded p-2 text-gray-200 hover:bg-gray-700 disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="ml-2 rounded p-2 text-gray-200 hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PAGE AREA */}
      <div className="flex-1 select-none overflow-auto p-4">
        <div className="flex min-h-full items-start justify-center">
          {failure ? (
            <div className="mt-20 text-center">
              <p className="text-sm font-medium text-red-400">
                Could not load this PDF.
              </p>
              <p className="mt-1 text-xs text-gray-400">{String(failure)}</p>
            </div>
          ) : !src ? (
            <div className="mt-20 flex items-center gap-2 text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading PDF...
            </div>
          ) : (
            <ViewerBoundary>
              <Document
                file={src}
                onLoadSuccess={({ numPages: total }) => {
                  setNumPages(total);
                  setPage(1);
                }}
                onLoadError={(loadError) => {
                  console.error('[PdfViewer] document error:', loadError);
                  setDocError(loadError?.message || 'Invalid PDF file');
                }}
                loading={
                  <div className="mt-20 flex items-center gap-2 text-gray-300">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Rendering...
                  </div>
                }
                error={null}
                noData={null}
              >
                <Page
                  pageNumber={page}
                  width={Math.round(baseWidth * scale)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-xl"
                />
              </Document>
            </ViewerBoundary>
          )}
        </div>
      </div>

      {/* BOTTOM BAR */}
      {src && numPages > 0 && (
        <div className="flex items-center justify-center gap-4 border-t border-gray-700 bg-gray-800 px-4 py-2 text-gray-200">
          <button
            type="button"
            onClick={goPrev}
            disabled={page <= 1}
            aria-label="Previous page"
            className="rounded p-2 hover:bg-gray-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-sm">
            Page {page} of {numPages}
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={page >= numPages}
            aria-label="Next page"
            className="rounded p-2 hover:bg-gray-700 disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default PdfViewer;