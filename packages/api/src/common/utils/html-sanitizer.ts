import sanitizeHtml from 'sanitize-html';

const BLOG_ALLOWED_TAGS = [
  'p', 'br', 'hr', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark',
  'blockquote', 'code', 'pre',
  'a', 'ul', 'ol', 'li',
  'img', 'figure', 'figcaption',
  'span', 'div',
];

const BLOG_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  span: ['class', 'data-*'],
  div: ['class', 'data-*'],
  code: ['class'],
};

const BLOG_ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

export function sanitizeBlogHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: BLOG_ALLOWED_TAGS,
    allowedAttributes: BLOG_ALLOWED_ATTRIBUTES,
    allowedSchemes: BLOG_ALLOWED_SCHEMES,
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      }),
    },
  });
}
