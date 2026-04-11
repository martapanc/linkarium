interface Props {
  title: string | null;
  url: string | null;
  citation_authors: string | null;
  citation_venue: string | null;
  citation_year: number | null;
  doi: string | null;
  pdf_url: string | null;
  noPublicLinkLabel: string;
}

export function PaperCardContent({ title, url, citation_authors, citation_venue, citation_year, doi, pdf_url, noPublicLinkLabel }: Props) {
  return (
    <>
      <p className="text-xs sm:text-sm font-medium text-sand-900 leading-snug line-clamp-1 sm:line-clamp-2">
        {citation_authors && <>{citation_authors}, </>}
        {title && <em className="font-display">{title}</em>}
        {citation_venue && <>, {citation_venue}</>}
        {citation_year && <>, {citation_year}</>}
      </p>

      <div className="flex justify-between">
        {url && (
          <p className="text-xs text-sand-600 truncate mt-0.5">{url}</p>
        )}
        <div className="items-center gap-2 flex-wrap hidden sm:flex me-3">
          {doi && (
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1 py-0.3 rounded font-mono shrink-0">DOI</span>
          )}
          {pdf_url && (
            <span className="text-[10px] bg-red-50 text-coral-500 px-1 py-0.3 rounded font-medium shrink-0">PDF</span>
          )}
          {url && !doi && !pdf_url && (
            <span className="text-[10px] bg-sky-50 text-sky-700 px-1 py-0.3 rounded font-medium shrink-0">Web</span>
          )}
          {!url && !pdf_url && (
            <span className="text-xs text-sand-500 shrink-0">{noPublicLinkLabel}</span>
          )}
        </div>
      </div>
    </>
  );
}
