const tabs = [
  ["hero", "首页开场"],
  ["activity", "投入的事"],
  ["journal", "长记录"],
  ["gallery", "照片专题"],
  ["projects", "小项目"],
  ["contacts", "联系"],
];

const icons = ["ai", "book", "briefcase", "city", "coffee", "contact", "dumbbell", "globe", "language", "note", "spark", "swim", "tennis"];
const tones = ["bg-moss/10 text-moss", "bg-lake/10 text-lake", "bg-clay/10 text-clay", "bg-sage/20 text-moss", "bg-paper text-ink/70", "bg-fog text-ink/70"];
const galleryTones = ["from-moss/75 via-sage/60 to-paper", "from-lake/80 via-fog to-paper", "from-fog via-paper to-clay/30", "from-sage/70 via-paper to-fog", "from-ink/70 via-lake/60 to-paper", "from-clay/70 via-fog to-paper", "from-lake/60 via-paper to-sage/50"];
const tennisTags = ["发球", "单反", "步伐", "比赛", "课程", "日常", "抛球", "复盘"];

let content;
let currentTab = "activity";
let selected = 0;
let pendingQuickDraft = null;

const statusEl = document.querySelector("#status");
const saveButtonEl = document.querySelector("#save");
const tabsEl = document.querySelector("#tabs");
const itemTabsEl = document.querySelector("#itemTabs");
const editorEl = document.querySelector("#editor");
const handlers = new Map();
let handlerId = 0;

init();

async function init() {
  content = await fetch("/api/admin/content").then((response) => response.json()).then((data) => data.content ?? data);
  status("内容已载入");
  document.querySelector("#save").addEventListener("click", save);
  render();
}

function render() {
  const scrollY = window.scrollY;
  handlers.clear();
  renderTabs();
  renderItemTabs();

  if (currentTab === "hero") renderHero();
  if (currentTab === "activity") renderActivity();
  if (currentTab === "journal") renderJournal();
  if (currentTab === "gallery") renderGallery();
  if (currentTab === "projects") renderProject();
  if (currentTab === "contacts") renderContact();
  mountPendingQuickDraft();
  if (!pendingQuickDraft) {
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  }
}

function renderTabs() {
  tabsEl.innerHTML = tabs.map(([key, label]) => `<button class="${key === currentTab ? "active" : ""}" data-tab="${key}" type="button">${label}</button>`).join("");
  tabsEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      currentTab = button.dataset.tab;
      selected = 0;
      render();
    });
  });
}

function renderItemTabs() {
  const count = itemCount();
  itemTabsEl.innerHTML = count > 1 ? Array.from({ length: count }, (_, index) => `<button class="${index === selected ? "active" : ""}" data-index="${index}" type="button">${escapeHtml(itemTabLabel(index))}</button>`).join("") : "";
  itemTabsEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selected = Number(button.dataset.index);
      render();
    });
  });
}

function itemTabLabel(index) {
  const item =
    currentTab === "activity"
      ? content.activitySpotlights[index]
      : currentTab === "journal"
      ? content.journalPosts[index]
      : currentTab === "gallery"
      ? content.galleryItems[index]
      : currentTab === "projects"
      ? content.projects[index]
      : null;

  return item?.title ?? item?.category ?? item?.caption ?? `第 ${itemCount() - index} 项`;
}

function itemCount() {
  if (currentTab === "activity") return content.activitySpotlights.length;
  if (currentTab === "journal") return content.journalPosts.length;
  if (currentTab === "gallery") return content.galleryItems.length;
  if (currentTab === "projects") return content.projects.length;
  return 1;
}

function renderHero() {
  editorEl.innerHTML = grid(
    panel("首页开场", [
      field("开场小字", content.hero.eyebrow, (value) => (content.hero.eyebrow = value)),
      field("主标题", content.hero.title, (value) => (content.hero.title = value)),
      textarea("说明文字", content.hero.description, 4, (value) => (content.hero.description = value)),
      textarea("标签，一行一个", content.heroTags.join("\n"), 8, (value) => (content.heroTags = lines(value))),
    ].join("")),
    preview(content.hero.eyebrow, content.hero.title, `<p>${escapeHtml(content.hero.description)}</p><div class="tag-list">${content.heroTags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`),
  );
  bindInputs();
}

function renderActivity() {
  const item = content.activitySpotlights[selected];
  editorEl.innerHTML = grid(
    panel("投入的事", [
      actionButton("新增", () => {
        content.activitySpotlights.unshift({ title: "新主题", status: "新的状态", summary: "写一点简介。", icon: "spark", tone: "bg-moss/10 text-moss", notes: ["第一条记录"], photos: [{ label: "照片" }] });
        selected = 0;
        render();
      }),
      quickActionsForActivity(item),
      field("标题", item.title, (value) => (item.title = value)),
      field("状态", item.status, (value) => (item.status = value)),
      textarea("简介", item.summary, 4, (value) => (item.summary = value)),
      select("图标", item.icon, icons, (value) => (item.icon = value)),
      select("颜色", item.tone, tones, (value) => (item.tone = value)),
      item.shows
        ? showList(item.shows, item.uploadDir ?? "/uploads/shows")
        : item.books
        ? bookList(item.books, item.bookCoverDir ?? "/uploads/books")
        : item.checkins
        ? handwritingCheckinsEditor(item)
        : item.phrases || item.inputs || item.learningLogs
        ? languageArchiveEditor(item)
        : item.plans || item.workouts
        ? fitnessTrainingEditor(item)
        : item.records || item.essays
        ? tennisTopicEditor(item)
        : [
            textarea("最近记录，一行一条", item.notes.join("\n"), 5, (value) => (item.notes = lines(value))),
            photoList(item.photos, item.uploadDir),
          ].join(""),
    ].join("")),
    preview(
      item.title,
      item.status,
      `<p>${escapeHtml(item.summary)}</p><div class="note-list">${item.notes.map((note) => `<span>${escapeHtml(note)}</span>`).join("")}</div>`,
    ),
  );
  bindInputs();
  if (item.shows) {
    bindShowInputs(item.shows, (shows, shouldRender = true) => {
      item.shows = shows;
      if (shouldRender) render();
    }, item.uploadDir ?? "/uploads/shows");
  } else if (item.books) {
    bindBookInputs(item.books, (books, shouldRender = true) => {
      item.books = books;
      if (shouldRender) render();
    }, item.bookCoverDir ?? "/uploads/books");
  } else if (item.checkins) {
    bindHandwritingCheckins(item);
  } else if (item.phrases || item.inputs || item.learningLogs) {
    bindLanguageArchive(item);
  } else if (item.plans || item.workouts) {
    bindFitnessTraining(item);
  } else if (item.records || item.essays) {
    bindTennisTopic(item);
  } else {
    bindPhotoInputs(item.photos, (photos, shouldRender = true) => {
      item.photos = photos;
      if (shouldRender) render();
    }, item.uploadDir);
  }
}

function renderJournal() {
  const item = content.journalPosts[selected];
  editorEl.innerHTML = grid(
    panel("长记录", [
      actionButton("新增", () => {
        content.journalPosts.unshift({ date: "May 26", category: "日常", title: "新记录", summary: "写一句摘要。", body: "在这里写完整记录。", icon: "note" });
        selected = 0;
        render();
      }),
      field("日期", item.date, (value) => (item.date = value)),
      field("分类", item.category, (value) => (item.category = value)),
      field("标题", item.title, (value) => (item.title = value)),
      textarea("摘要", item.summary, 3, (value) => (item.summary = value)),
      select("图标", item.icon, icons, (value) => (item.icon = value)),
      textarea("正文", item.body, 14, (value) => (item.body = value)),
    ].join("")),
    preview(`${item.date} · ${item.category}`, item.title, `<p>${escapeHtml(item.summary)}</p><p class="preview-note">${escapeHtml(item.body)}</p>`),
  );
  bindInputs();
}

function renderGallery() {
  const item = content.galleryItems[selected];
  editorEl.innerHTML = grid(
    panel("照片专题", [
      actionButton("新增", () => {
        content.galleryItems.unshift({ category: "新专题", caption: "一句展示文案", detail: "写一点这个专题的说明。", tone: "from-moss/75 via-sage/60 to-paper", className: "lg:col-span-2", photos: [{ label: "照片" }] });
        selected = 0;
        render();
      }),
      field("分类", item.category, (value) => (item.category = value)),
      field("卡片文案", item.caption, (value) => (item.caption = value)),
      textarea("展开说明", item.detail, 4, (value) => (item.detail = value)),
      select("颜色", item.tone, galleryTones, (value) => (item.tone = value)),
      field("布局 class", item.className, (value) => (item.className = value)),
      photoList(item.photos),
    ].join("")),
    `<div class="gallery-preview"><div class="gallery-caption"><p class="eyebrow">${escapeHtml(item.category)}</p><h3>${escapeHtml(item.caption)}</h3><p>${escapeHtml(item.detail)}</p></div></div>`,
  );
  bindInputs();
  bindPhotoInputs(item.photos, (photos, shouldRender = true) => {
    item.photos = photos;
    if (shouldRender) render();
  });
}

