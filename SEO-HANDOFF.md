# Bàn giao SEO cho Classly — kế hoạch chi tiết các giai đoạn còn lại

Tài liệu này dành cho AI / người tiếp nhận. Đọc hết mục 0–2 trước khi làm bất kỳ task nào.
Mỗi task có: mục tiêu, file cần sửa, đặc tả, số liệu kiểm tra và tiêu chí xong (DoD).

---

## 0. Bối cảnh

- **Sản phẩm:** Classly: Attendance Tracker — app iOS/Android theo dõi chuyên cần cho sinh viên
  (offline, không tài khoản, miễn phí). App Store id `6760553317`, Google Play
  `com.thiemjason.classattendance`.
- **Website:** https://thiemjason-work.site/classly/ — repo này (`ThiemJson/classly`), GitHub Pages,
  HTML tĩnh, không có build system ngoài các script Python trong `tools/`.
- **Gốc tên miền** (`/`, `robots.txt`) nằm ở repo khác: `ThiemJson/ThiemJson.github.io`. Không cần sửa.
- **App repo** (để tra thuật ngữ và công thức): `ThiemJson/class-attence`
  - Bản dịch: `lib/l10n/app_<lang>.arb` (en, de, es, fr, hi, id, it, ja, ko, pl, pt, ru, tr, vi)
  - Công thức chuyên cần: `lib/features/reports/attendance_report_model.dart` (`bunkable`, `classesToTarget`)
- **Mô hình học theo:** app Doz (getdoz.app) — nhiều công cụ tính cho câu hỏi hẹp, bài viết trả lời
  ngay câu đầu, dịch mọi trang, tuần nào cũng viết lại tiêu đề trang có CTR thấp, ghi changelog.
- **Kế hoạch tổng:** `SEO-PLAN.md`. **Nhật ký thay đổi:** `SEO-CHANGELOG.md`.

## 1. Hiện trạng (2026-10-15)

| Hạng mục | Trạng thái |
|---|---|
| robots.txt, sitemap.xml, canonical, JSON-LD | ✅ Xong |
| Trình sinh trang `tools/build_seo_pages.py` | ✅ Xong (chỉ hỗ trợ trang **tool** và **hub**) |
| 4 công cụ: attendance calculator, bunk, bảng mức tối thiểu, recovery | ✅ en, vi, hi, id |
| Tiếng Tây Ban Nha (es) | ✅ 4 công cụ + hub đã sinh và kiểm tra |
| Tiếng Bồ Đào Nha–Brazil (pt) | ✅ 4 công cụ + hub đã sinh và kiểm tra |
| Tiếng Thổ Nhĩ Kỳ (tr) | ✅ 4 công cụ + hub đã sinh và kiểm tra |
| Tiếng Pháp (fr) | ✅ 4 công cụ + hub đã sinh và kiểm tra |
| FAQ tĩnh trong faq.html | ✅ Xong |
| Link Google Play có `utm_campaign` | ✅ Xong |
| Link App Store có campaign | ❌ Chờ chủ app đưa provider token `pt` |
| Bài viết (blog) | ❌ Chưa có, generator chưa hỗ trợ |
| Vòng tối ưu tiêu đề hằng tuần | ❌ Chưa bắt đầu (chưa có dữ liệu) |

## 2. Cách làm việc trong repo (bắt buộc)

### 2.1 Cấu trúc
```
content/<lang>/site.json          chữ dùng chung của 1 ngôn ngữ (menu, nhãn ô nhập, câu kết quả, hub)
content/<lang>/tools/<name>.html  1 trang công cụ = JSON header + dòng '---' + thân HTML
assets/calculator.js              logic máy tính (mọi widget), đọc chữ từ window.CALC_TEXT
assets/site.css                   CSS chung
tools/build_seo_pages.py          sinh trang tool, hub, FAQ tĩnh, sitemap.xml
<slug>/index.html                 FILE SINH RA — không sửa tay
```

