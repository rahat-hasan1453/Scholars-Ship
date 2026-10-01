# Design Tokens / ডিজাইন টোকেন

**Source / উৎস:** Figma file `zLYU2tCsLDvZNnUXk7Cpgw`, styles node `181-3148` (read 2026-10-01).
Figma-ই সত্য। কোডে রঙ হাতে না লিখে টোকেন ব্যবহার করতে হবে। / Figma is the source of truth. Use tokens in code, never hand-typed colors.

> Brand Primary হলো `#7150E7` (পুরোনো ডকে `#7050E6` ছিল, সেটা ভুল)। / Brand Primary is `#7150E7` (old docs said `#7050E6`, which was wrong).

---

## 1. Colors / রঙ

### Brand
| Token | Hex |
|---|---|
| Brand/Primary | `#7150E7` |
| Brand/Light | `#EDE9FC` |
| Brand/Soft | `#EEF2FF` |

### Text
| Token | Hex |
|---|---|
| Text/Primary | `#101828` |
| Text/Secondary | `#627181` (darkened from #919EAB for a11y: 5.0:1 on white, 4.57:1 on #F1F5F9; BUG-19. `Neutral/350` stays #919EAB) |
| Text/Tertiary | `#637381` |
| Text/Placeholder | `#D0D7E1` |
| Text/Subtle | `#95A3B6` |

### Neutral
| 950 | 900 | 800 | 700 | 600 | 500 | 400 | 350 | 300 | 200 | 150 | 100 | 50 | White |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `#0F172B` | `#101828` | `#212B36` | `#314158` | `#45556C` | `#62748E` | `#90A1B9` | `#919EAB` | `#CAD5E2` | `#E1E8F0` | `#F0F3F4` | `#F1F5F9` | `#F8FAFC` | `#FFFFFF` |

### Status / অবস্থা
| Group | Main | Dark | Darker | Light | Surface Lightest | Surface Lighter | Surface Extra Light |
|---|---|---|---|---|---|---|---|
| **Error** | `#F62752` | `#C10F41` | `#66061A` | `#FD6F88` | `#FFF1F3` | `#FEA3B1` | `#FFE4E7` |
| **Success** | `#36B37E` | `#1B806A` | `#0A5554` | `#86E8AB` | `#E7FDEB` | `#D8FBDE` | `#EBFDEF` |
| **Info** | `#3B82F6` | `#234E94` | `#0C1A31` | `#629BF8` | `#EBF2FF` | `#89B4FA` | `#B1CDFB` |
| **Warning** | `#FFAB00` | `#B76E00` | `#7A4100` | `#FFD666` | `#FFFBEB` | `#FFF5CC` | `#FFFAE5` |

### Stroke & Surface
| Token | Hex |
|---|---|
| Stroke/Default, Stroke/Divider | `#E1E8F0` |
| Surface/BG | `#FCFCFC` |
| Surface/White | `#FFFFFF` |
| Surface/Secondary Surface | `#FAFAFA` |

---

## 2. Typography / টাইপোগ্রাফি

**Design font:** SF Pro (Figma)

| Style | Size / Line-height | Weight |
|---|---|---|
| Title/L | 32 / 40 | Semibold (590) |
| Title/1 | 28 / 36 | Semibold (590) |
| Title/2 | 24 / 32 | Medium (510) |
| Title/3 | 20 / 28 | Semibold (590) |
| Body/1 M | 16 / 24 | Medium (510) |
| Body/1 R | 16 / 20 | Regular (400) |
| Body/2 M | 14 / 20 | Medium (510) |
| Body/2 R | 14 / 18 | Regular (400) |
| Caption/1 | 12 / 16 | Medium (510) |
| Caption/1 It | 12 / 18 | Regular Italic |
| Caption/2 | 10 / 14 | Regular |
| Caption/2 It | 10 / 16 | Regular Italic |

Letter spacing: 0 (সব স্টাইলে / all styles)

### Font decision / ফন্ট সিদ্ধান্ত

| Platform / প্ল্যাটফর্ম | Font |
|---|---|
| **iOS, macOS** | **SF Pro** (সিস্টেম ফন্ট / system font) |
| **Windows, Android, others** | **Inter** |

**বাংলা:** SF Pro শুধু Apple ডিভাইসে আছে, তাই অন্য ডিভাইসে Inter ব্যবহার হবে। Inter দেখতে SF Pro-র খুব কাছাকাছি।
**English:** SF Pro exists only on Apple devices, so other platforms fall back to Inter, which is visually very close to SF Pro.