function renderProject() {
  const item = content.projects[selected];
  editorEl.innerHTML = panel("小项目", [
    field("标题", item.title, (value) => (item.title = value)),
    field("状态", item.status, (value) => (item.status = value)),
    textarea("说明", item.description, 5, (value) => (item.description = value)),
    textarea("标签，一行一个", item.tags.join("\n"), 5, (value) => (item.tags = lines(value))),
  ].join(""));
  bindInputs();
}

function renderContact() {
  const profile = content.contactProfile;
  editorEl.innerHTML = panel("联系资料", [
    field("联系区标题", profile.eyebrow, (value) => (profile.eyebrow = value)),
    textarea("联系区说明", profile.description, 4, (value) => (profile.description = value)),
    field("邮箱", profile.email, (value) => (profile.email = value)),
    field("微信", profile.wechat, (value) => (profile.wechat = value)),
    imageField("微信二维码", profile.wechatQr, (value) => (profile.wechatQr = value)),
  ].join(""));
  bindInputs();
  bindImageInputs();
}

function grid(left, right) {
  return `<div class="editor-grid">${left}${right}</div>`;
}

function panel(title, body) {
  return `<div class="panel"><div class="panel-title"><h2>${title}</h2></div>${body}</div>`;
}

function preview(eyebrow, title, body, quickActions = "") {
  return `<div class="preview"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h3>${escapeHtml(title)}</h3>${body}${quickActions}</div>`;
}

function field(label, value, onChange) {
  const id = bind(onChange);
  return `<label class="field"><span>${label}</span><input data-bind="${id}" value="${escapeAttr(value)}" /></label>`;
}

function textarea(label, value, rows, onChange) {
  const id = bind(onChange);
  return `<label class="field"><span>${label}</span><textarea data-bind="${id}" rows="${rows}">${escapeHtml(value)}</textarea></label>`;
}

function select(label, value, options, onChange) {
  const id = bind(onChange);
  return `<label class="field"><span>${label}</span><select data-bind="${id}">${options.map((option) => `<option value="${escapeAttr(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`;
}

function imageField(label, value, onChange) {
  const id = bind(onChange);
  return `<label class="field"><span>${label}</span><div class="photo-actions"><input data-bind="${id}" value="${escapeAttr(value ?? "")}" placeholder="/uploads/image.jpg" /><label class="upload">上传<input data-image-upload data-bind-target="${id}" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label></div></label>`;
}

function actionButton(label, onClick) {
  const id = bind(onClick);
  return `<button class="pill-button" data-click="${id}" type="button">${label}</button>`;
}

function quickActionsForActivity(item) {
  const actions = [];
  const isFitness = item.plans || item.workouts;
  const isSimpleSport = item.uploadDir === "/uploads/tennis" || item.uploadDir === "/uploads/swimming";
  const hidesLongRecords = isSimpleSport || item.uploadDir === "/uploads/work-notes";

  if (item.shows) actions.push(["新增影视", "add-show"]);
  if (item.books) actions.push(["新增书籍", "add-book"]);
  if (item.checkins) actions.push(["新增打卡", "add-handwriting-checkin"]);
  if (item.phrases || item.inputs || item.learningLogs) {
    actions.push(["新增词句", "add-phrase"], ["新增记录", "add-learning-log"]);
  }
  if (isFitness) {
    actions.push(["新增文字训练", "add-workout"]);
  } else if (item.records || item.essays) {
    actions.push([item.uploadDir === "/uploads/work-notes" ? "新增札记" : "新增短记录", "add-record"]);
    if (!hidesLongRecords) actions.push(["新增长记录", "add-essay"]);
  }
  if (!item.books && !item.shows && !item.checkins && !item.phrases && !item.inputs && !item.learningLogs && !item.plans && !item.workouts && !item.records && !item.essays) {
    actions.push(["新增照片", "add-photo"]);
  }

  const photoUpload = item.checkins
    ? null
    : item.phrases || item.inputs || item.learningLogs
    ? null
    : isFitness
    ? ["上传照片训练", "fitness-photo-upload"]
    : item.uploadDir === "/uploads/work-notes"
    ? null
    : item.records || item.essays
    ? [item.uploadDir === "/uploads/work-notes" ? "上传随手照片" : item.uploadDir === "/uploads/city-life" ? "上传城市照片" : "上传训练照片", "tennis-photo-upload"]
    : null;

  if (photoUpload) actions.push(photoUpload);

  if (actions.length === 0) return "";

  return `<div class="quick-actions" aria-label="快捷新增">
    <p>快捷新增</p>
    <div>${actions.map(([label, target]) => `<button data-quick-target="${target}" type="button">${label}</button>`).join("")}</div>
    <div class="quick-draft-slot" data-quick-draft-slot></div>
  </div>`;
}

function photoList(photos, uploadDir = "/uploads") {
  return `<div class="photo-list"><button class="pill-button" data-add-photo type="button">新增照片格</button>${photos.map((photo, index) => `
    <div class="photo-row" data-photo="${index}">
      <input data-photo-label value="${escapeAttr(photo.label ?? "")}" placeholder="照片标签" />
      <div class="photo-actions">
        <input data-photo-src value="${escapeAttr(photo.src ?? "")}" placeholder="${escapeAttr(uploadDir)}/photo.jpg" />
        <label class="upload">上传<input data-photo-upload type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
        <button class="delete-photo" data-photo-delete type="button">删除</button>
      </div>
    </div>`).join("")}</div>`;
}

