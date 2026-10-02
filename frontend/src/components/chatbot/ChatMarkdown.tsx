import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

function isSafeHref(href?: string) {
  if (!href) return false;

  const value = href.trim().toLowerCase();
  if (value.startsWith('//')) return false;

  return value.startsWith('/')
    || value.startsWith('#')
    || value.startsWith('./')
    || value.startsWith('../')
    || value.startsWith('https://')
    || value.startsWith('http://')
    || value.startsWith('mailto:')
    || value.startsWith('tel:');
}

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    const safeHref = isSafeHref(href) ? href : undefined;
    const isExternal = Boolean(safeHref?.startsWith('http://') || safeHref?.startsWith('https://'));

    return (
      <a
        {...props}
        href={safeHref}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  },
  img: () => null,
};

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="chatbot-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
