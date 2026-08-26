/**
 * Social profiles are stored as full URLs, because that is what the public
 * profile pages render into href attributes. People do not think in URLs
 * though - they know their handle. These helpers keep the stored value
 * canonical while the form only ever asks for the username.
 */

export interface SocialPlatform {
  /** Position in the stored socialmedia array. */
  index: number;
  label: string;
  /** Prefix shown beside the input and prepended on save. */
  prefix: string;
  /** Hosts recognised when parsing an existing value back into a username. */
  hosts: string[];
  /** Extra path segment after the host, e.g. LinkedIn's "in/". */
  path?: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { index: 0, label: 'Twitter/X', prefix: 'x.com/', hosts: ['x.com', 'twitter.com'] },
  { index: 1, label: 'LinkedIn', prefix: 'linkedin.com/in/', hosts: ['linkedin.com'], path: 'in/' },
  { index: 2, label: 'Instagram', prefix: 'instagram.com/', hosts: ['instagram.com'] },
  { index: 3, label: 'GitHub', prefix: 'github.com/', hosts: ['github.com'] },
];

/** Index of the free-form website field, which has no fixed prefix. */
export const WEBSITE_INDEX = 4;

/**
 * Reduce a stored value to just the username.
 *
 * Accepts anything a person might paste - a bare handle, "@handle", a URL with
 * or without scheme, with or without "www." - so editing an existing profile
 * never shows the prefix twice.
 */
export function toUsername(stored: string | undefined, platform: SocialPlatform): string {
  if (!stored) return '';
  let v = stored.trim();
  if (!v) return '';

  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '');

  const host = platform.hosts.find((h) => v.toLowerCase().startsWith(h + '/'));
  if (host) {
    v = v.slice(host.length + 1);
    if (platform.path && v.toLowerCase().startsWith(platform.path)) {
      v = v.slice(platform.path.length);
    }
  }

  return v.replace(/^@/, '').replace(/\/+$/, '').trim();
}

/** Build the canonical URL to store, or '' when the field was left empty. */
export function toUrl(username: string, platform: SocialPlatform): string {
  const handle = username.replace(/^@/, '').trim();
  if (!handle) return '';
  return `https://${platform.prefix}${handle}`;
}

/** Normalise the free-form website field so it is always a usable href. */
export function toWebsiteUrl(value: string): string {
  const v = value.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