### 2.2 Định dạng trang công cụ (`content/<lang>/tools/<name>.html`)
```json
{
  "id": "bunk-calculator",           // giống nhau giữa các bản dịch → tự có hreflang
  "order": 2,                         // thứ tự trên trang hub
  "slug": "es/cuantas-faltas-puedo-tener/",  // URL dưới /classly/, kết thúc bằng '/'
  "title": "...", "description": "...", "og_title": "...",
  "h1": "...", "card_title": "...", "card_text": "...",
  "intro": "<p><b>Câu trả lời ngay câu đầu.</b> ...</p>",
  "widgets": [{"kind": "whatif", "title": "(tuỳ chọn)", "defaults": {"held": 30, "attended": 27, "skip": 2, "target": 80}}],
  "related": ["attendance-calculator", "minimum-table", "recovery"],
  "faq": [{"q": "...", "a": "văn bản thuần"}]
}
---
<h2>...</h2> thân trang; có thể dùng {{table:80}} để chèn bảng mức tối thiểu
```
Widget hiện có (`assets/calculator.js` → `KINDS`): `standing`, `plan`, `whatif`, `recover`.
Ô nhập của từng widget khai báo trong `WIDGET_FIELDS` ở generator.

### 2.3 Quy tắc nội dung
1. **Câu đầu tiên là đáp án** (in đậm), sau đó là ví dụ tính bằng số thật.
2. **Số ví dụ trong thân bài phải khớp với kết quả widget** ở giá trị mặc định (`defaults`).
   Phần trăm hiển thị được **làm tròn xuống 2 chữ số** (80,955 → 80,95).
3. **Không khẳng định luật/quy chế của nước hay trường nào** nếu không có nguồn chính thức kèm link.
   Không có nguồn thì viết "nhiều trường…" và bảo người đọc tự kiểm tra quy chế của trường mình.
4. Không tạo trang mỏng, gần trùng nhau. Mỗi trang trả lời một câu hỏi riêng.
5. Thuật ngữ lấy từ `app_<lang>.arb` để web và app dùng cùng từ.
6. Slug dùng từ khoá người bản xứ thực sự gõ (không dịch máy từng chữ), chỉ ký tự ASCII, gạch nối.
7. Không bịa số liệu lượng tìm kiếm; nếu cần, ghi "cần kiểm tra bằng Keyword Planner".

### 2.4 Quy trình mỗi task
1. Sửa/thêm file trong `content/` (hoặc code generator / JS / CSS).
2. `python3 tools/build_seo_pages.py`
3. `python3 tools/check_seo_pages.py`
4. Xem thử cục bộ (trang dùng đường dẫn gốc `/classly/...`):
   ```sh
   mkdir -p /tmp/serve && ln -sfn "$PWD" /tmp/serve/classly
   python3 -m http.server 4173 --directory /tmp/serve
   # mở http://localhost:4173/classly/<slug>
   ```
5. **Checklist kiểm tra** (bắt buộc, ghi kết quả vào mô tả commit nếu có lỗi còn lại):
   - [ ] Mỗi widget ở giá trị mặc định cho đúng số đã viết trong thân bài.
   - [ ] Thử thêm: ô trống (ẩn kết quả), số thập phân/âm (báo lỗi), attended > held (báo lỗi),
         target 100, trường hợp "không thể đạt" của `recover`.
   - [ ] Không có link `/classly/...` nào hỏng (fetch từng link → 200).
   - [ ] `sitemap.xml` hợp lệ (`python3 -c "import xml.dom.minidom as m;m.parse('sitemap.xml')"`),
         số `<url>` tăng đúng số trang mới.
   - [ ] Mọi `<script type="application/ld+json">` parse được.
   - [ ] `hreflang` trên mỗi trang liệt kê đủ các ngôn ngữ của cùng `id`, có `x-default`.
   - [ ] Ở bề rộng 375px không có cuộn ngang (`document.documentElement.scrollWidth === 375`).
6. Thêm 1 dòng vào `SEO-CHANGELOG.md` (ngày, thay đổi, trang, "new" hoặc số liệu trước đó).
7. Tick ô tương ứng trong `SEO-PLAN.md`.
8. Commit trên `master`, mỗi task một commit, message dạng `feat(seo): ...`.
   **Không tự push** nếu môi trường không có quyền SSH; báo chủ repo chạy:
   `git -C <đường dẫn repo> push origin master`.

---

## 3. GIAI ĐOẠN 3 (còn lại) — Đa ngôn ngữ

