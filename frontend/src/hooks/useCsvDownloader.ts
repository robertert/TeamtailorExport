import { useState } from 'react';

interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number | null;
}

interface UseCsvDownloaderReturn {
  downloadCsv: (url: string, filename: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  progress: DownloadProgress | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { formatBytes };

export function useCsvDownloader(): UseCsvDownloaderReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  async function downloadCsv(url: string, filename: string): Promise<void> {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    setProgress(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const contentLength = response.headers.get('Content-Length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Streaming not supported by browser');
      }

      const chunks: BlobPart[] = [];
      let receivedBytes = 0;

      setProgress({ receivedBytes: 0, totalBytes });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;
        setProgress({ receivedBytes, totalBytes });
      }

      const blob = new Blob(chunks, { type: 'text/csv' });
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(objectUrl);

      setIsSuccess(true);
      setProgress(null);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      setProgress(null);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return { downloadCsv, isLoading, error, isSuccess, progress };
}