function bookList(books, bookCoverDir = "/uploads/books") {
  return `<div class="book-list">
    <div class="help-box">
      <strong>封面维护：</strong>先点“获取封面”，维护台会自动查找并保存到 <code>${escapeHtml(bookCoverDir)}</code>。
      如果没找到，可以去 <a href="https://openlibrary.org/search" target="_blank" rel="noreferrer">Open Library</a>、
      <a href="https://books.google.com/" target="_blank" rel="noreferrer">Google Books</a>、豆瓣读书或出版社页面找封面，
      复制图片地址粘到“封面 URL”。也可以把截图裁成封面后点“上传封面”。
    </div>
    <button class="pill-button" data-add-book type="button">新增书籍</button>
    ${books.map((book, index) => `
      <div class="book-row" data-book="${index}">
        <div class="book-row-title">第 ${books.length - index} 本</div>
        <input data-book-title value="${escapeAttr(book.title ?? "")}" placeholder="书名" />
        <input data-book-author value="${escapeAttr(book.author ?? "")}" placeholder="作者" />
        <input data-book-status value="${escapeAttr(book.status ?? "")}" placeholder="阅读状态" />
        <select data-book-tone>${galleryTones.map((tone) => `<option value="${escapeAttr(tone)}" ${tone === book.coverTone ? "selected" : ""}>${escapeHtml(tone)}</option>`).join("")}</select>
        <div class="photo-actions">
          <input data-book-cover value="${escapeAttr(book.cover ?? "")}" placeholder="${escapeAttr(bookCoverDir)}/cover.jpg" />
          <button class="upload" data-fetch-cover type="button">获取封面</button>
          <button class="upload" data-save-cover-local type="button">存到本地</button>
          <label class="upload">上传封面<input data-book-cover-upload type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
          <button class="delete-photo" data-delete-book type="button">删除</button>
        </div>
        <div class="cover-feedback" data-cover-feedback></div>
        <div class="note-tools">
          <button class="pill-button" data-add-note="摘抄" type="button">新增摘抄</button>
          <button class="pill-button" data-add-note="想法" type="button">新增想法</button>
        </div>
        <div class="book-notes">
          ${(book.notes ?? []).map((note, noteIndex) => `
            <div class="note-row" data-note="${noteIndex}">
              <select data-note-type>
                ${["摘抄", "想法"].map((type) => `<option value="${type}" ${normalizeNoteType(note.type) === type ? "selected" : ""}>${type}</option>`).join("")}
              </select>
              <textarea data-note-text rows="3" placeholder="写下这一条内容">${escapeHtml(note.text ?? "")}</textarea>
              <button class="delete-photo" data-delete-note type="button">删除这一条</button>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("")}
  </div>`;
}

function showList(shows, posterDir = "/uploads/shows") {
  return `<div class="book-list">
    <div class="help-box">
      <strong>海报维护：</strong>输入影视名称和类型后点“获取海报”，维护台会搜索并保存到 <code>${escapeHtml(posterDir)}</code>。
      查不到时，可以手动粘贴海报 URL 后点“存到本地”，或上传海报图片。保存到网站时也会自动把远程图片存成本地路径。
    </div>
    <button class="pill-button" data-add-show type="button">新增影视</button>
    ${shows.map((show, index) => `
      <div class="book-row" data-show="${index}">
        <div class="book-row-title">第 ${shows.length - index} 部</div>
        <input data-show-title value="${escapeAttr(show.title ?? "")}" placeholder="影视名称" />
        <input data-show-creator value="${escapeAttr(show.creator ?? "")}" placeholder="主创 / 平台 / 备注" />
        <select data-show-kind>
          ${["电视剧", "电影"].map((kind) => `<option value="${kind}" ${kind === show.kind ? "selected" : ""}>${kind}</option>`).join("")}
        </select>
        <input data-show-status value="${escapeAttr(show.status ?? "")}" placeholder="状态，例如 正在看 / 想重看" />
        <input data-show-meta value="${escapeAttr(show.meta ?? "")}" placeholder="标签文案，例如 职场 / 媒体 / 群像" />
        <select data-show-tone>${galleryTones.map((tone) => `<option value="${escapeAttr(tone)}" ${tone === show.posterTone ? "selected" : ""}>${escapeHtml(tone)}</option>`).join("")}</select>
        <div class="photo-actions">
          <input data-show-poster value="${escapeAttr(show.poster ?? "")}" placeholder="${escapeAttr(posterDir)}/poster.jpg" />
          <button class="upload" data-fetch-show-poster type="button">获取海报</button>
          <button class="upload" data-save-show-poster-local type="button">存到本地</button>
          <label class="upload">上传海报<input data-show-poster-upload type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
          <button class="delete-photo" data-delete-show type="button">删除</button>
        </div>
        <div class="cover-feedback" data-show-feedback></div>
        <div class="note-tools">
          <button class="pill-button" data-add-character type="button">新增人物</button>
          <button class="pill-button" data-add-show-note="剧情" type="button">新增剧情笔记</button>
          <button class="pill-button" data-add-show-note="台词" type="button">新增台词笔记</button>
        </div>
        <div class="book-notes">
          ${(show.characters ?? []).map((character, characterIndex) => `
            <div class="note-row" data-character="${characterIndex}">
              <input data-character-name value="${escapeAttr(character.name ?? "")}" placeholder="人物名称" />
              <textarea data-character-note rows="3" placeholder="为什么喜欢 / 角色观察">${escapeHtml(character.note ?? "")}</textarea>
              <button class="delete-photo" data-delete-character type="button">删除人物</button>
            </div>
          `).join("")}
          ${(show.notes ?? []).map((note, noteIndex) => `
            <div class="note-row" data-show-note="${noteIndex}">
              <select data-show-note-type>
                ${["剧情", "台词", "人物", "画面", "节奏"].map((type) => `<option value="${type}" ${type === note.type ? "selected" : ""}>${type}</option>`).join("")}
              </select>
              <textarea data-show-note-text rows="3" placeholder="剧情、台词或观感记录">${escapeHtml(note.text ?? "")}</textarea>
              <button class="delete-photo" data-delete-show-note type="button">删除笔记</button>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("")}
  </div>`;
}

function handwritingCheckinsEditor(item) {
  const uploadDir = item.uploadDir ?? "/uploads/handwriting";
  return `<div class="topic-grid">
    <section class="topic-panel">
      <div class="topic-heading">
        <h3>练字打卡</h3>
        <button class="pill-button" data-add-handwriting-checkin type="button">新增打卡</button>
      </div>
      ${(item.checkins ?? []).map((checkin, index) => `
        <div class="topic-row" data-handwriting-checkin="${index}">
          <input data-checkin-date value="${escapeAttr(checkin.date ?? today())}" type="date" />
          <input data-checkin-label value="${escapeAttr(checkin.label ?? "")}" placeholder="标题，例如今日练字" />
          <input data-checkin-content value="${escapeAttr(checkin.content ?? "")}" placeholder="练习内容，例如楷书基础笔画" />
          <input data-checkin-duration value="${escapeAttr(checkin.duration ?? "")}" placeholder="时长，例如 20 分钟" />
          <textarea data-checkin-note rows="3" placeholder="一句备注">${escapeHtml(checkin.note ?? "")}</textarea>
          <div class="photo-actions">
            <input data-checkin-src value="${escapeAttr(checkin.src ?? "")}" placeholder="${escapeAttr(uploadDir)}/practice.jpg" />
            <label class="upload">上传纸页<input data-checkin-upload type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
            <button class="delete-photo" data-delete-handwriting-checkin type="button">删除</button>
          </div>
        </div>
      `).join("")}
    </section>
  </div>`;
}

function languageArchiveEditor(item) {
  return `<div class="topic-grid">
    <section class="topic-panel">
      <div class="topic-heading">
        <h3>词句卡片</h3>
        <button class="pill-button" data-add-phrase type="button">新增词句</button>
      </div>
      ${(item.phrases ?? []).map((phrase, index) => `
        <div class="topic-row" data-phrase="${index}">
          <input data-phrase-text value="${escapeAttr(phrase.text ?? "")}" placeholder="粤语句子" />
          <input data-phrase-jyutping value="${escapeAttr(phrase.jyutping ?? "")}" placeholder="粤拼" />
          <input data-phrase-meaning value="${escapeAttr(phrase.meaning ?? "")}" placeholder="中文意思" />
          <input data-phrase-scene value="${escapeAttr(phrase.scene ?? "")}" placeholder="使用场景" />
          <textarea data-phrase-note rows="3" placeholder="发音提醒">${escapeHtml(phrase.note ?? "")}</textarea>
          <button class="delete-photo" data-delete-phrase type="button">删除词句</button>
        </div>
      `).join("")}
    </section>

    <section class="topic-panel">
      <div class="topic-heading">
        <h3>学习记录</h3>
        <button class="pill-button" data-add-learning-log type="button">新增记录</button>
      </div>
      ${(item.learningLogs ?? []).map((log, index) => `
        <div class="topic-row" data-learning-log="${index}">
          <input data-log-date value="${escapeAttr(log.date ?? today())}" type="date" />
          <input data-log-type value="${escapeAttr(log.type ?? "复盘")}" placeholder="类型，例如课程 / 复盘 / 观察 / 阶段总结" />
          <input data-log-title value="${escapeAttr(log.title ?? "")}" placeholder="标题" />
          <textarea data-log-summary rows="4" placeholder="记录内容">${escapeHtml(log.summary ?? "")}</textarea>
          <textarea data-log-tags rows="2" placeholder="标签，一行一个">${escapeHtml((log.tags ?? []).join("\n"))}</textarea>
          <button class="delete-photo" data-delete-learning-log type="button">删除记录</button>
        </div>
      `).join("")}
    </section>
  </div>`;
}

function fitnessTrainingEditor(item) {
  const uploadDir = item.uploadDir ?? "/uploads/fitness";
  return `<div class="topic-grid">
    <section class="topic-panel">
      <div class="topic-heading">
        <h3>纯文字训练</h3>
        <button class="pill-button" data-add-workout type="button">新增文字训练</button>
      </div>
      ${(item.workouts ?? []).map((workout, index) => `
        <div class="topic-row" data-workout="${index}">
          <input data-workout-date value="${escapeAttr(workout.date ?? today())}" type="date" />
          <input data-workout-title value="${escapeAttr(workout.title ?? "")}" placeholder="训练标题，例如上肢拉 + 核心" />
          <textarea data-workout-parts rows="3" placeholder="训练部位，一行一个">${escapeHtml((workout.parts ?? []).join("\n"))}</textarea>
          <input data-workout-duration value="${escapeAttr(workout.duration ?? "")}" placeholder="时长，例如 45 分钟" />
          <input data-workout-intensity value="${escapeAttr(workout.intensity ?? "")}" placeholder="强度，例如 中等" />
          <textarea data-workout-summary rows="4" placeholder="简短总结">${escapeHtml(workout.summary ?? "")}</textarea>
          <button class="delete-photo" data-delete-workout type="button">删除训练</button>
        </div>
      `).join("")}
    </section>

    <section class="topic-panel">
      <div class="topic-heading">
        <h3>带照片训练</h3>
        <label class="upload">上传照片训练<input data-fitness-photo-upload type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
      </div>
      ${(item.photos ?? []).map((photo, index) => `
        <div class="topic-row" data-fitness-photo="${index}">
          <input data-photo-label value="${escapeAttr(photo.label ?? "")}" placeholder="训练标题，例如上肢拉 + 核心" />
          <input data-photo-src value="${escapeAttr(photo.src ?? "")}" placeholder="${escapeAttr(uploadDir)}/photo.jpg" />
          <input data-photo-date value="${escapeAttr(photo.date ?? today())}" type="date" />
          <input data-photo-month value="${escapeAttr(photo.month ?? monthFromDate(photo.date ?? today()))}" placeholder="YYYY-MM" />
          <textarea data-photo-note rows="4" placeholder="这次带照片训练的内容、动作、重量、感受">${escapeHtml(photo.note ?? "")}</textarea>
          <textarea data-photo-tags rows="2" placeholder="训练部位 / 动作 / 强度，一行一个">${escapeHtml((photo.tags ?? []).join("\n"))}</textarea>
          <button class="delete-photo" data-delete-fitness-photo type="button">删除照片</button>
        </div>
      `).join("")}
    </section>

  </div>`;
}

function tennisTopicEditor(item) {
  const isWorkNotes = item.uploadDir === "/uploads/work-notes" || item.title === "随手札记" || item.title === "做事札记";
  const isCityLife = item.uploadDir === "/uploads/city-life" || item.title === "城市生活";
  const isSimpleSport = item.uploadDir === "/uploads/tennis" || item.uploadDir === "/uploads/swimming";
  const hidesLongRecords = isSimpleSport || isWorkNotes;
  const usesFreeTags = isWorkNotes || isCityLife;
  const photoTitle = isWorkNotes ? "随手照片" : isCityLife ? "城市照片" : "训练照片";
  const uploadLabel = isWorkNotes ? "上传随手照片" : isCityLife ? "上传城市照片" : "上传训练照片";
  if (isWorkNotes) {
    return `<div class="topic-grid single-topic-grid">
      <section class="topic-panel">
        <div class="topic-heading">
          <h3>文字札记</h3>
          <button class="pill-button" data-add-record type="button">新增札记</button>
        </div>
        ${(item.records ?? []).map((record, index) => `
          <div class="topic-row" data-record="${index}">
            <input data-record-date value="${escapeAttr(record.date ?? today())}" type="date" />
            <input data-record-title value="${escapeAttr(record.title ?? "")}" placeholder="标题，例如路上看到的一句话" />
            <textarea data-record-summary rows="5" placeholder="摘抄、感悟、观察，都可以短短写下来">${escapeHtml(record.summary ?? "")}</textarea>
            <textarea data-record-tags rows="2" placeholder="标签，一行一个">${escapeHtml((record.tags ?? []).join("\n"))}</textarea>
            <button class="delete-photo" data-delete-record type="button">删除札记</button>
          </div>
        `).join("")}
      </section>
    </div>`;
  }
  return `<div class="topic-grid">
    <section class="topic-panel">
      <div class="topic-heading">
        <h3>最近记录</h3>
        <button class="pill-button" data-add-record type="button">新增短记录</button>
      </div>
      ${(item.records ?? []).map((record, index) => `
        <div class="topic-row" data-record="${index}">
          <input data-record-date value="${escapeAttr(record.date ?? today())}" type="date" />
          <input data-record-title value="${escapeAttr(record.title ?? "")}" placeholder="标题" />
          <textarea data-record-summary rows="3" placeholder="短记录内容">${escapeHtml(record.summary ?? "")}</textarea>
          ${usesFreeTags ? `<textarea data-record-tags rows="2" placeholder="标签，一行一个">${escapeHtml((record.tags ?? []).join("\n"))}</textarea>` : tagPicker(record.tags ?? [], "record")}
          <button class="delete-photo" data-delete-record type="button">删除短记录</button>
        </div>
      `).join("")}
    </section>

    <section class="topic-panel">
      <div class="topic-heading">
        <h3>${photoTitle}</h3>
        <label class="upload">${uploadLabel}<input data-tennis-photo-upload type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
      </div>
      ${(item.photos ?? []).map((photo, index) => `
        <div class="topic-row" data-tennis-photo="${index}">
          <input data-photo-label value="${escapeAttr(photo.label ?? "")}" placeholder="照片标题 / label" />
          ${isWorkNotes ? `<input data-photo-project value="${escapeAttr(photo.project ?? "")}" placeholder="来源 / 场景，例如路上看到、会议、聊天" />` : ""}
          ${isCityLife ? `<input data-photo-city value="${escapeAttr(photo.city ?? "")}" placeholder="城市，例如上海" />` : ""}
          <input data-photo-src value="${escapeAttr(photo.src ?? "")}" placeholder="${escapeAttr(item.uploadDir ?? "/uploads")}/photo.jpg" />
          <input data-photo-date value="${escapeAttr(photo.date ?? today())}" type="date" />
          <input data-photo-month value="${escapeAttr(photo.month ?? monthFromDate(photo.date ?? today()))}" placeholder="YYYY-MM" />
          <textarea data-photo-note rows="2" placeholder="备注，可不写">${escapeHtml(photo.note ?? "")}</textarea>
          ${usesFreeTags ? `<textarea data-photo-tags rows="2" placeholder="标签，一行一个">${escapeHtml((photo.tags ?? []).join("\n"))}</textarea>` : tagPicker(photo.tags ?? [], "photo")}
          <button class="delete-photo" data-delete-tennis-photo type="button">删除照片</button>
        </div>
      `).join("")}
    </section>

    ${hidesLongRecords ? "" : `<section class="topic-panel">
      <div class="topic-heading">
        <h3>长记录</h3>
        <button class="pill-button" data-add-essay type="button">新增长记录</button>
      </div>
      ${(item.essays ?? []).map((essay, index) => `
        <div class="topic-row" data-essay="${index}">
          <input data-essay-date value="${escapeAttr(essay.date ?? today())}" type="date" />
          <input data-essay-type value="${escapeAttr(essay.type ?? "训练复盘")}" placeholder="类型，例如训练复盘" />
          <input data-essay-title value="${escapeAttr(essay.title ?? "")}" placeholder="标题" />
          <textarea data-essay-summary rows="4" placeholder="摘要 / 内容预览">${escapeHtml(essay.summary ?? "")}</textarea>
          ${usesFreeTags ? `<textarea data-essay-tags rows="2" placeholder="标签，一行一个">${escapeHtml((essay.tags ?? []).join("\n"))}</textarea>` : tagPicker(essay.tags ?? [], "essay")}
          <button class="delete-photo" data-delete-essay type="button">删除长记录</button>
        </div>
      `).join("")}
    </section>`}
  </div>`;
}

function tagPicker(selectedTags, scope) {
  return `<div class="tag-picker" data-tag-picker="${scope}">
    ${tennisTags.map((tag) => `
      <button class="${selectedTags.includes(tag) ? "selected" : ""}" data-tag="${escapeAttr(tag)}" type="button">${escapeHtml(tag)}</button>
    `).join("")}
  </div>`;
}

function bind(handler) {
  const id = String(++handlerId);
  handlers.set(id, handler);
  return id;
}

function bindInputs() {
  editorEl.querySelectorAll("[data-bind]").forEach((element) => {
    element.addEventListener("input", () => handlers.get(element.dataset.bind)(element.value));
  });
  editorEl.querySelectorAll("[data-click]").forEach((element) => {
    element.addEventListener("click", () => handlers.get(element.dataset.click)());
  });
  bindQuickActions();
}

function bindQuickActions() {
  editorEl.querySelectorAll("[data-quick-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.quickTarget;
      pendingQuickDraft = createPendingQuickDraft(target);
      const action = editorEl.querySelector(`[data-${target}]`);
      if (action) {
        action.click();
      }
    });
  });
}

function mountPendingQuickDraft() {
  if (!pendingQuickDraft) return;

  const slot = editorEl.querySelector("[data-quick-draft-slot]");
  const selector = quickDraftSelector(pendingQuickDraft.target);
  if (!slot || !selector) return;

  const rows = editorEl.querySelectorAll(selector);
  const row = Array.from(rows).find((item) => Number(item.dataset[pendingQuickDraft.datasetKey]) === pendingQuickDraft.index);
  if (!row) return;

  const draft = document.createElement("div");
  draft.className = "quick-draft";
  draft.innerHTML = `
    <div class="quick-draft-head">
      <span>正在维护</span>
      <button type="button" data-finish-quick-draft>完成，放回列表</button>
    </div>
  `;
  draft.appendChild(row);
  slot.replaceChildren(draft);
  slot.hidden = false;

  draft.querySelector("[data-finish-quick-draft]").addEventListener("click", async () => {
    pendingQuickDraft = null;
    render();
    await save();
  });

  requestAnimationFrame(() => {
    draft.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const firstInput = draft.querySelector("input, textarea, select");
    firstInput?.focus();
  });
}

function createPendingQuickDraft(target) {
  const list = quickDraftList(target);
  return {
    target,
    index: 0,
    datasetKey: quickDraftDatasetKey(target),
  };
}

function clearPendingQuickDraft(target, index) {
  if (pendingQuickDraft?.target === target && pendingQuickDraft.index === index) {
    pendingQuickDraft = null;
  }
}

function quickDraftList(target) {
  const item = content?.activitySpotlights?.[selected];
  if (!item) return null;

  return {
    "add-photo": item.photos,
    "add-book": item.books,
    "add-show": item.shows,
    "add-handwriting-checkin": item.checkins,
    "add-phrase": item.phrases,
    "add-learning-log": item.learningLogs,
    "add-workout": item.workouts,
    "fitness-photo-upload": item.photos,
    "add-record": item.records,
    "tennis-photo-upload": item.photos,
    "add-essay": item.essays,
  }[target] ?? null;
}

function quickDraftSelector(target) {
  return {
    "add-photo": "[data-photo]",
    "add-book": "[data-book]",
    "add-show": "[data-show]",
    "add-handwriting-checkin": "[data-handwriting-checkin]",
    "add-phrase": "[data-phrase]",
    "add-learning-log": "[data-learning-log]",
    "add-workout": "[data-workout]",
    "fitness-photo-upload": "[data-fitness-photo]",
    "add-record": "[data-record]",
    "tennis-photo-upload": "[data-tennis-photo]",
    "add-essay": "[data-essay]",
  }[target] ?? "";
}

function quickDraftDatasetKey(target) {
  return {
    "add-photo": "photo",
    "add-book": "book",
    "add-show": "show",
    "add-handwriting-checkin": "handwritingCheckin",
    "add-phrase": "phrase",
    "add-learning-log": "learningLog",
    "add-workout": "workout",
    "fitness-photo-upload": "fitnessPhoto",
    "add-record": "record",
    "tennis-photo-upload": "tennisPhoto",
    "add-essay": "essay",
  }[target] ?? "";
}

function bindImageInputs() {
  editorEl.querySelectorAll("[data-image-upload]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const uploaded = await upload(file);
      const targetId = input.dataset.bindTarget;
      const target = editorEl.querySelector(`[data-bind="${targetId}"]`);
      if (target) {
        target.value = uploaded.src;
        handlers.get(targetId)(uploaded.src);
      }
      event.target.value = "";
    });
  });
}