### Task 3.1 — Hoàn tất tiếng Tây Ban Nha (es) ✅
- **Đã có:** `content/es/site.json`, 4 file trong `content/es/tools/` (mức 80%, dùng "materia", "faltas").
- **Việc:** chạy generator, chạy đủ checklist 2.4.
- **Số kiểm tra ở giá trị mặc định:**
  | Trang | Kết quả widget phải ra |
  |---|---|
  | `es/calculadora-de-asistencia/` | còn 2 buổi, sau đó 80,95 %; plan 16 buổi → nghỉ tối đa 3, đi ít nhất 13 |
  | `es/cuantas-faltas-puedo-tener/` | whatif 2 buổi → 84,37 %, tối đa 3; standing → 3 buổi, sau đó 81,81 % |
  | `es/asistencia-80-por-ciento/` | còn 1 buổi, sau đó 80,64 %; bảng 12 hàng (kể cả tiêu đề) |
  | `es/recuperar-asistencia/` | recover: 22 trên 25, nghỉ được 3; standing: 10 buổi liên tiếp, đang 70 % |
- **DoD:** 4 trang + `es/herramientas/` hoạt động, sitemap 29 URL, mọi trang en/vi/hi/id có hreflang `es`.

### Task 3.2 — Tiếng Bồ Đào Nha – Brazil (pt) ✅
- **Thị trường:** Brazil. Thuật ngữ app: "frequência", "faltas", "aula", "matéria".
- **Mức mặc định:** 75 % ("frequência mínima de 75%" phổ biến ở đại học Brazil). Nếu nêu căn cứ
  pháp lý (LDB – Lei 9.394/1996) phải trích đúng điều khoản và link tới planalto.gov.br;
  nếu không chắc thì chỉ viết "a maioria das faculdades exige…".
- **Slug đề xuất:** `pt/calculadora-de-frequencia/`, `pt/quantas-faltas-posso-ter/`,
  `pt/frequencia-75-por-cento/`, `pt/recuperar-frequencia/`, hub `pt/ferramentas/`.
- **Số ví dụ:** dùng y như bản tiếng Anh (cùng mức 75 %) — xem `content/en/tools/*.html`.
  Đổi dấu thập phân sang dấu phẩy (76,19 %, 74,41 %, 75,55 %, 73,91 %, 66,66 %).
- **Câu hỏi FAQ nên có:** "Quantas faltas posso ter em uma matéria de 60 horas?" (tính theo giờ:
  60 h × 25 % = 15 h), "Atestado médico abona falta?" (tuỳ trường, không khẳng định).
- **og_locale:** `pt_BR`. `language_name`: "Português".

### Task 3.3 — Tiếng Thổ Nhĩ Kỳ (tr) ✅
- **Thuật ngữ:** "devamsızlık", "devam zorunluluğu", "ders", "dönem". Từ khoá chính: "devamsızlık hesaplama",
  "kaç saat devamsızlık hakkım var".
- **Mức mặc định:** 70 % (nhiều trường: lý thuyết 70 %, thực hành 80 %). Ghi "birçok üniversitede"
  và nhắc tự kiểm tra "ön lisans ve lisans eğitim-öğretim yönetmeliği" của trường mình.
- **Lưu ý:** Thổ Nhĩ Kỳ hay tính theo **giờ học (ders saati)**; ghi rõ "nhập giờ thay cho buổi đều được".
- **Slug đề xuất:** `tr/devamsizlik-hesaplama/`, `tr/devamsizlik-hakki-hesaplama/`,
  `tr/yuzde-70-devam-zorunlulugu/`, `tr/devamsizlik-telafi-hesaplama/`, hub `tr/araclar/`.
- **Số ví dụ đã tính sẵn cho mức 70 %** (dùng làm `defaults` và viết vào thân bài):
  | Trường hợp | Kết quả |
  |---|---|
  | 32/40, mục tiêu 70 | nghỉ thêm được 5 → 32/45 = 71,11 %; buổi thứ 6 → 69,56 % |
  | 26/40 (65 %) | cần đi liên tiếp 7 → 33/47 = 70,21 % |
  | plan 14 buổi | nghỉ tối đa 4, đi ít nhất 10 |
  | whatif 34/40, nghỉ 3 | 79,06 %, tối đa nghỉ 8 → 34/48 = 70,83 %; buổi thứ 9 → 69,38 % |
  | standing 24/30 (trang bảng 70 %) | nghỉ thêm được 4 → 24/34 = 70,58 % |
  | recover 20/30, còn 30 | đi ít nhất 22/30, nghỉ được 8 |
  | standing 20/30 | đi liên tiếp 4 → 24/34 = 70,58 % |
  | không thể đạt: 20/40, còn 10 | tối đa 30/50 = 60 % |
  Quy tắc nhẩm 70 %: tổng buổi vắng ≤ 3/7 số buổi có mặt. Bảng dùng `{{table:70}}`.
