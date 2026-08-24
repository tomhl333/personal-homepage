type MediaSuggestion = {
  title: string;
  creator?: string;
  imageUrl?: string;
  source: string;
  sourceUrl?: string;
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

export async function findBookTitleSuggestion(title: string, author = ""): Promise<MediaSuggestion | null> {
  const query=new URL("https://www.googleapis.com/books/v1/volumes");
  query.searchParams.set("q",[`intitle:${title}`,author?`inauthor:${author}`:""].filter(Boolean).join(" "));
  query.searchParams.set("maxResults","10");
  query.searchParams.set("printType","books");
  try {
    const response=await fetch(query,{headers:{"User-Agent":"personal-homepage-admin/1.0"},signal:AbortSignal.timeout(7000)});
    if(!response.ok) return null;
    const data=await response.json() as {items?:Array<{volumeInfo?:{title?:string;authors?:string[];imageLinks?:Record<string,string>}}>};
    for(const item of data.items??[]){
      const info=item.volumeInfo, candidate=info?.title??"";
      if(!plausible(title,candidate)) continue;
      const images=info?.imageLinks??{};
      const imageUrl=images.extraLarge??images.large??images.medium??images.thumbnail??images.small??images.smallThumbnail;
      return {title:candidate,creator:info?.authors?.[0]??author,imageUrl:imageUrl?.replace(/^http:/,"https:").replace(/&edge=curl/g,""),source:"Google Books"};
    }
    return null;
  } catch { return null; }
}

export function differsFromRequested(requested: string, suggested: string) {
  return plain(requested) !== plain(suggested);
}