function bindPhotoInputs(photos, onChange, uploadDir = "/uploads") {
  const getNext = () => structuredClone(photos);

  editorEl.querySelector("[data-add-photo]")?.addEventListener("click", () => {
    onChange([{ label: "新照片" }, ...photos]);
  });

  editorEl.querySelectorAll("[data-photo]").forEach((row) => {
    const index = Number(row.dataset.photo);
    row.querySelector("[data-photo-label]").addEventListener("input", (event) => {
      photos[index].label = event.target.value;
      onChange(photos, false);
    });
    row.querySelector("[data-photo-src]").addEventListener("input", (event) => {
      photos[index].src = event.target.value || undefined;
      onChange(photos, false);
    });
    row.querySelector("[data-photo-upload]").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const uploaded = await upload(file, "/api/admin/upload", uploadDir);
      const next = getNext();
      next[index] = { label: next[index].label || uploaded.label, src: uploaded.src };
      onChange(next);
    });
    row.querySelector("[data-photo-delete]").addEventListener("click", () => {
      const next = getNext();
      next.splice(index, 1);
      onChange(next);
    });
  });
}

function bindBookInputs(books, onChange, bookCoverDir = "/uploads/books") {
  const getNext = () => structuredClone(books);

  editorEl.querySelector("[data-add-book]")?.addEventListener("click", () => {
    onChange([
      {
        title: "新书",
        author: "",
        status: "正在读",
        cover: "",
        coverTone: "from-fog via-white to-clay/30",
        notes: [{ type: "想法", text: "写一点读到这里的想法。" }],
      },
      ...books,
    ]);
  });

  editorEl.querySelectorAll("[data-book]").forEach((row) => {
    const index = Number(row.dataset.book);
    const updateBook = (patch) => {
      books[index] = { ...books[index], ...patch };
      onChange(books, false);
    };

    row.querySelector("[data-book-title]").addEventListener("input", (event) => updateBook({ title: event.target.value }));
    row.querySelector("[data-book-author]").addEventListener("input", (event) => updateBook({ author: event.target.value }));
    row.querySelector("[data-book-status]").addEventListener("input", (event) => updateBook({ status: event.target.value }));
    row.querySelector("[data-book-tone]").addEventListener("input", (event) => updateBook({ coverTone: event.target.value }));
    row.querySelector("[data-book-cover]").addEventListener("input", (event) => {
      updateBook({ cover: event.target.value });
      status("封面 URL 已填入。点“存到本地”会下载到 /uploads/books；直接保存则只是引用这个 URL。");
    });
    row.querySelector("[data-fetch-cover]").addEventListener("click", async () => {
      const current = getNext()[index];
      const feedback = row.querySelector("[data-cover-feedback]");
      setCoverFeedback(feedback, `正在查找《${current.title}》封面...`);
      status(`正在查找《${current.title}》封面...`);
      const result = await fetchCover(current, bookCoverDir);

      if (!result.cover) {
        setCoverFeedback(feedback, result.message || "没有找到封面，可以手动粘贴封面 URL，或上传截图裁好的封面。", "error");
        status("没有找到封面，可以手动粘贴封面 URL。");
        return;
      }

      const next = getNext();
      next[index] = { ...next[index], cover: result.cover };
      onChange(next);
      setCoverFeedback(feedback, `已保存封面到 ${result.cover}`);
      status(`已找到并保存封面：${result.source ?? "Open Library"}，记得保存内容。`);
    });

    row.querySelector("[data-book-cover-upload]").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const uploaded = await upload(file, "/api/admin/upload", bookCoverDir);
      const next = getNext();
      next[index] = { ...next[index], cover: uploaded.src };
      onChange(next);
      event.target.value = "";
      status(`封面已上传到 ${bookCoverDir}，记得保存内容。`);
    });

    row.querySelector("[data-save-cover-local]").addEventListener("click", async () => {
      const current = getNext()[index];
      const feedback = row.querySelector("[data-cover-feedback]");
      const remoteUrl = current.cover?.trim();

      if (!remoteUrl || !/^https?:\/\//i.test(remoteUrl)) {
        setCoverFeedback(feedback, "请先粘贴一个 http 或 https 开头的封面 URL。", "error");
        status("请先粘贴一个 http 或 https 开头的封面 URL。");
        return;
      }

      setCoverFeedback(feedback, "正在把远程封面保存到本地...");
      status("正在把远程封面保存到本地...");

      try {
        const result = await saveRemoteImage(remoteUrl, current.title || "book-cover", bookCoverDir);
        const next = getNext();
        next[index] = { ...next[index], cover: result.src };
        onChange(next);
        setCoverFeedback(feedback, `已保存到 ${result.src}`);
        status("封面已保存到本地，记得点“保存到网站”。");
      } catch (error) {
        setCoverFeedback(feedback, `保存到本地失败：${error.message ?? "远程图片无法下载"}`, "error");
        status("保存到本地失败，可以继续保留远程 URL 或手动上传图片。");
      }
    });

    row.querySelector("[data-delete-book]").addEventListener("click", () => {
      const next = getNext();
      next.splice(index, 1);
      onChange(next);
    });

    row.querySelectorAll("[data-add-note]").forEach((button) => {
      button.addEventListener("click", async () => {
        const text = await openNoteDialog(button.dataset.addNote);
        if (!text) return;
        const next = getNext();
        next[index].notes = [{ type: button.dataset.addNote, text }, ...(next[index].notes ?? [])];
        onChange(next);
      });
    });

    row.querySelectorAll("[data-note]").forEach((noteRow) => {
      const noteIndex = Number(noteRow.dataset.note);
      const updateNote = (patch) => {
        const notes = [...(books[index].notes ?? [])];
        notes[noteIndex] = { ...notes[noteIndex], ...patch };
        books[index] = { ...books[index], notes };
        onChange(books, false);
      };

      noteRow.querySelector("[data-note-type]").addEventListener("input", (event) => updateNote({ type: event.target.value }));
      noteRow.querySelector("[data-note-text]").addEventListener("input", (event) => updateNote({ text: event.target.value }));
      noteRow.querySelector("[data-delete-note]").addEventListener("click", () => {
        const next = getNext();
        next[index].notes = (next[index].notes ?? []).filter((_, itemIndex) => itemIndex !== noteIndex);
        onChange(next);
      });
    });
  });
}