- **og_locale:** `tr_TR`. `language_name`: "Türkçe".

### Task 3.4 — Tiếng Pháp (fr) ✅
- **Thuật ngữ app:** "présence", "cours", "matière", "absent"; app xưng "tu" → web cũng dùng "tu".
- **Thực tế:** ở Pháp quy định hay tính theo **số buổi vắng không lý do** hơn là %. Viết trung lập:
  "selon ton établissement", mặc định 75 %, nhấn mạnh "absences justifiées / injustifiées".
  Cân nhắc nhắm thêm Bỉ, Canada (Québec), châu Phi nói tiếng Pháp.
- **Slug đề xuất:** `fr/calcul-assiduite/`, `fr/combien-absences/`, `fr/assiduite-75-pourcent/`,
  `fr/rattraper-assiduite/`, hub `fr/outils/`.
- **Số ví dụ:** như bản tiếng Anh (75 %), dấu thập phân phẩy và có khoảng trắng trước % ("76,19 %").
- **og_locale:** `fr_FR`. `language_name`: "Français".

### Task 3.5 — Rà soát bản ngữ
- Gửi chủ app danh sách URL hi, id, es, pt, tr, fr để nhờ người bản xứ đọc. Sửa theo góp ý.
- DoD: mỗi ngôn ngữ có 1 dòng "reviewed by native speaker: yes/no" trong `SEO-CHANGELOG.md`.

---

## 4. GIAI ĐOẠN 2 (còn lại) — Thêm công cụ

Thứ tự làm: 2.1 → 2.2 → 2.3 → 2.4 → 2.5; 2.6 chỉ làm khi chủ app đồng ý.
Mỗi công cụ: làm bản **en trước**, kiểm tra xong mới dịch sang các ngôn ngữ đã có.
Khi thêm công cụ mới: thêm `id` của nó vào `related` của 1–2 trang liên quan (giữ tối đa 4 link).

### Cách thêm một loại widget mới (áp dụng cho 2.1–2.5)
1. `tools/build_seo_pages.py`: thêm `WIDGET_FIELDS['<kind>'] = [...]`. Nếu ô nhập không phải số
   nguyên (ngày, tên môn), mở rộng hàm `widget()` để hỗ trợ `type="date"` / `type="text"`.
2. `assets/calculator.js`: thêm `KINDS.<kind> = function (v) { return [headline, detail, tone]; }`.
   Hiện `attach()` coi mọi ô (trừ `target`) là số nguyên ≥ 0 → widget có ô khác kiểu cần bỏ qua
   kiểm tra đó (ví dụ thêm `data-type` cho input và chỉ kiểm tra ô số).
3. `content/<lang>/site.json`: thêm nhãn ô (`fields`), tiêu đề/gợi ý (`widgets.<kind>`), câu kết quả (`calc`).
4. Viết `content/en/tools/<name>.html` theo mục 2.2.

### Task 2.1 ✅ — Chuyên cần theo từng môn (subject-wise; hoàn tất 8 ngôn ngữ)
- **Câu tìm kiếm:** "subject wise attendance calculator", "overall attendance calculator".
- **Slug:** `subject-wise-attendance-calculator/`; vi `vi/tinh-chuyen-can-tung-mon/`.
- **Widget `subjects`:** bảng nhiều dòng (tên môn, đã học, có mặt), nút "+ Thêm môn", 1 ô mục tiêu.
  Kết quả: mỗi dòng hiện %, "còn được nghỉ N" hoặc "cần đi N"; dòng tổng hiện % chung và cảnh báo
  "môn X dưới mức dù tổng vẫn đạt". Mặc định 3 môn: (Toán 30/26), (Lý 30/21), (Hoá 24/22), mục tiêu 75.
  - Toán 86,66 % → nghỉ được floor(2600/75 − 30) = 4
  - Lý 70 % → cần (22,5 − 21)/0,25 = 6 → 27/36 = 75 %
  - Hoá 91,66 % → floor(2200/75 − 24) = 5
  - Tổng 69/84 = 82,14 % (đạt) nhưng Lý dưới mức → phải hiện cảnh báo.
- **DoD:** thêm/xoá dòng hoạt động trên mobile, không cần JS bên ngoài.

