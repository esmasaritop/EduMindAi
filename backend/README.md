# EduMind AI – Backend API

Laravel 12 tabanlı RESTful API. PostgreSQL veritabanı, Sanctum token auth.

## Gereksinimler

- PHP 8.2+
- PostgreSQL 14+
- Composer 2

## Kurulum

```bash
# Bağımlılıkları yükle
composer install

# .env dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle (DB bilgilerini gir)
# DB_DATABASE=edumind_ai
# DB_USERNAME=postgres
# DB_PASSWORD=secret

# Uygulama anahtarını oluştur
php artisan key:generate

# Veritabanı tablolarını oluştur
php artisan migrate

# Sunucuyu başlat
php artisan serve
```

## API Endpointleri

Tüm endpointler `/api/v1/` prefix'i ile başlar.

### Auth (Kimlik Doğrulama)

| Method | Endpoint           | Açıklama          | Auth |
|--------|--------------------|-------------------|------|
| POST   | /auth/register     | Kayıt ol          | -    |
| POST   | /auth/login        | Giriş yap         | -    |
| POST   | /auth/logout       | Çıkış yap         | ✓    |

### Study Sessions (Çalışma Seansları)

| Method      | Endpoint                    | Açıklama             | Auth |
|-------------|-----------------------------|----------------------|------|
| GET         | /study-sessions             | Tüm seansları getir  | ✓    |
| POST        | /study-sessions             | Yeni seans oluştur   | ✓    |
| PUT/PATCH   | /study-sessions/{id}        | Seans güncelle       | ✓    |
| DELETE      | /study-sessions/{id}        | Seans sil            | ✓    |

### Goals (Hedefler)

| Method | Endpoint | Açıklama           | Auth |
|--------|----------|--------------------|------|
| GET    | /goals   | Hedefleri getir    | ✓    |
| POST   | /goals   | Yeni hedef oluştur | ✓    |

### Dashboard

| Method | Endpoint    | Açıklama              | Auth |
|--------|-------------|-----------------------|------|
| GET    | /dashboard  | Dashboard verisi      | ✓    |

### Notifications (Bildirimler)

| Method | Endpoint                        | Açıklama                | Auth |
|--------|---------------------------------|-------------------------|------|
| GET    | /notifications                  | Bildirimleri getir      | ✓    |
| PATCH  | /notifications/mark-all-read    | Tümünü okundu işaretle  | ✓    |

## Mimari

```
app/
├── Http/
│   ├── Controllers/API/    ← API Controller'ları
│   ├── Requests/           ← Form Request Validation
│   └── Resources/          ← API Response Transformer
├── Models/                 ← Eloquent Modeller
├── Repositories/
│   ├── Interfaces/         ← Repository Sözleşmeleri
│   └── *.php               ← Repository İmplementasyonları
├── Services/               ← Business Logic
└── Providers/
    └── RepositoryServiceProvider.php
```

## Veritabanı Şeması

- **users** – Kullanıcılar (role: student/admin)
- **subjects** – Dersler
- **study_sessions** – Çalışma seansları
- **goals** – Günlük/Haftalık hedefler
- **daily_stats** – Günlük istatistikler
- **streaks** – Çalışma serileri
- **notifications** – Bildirimler
- **ai_recommendations** – AI önerileri