function bindShowInputs(shows, onChange, posterDir = "/uploads/shows") {
  const getNext = () => structuredClone(shows);

  editorEl.querySelector("[data-add-show]")?.addEventListener("click", () => {
    onChange([
      {
        title: "新片名",
        creator: "",
        kind: "电视剧",
        status: "想看",
        poster: "",
        posterTone: "from-fog via-paper to-moss/55",
        meta: "",
        characters: [],
        notes: [],
      },
      ...shows,
    ]);
  });

  editorEl.querySelectorAll("[data-show]").forEach((row) => {
    const index = Number(row.dataset.show);
    const updateShow = (patch) => {
      shows[index] = { ...shows[index], ...patch };
      onChange(shows, false);
    };

    row.querySelector("[data-show-title]").addEventListener("input", (event) => updateShow({ title: event.target.value }));
    row.querySelector("[data-show-creator]").addEventListener("input", (event) => updateShow({ creator: event.target.value }));
    row.querySelector("[data-show-kind]").addEventListener("input", (event) => updateShow({ kind: event.target.value }));
    row.querySelector("[data-show-status]").addEventListener("input", (event) => updateShow({ status: event.target.value }));
    row.querySelector("[data-show-meta]").addEventListener("input", (event) => updateShow({ meta: event.target.value }));
    row.querySelector("[data-show-tone]").addEventListener("input", (event) => updateShow({ posterTone: event.target.value }));
    row.querySelector("[data-show-poster]").addEventListener("input", (event) => {
      updateShow({ poster: event.target.value });
      status("海报 URL 已填入。点“存到本地”会下载到 /uploads/shows；保存时也会自动本地化。");
    });

    row.querySelector("[data-fetch-show-poster]").addEventListener("click", async () => {
      const current = getNext()[index];
      const feedback = row.querySelector("[data-show-feedback]");
      setCoverFeedback(feedback, `正在查找《${current.title}》海报...`);
      status(`正在查找《${current.title}》海报...`);
      const result = await fetchShowPoster(current, posterDir);

      if (!result.poster) {
        setCoverFeedback(feedback, result.message || "没有找到海报，可以手动粘贴 URL，或上传海报图片。", "error");
        status("没有找到海报，可以手动粘贴 URL 或上传图片。");
        return;
      }

      const next = getNext();
      next[index] = {
        ...next[index],
        poster: result.poster,
        creator: next[index].creator || result.creator || "",
      };
      onChange(next);
      setCoverFeedback(feedback, `已保存海报到 ${result.poster}`);
      status(`已找到并保存海报：${result.source ?? "iTunes Search"}，记得保存内容。`);
    });

    row.querySelector("[data-show-poster-upload]").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const uploaded = await upload(file, "/api/admin/upload", posterDir);
      const next = getNext();
      next[index] = { ...next[index], poster: uploaded.src };
      onChange(next);
      event.target.value = "";
      status(`海报已上传到 ${posterDir}，记得保存内容。`);
    });

    row.querySelector("[data-save-show-poster-local]").addEventListener("click", async () => {
      const current = getNext()[index];
      const feedback = row.querySelector("[data-show-feedback]");
      const remoteUrl = current.poster?.trim();

      if (!remoteUrl || !/^https?:\/\//i.test(remoteUrl)) {
        setCoverFeedback(feedback, "请先粘贴一个 http 或 https 开头的海报 URL。", "error");
        status("请先粘贴一个 http 或 https 开头的海报 URL。");
        return;
      }

      setCoverFeedback(feedback, "正在把远程海报保存到本地...");
      status("正在把远程海报保存到本地...");

      try {
        const result = await saveRemoteImage(remoteUrl, current.title || "show-poster", posterDir);
        const next = getNext();
        next[index] = { ...next[index], poster: result.src };
        onChange(next);
        setCoverFeedback(feedback, `已保存到 ${result.src}`);
        status("海报已保存到本地，记得点“保存到网站”。");
      } catch (error) {
        setCoverFeedback(feedback, `保存到本地失败：${error.message ?? "远程图片无法下载"}`, "error");
        status("保存到本地失败，请换一个图片地址或手动上传图片。");
      }
    });

    row.querySelector("[data-delete-show]").addEventListener("click", () => {
      const next = getNext();
      next.splice(index, 1);
      onChange(next);
    });

    row.querySelector("[data-add-character]").addEventListener("click", () => {
      const next = getNext();
      next[index].characters = [{ name: "新人物", note: "" }, ...(next[index].characters ?? [])];
      onChange(next);
    });

    row.querySelectorAll("[data-add-show-note]").forEach((button) => {
      button.addEventListener("click", async () => {
        const text = await openNoteDialog(button.dataset.addShowNote);
        if (!text) return;
        const next = getNext();
        next[index].notes = [{ type: button.dataset.addShowNote, text }, ...(next[index].notes ?? [])];
        onChange(next);
      });
    });

    row.querySelectorAll("[data-character]").forEach((characterRow) => {
      const characterIndex = Number(characterRow.dataset.character);
      const updateCharacter = (patch) => {
        const characters = [...(shows[index].characters ?? [])];
        characters[characterIndex] = { ...characters[characterIndex], ...patch };
        shows[index] = { ...shows[index], characters };
        onChange(shows, false);
      };

      characterRow.querySelector("[data-character-name]").addEventListener("input", (event) => updateCharacter({ name: event.target.value }));
      characterRow.querySelector("[data-character-note]").addEventListener("input", (event) => updateCharacter({ note: event.target.value }));
      characterRow.querySelector("[data-delete-character]").addEventListener("click", () => {
        const next = getNext();
        next[index].characters = (next[index].characters ?? []).filter((_, itemIndex) => itemIndex !== characterIndex);
        onChange(next);
      });
    });

    row.querySelectorAll("[data-show-note]").forEach((noteRow) => {
      const noteIndex = Number(noteRow.dataset.showNote);
      const updateNote = (patch) => {
        const notes = [...(shows[index].notes ?? [])];
        notes[noteIndex] = { ...notes[noteIndex], ...patch };
        shows[index] = { ...shows[index], notes };
        onChange(shows, false);
      };

      noteRow.querySelector("[data-show-note-type]").addEventListener("input", (event) => updateNote({ type: event.target.value }));
      noteRow.querySelector("[data-show-note-text]").addEventListener("input", (event) => updateNote({ text: event.target.value }));
      noteRow.querySelector("[data-delete-show-note]").addEventListener("click", () => {
        const next = getNext();
        next[index].notes = (next[index].notes ?? []).filter((_, itemIndex) => itemIndex !== noteIndex);
        onChange(next);
      });
    });
  });
}