### Task 2.2 ✅ — Lập kế hoạch cả học kỳ (hoàn tất 8 ngôn ngữ)
- **Câu:** "semester attendance planner", "how many classes in a semester".
- **Slug:** `semester-attendance-planner/`; vi `vi/ke-hoach-chuyen-can-hoc-ky/`.
- **Widget `semester`:** số tuần, số buổi/tuần, số buổi nghỉ lễ/huỷ, mục tiêu.
  Tổng = tuần × buổi/tuần − nghỉ lễ; được vắng tối đa = ⌊tổng × (1 − mục tiêu)⌋; quy ra "≈ X tuần".
  Ví dụ: 15 tuần × 3 − 3 = 42 buổi, 75 % → vắng tối đa 10, đi ít nhất 32.

### Task 2.3 ✅ — Tính theo tiết / giờ (hoàn tất 8 ngôn ngữ)
- **Câu:** vi "tính số tiết được nghỉ", tr "kaç saat devamsızlık hakkım var", pt "quantas faltas em 60 horas".
- **Slug:** `class-hours-attendance-calculator/`; vi `vi/tinh-so-tiet-duoc-nghi/`.
- **Widget `hours`:** tổng số tiết (giờ) của học phần, số tiết mỗi buổi, số tiết đã vắng, mục tiêu.
  Tiết được vắng = ⌊tổng × (1 − mục tiêu)⌋; còn lại = được vắng − đã vắng; quy ra số buổi = ⌊còn lại ÷ tiết mỗi buổi⌋.
  Ví dụ: 45 tiết, 3 tiết/buổi, đã vắng 3, mục tiêu 80 → được vắng 9 tiết, còn 6 tiết = 2 buổi.

### Task 2.4 ✅ — Đếm ngược ngày thi (hoàn tất 8 ngôn ngữ)
- **Câu:** "days until exam", "exam countdown".
- **Slug:** `exam-countdown/`; vi `vi/dem-nguoc-ngay-thi/`.
- **Widget `countdown`:** ô ngày thi (`type="date"`), tuỳ chọn bỏ Chủ nhật. Kết quả: số ngày, số tuần,
  số ngày học còn lại. Không lưu dữ liệu. Liên kết sang tính năng nhắc deadline của app.

### Task 2.5 — Tín chỉ → giờ học mỗi tuần (đang làm: bản en đã triển khai)
- **Câu:** "credit hours to study hours", "how many hours per credit".
- **Slug:** `credit-hours-calculator/`.
- **Widget `credits`:** số tín chỉ, hệ (US credit hour | ECTS | tuỳ chỉnh giờ/tín chỉ), số tuần.
- **Bắt buộc có nguồn** cho từng hệ quy đổi: định nghĩa credit hour của US Department of Education
  (34 CFR 600.2) và ECTS Users' Guide của European Commission. Không có nguồn → không làm hệ đó.
  Bản vi chỉ làm nếu tìm được văn bản của Bộ GD&ĐT quy định giờ/tín chỉ, kèm link.
- **Đã có:** bản en với hệ US, ECTS và tuỳ chỉnh; ECTS hiển thị khoảng 25–30 giờ thay vì lấy trung bình.
- **Còn lại:** kiểm tra dữ liệu tìm kiếm rồi dịch sang các ngôn ngữ phù hợp. Chưa làm bản vi cho đến khi có
  nguồn chính thức của Bộ GD&ĐT như yêu cầu trên.

### Task 2.6 — (Thử nghiệm) CGPA → phần trăm
- Lượng tìm kiếm lớn ở Ấn Độ nhưng **mỗi trường một công thức**. Chỉ làm các công thức có văn bản
  chính thức của chính trường đó, ghi tên trường và link nguồn ngay cạnh công thức.
  Không gộp thành "công thức chung". Hỏi chủ app trước khi làm.

---

## 5. GIAI ĐOẠN 4 — Bài viết trả lời ngay (blog)

### Task 4.1 — Mở rộng generator cho bài viết ✅
- **File mới:** `content/<lang>/articles/<name>.html`, cùng định dạng JSON header + `---` + thân HTML.
  Header:
  ```json
  {
    "id": "calculate-attendance-percentage",
    "slug": "blog/how-to-calculate-attendance-percentage/",
    "title": "...", "description": "...", "h1": "...",
    "answer": "Câu trả lời 1–2 câu, hiện trong hộp nổi bật ngay dưới H1.",
    "published": "2026-10-20", "updated": "2026-10-20",
    "sources": [{"title": "...", "url": "https://..."}],
    "related_tools": ["attendance-calculator"],
    "faq": [{"q": "...", "a": "..."}]
  }
  ```
