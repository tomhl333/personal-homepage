type MediaSuggestion = {
  title: string;
  creator?: string;
  imageUrl?: string;
  source: string;
  sourceUrl?: string;
};

type ImdbSuggestion = {
  i?: { height?: number; imageUrl?: string; width?: number };
  id?: string;
  l?: string;
  q?: string;
  qid?: string;
  s?: string;
  y?: number;
};

const plain = (value = "") => value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, "");
const tokens = (value: string) => value.toLocaleLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [];

function plausible(query: string, candidate: string) {
  const left = plain(query), right = plain(candidate);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const wanted = new Set(tokens(query).filter((item) => !["the","and","series","docuseries","season"].includes(item)));
  return tokens(candidate).filter((item) => wanted.has(item)).length >= 2;
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&colon;/g,":");
}

export async function findWeReadBookSuggestion(title: string, author = ""): Promise<MediaSuggestion | null> {
  try {
    const search = new URL("https://weread.qq.com/web/search/books");
    search.searchParams.set("keyword", [title, author].filter(Boolean).join(" "));
    const response = await fetch(search, {
      headers: {
        "Accept-Language": "zh-CN,zh;q=0.9",
        "User-Agent": "Mozilla/5.0 personal-homepage-cover/3.0",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    const cards = [...html.matchAll(/<li class="wr_bookList_item">[\s\S]*?<a href="\/web\/reader\/([^"?]+)"[\s\S]*?<img src="([^"]+)"[^>]*>[\s\S]*?<p class="wr_bookList_item_title">([^<]+)<\/p>[\s\S]*?<p class="wr_bookList_item_author">[\s\S]*?>([^<]+)<\/a>[\s\S]*?<\/li>/g)];
    for (const card of cards) {
      const candidateTitle = decodeHtml(card[3]).trim();
      const candidateAuthor = decodeHtml(card[4]).trim();
      if (!plausible(title, candidateTitle)) continue;
      if (author && candidateAuthor && !plausible(author, candidateAuthor)) continue;
      return {
        title: candidateTitle,
        creator: candidateAuthor || author,
        imageUrl: decodeHtml(card[2]).replace(/^http:/, "https:"),
        source: "微信读书",
        sourceUrl: `https://weread.qq.com/web/bookDetail/${card[1]}`,
      };
    }
    return null;
  } catch { return null; }
}

export async function findAppleTvSuggestion(title: string): Promise<MediaSuggestion | null> {
  try {
    const search = new URL("https://tv.apple.com/us/search");
    search.searchParams.set("term", title);
    const response = await fetch(search, { headers: { "Accept-Language":"en-US,en;q=0.8", "User-Agent":"Mozilla/5.0 personal-homepage-cover/3.0" }, signal:AbortSignal.timeout(7000) });
    if (!response.ok) return null;
    const html = await response.text();
    const cards = [...html.matchAll(/<a[^>]+aria-label="([^"]+)"[^>]+href="(https:\/\/tv\.apple\.com\/[^"]+)"[\s\S]{0,5000}?<source[^>]+srcset="([^"]+)"/g)];
    for (const card of cards) {
      const candidateTitle=decodeHtml(card[1]);
      if (!plausible(title,candidateTitle)) continue;
      const variants=decodeHtml(card[3]).split(",").map((item)=>item.trim().split(/\s+/)[0]).filter(Boolean);
      return { title:candidateTitle, imageUrl:variants.at(-1), source:"Apple TV", sourceUrl:decodeHtml(card[2]) };
    }
    return null;
  } catch { return null; }
}

export async function findImdbShowSuggestion(title: string, kind = "电影"): Promise<MediaSuggestion | null> {
  try {
    const endpoint = new URL(`https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(title)}.json`);
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json", "User-Agent": "personal-homepage-admin/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const data = await response.json() as { d?: ImdbSuggestion[] };
    const candidates = (data.d ?? []).filter((item) => item.i?.imageUrl && item.id?.startsWith("tt"));
    const movie = kind === "电影" || /movie|film/i.test(kind);
    const expectedType = movie ? "movie" : "tvSeries";
    const match = candidates.find((item) => item.qid === expectedType)
      ?? candidates.find((item) => movie ? item.q === "feature" : item.qid === "tvMiniSeries")
      ?? candidates[0];
    if (!match?.id || !match.i?.imageUrl) return null;

    return {
      // IMDb often displays an English title for Chinese films. Keep the confirmed
      // user title so a valid poster match does not trigger a false rename prompt.
      title,
      creator: match.s,
      imageUrl: match.i.imageUrl,
      source: "IMDb",
      sourceUrl: `https://www.imdb.com/title/${match.id}/`,
    };
  } catch { return null; }
}

export async function findBookTitleSuggestion(title: string, author = ""): Promise<MediaSuggestion | null> {
  const query=new URL("https://www.googleapis.com/books/v1/volumes");
  query.searchParams.set("q",[`intitle:${title}`,author?`inauthor:${author}`:""].filter(Boolean).join(" "));
  query.searchParams.set("maxResults","10");
  query.searchParams.set("printType","books");
  try {
    const response=await fetch(query,{headers:{"User-Agent":"personal-homepage-admin/1.0"},signal:AbortSignal.timeout(7000)});
    if(!response.ok) return null;
    const data=await response.json() as {items?:Array<{volumeInfo?:{title?:string;authors?:string[];imageLinks?:Record<string,string>}}>};
    let titleOnlySuggestion: MediaSuggestion | null = null;
    for(const item of data.items??[]){
      const info=item.volumeInfo, candidate=info?.title??"";
      if(!plausible(title,candidate)) continue;
      const images=info?.imageLinks??{};
      const imageUrl=images.extraLarge??images.large??images.medium??images.thumbnail??images.small??images.smallThumbnail;
      const suggestion = {title:candidate,creator:info?.authors?.[0]??author,imageUrl:imageUrl?.replace(/^http:/,"https:").replace(/&edge=curl/g,""),source:"Google Books"};
      if (imageUrl) return suggestion;
      titleOnlySuggestion ??= suggestion;
    }
    return await findWeReadBookSuggestion(title, author) ?? titleOnlySuggestion;
  } catch { return findWeReadBookSuggestion(title, author); }
}

export function differsFromRequested(requested: string, suggested: string) {
  return plain(requested) !== plain(suggested);
}