function bindHandwritingCheckins(item) {
  const updateItem = (patch, shouldRender = true) => {
    Object.assign(item, patch);
    if (shouldRender) render();
  };

  editorEl.querySelector("[data-add-handwriting-checkin]")?.addEventListener("click", () => {
    updateItem({
      checkins: [
        {
          date: today(),
          label: "今日练字",
          content: "楷书基础笔画",
          duration: "20 分钟",
          note: "",
          src: "",
        },
        ...(item.checkins ?? []),
      ],
    });
  });

  editorEl.querySelectorAll("[data-handwriting-checkin]").forEach((row) => {
    const index = Number(row.dataset.handwritingCheckin);
    bindListItem(row, item.checkins, index, updateItem, "checkins", {
      date: "[data-checkin-date]",
      label: "[data-checkin-label]",
      content: "[data-checkin-content]",
      duration: "[data-checkin-duration]",
      note: "[data-checkin-note]",
      src: "[data-checkin-src]",
    });

    row.querySelector("[data-checkin-upload]").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const uploaded = await upload(file, "/api/admin/upload", item.uploadDir ?? "/uploads/handwriting");
      const next = structuredClone(item.checkins ?? []);
      next[index] = {
        ...next[index],
        label: next[index].label || uploaded.label,
        src: uploaded.src,
      };
      updateItem({ checkins: next });
      event.target.value = "";
    });

    row.querySelector("[data-delete-handwriting-checkin]").addEventListener("click", () => deleteListItem(item.checkins, index, updateItem, "checkins"));
  });
}

function bindLanguageArchive(item) {
  const updateItem = (patch, shouldRender = true) => {
    Object.assign(item, patch);
    if (shouldRender) render();
  };

  editorEl.querySelector("[data-add-phrase]")?.addEventListener("click", () => {
    updateItem({
      phrases: [
        { text: "新句子", jyutping: "", meaning: "", scene: "", note: "" },
        ...(item.phrases ?? []),
      ],
    });
  });

  editorEl.querySelector("[data-add-learning-log]")?.addEventListener("click", () => {
    updateItem({
      learningLogs: [
        { date: today(), type: "复盘", title: "新的学习记录", summary: "", tags: ["粤语"] },
        ...(item.learningLogs ?? []),
      ],
    });
  });

  editorEl.querySelectorAll("[data-phrase]").forEach((row) => {
    const index = Number(row.dataset.phrase);
    bindListItem(row, item.phrases, index, updateItem, "phrases", {
      text: "[data-phrase-text]",
      jyutping: "[data-phrase-jyutping]",
      meaning: "[data-phrase-meaning]",
      scene: "[data-phrase-scene]",
      note: "[data-phrase-note]",
    });
    row.querySelector("[data-delete-phrase]").addEventListener("click", () => deleteListItem(item.phrases, index, updateItem, "phrases"));
  });

  editorEl.querySelectorAll("[data-learning-log]").forEach((row) => {
    const index = Number(row.dataset.learningLog);
    bindListItem(row, item.learningLogs, index, updateItem, "learningLogs", {
      date: "[data-log-date]",
      type: "[data-log-type]",
      title: "[data-log-title]",
      summary: "[data-log-summary]",
    });
    bindLineList(row, item.learningLogs, index, updateItem, "learningLogs", "tags", "[data-log-tags]");
    row.querySelector("[data-delete-learning-log]").addEventListener("click", () => deleteListItem(item.learningLogs, index, updateItem, "learningLogs"));
  });
}