- **Template bài:** H1 → hộp đáp án → thân bài → "Nguồn" (nếu có) → hộp tải app → 2–3 công cụ liên quan
  (dùng lại `.tool-link`) → FAQ. Có dòng "Cập nhật: <ngày>".
- **JSON-LD:** `Article` (headline, datePublished, dateModified, author = Person "Nguyen Cao Thiem",
  publisher Classly, inLanguage) + `FAQPage` nếu có faq + `BreadcrumbList` (Home › Blog › bài).
- **Trang danh sách:** `blog/` (en), `vi/blog/`, … — liệt kê bài theo ngày mới nhất, có tóm tắt.
  Thêm "Blog" vào `nav` và `footer` trong mọi `site.json`, và link "Blog" ở `index.html`.
- **Sitemap:** thêm `<lastmod>` = `updated` cho bài viết.
- **CSS:** `.answer-box` (nền `--sage-soft`, bo góc, chữ đậm), `.sources`.
- **DoD:** 1 bài mẫu sinh ra đúng, qua checklist 2.4, Rich Results Test của Google không báo lỗi.

### Task 4.2 — 10 bài tiếng Anh đầu tiên ✅
Mỗi bài 600–1200 từ, câu đầu là đáp án, có ít nhất 1 ví dụ tính, link tới ≥ 1 công cụ.

| # | Slug (`blog/…/`) | Câu hỏi mục tiêu | Ghi chú |
|---|---|---|---|
| 1 | how-to-calculate-attendance-percentage | how to calculate attendance percentage | Công thức + 3 ví dụ + Excel/Sheets formula |
| 2 | 75-percent-attendance-rule | what is the 75% attendance rule | Không khẳng định luật chung; nêu ví dụ quy chế của 2–3 trường lớn **kèm link** |
| 3 | how-to-increase-attendance-from-60-to-75 | how to increase attendance from 60 to 75 | Bảng số buổi cần đi theo từng mức xuất phát |
| 4 | does-medical-leave-count-in-attendance | does medical leave count in attendance | Trả lời "tuỳ trường", hướng dẫn hỏi đúng chỗ |
| 5 | how-many-classes-can-i-miss-in-a-semester | how many classes can I miss in a semester | Bảng theo 1/2/3/4 buổi mỗi tuần × 15 tuần |
| 6 | attendance-condonation | what is attendance condonation | Chỉ viết những gì có nguồn (quy chế trường cụ thể) |
| 7 | subject-wise-vs-overall-attendance | subject wise vs overall attendance | Link Task 2.1 |
| 8 | how-to-plan-bunks-safely | how to plan bunks | Giọng có trách nhiệm, không cổ vũ trốn học |
| 9 | college-timetable-tips | how to make a college timetable | Link tính năng thời khoá biểu của app |
| 10 | track-attendance-on-phone | how to track attendance on phone | Hướng dẫn dùng Classly, ảnh trong `screenshots/` |

### Task 4.3 — Bài từ FAQ ✅
- Với mỗi câu trong `assets/faq.json` có câu trả lời ≥ 3 bước (ví dụ `starting-attendance`), viết thành
  bài hướng dẫn riêng dài hơn, có ảnh chụp màn hình. FAQ giữ nguyên, thêm link "Đọc hướng dẫn đầy đủ".
  (Sửa `faq.json` xong phải chạy lại generator.)
- **Đã làm:** hai FAQ có danh sách 3+ bước (`starting-attendance`, `semester-dates`) đã có bài hướng dẫn
  riêng, ảnh chụp màn hình và link ngược từ `faq.html`.

### Task 4.4 — 10 bài tiếng Việt
Ví dụ: "cách tính % chuyên cần", "nghỉ quá 20% có bị cấm thi không" (chỉ trích quy chế của các trường
**có link văn bản**), "cách lập thời khoá biểu đại học", "nghỉ ốm có được tính chuyên cần không",
"bao nhiêu buổi thì được nghỉ trong một học phần 15 tuần".

### Task 4.5 — Nhịp sản xuất (tuần 3–8)
- Khoảng 10 bài/tuần. Từ bài thứ 11, **chọn chủ đề từ Search Console → Performance → Queries**
  (các truy vấn có lượt hiển thị nhưng chưa có trang trả lời riêng).
