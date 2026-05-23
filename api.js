class OpenLibraryError extends Error {
  constructor(message, statusCode, body) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
    this.name = "OpenLibraryError";
  }
}

function normalizeBook(raw) {
  return {
    key: raw.key || null,
    title: raw.title || null,
    subtitle: raw.subtitle || null,
    authors: raw.author_name || [],
    authorKeys: raw.author_key ? raw.author_key.map(k => `/authors/${k}`) : [],
    firstPublishYear: raw.first_publish_year || null,
    publishYears: raw.publish_year || [],
    isbn: raw.isbn || [],
    coverEditionKey: raw.cover_edition_key || null,
    coverUrl: raw.cover_i ? getCoverUrl(raw.cover_i, "M") : null,
    subjects: raw.subject || [],
    publishers: raw.publisher || [],
    languages: raw.language || [],
    editionCount: raw.edition_count || 0,
    hasFullText: raw.has_fulltext || false,
    publicScanB: raw.public_scan_b || false,
    ratingsAverage: raw.ratings_average || null,
    ratingsCount: raw.ratings_count || null,
    wantToReadCount: raw.want_to_read_count || null,
    currentlyReadingCount: raw.currently_reading_count || null,
    alreadyReadCount: raw.already_read_count || null,
    openLibraryUrl: raw.key ? `https://openlibrary.org${raw.key}` : null
  };
}

async function fetchOpenLibrary(params) {
  const url = new URL("https://openlibrary.org/search.json");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.append(k, v);
    }
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new OpenLibraryError(`API Error ${res.status}: ${res.statusText}`, res.status, text);
  }
  return res.json();
}

async function performSearch(queryParam, qValue, opts = {}) {
  const params = {
    [queryParam]: qValue,
    page: opts.page || 1,
    limit: opts.limit || 10,
    sort: opts.sort,
    lang: opts.lang
  };
  const data = await fetchOpenLibrary(params);
  return {
    numFound: data.numFound,
    numFoundExact: data.numFoundExact,
    start: data.start,
    books: (data.docs || []).map(normalizeBook),
    query: qValue
  };
}

export async function search(query, opts) {
  return performSearch("q", query, opts);
}

export async function searchByTitle(title, opts) {
  return performSearch("title", title, opts);
}

export async function searchByAuthor(author, opts) {
  return performSearch("author", author, opts);
}

export async function searchByISBN(isbn) {
  const data = await fetchOpenLibrary({ q: `isbn:${isbn}`, limit: 1 });
  return {
    numFound: data.numFound,
    numFoundExact: data.numFoundExact,
    start: data.start,
    books: (data.docs || []).map(normalizeBook),
    query: isbn
  };
}

export async function searchBySubject(subject, opts) {
  return performSearch("subject", subject, opts);
}

export async function trending(limit = 10) {
  return searchBySubject("fiction", { sort: "new", limit });
}

export function getCoverUrl(coverId, size = "M") {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export { OpenLibraryError };