function bindFitnessTraining(item) {
  const updateItem = (patch, shouldRender = true) => {
    Object.assign(item, patch);
    if (shouldRender) render();
  };

  editorEl.querySelector("[data-add-workout]")?.addEventListener("click", () => {
    updateItem({
      workouts: [
        { date: today(), title: "新的训练", parts: ["核心"], duration: "40 分钟", intensity: "中等", summary: "" },
        ...(item.workouts ?? []),
      ],
    });
  });

  editorEl.querySelector("[data-fitness-photo-upload]")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploaded = await upload(file, "/api/admin/upload", item.uploadDir);
    updateItem({
      photos: [
        {
          label: uploaded.label || "新的训练照片",
          src: uploaded.src,
          date: today(),
          month: monthFromDate(today()),
          note: "",
          tags: ["训练"],
        },
        ...(item.photos ?? []),
      ],
    });
  });

  editorEl.querySelectorAll("[data-workout]").forEach((row) => {
    const index = Number(row.dataset.workout);
    bindListItem(row, item.workouts, index, updateItem, "workouts", {
      date: "[data-workout-date]",
      title: "[data-workout-title]",
      duration: "[data-workout-duration]",
      intensity: "[data-workout-intensity]",
      summary: "[data-workout-summary]",
    });
    bindLineList(row, item.workouts, index, updateItem, "workouts", "parts", "[data-workout-parts]");
    row.querySelector("[data-delete-workout]").addEventListener("click", () => deleteListItem(item.workouts, index, updateItem, "workouts"));
  });

  editorEl.querySelectorAll("[data-fitness-photo]").forEach((row) => {
    const index = Number(row.dataset.fitnessPhoto);
    bindListItem(row, item.photos, index, updateItem, "photos", {
      label: "[data-photo-label]",
      src: "[data-photo-src]",
      date: "[data-photo-date]",
      month: "[data-photo-month]",
      note: "[data-photo-note]",
    });
    row.querySelector("[data-photo-date]").addEventListener("input", (event) => {
      const next = structuredClone(item.photos ?? []);
      next[index] = { ...next[index], date: event.target.value, month: monthFromDate(event.target.value) };
      updateItem({ photos: next }, false);
    });
    bindLineList(row, item.photos, index, updateItem, "photos", "tags", "[data-photo-tags]");
    row.querySelector("[data-delete-fitness-photo]").addEventListener("click", () => deleteListItem(item.photos, index, updateItem, "photos"));
  });

}

function bindTennisTopic(item) {
  const isWorkNotes = item.uploadDir === "/uploads/work-notes" || item.title === "随手札记" || item.title === "做事札记";
  const isCityLife = item.uploadDir === "/uploads/city-life" || item.title === "城市生活";
  const usesFreeTags = isWorkNotes || isCityLife;
  const updateItem = (patch, shouldRender = true) => {
    Object.assign(item, patch);
    if (shouldRender) render();
  };

  editorEl.querySelector("[data-add-record]")?.addEventListener("click", () => {
    updateItem({
      records: [
        { date: today(), title: "新的短记录", summary: "", tags: ["日常"] },
        ...(item.records ?? []),
      ],
    });
  });

  editorEl.querySelector("[data-add-essay]")?.addEventListener("click", () => {
    updateItem({
      essays: [
        { date: today(), title: "新的长记录", type: "训练复盘", summary: "", tags: ["复盘"] },
        ...(item.essays ?? []),
      ],
    });
  });

  editorEl.querySelector("[data-tennis-photo-upload]")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploaded = await upload(file, "/api/admin/upload", item.uploadDir);
    updateItem({
      photos: [
        {
          label: uploaded.label,
          src: uploaded.src,
          project: isWorkNotes ? "" : undefined,
          city: isCityLife ? "" : undefined,
          date: today(),
          month: monthFromDate(today()),
          note: "",
          tags: [isWorkNotes ? "做事" : isCityLife ? "城市" : "日常"],
        },
        ...(item.photos ?? []),
      ],
    });
  });

  editorEl.querySelectorAll("[data-record]").forEach((row) => {
    const index = Number(row.dataset.record);
    bindListItem(row, item.records, index, updateItem, "records", {
      date: "[data-record-date]",
      title: "[data-record-title]",
      summary: "[data-record-summary]",
    });
    if (usesFreeTags) {
      bindLineList(row, item.records, index, updateItem, "records", "tags", "[data-record-tags]");
    } else {
      bindTagPicker(row, item.records, index, updateItem, "records");
    }
    row.querySelector("[data-delete-record]").addEventListener("click", () => deleteListItem(item.records, index, updateItem, "records"));
  });

  editorEl.querySelectorAll("[data-tennis-photo]").forEach((row) => {
    const index = Number(row.dataset.tennisPhoto);
    const photoSelectors = {
      label: "[data-photo-label]",
      src: "[data-photo-src]",
      date: "[data-photo-date]",
      month: "[data-photo-month]",
      note: "[data-photo-note]",
    };
    if (isWorkNotes) {
      photoSelectors.project = "[data-photo-project]";
    }
    if (isCityLife) {
      photoSelectors.city = "[data-photo-city]";
    }
    bindListItem(row, item.photos, index, updateItem, "photos", photoSelectors);
    row.querySelector("[data-photo-date]").addEventListener("input", (event) => {
      const next = structuredClone(item.photos ?? []);
      next[index] = { ...next[index], date: event.target.value, month: monthFromDate(event.target.value) };
      updateItem({ photos: next }, false);
    });
    if (usesFreeTags) {
      bindLineList(row, item.photos, index, updateItem, "photos", "tags", "[data-photo-tags]");
    } else {
      bindTagPicker(row, item.photos, index, updateItem, "photos");
    }
    row.querySelector("[data-delete-tennis-photo]").addEventListener("click", () => deleteListItem(item.photos, index, updateItem, "photos"));
  });

  editorEl.querySelectorAll("[data-essay]").forEach((row) => {
    const index = Number(row.dataset.essay);
    bindListItem(row, item.essays, index, updateItem, "essays", {
      date: "[data-essay-date]",
      type: "[data-essay-type]",
      title: "[data-essay-title]",
      summary: "[data-essay-summary]",
    });
    if (usesFreeTags) {
      bindLineList(row, item.essays, index, updateItem, "essays", "tags", "[data-essay-tags]");
    } else {
      bindTagPicker(row, item.essays, index, updateItem, "essays");
    }
    row.querySelector("[data-delete-essay]").addEventListener("click", () => deleteListItem(item.essays, index, updateItem, "essays"));
  });
}

function bindListItem(row, list, index, updateItem, key, selectors) {
  Object.entries(selectors).forEach(([fieldName, selector]) => {
    row.querySelector(selector).addEventListener("input", (event) => {
      list[index] = { ...list[index], [fieldName]: event.target.value };
      updateItem({ [key]: list }, false);
    });
  });
}

function bindLineList(row, list, index, updateItem, key, fieldName, selector) {
  row.querySelector(selector).addEventListener("input", (event) => {
    list[index] = { ...list[index], [fieldName]: lines(event.target.value) };
    updateItem({ [key]: list }, false);
  });
}

function bindTagPicker(row, list, index, updateItem, key) {
  row.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = structuredClone(list ?? []);
      const currentTags = new Set(next[index].tags ?? []);
      const tag = button.dataset.tag;
      if (currentTags.has(tag)) {
        currentTags.delete(tag);
      } else {
        currentTags.add(tag);
      }
      next[index] = { ...next[index], tags: Array.from(currentTags) };
      updateItem({ [key]: next });
    });
  });
}

function deleteListItem(list, index, updateItem, key) {
  const target = quickDraftTargetForKey(key);
  if (target) clearPendingQuickDraft(target, index);
  const next = structuredClone(list ?? []);
  next.splice(index, 1);
  updateItem({ [key]: next });
}

function quickDraftTargetForKey(key) {
  if (!pendingQuickDraft) return "";
  const map = {
    photos: ["add-photo", "fitness-photo-upload", "tennis-photo-upload"],
    books: ["add-book"],
    shows: ["add-show"],
    checkins: ["add-handwriting-checkin"],
    phrases: ["add-phrase"],
    learningLogs: ["add-learning-log"],
    workouts: ["add-workout"],
    essays: ["add-essay"],
    records: ["add-record"],
  };
  return map[key]?.includes(pendingQuickDraft.target) ? pendingQuickDraft.target : "";
}

async function fetchCover(book, uploadDir = "/uploads/books") {
  try {
    const response = await fetch("/api/admin/book-cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: book.title, author: book.author, uploadDir }),
    });
    const result = await response.json();
    if (result.cover) return result;
  } catch {
    // Fall back to browser-side Open Library lookup below.
  }

  return fetchCoverInBrowser(book, uploadDir);
}

