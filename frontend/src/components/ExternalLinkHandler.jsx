import { useEffect } from 'react';

const EXTERNAL_REL = 'noopener noreferrer';

const isExternalHttpLink = (href) => {
  if (!href || typeof window === 'undefined') return false;

  try {
    const url = new URL(href, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) && url.origin !== window.location.origin;
  } catch {
    return false;
  }
};

const markExternalLink = (anchor) => {
  if (!anchor?.href || anchor.hasAttribute('download') || !isExternalHttpLink(anchor.href)) return;

  anchor.setAttribute('target', '_blank');
  anchor.setAttribute('rel', EXTERNAL_REL);
};

const markExternalLinks = (root = document) => {
  root.querySelectorAll?.('a[href]').forEach(markExternalLink);
};

export default function ExternalLinkHandler() {
  useEffect(() => {
    markExternalLinks();

    const handleClick = (event) => {
      const anchor = event.target?.closest?.('a[href]');

      if (!anchor || anchor.hasAttribute('download') || !isExternalHttpLink(anchor.href)) return;
      if (anchor.target === '_blank') return;

      event.preventDefault();
      window.open(anchor.href, '_blank', 'noopener,noreferrer');
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          markExternalLink(mutation.target);
          return;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.matches?.('a[href]')) markExternalLink(node);
          markExternalLinks(node);
        });
      });
    });

    document.addEventListener('click', handleClick, true);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href'],
    });

    return () => {
      document.removeEventListener('click', handleClick, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
