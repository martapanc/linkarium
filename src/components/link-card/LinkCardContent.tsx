interface Props {
  title: string | null;
  url: string | null;
  domain: string | null;
}

export function LinkCardContent({ title, url, domain }: Props) {
  return (
    <>
      <h3 className="text-xs sm:text-sm font-medium text-sand-900 leading-snug line-clamp-1 sm:line-clamp-2 break-all">
        {title || url || "Untitled"}
      </h3>
      <div className="flex items-center gap-2 mt-0.5 min-w-0">
        <span className="text-xs text-sand-600 truncate min-w-0">
          {domain || url}
        </span>
        <svg className="w-3 h-3 text-sand-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6h6m0 0v6m0-6L9.75 14.25" />
        </svg>
      </div>
    </>
  );
}
