#!/usr/bin/env python3
import argparse
import base64
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from datetime import date
from pathlib import Path

BASE = os.environ.get("PERSONAL_HOMEPAGE_URL", "https://personal-homepage-nine-ashen.vercel.app").rstrip("/")
TRAINING_BASE = os.environ.get("TRAINING_HOMEPAGE_URL", "https://xunheng-training.vercel.app").rstrip("/")


def token():
    value = os.environ.get("PERSONAL_CONTENT_API_TOKEN", "")
    if not value and sys.platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
                value = winreg.QueryValueEx(key, "PERSONAL_CONTENT_API_TOKEN")[0]
        except OSError:
            pass
    if not value:
        raise SystemExit("PERSONAL_CONTENT_API_TOKEN is not configured")
    return value


def request(path, method="GET", payload=None, authenticated=True):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {"Content-Type": "application/json", "User-Agent": "maintain-personal-homepage-skill/2.0"}
    if authenticated:
        headers["Authorization"] = "Bearer " + token()
    req = urllib.request.Request(BASE + path, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8")
        return error.code, json.loads(raw or "{}")


def training_request(path, method="GET", payload=None):
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(TRAINING_BASE + path, data=body, method=method, headers={"Authorization": "Bearer " + token(), "Content-Type": "application/json", "User-Agent": "maintain-personal-homepage-skill/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read().decode("utf-8") or "{}")


def activity(content, title):
    return next(item for item in content["activitySpotlights"] if item["title"] == title or (title == "纸笔" and item["title"] == "练字") or (title == "语言学习" and item["title"] == "粤语"))


def normalized(value):
    return re.sub(r"[\W_]+", "", (value or "").casefold())


def identity_compatible(left, right, minimum=0.66):
    left_value, right_value = normalized(left), normalized(right)
    if not left_value or not right_value:
        return True
    return (
        left_value == right_value
        or left_value in right_value
        or right_value in left_value
        or SequenceMatcher(None, left_value, right_value).ratio() >= minimum
    )


def media_kind(value):
    marker = normalized(value)
    if any(word in marker for word in ("电影", "movie", "film")):
        return "movie"
    if any(word in marker for word in ("电视剧", "剧集", "tvshow", "series")):
        return "series"
    return marker


def closest_matches(items, requested_titles, title_getter, compatible=lambda _item: True, minimum=0.72):
    requested = [normalized(title) for title in requested_titles if normalized(title)]
    scored = []
    for item in items:
        if not compatible(item):
            continue
        existing = normalized(title_getter(item))
        score = max((SequenceMatcher(None, existing, title).ratio() for title in requested), default=0)
        if score >= minimum:
            scored.append((score, item))
    if not scored:
        return []
    best = max(score for score, _item in scored)
    return [item for score, item in scored if best - score <= 0.03]


def unique_items(items, key):
    result, seen = [], set()
    for item in items:
        marker = normalized(key(item))
        if marker and marker not in seen:
            result.append(item)
            seen.add(marker)
    return result


def unique_text_items(items):
    result = []
    for item in items:
        text = normalized(item.get("text", ""))
        if not text:
            continue
        duplicate = any(SequenceMatcher(None, text, normalized(old.get("text", ""))).ratio() >= 0.72 for old in result)
        if not duplicate:
            result.append(item)
    return result


def mutate(change, verify):
    for _ in range(3):
        status, current = request("/api/admin/content", "POST", {})
        if status != 200:
            raise SystemExit(current.get("message", "读取内容失败"))
        content = current["content"]
        result = change(content)
        status, saved = request("/api/admin/content", "PUT", {"content": content, "revision": current["revision"]})
        if status == 409:
            continue
        if status != 200:
            raise SystemExit(saved.get("message", "保存内容失败"))
        check_status, checked = request("/api/admin/content", "POST", {})
        verified = check_status == 200 and verify(checked.get("content", {}))
        if not verified:
            raise SystemExit("写入后回读验证失败；没有报告成功，请在后台检查")
        public_visible = verify_public(result.get("publicMarker", ""))
        return {k: v for k, v in result.items() if k != "publicMarker"} | {
            "ok": bool(public_visible),
            "saved": True,
            "verified": True,
            "publicVisible": public_visible,
            "revision": saved.get("revision"),
            "message": "保存且前端可见" if public_visible else "已保存并回读成功，但线上前端尚未显示；不要向用户报告完成",
        }
    raise SystemExit("内容同时被修改，请稍后重试")


def verify_public(marker):
    if not marker:
        return False
    stamp = str(int(time.time() * 1000))
    targets = [BASE + "/api/content?skill_verify=" + stamp, BASE + "/?skill_verify=" + stamp]
    for url in targets:
        try:
            req = urllib.request.Request(url, headers={"Cache-Control": "no-cache, no-store", "User-Agent": "maintain-personal-homepage-skill/2.0"})
            with urllib.request.urlopen(req, timeout=30) as response:
                if marker not in response.read().decode("utf-8"):
                    return False
        except Exception:
            return False
    return True


def upload_image(path, upload_dir):
    raw = Path(path).read_bytes()
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    data_url = "data:" + mime + ";base64," + base64.b64encode(raw).decode("ascii")
    status, uploaded = request("/api/admin/upload", "POST", {"data": data_url, "name": Path(path).name, "uploadDir": upload_dir})
    if status != 200:
        raise SystemExit(uploaded.get("message", f"图片上传失败：{path}"))
    return uploaded


def infer_category(text, requested):
    if requested != "auto":
        return "纸笔" if requested == "练字" else requested
    groups = {
        "纸笔": ("练字", "书法", "临帖", "临写", "字帖", "楷书", "行书", "硬笔", "毛笔", "抄写", "画画", "绘画", "素描", "水彩", "彩铅", "速写"),
        "网球": ("网球", "发球", "正手", "反手", "截击", "球场"),
        "游泳": ("游泳", "泳池", "自由泳", "蛙泳", "蝶泳", "仰泳", "划水"),
        "健身": ("健身", "力量", "哑铃", "杠铃", "深蹲", "卧推", "硬拉", "核心", "训练"),
        "粤语": ("粤语", "广东话", "发音", "粤拼"),
        "城市生活": ("城市", "街", "公园", "建筑", "咖啡", "餐厅", "展览", "旅行", "散步", "夜景", "生活"),
    }
    scores = {category: sum(1 for word in words if word in text) for category, words in groups.items()}
    best = max(scores.values(), default=0)
    winners = [category for category, score in scores.items() if score == best and score > 0]
    if len(winners) == 1:
        return winners[0]
    raise SystemExit("无法可靠判断图片所属栏目；请补充内容、运动类型或使用 --category")


def compact_title(text, fallback):
    clean = re.sub(r"\s+", " ", text).strip(" ，。；：,.!?！？")
    first = re.split(r"[。！？；\n]", clean)[0].strip()
    return (first[:18] + "…") if len(first) > 18 else (first or fallback)


def series_identity(title):
    season = ""
    patterns = [r"第\s*([一二三四五六七八九十\d]+)\s*季", r"\bS(?:eason)?\s*(\d+)\b"]
    base = title
    for pattern in patterns:
        match = re.search(pattern, base, flags=re.I)
        if match:
            season = f"第{match.group(1)}季"
            base = re.sub(pattern, "", base, flags=re.I)
            break
    return re.sub(r"[\s:：-]+$", "", base).strip(), season


def add_show(args):
    base_title, parsed_season = series_identity(args.title)
    season = args.season or parsed_season or "观后札记"
    note_text = args.note.strip()
    poster = None

    def load_poster():
        nonlocal poster
        if poster is None:
            status, result = request("/api/admin/show-poster", "POST", {"title": base_title, "kind": args.kind, "uploadDir": "/uploads/shows"})
            poster = result if status == 200 else {}
        return poster

    def compatible_show(show):
        existing_kind, requested_kind = media_kind(show.get("kind", "")), media_kind(args.kind)
        kind_match = not existing_kind or not requested_kind or existing_kind == requested_kind
        return kind_match and identity_compatible(show.get("creator", ""), args.creator)

    def change(content):
        shows = activity(content, "看剧").setdefault("shows", [])
        matches = closest_matches(shows, [base_title], lambda show: series_identity(show.get("title", ""))[0], compatible_show)
        if matches:
            show = matches[0]
            for duplicate in matches[1:]:
                show["notes"] = unique_text_items(show.get("notes", []) + duplicate.get("notes", []))
                show["characters"] = unique_items(show.get("characters", []) + duplicate.get("characters", []), lambda x: x.get("name", "") + x.get("note", ""))
                if not show.get("poster") and duplicate.get("poster"):
                    show["poster"] = duplicate["poster"]
                shows.remove(duplicate)
        else:
            asset = load_poster()
            show = {"title": base_title, "creator": asset.get("creator") or args.creator or "", "kind": args.kind, "status": args.status or "", "posterTone": "from-fog via-paper to-moss/55", "meta": asset.get("year") or "", "characters": [], "notes": []}
            shows.insert(0, show)
        show["title"] = base_title
        show["status"] = args.status or show.get("status", "")
        if not show.get("poster"):
            asset = load_poster()
            if asset.get("poster"):
                show["poster"] = asset["poster"]
        if note_text and normalized(note_text) not in {normalized(n.get("text", "")) for n in show.get("notes", [])}:
            show.setdefault("notes", []).insert(0, {"type": season, "text": note_text})
        show["notes"] = unique_text_items(show.get("notes", []))
        return {"type": "show", "title": base_title, "deduplicated": max(0, len(matches) - 1), "noteAdded": bool(note_text), "coverSource": (poster or {}).get("source", "existing"), "hasCover": bool(show.get("poster")), "publicMarker": note_text or base_title}

    return mutate(change, lambda c: any(s in closest_matches(activity(c, "看剧").get("shows", []), [base_title], lambda show: series_identity(show.get("title", ""))[0], compatible_show) and (not note_text or any(normalized(n.get("text", "")) == normalized(note_text) for n in s.get("notes", []))) for s in activity(c, "看剧").get("shows", [])))


def add_book(args):
    note_text = args.note.strip()
    cover = None
    canonical = args.title

    def load_cover():
        nonlocal cover, canonical
        if cover is None:
            status, result = request("/api/admin/book-cover", "POST", {"title": args.title, "author": args.author, "uploadDir": "/uploads/books"})
            cover = result if status == 200 else {}
            canonical = cover.get("title") or args.title
        return cover

    def compatible_author(book):
        requested_author = (cover or {}).get("author") or args.author
        return identity_compatible(book.get("author", ""), requested_author)

    def find_matches(books):
        return closest_matches(books, [args.title, canonical], lambda book: book.get("title", ""), compatible_author)

    def change(content):
        books = activity(content, "阅读").setdefault("books", [])
        matches = find_matches(books)
        if not matches or not any(book.get("cover") for book in matches):
            load_cover()
            matches = find_matches(books)
        matches.sort(key=lambda book: (bool(book.get("cover")), normalized(book.get("title", "")) == normalized(canonical)), reverse=True)
        if matches:
            book = matches[0]
            for duplicate in matches[1:]:
                book["notes"] = unique_text_items(book.get("notes", []) + duplicate.get("notes", []))
                if not book.get("cover") and duplicate.get("cover"):
                    book["cover"] = duplicate["cover"]
                books.remove(duplicate)
        else:
            asset = load_cover()
            book = {"title": canonical, "author": asset.get("author") or args.author or "", "status": args.status or "", "coverTone": "from-fog via-white to-clay/30", "notes": []}
            books.insert(0, book)
        display_title = (cover or {}).get("title") or book.get("title") or args.title
        book["title"] = display_title
        book["status"] = args.status or book.get("status", "")
        if not book.get("cover"):
            asset = load_cover()
            if asset.get("cover"):
                book["cover"] = asset["cover"]
        if note_text and normalized(note_text) not in {normalized(n.get("text", "")) for n in book.get("notes", [])}:
            book.setdefault("notes", []).insert(0, {"type": args.note_type, "text": note_text})
        book["notes"] = unique_text_items(book.get("notes", []))
        return {"type": "book", "title": display_title, "deduplicated": max(0, len(matches) - 1), "noteAdded": bool(note_text), "coverSource": (cover or {}).get("source", "existing"), "hasCover": bool(book.get("cover")), "publicMarker": note_text or display_title}

    return mutate(change, lambda c: any(b in find_matches(activity(c, "阅读").get("books", [])) and (not note_text or any(normalized(n.get("text", "")) == normalized(note_text) for n in b.get("notes", []))) for b in activity(c, "阅读").get("books", [])))


def add_activity(args):
    category = infer_category(" ".join([args.text, args.title or "", *args.image]), args.category)
    title = args.title or compact_title(args.text, "纸笔记录" if category == "纸笔" else "城市片段")
    if category in {"网球", "游泳", "健身"}:
        uploads = [upload_image(path, "/uploads/training") for path in args.image]
        status_code, attached = training_request("/api/workout-media", "POST", {
            "date": args.date,
            "workoutId": args.workout_id or None,
            "titleHint": " ".join([category, args.text]),
            "note": args.text,
            "category": {"网球": "tennis", "游泳": "swim", "健身": "strength"}[category],
            "images": [{"url": item["src"], "label": title} for item in uploads],
        })
        if status_code == 409:
            raise SystemExit("同一天存在多条可能的训练，未挂载图片。候选：" + json.dumps(attached.get("candidates", []), ensure_ascii=False))
        if status_code != 200 or not attached.get("ok"):
            raise SystemExit(attached.get("message", "训练图片关联失败"))
        marker = uploads[0]["src"] if uploads else ""
        public_visible = verify_url_contains(TRAINING_BASE, marker)
        return {"ok": public_visible, "saved": True, "verified": True, "publicVisible": public_visible, "type": "training-media", "category": category, "title": title, "imageCount": len(uploads), "workout": attached.get("workout"), "pending": bool(attached.get("pending")), "message": ("运动图片已独立保存并等待后续训练匹配" if attached.get("pending") and public_visible else "训练图片已挂载且前端可见" if public_visible else "图片已保存，但训衡前端尚未显示；不要向用户报告完成")}
    upload_dir = "/uploads/paper" if category == "纸笔" else f"/uploads/{urllib.parse.quote(category)}"
    uploads = [upload_image(path, upload_dir) for path in args.image]
    record_date = args.date

    def change(content):
        section = activity(content, category)
        if category == "纸笔":
            checkins = section.setdefault("checkins", [])
            identity = normalized(record_date + title + args.text)
            existing = next((x for x in checkins if normalized(x.get("date", "") + x.get("label", "") + x.get("note", "")) == identity), None)
            paper_type = args.paper_type or ("画画" if any(word in args.text for word in ("画", "绘", "素描", "水彩", "彩铅", "速写")) else "练字" if any(word in args.text for word in ("字", "书法", "临帖", "临写")) else "纸笔创作")
            item = existing or {"date": record_date, "label": title, "type": paper_type, "content": args.content or "", "duration": args.duration or "", "note": args.text, "images": []}
            item["type"] = paper_type
            item["images"] = unique_items(item.get("images", []) + [{"src": u["src"], "label": u.get("label", title)} for u in uploads], lambda x: x.get("src", ""))
            if item["images"]:
                item["src"] = item["images"][0]["src"]
            if not existing:
                checkins.insert(0, item)
        else:
            collection_name = "records" if "records" in section or category == "城市生活" else "learningLogs"
            records = section.setdefault(collection_name, [])
            identity = normalized(record_date + title + args.text)
            if not any(normalized(x.get("date", "") + x.get("title", "") + x.get("summary", "")) == identity for x in records):
                record = {"date": record_date, "title": title, "summary": args.text, "tags": args.tag or [category]}
                if collection_name == "learningLogs":
                    record["type"] = category
                records.insert(0, record)
            photos = section.setdefault("photos", [])
            photos[:] = unique_items([{"date": record_date, "label": title, "note": args.text, "src": u["src"], "project": title} for u in uploads] + photos, lambda x: x.get("src", ""))
        return {"type": "activity", "category": category, "title": title, "imageCount": len(uploads), "publicMarker": title}

    return mutate(change, lambda c: any((x.get("title") == category or (category == "纸笔" and x.get("title") == "练字")) and (any(y.get("label") == title for y in x.get("checkins", [])) if category == "纸笔" else any(y.get("title") == title for y in x.get("records", []) + x.get("learningLogs", []))) for x in c.get("activitySpotlights", [])))


def verify_url_contains(base, marker):
    if not marker:
        return False
    try:
        req = urllib.request.Request(base + "/?skill_verify=" + str(int(time.time())), headers={"Cache-Control": "no-cache", "User-Agent": "maintain-personal-homepage-skill/2.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            return marker in response.read().decode("utf-8")
    except Exception:
        return False


def status(_):
    return request("/api/admin/media")[1]


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    show = sub.add_parser("add-show")
    show.add_argument("title"); show.add_argument("--kind", default="电视剧"); show.add_argument("--creator", default=""); show.add_argument("--status", default="看过"); show.add_argument("--season", default=""); show.add_argument("--note", default=""); show.set_defaults(run=add_show)
    book = sub.add_parser("add-book")
    book.add_argument("title"); book.add_argument("--author", default=""); book.add_argument("--status", default="在读"); book.add_argument("--note", default=""); book.add_argument("--note-type", default="读后感"); book.set_defaults(run=add_book)
    entry = sub.add_parser("add-activity")
    entry.add_argument("text"); entry.add_argument("--image", action="append", default=[]); entry.add_argument("--category", choices=["auto", "纸笔", "练字", "城市生活", "粤语", "网球", "游泳", "健身"], default="auto"); entry.add_argument("--paper-type", choices=["练字", "画画", "纸笔创作"], default=""); entry.add_argument("--title", default=""); entry.add_argument("--date", default=date.today().isoformat()); entry.add_argument("--content", default=""); entry.add_argument("--duration", default=""); entry.add_argument("--tag", action="append", default=[]); entry.add_argument("--workout-id", default=""); entry.set_defaults(run=add_activity)
    check = sub.add_parser("status"); check.set_defaults(run=status)
    args = parser.parse_args()
    result = args.run(args)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result.get("saved") and not result.get("ok"):
        raise SystemExit(2)


if __name__ == "__main__":
    main()
