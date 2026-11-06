import localCovers from '../data/local-covers.json';
export function bookCoverUrl(coverId?: number) {
  if (!coverId || coverId < 1) return undefined;
  return localCovers.includes(coverId) ? `/covers/kingdom/${coverId}.jpg`
    : `https://covers.openlibrary.org/b/id/${coverId}-M.jpg?default=false`;
}
