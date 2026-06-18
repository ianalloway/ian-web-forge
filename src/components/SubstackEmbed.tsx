interface SubstackEmbedProps {
  publicationUrl?: string;
  title?: string;
  height?: number;
  className?: string;
}

const DEFAULT_PUBLICATION_URL = 'https://allowayai.substack.com';
const ALLOWED_SUBSTACK_HOST_PATTERN = /(^|\.)substack\.com$/i;

function getEmbedUrl(publicationUrl: string): string {
  try {
    const url = new URL(publicationUrl);

    if (url.protocol !== 'https:' || !ALLOWED_SUBSTACK_HOST_PATTERN.test(url.hostname)) {
      return `${DEFAULT_PUBLICATION_URL}/embed`;
    }

    url.pathname = `${url.pathname.replace(/\/+$/, '')}/embed`;
    url.search = '';
    url.hash = '';

    return url.toString();
  } catch {
    return `${DEFAULT_PUBLICATION_URL}/embed`;
  }
}

export default function SubstackEmbed({
  publicationUrl = import.meta.env.VITE_SUBSTACK_PUBLICATION_URL || DEFAULT_PUBLICATION_URL,
  title = 'Subscribe to AllowayAI on Substack',
  height = 320,
  className = '',
}: SubstackEmbedProps) {
  return (
    <div className={className}>
      <iframe
        src={getEmbedUrl(publicationUrl)}
        title={title}
        height={height}
        className="h-full min-h-[320px] w-full rounded-2xl border border-primary/20 bg-white"
        frameBorder="0"
        scrolling="no"
        sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        referrerPolicy="no-referrer"
        allow=""
      />
    </div>
  );
}
