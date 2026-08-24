import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("media lookup asks for canonical title confirmation",async()=>{
  const [lookup,records]=await Promise.all([read("lib/media-title-lookup.ts"),read("lib/action-records.ts")]);
  assert.match(lookup,/https:\/\/tv\.apple\.com\/us\/search/);
  assert.match(lookup,/findBookTitleSuggestion/);
  assert.match(records,/规范名称可能是/);
  assert.match(records,/requiresChoice: ambiguous \|\| categoryRequired \|\| cityRequired \|\| titleCorrection/);
});

test("poster and cover lookup continue after a failed source",async()=>{
  const [show,book,blob]=await Promise.all([read("app/api/admin/show-poster/route.ts"),read("app/api/admin/book-cover/route.ts"),read("lib/blob-media.ts")]);
  assert.match(show,/findAppleTvSuggestion/);
  assert.match(show,/豆瓣影视/);
  assert.match(show,/TMDB/);
  assert.match(show,/iTunes Search/);
  assert.match(book,/豆瓣读书/);
  assert.match(book,/Google Books/);
  assert.match(book,/Open Library/);
  assert.match(show,/\.catch\(\(\) => \(\{ poster: "" \}\)\)/);
  assert.match(book,/\.catch\(\(\) => \(\{ cover: "" \}\)\)/);
  assert.match(blob,/metadata\.width < 180 \|\| metadata\.height < 180/);
});

test("existing empty media records retry cover discovery",async()=>{
  const records=await read("lib/action-records.ts");
  assert.match(records,/if\(!show\.poster\)/);
  assert.match(records,/if\(!book\.cover\)/);
});

test("preview tells the GPT when a cover can be repaired automatically",async()=>{
  const [records,schema,policy]=await Promise.all([read("lib/action-records.ts"),read("app/api/actions/openapi/route.ts"),read("lib/action-policy.ts")]);
  assert.match(records,/coverLookup/);
  assert.match(records,/willRepairOnCommit/);
  assert.match(records,/无需用户提供图片 URL/);
  assert.match(schema,/never ask the user for an image URL/);
  assert.match(policy,/coverLookup\.available/);
});

test("an unrelated revision change does not expire a unique media update",async()=>{
  const records=await read("lib/action-records.ts");
  assert.match(records,/const stableExistingMedia = \(normalizedInput\.type === "show" \|\| normalizedInput\.type === "book"\) && existingCandidates\.length === 1/);
  assert.match(records,/if \(revisionChanged && !stableExistingMedia\)/);
});