- Chỉ dịch một bài sang ngôn ngữ khác khi bản gốc đã có lượt hiển thị trong Search Console.

---

## 6. GIAI ĐOẠN 5 — Vòng tối ưu hằng tuần

### Task 5.1 — Quy trình thủ công (mỗi thứ Hai)
1. Search Console → Performance → Search results → 28 ngày → tab **Pages**, bật đủ 4 chỉ số.
2. Lọc trang có **vị trí trung bình 5–20** và **CTR < 2 %**, có ≥ 100 lượt hiển thị.
3. Với mỗi trang: xem tab **Queries** của trang đó → viết lại `title` và `description` trong
   `content/...` sao cho chứa đúng cụm truy vấn chính và **con số/đáp án** (ví dụ
   "75% Attendance Calculator: See How Many Classes You Can Bunk").
   Giữ title ≤ 60 ký tự, description ≤ 155 ký tự.
4. Ghi vào `SEO-CHANGELOG.md`: ngày, trang, title cũ → mới, số liệu 28 ngày trước khi sửa.
5. Sau 14 và 28 ngày, điền số liệu mới vào đúng dòng đó. Nếu tệ hơn → cân nhắc quay lại title cũ.
- Không sửa một trang quá 1 lần mỗi 14 ngày (để đo được).

### Task 5.2 — Tự động hoá báo cáo (tuỳ chọn, cần chủ app hỗ trợ)
- Script `tools/gsc_report.py` dùng Search Console API (`searchanalytics.query`, dimensions page/query,
  28 ngày) qua service account. File khoá JSON **không commit**: đọc từ biến môi trường
  `GSC_KEY_FILE`; thêm vào `.gitignore`.
- Xuất `reports/gsc-<ngày>.csv` (không commit) gồm các trang thoả điều kiện 5.1 và 3 truy vấn đứng đầu.
- Chủ app cần: tạo service account trên Google Cloud, bật Search Console API, thêm email service
  account làm user (Restricted) của property trong Search Console.

---

## 7. Hạ tầng còn thiếu (Giai đoạn 1)

### Task 1.8 — Script kiểm tra tự động `tools/check_seo_pages.py` ✅
Tự động hoá phần không cần trình duyệt của checklist 2.4: mọi link `/classly/...` trong HTML trỏ tới
file có thật; hreflang hai chiều; sitemap hợp lệ và khớp số trang; JSON-LD parse được; mỗi trang có
đúng 1 `<h1>`, title ≤ 65 ký tự, description ≤ 160 ký tự. Thoát với mã ≠ 0 nếu có lỗi.
Thêm vào README và vào bước 2.4.

### Task 1.9 — App Store campaign
Khi chủ app gửi provider token: đặt `APP_STORE_PROVIDER_TOKEN` trong `tools/build_seo_pages.py`,
chạy lại generator, và thêm `?pt=…&ct=home-hero` / `home-download` vào 2 link App Store ở `index.html`.

---

## 8. Việc chủ app phải tự làm (AI không làm được)

| Việc | Khi nào |
|---|---|
| Push các commit (`git push origin master`) | Sau mỗi đợt task |
| Gửi lại sitemap + "Request indexing" trang mới trong Search Console | Sau mỗi lần push có trang mới |
| Lấy provider token `pt` trong App Store Connect → App Analytics → Campaign links | Một lần |
| Thêm site vào Bing Webmaster Tools (Import from Search Console) | Một lần |
| Kiểm tra lượng tìm kiếm (Keyword Planner) trước Task 2.x | Trước mỗi công cụ mới |
| Nhờ người bản xứ đọc hi, id, es, pt, tr, fr | Task 3.5 |
| Gửi ảnh chụp hoặc file xuất Search Console mỗi tuần | Giai đoạn 5 |

## 9. Thứ tự đề xuất

1. Task 3.1 (es) → 1.8 (script kiểm tra) → 3.2 (pt) → 3.3 (tr) → 3.4 (fr)
2. Task 4.1 (generator blog) → 4.2 (10 bài en) → 2.1 → 2.2 → 2.3
3. Task 4.4 (10 bài vi) → 4.3 → 2.4 → 2.5
4. Từ tuần 3: Task 5.1 mỗi tuần; Task 4.5 liên tục.
