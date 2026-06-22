# EduMind AI

Öğrencilerin çalışma sürelerini, derslerini, hedeflerini ve soru istatistiklerini tek yerden takip etmelerini sağlayan; **AI destekli kişisel çalışma koçluğu** sunan full-stack bir platform.

Web (React) ve iOS (SwiftUI) istemcileri, Laravel tabanlı ortak bir REST API üzerinden çalışır.

---

## Özellikler

- **Dashboard** — Günlük/haftalık çalışma özeti, streak ve genel performans görünümü
- **Ders & Konu Yönetimi** — Ders ekleme, konu bazlı çalışma süresi takibi
- **Zamanlayıcı** — Canlı çalışma sayacı ile odaklı çalışma seansları
- **Çalışma Seansları** — Geçmiş seansları görüntüleme ve düzenleme
- **Hedefler** — Günlük/haftalık çalışma hedefleri ve ilerleme takibi
- **Soru Takibi** — Konu bazlı doğru/yanlış/boş soru istatistikleri
- **Bildirimler** — Çalışma alışkanlıklarına göre akıllı hatırlatmalar
- **AI Önerileri** — Google Gemini ile kişiselleştirilmiş çalışma önerileri ve uyarılar

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Backend API | Laravel 12, PHP 8.2+, Laravel Sanctum |
| Veritabanı | SQLite (geliştirme) / PostgreSQL (üretim) |
| Web | React 19, Vite, React Router, Axios |
| Mobil | SwiftUI, native iOS |
| AI | Google Gemini API |

---

## Proje Yapısı

```
EduMindAi/
├── backend/          # Laravel REST API
├── web/              # React web uygulaması
├── mobile/
│   └── native-ios/   # SwiftUI iOS uygulaması
├── scripts/          # Geliştirme yardımcı scriptleri
└── package.json      # Monorepo başlatma komutları
```

---

## Gereksinimler

- **Node.js** 18+
- **PHP** 8.2+
- **Composer** 2
- **Xcode** (yalnızca iOS geliştirme için, macOS)

---

## Kurulum

### 1. Repoyu klonla

```bash
git clone https://github.com/esmasaritop/EduMindAi.git
cd EduMindAi
```

### 2. Bağımlılıkları yükle

```bash
npm run setup
```

### 3. Backend ortamını hazırla

```bash
cd backend
cp .env.example .env
php artisan key:generate
touch database/database.sqlite   # SQLite kullanıyorsan
php artisan migrate
cd ..
```

### 4. (Opsiyonel) AI önerileri için Gemini API anahtarı

`backend/.env` dosyasına ekle:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> AI özelliği olmadan da uygulamanın geri kalanı çalışır.

---

## Çalıştırma

### Tümünü tek komutla başlat (önerilen)

Backend, web ve iOS simülatörünü birlikte ayağa kaldırır:

```bash
npm start
```

| Servis | Adres |
|--------|-------|
| Backend API | http://127.0.0.1:8000 |
| Web | http://127.0.0.1:5173 |
| iOS | Xcode simülatörü (macOS) |

### Ayrı ayrı başlatma

```bash
# Backend
npm run start:backend

# Web
npm run start:web

# iOS (macOS + Xcode gerekli)
npm run start:mobile
```

---

## API

Tüm endpoint'ler `/api/v1` prefix'i altındadır. Kimlik doğrulama **Bearer Token** (Sanctum) ile yapılır.

Detaylı dokümantasyon: [`backend/docs/API.md`](backend/docs/API.md)

### Örnek endpoint'ler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/auth/register` | Kayıt ol |
| POST | `/auth/login` | Giriş yap |
| GET | `/dashboard` | Dashboard özeti |
| GET | `/subjects` | Ders listesi |
| GET | `/goals` | Hedefler |
| GET | `/questions` | Soru istatistikleri |
| GET | `/ai/recommendations` | AI önerileri |
| POST | `/ai/recommendations/generate` | Yeni AI önerisi üret |

---

## Ekranlar

### Web
Dashboard · Dersler · Zamanlayıcı · Çalışma Seansları · Hedefler · Sorular · Bildirimler

### iOS
Dashboard · Derslerim · Zamanlayıcı · Seanslar · Hedefler · Sorularım · Bildirimler

---

## Geliştirme Notları

- Web ve mobil istemciler aynı API'yi kullanır; özellik parity hedeflenmiştir.
- iOS simülatörü backend'e `http://127.0.0.1:8000` üzerinden bağlanır.
- Backend için PostgreSQL kullanmak istersen `backend/.env` içindeki `DB_*` değişkenlerini güncelle.

---

## Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
