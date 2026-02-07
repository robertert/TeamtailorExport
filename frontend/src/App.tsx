import { DownloadButton } from './components/DownloadButton';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fff0f5] font-[Inter,sans-serif]">
      <header className="border-b border-pink-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f43f85]">
            <span className="text-sm font-bold text-white">T</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Teamtailor Recruitment
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-pink-100 bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
            Export Candidates
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-gray-500">
            Download all candidate data from Teamtailor as a CSV file. The
            export includes names, emails, and application details.
          </p>
          <DownloadButton
            url="/api/export/candidates"
            filename="candidates.csv"
            label="Download CSV"
          />
        </div>
      </main>

      <footer className="border-t border-pink-100 bg-white px-6 py-4 text-center text-xs text-gray-400">
        Teamtailor Recruitment Server &middot; v1.0.0
      </footer>
    </div>
  );
}

export default App;
