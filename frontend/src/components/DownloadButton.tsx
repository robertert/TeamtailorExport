import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useCsvDownloader, formatBytes } from '../hooks/useCsvDownloader';

interface DownloadButtonProps {
  url: string;
  filename: string;
  label: string;
}

export function DownloadButton({ url, filename, label }: DownloadButtonProps) {
  const { downloadCsv, isLoading, error, isSuccess, progress } =
    useCsvDownloader();

  const percentage =
    progress?.totalBytes != null
      ? Math.round((progress.receivedBytes / progress.totalBytes) * 100)
      : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => downloadCsv(url, filename)}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-2xl bg-[#f43f85] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f43f85] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? 'Downloading...' : label}
      </button>

      {progress && (
        <div className="w-full max-w-xs">
          <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-pink-100">
            {percentage != null ? (
              <div
                className="h-full rounded-full bg-[#f43f85] transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            ) : (
              <div className="h-full w-1/3 animate-[progress_1.5s_ease-in-out_infinite] rounded-full bg-[#f43f85]" />
            )}
          </div>
          <p className="text-center text-xs text-gray-500">
            {percentage != null
              ? `${percentage}% — ${formatBytes(progress.receivedBytes)} / ${formatBytes(progress.totalBytes!)}`
              : `${formatBytes(progress.receivedBytes)} downloaded`}
          </p>
        </div>
      )}

      {isSuccess && (
        <p className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          Download complete!
        </p>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