async function fetchCoverInBrowser(book, uploadDir = "/uploads/books") {
  try {
    const search = new URL("https://openlibrary.org/search.json");
    search.searchParams.set("title", book.title);
    if (book.author) search.searchParams.set("author", book.author);
    search.searchParams.set("limit", "8");
    search.searchParams.set("fields", "title,author_name,cover_i");

    const data = await fetch(search).then((response) => response.json());
    const match = (data.docs ?? []).find((doc) => doc.cover_i);
    if (!match?.cover_i) {
      return { cover: "", message: "Open Library 没有找到这本书的封面。" };
    }

    const remoteCover = `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`;
    const imageResponse = await fetch(remoteCover);
    const blob = await imageResponse.blob();
    const file = new File([blob], `${book.title || "book-cover"}.jpg`, { type: blob.type || "image/jpeg" });
    const uploaded = await upload(file, "/api/admin/upload", uploadDir);

    return {
      cover: uploaded.src,
      source: "Open Library",
    };
  } catch {
    return {
      cover: "",
      message: "浏览器备用查询也失败了。可以手动粘贴封面 URL，或上传封面图片。",
    };
  }
}

async function fetchShowPoster(show, uploadDir = "/uploads/shows") {
  try {
    const response = await fetch("/api/admin/show-poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: show.title, kind: show.kind, uploadDir }),
    });
    const result = await response.json();
    if (result.poster) return result;
  } catch {
    // Fall back to browser-side iTunes lookup below.
  }

  return fetchShowPosterInBrowser(show, uploadDir);
}

async function fetchShowPosterInBrowser(show, uploadDir = "/uploads/shows") {
  try {
    const search = new URL("https://itunes.apple.com/search");
    search.searchParams.set("term", show.title);
    search.searchParams.set("country", "HK");
    search.searchParams.set("limit", "8");
    search.searchParams.set("media", show.kind === "电影" ? "movie" : "tvShow");

    const data = await fetch(search).then((response) => response.json());
    const match = (data.results ?? []).find((item) => item.artworkUrl100);
    if (!match?.artworkUrl100) {
      return { poster: "", message: "没有找到海报，可以手动粘贴海报 URL，或上传海报图片。" };
    }

    const remotePoster = match.artworkUrl100.replace(/100x100bb\.(jpg|png|webp)$/i, "1000x1500bb.$1");
    const imageResponse = await fetch(remotePoster);
    const blob = await imageResponse.blob();
    const file = new File([blob], `${show.title || "show-poster"}.jpg`, { type: blob.type || "image/jpeg" });
    const uploaded = await upload(file, "/api/admin/upload", uploadDir);

    return {
      poster: uploaded.src,
      source: "iTunes Search",
      creator: match.artistName ?? "",
    };
  } catch {
    return {
      poster: "",
      message: "浏览器备用查询也失败了。可以手动粘贴海报 URL，或上传海报图片。",
    };
  }
}

async function saveRemoteImage(url, title, uploadDir) {
  const response = await fetch("/api/admin/remote-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, title, uploadDir }),
  });
  const result = await response.json();

  if (!response.ok || !result.src) {
    throw new Error(result.error || "远程图片无法下载");
  }

  return result;
}

function setCoverFeedback(element, message, tone = "ok") {
  if (!element) return;
  element.className = `cover-feedback ${tone === "error" ? "cover-feedback-error" : ""}`;
  element.textContent = message;
}

function openNoteDialog(type) {
  return new Promise((resolve) => {
    const dialog = document.createElement("div");
    dialog.className = "note-dialog";
    dialog.innerHTML = `
      <div class="note-dialog-card">
        <p class="eyebrow">新增${escapeHtml(type)}</p>
        <textarea rows="8" placeholder="把这一条${escapeHtml(type)}写在这里，或者直接粘贴进来。"></textarea>
        <div class="note-dialog-actions">
          <button class="pill-button" data-cancel type="button">取消</button>
          <button class="save" data-confirm type="button">加入</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    const textarea = dialog.querySelector("textarea");
    textarea.focus();

    const close = (value) => {
      dialog.remove();
      resolve(value);
    };

    dialog.querySelector("[data-cancel]").addEventListener("click", () => close(""));
    dialog.querySelector("[data-confirm]").addEventListener("click", () => close(textarea.value.trim()));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close("");
    });
  });
}

async function upload(file, endpoint = "/api/admin/upload", uploadDir = "/uploads") {
  status("正在压缩图片...");
  const prepared = await prepareImageForUpload(file);
  const sizeMb = (prepared.size / 1024 / 1024).toFixed(2);
  status(`正在上传图片...（约 ${sizeMb} MB）`);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: prepared.name,
        type: prepared.type,
        data: prepared.data,
        uploadDir,
      }),
      signal: controller.signal,
    });
    const uploaded = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(uploaded.message || uploaded.error || `上传失败：${response.status}`);
    }

    status("图片已上传，记得保存内容。");
    return uploaded;
  } catch (error) {
    const message =
      error.name === "AbortError"
        ? "上传超时。手机原图可能太大或网络不稳定，请换一张图或稍后重试。"
        : error.message || "上传失败，请稍后重试。";
    status(message);
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function save() {
  status("正在保存...");
  const originalText = saveButtonEl.textContent;
  saveButtonEl.textContent = "正在保存...";
  saveButtonEl.disabled = true;

  try {
    const localized = await localizeRemoteImages();
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "保存失败");
    }

    status(localized > 0 ? `已保存，并把 ${localized} 张远程图片存到本地。刷新首页即可查看。` : "已保存，刷新首页即可查看。");
    saveButtonEl.textContent = "已保存";
    setTimeout(() => {
      saveButtonEl.textContent = originalText;
    }, 1600);
  } catch (error) {
    status(`保存失败：${error.message ?? "请看终端输出"}`);
    saveButtonEl.textContent = "保存失败";
    setTimeout(() => {
      saveButtonEl.textContent = originalText;
    }, 2200);
  } finally {
    saveButtonEl.disabled = false;
  }
}

async function localizeRemoteImages() {
  let count = 0;

  for (const item of content.activitySpotlights ?? []) {
    const uploadDir = item.uploadDir ?? "/uploads";

    for (const photo of item.photos ?? []) {
      if (isRemoteImage(photo.src)) {
        status(`正在保存远程图片：${photo.label ?? item.title}`);
        photo.src = await saveRequiredRemoteImage(photo.src, photo.label ?? item.title, uploadDir);
        count += 1;
      }
    }

    for (const checkin of item.checkins ?? []) {
      if (isRemoteImage(checkin.src)) {
        status(`正在保存练字图片：${checkin.label ?? item.title}`);
        checkin.src = await saveRequiredRemoteImage(checkin.src, checkin.label ?? item.title, uploadDir);
        count += 1;
      }
    }

    for (const book of item.books ?? []) {
      if (isRemoteImage(book.cover)) {
        const coverDir = item.bookCoverDir ?? "/uploads/books";
        status(`正在保存《${book.title}》封面到本地...`);
        book.cover = await saveRequiredRemoteImage(book.cover, book.title ?? "book-cover", coverDir);
        count += 1;
      }
    }

    for (const show of item.shows ?? []) {
      if (isRemoteImage(show.poster)) {
        status(`正在保存《${show.title}》海报到本地...`);
        show.poster = await saveRequiredRemoteImage(show.poster, show.title ?? "show-poster", uploadDir);
        count += 1;
      }
    }
  }

  for (const item of content.galleryItems ?? []) {
    for (const photo of item.photos ?? []) {
      if (isRemoteImage(photo.src)) {
        status(`正在保存专题图片：${photo.label ?? item.category}`);
        photo.src = await saveRequiredRemoteImage(photo.src, photo.label ?? item.category, "/uploads");
        count += 1;
      }
    }
  }

  const profile = content.contactProfile;
  if (profile && isRemoteImage(profile.wechatQr)) {
    status("正在保存微信二维码到本地...");
    profile.wechatQr = await saveRequiredRemoteImage(profile.wechatQr, "wechat-qr", "/uploads");
    count += 1;
  }

  return count;
}

function isRemoteImage(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

async function saveRequiredRemoteImage(url, title, uploadDir) {
  try {
    const src = (await saveRemoteImage(url, title, uploadDir)).src;
    if (!src.startsWith("/uploads/")) {
      throw new Error("返回路径不是本地 /uploads 路径");
    }
    return src;
  } catch (error) {
    throw new Error(`${title} 的远程图片保存失败，请上传本地图片或换一个图片地址。`);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

async function prepareImageForUpload(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("只能上传图片。");
  }

  if (file.type === "image/gif" || file.size <= 900 * 1024) {
    return {
      data: await readFileAsDataUrl(file),
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }

  const image = await loadImage(file);
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return {
      data: await readFileAsDataUrl(file),
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }

  ctx.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.82);
  const data = await readFileAsDataUrl(blob);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

  return {
    data,
    name: `${baseName}.jpg`,
    size: blob.size,
    type: "image/jpeg",
  };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败，请换一张图片。"));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("图片压缩失败，请换一张图片。"));
        }
      },
      type,
      quality,
    );
  });
}

function lines(value) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthFromDate(value) {
  return value ? value.slice(0, 7) : today().slice(0, 7);
}

function normalizeNoteType(type) {
  return type === "摘抄" ? "摘抄" : "想法";
}

function status(message) {
  statusEl.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}

