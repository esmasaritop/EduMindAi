# EduMind AI – API Dokümantasyonu

## İçindekiler

- [Genel Bilgiler](#genel-bilgiler)
- [Postman Kurulumu](#postman-kurulumu)
- [Authentication](#authentication)
- [Dashboard](#dashboard)
- [Study Sessions](#study-sessions)
- [Goals](#goals)
- [Notifications](#notifications)
- [Hata Kodları](#hata-kodları)

---

## Genel Bilgiler

| Bilgi | Değer |
|-------|-------|
| Base URL | `http://127.0.0.1:8000/api/v1` |
| Format | JSON |
| Auth Tipi | Bearer Token (Sanctum) |
| PHP Versiyonu | 8.2 |
| Laravel Versiyonu | 12.x |

### Zorunlu Header'lar

Her istekte şu header'lar bulunmalıdır:

```
Content-Type: application/json
Accept: application/json
```

Korumalı endpoint'lerde ek olarak:

```
Authorization: Bearer {token}
```

---

## Postman Kurulumu

### 1. Environment Oluştur

1. Postman'ı aç
2. Sağ üstte **Environments** (göz ikonu) tıkla
3. **+** butonuna bas
4. İsim: `EduMind Local`
5. Şu değişkenleri ekle:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://127.0.0.1:8000/api/v1` | `http://127.0.0.1:8000/api/v1` |
| `token` | *(boş)* | *(login sonrası doldurulacak)* |

6. **Save** bas
7. Sağ üstte dropdown'dan `EduMind Local`'i **aktif et**

### 2. Collection Oluştur

1. Sol panelde **Collections** → **+** → `EduMind AI`
2. Her endpoint için ayrı request oluştur

### 3. Token Otomatik Kaydetme (Pre-request Script)

Login ve Register requestlerinin **Tests** sekmesine şunu yaz — token otomatik kaydedilsin:

```javascript
const response = pm.response.json();
if (response.token) {
    pm.environment.set("token", response.token);
    console.log("Token kaydedildi:", response.token);
}
```

---

## Authentication

### POST /auth/register — Kayıt

**URL:** `http://127.0.0.1:8000/api/v1/auth/register`

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Body:**
```json
{
    "name": "Test Kullanıcı",
    "email": "test@edumind.com",
    "password": "password123",
    "password_confirmation": "password123",
    "timezone": "Europe/Istanbul"
}
```

**Başarılı Yanıt (201):**
```json
{
    "message": "Kayıt başarılı.",
    "user": {
        "id": 1,
        "name": "Test Kullanıcı",
        "email": "test@edumind.com",
        "role": "student",
        "timezone": "Europe/Istanbul"
    },
    "token": "1|abc123xyz..."
}
```

**Validation Kuralları:**
| Alan | Kural |
|------|-------|
| `name` | Zorunlu, max 255 karakter |
| `email` | Zorunlu, geçerli email, benzersiz |
| `password` | Zorunlu, min 8 karakter, confirmed |
| `timezone` | Opsiyonel, geçerli timezone (varsayılan: UTC) |

---

### POST /auth/login — Giriş

**URL:** `http://127.0.0.1:8000/api/v1/auth/login`

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Body:**
```json
{
    "email": "test@edumind.com",
    "password": "password123"
}
```

**Başarılı Yanıt (200):**
```json
{
    "message": "Giriş başarılı.",
    "user": {
        "id": 1,
        "name": "Test Kullanıcı",
        "email": "test@edumind.com",
        "role": "student",
        "timezone": "Europe/Istanbul"
    },
    "token": "2|def456uvw..."
}
```

**Hatalı Şifre (401):**
```json
{
    "message": "Geçersiz e-posta veya şifre."
}
```

---

### POST /auth/logout — Çıkış

**URL:** `http://127.0.0.1:8000/api/v1/auth/logout`

**Headers:**
```
Accept: application/json
Authorization: Bearer {token}
```

**Başarılı Yanıt (200):**
```json
{
    "message": "Çıkış başarılı."
}
```

---

## Dashboard

### GET /dashboard — Dashboard Verisi

**URL:** `http://127.0.0.1:8000/api/v1/dashboard`

**Headers:**
```
Accept: application/json
Authorization: Bearer {token}
```

**Başarılı Yanıt (200):**
```json
{
    "data": {
        "today": {
            "total_duration": 120,
            "session_count": 2
        },
        "streak": {
            "current_streak": 5,
            "longest_streak": 12,
            "last_study_date": "2026-04-23"
        },
        "active_goals": [
            {
                "id": 1,
                "type": "daily",
                "target_duration": 180,
                "start_date": "2026-04-23",
                "end_date": "2026-04-23"
            }
        ],
        "weekly_stats": [
            {
                "id": 1,
                "date": "2026-04-17",
                "total_duration": 90,
                "session_count": 1
            }
        ],
        "unread_notification_count": 3
    }
}
```

---

## Study Sessions

### GET /study-sessions — Seansları Listele

**URL:** `http://127.0.0.1:8000/api/v1/study-sessions`

**Headers:**
```
Accept: application/json
Authorization: Bearer {token}
```

**Query Parameters (Opsiyonel):**
| Parametre | Tip | Açıklama |
|-----------|-----|---------|
| `page` | integer | Sayfa numarası (varsayılan: 1) |
| `per_page` | integer | Sayfa başı kayıt (varsayılan: 15) |

**Başarılı Yanıt (200):**
```json
{
    "data": [
        {
            "id": 1,
            "subject": {
                "id": 1,
                "name": "Matematik"
            },
            "duration": 60,
            "started_at": "2026-04-23T10:00:00+00:00",
            "ended_at": "2026-04-23T11:00:00+00:00",
            "session_type": "manual",
            "notes": "Türev konusu çalıştım",
            "created_at": "2026-04-23T12:00:00+00:00"
        }
    ],
    "links": {
        "first": "http://127.0.0.1:8000/api/v1/study-sessions?page=1",
        "last": "...",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "total": 1,
        "per_page": 15
    }
}
```

---

### POST /study-sessions — Seans Oluştur

**URL:** `http://127.0.0.1:8000/api/v1/study-sessions`

**Headers:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
    "subject_id": 1,
    "duration": 60,
    "started_at": "2026-04-23 10:00:00",
    "ended_at": "2026-04-23 11:00:00",
    "session_type": "manual",
    "notes": "Türev konusu çalıştım"
}
```

**Validation Kuralları:**
| Alan | Kural |
|------|-------|
| `subject_id` | Zorunlu, subjects tablosunda mevcut olmalı |
| `duration` | Zorunlu, integer, min 1 (dakika) |
| `started_at` | Zorunlu, geçerli tarih |
| `ended_at` | Opsiyonel, `started_at`'dan sonra |
| `session_type` | Zorunlu, `manual` veya `timer` |
| `notes` | Opsiyonel, max 1000 karakter |

**Başarılı Yanıt (201):**
```json
{
    "message": "Seans başarıyla oluşturuldu.",
    "data": {
        "id": 1,
        "subject": {
            "id": 1,
            "name": "Matematik"
        },
        "duration": 60,
        "started_at": "2026-04-23T10:00:00+00:00",
        "ended_at": "2026-04-23T11:00:00+00:00",
        "session_type": "manual",
        "notes": "Türev konusu çalıştım",
        "created_at": "2026-04-23T12:00:00+00:00"
    }
}
```

---

### PUT /study-sessions/{id} — Seans Güncelle

**URL:** `http://127.0.0.1:8000/api/v1/study-sessions/1`

**Headers:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

**Body (tüm alanlar opsiyonel):**
```json
{
    "subject_id": 2,
    "duration": 90,
    "started_at": "2026-04-23 10:00:00",
    "ended_at": "2026-04-23 11:30:00",
    "session_type": "timer",
    "notes": "Güncellendi"
}
```

**Başarılı Yanıt (200):**
```json
{
    "message": "Seans başarıyla güncellendi.",
    "data": { ... }
}
```

**Bulunamadı (404):**
```json
{
    "message": "Seans bulunamadı."
}
```

---

### DELETE /study-sessions/{id} — Seans Sil (Soft Delete)

**URL:** `http://127.0.0.1:8000/api/v1/study-sessions/1`

**Headers:**
```
Accept: application/json
Authorization: Bearer {token}
```

**Başarılı Yanıt (200):**
```json
{
    "message": "Seans başarıyla silindi."
}
```

> **Not:** Kayıt veritabanından silinmez. `deleted_at` alanına tarih yazılır.

---

### PATCH /study-sessions/{id}/restore — Silinen Seansı Geri Getir

**URL:** `http://127.0.0.1:8000/api/v1/study-sessions/1/restore`

**Headers:**
```
Accept: application/json
Authorization: Bearer {token}
```

**Başarılı Yanıt (200):**
```json
{
    "message": "Seans başarıyla geri yüklendi."
}
```

---

## Goals

### GET /goals — Hedefleri Listele

**URL:** `http://127.0.0.1:8000/api/v1/goals`

**Headers:**
```
Accept: application/json
Authorization: Bearer {token}
```

**Başarılı Yanıt (200):**
```json
{
    "data": [
        {
            "id": 1,
            "type": "daily",
            "target_duration": 120,
            "start_date": "2026-04-23",
            "end_date": "2026-04-23",
            "created_at": "2026-04-23T10:00:00+00:00"
        }
    ]
}
```

---

### POST /goals — Hedef Oluştur

**URL:** `http://127.0.0.1:8000/api/v1/goals`

**Headers:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
    "type": "daily",
    "target_duration": 120,
    "start_date": "2026-04-23",
    "end_date": "2026-04-23"
}
```

**Validation Kuralları:**
| Alan | Kural |
|------|-------|
| `type` | Zorunlu, `daily` veya `weekly` |
| `target_duration` | Zorunlu, integer, min 1 (dakika) |
| `start_date` | Zorunlu, geçerli tarih |
| `end_date` | Zorunlu, `start_date`'e eşit veya sonra |

**Başarılı Yanıt (201):**
```json
{
    "message": "Hedef başarıyla oluşturuldu.",
    "data": {
        "id": 1,
        "type": "daily",
        "target_duration": 120,
        "start_date": "2026-04-23",
        "end_date": "2026-04-23",
        "created_at": "2026-04-23T10:00:00+00:00"
    }
}
```

---

## Notifications

### GET /notifications — Bildirimleri Listele

**URL:** `http://127.0.0.1:8000/api/v1/notifications`

**Headers:**
```
Accept: application/json
Authorization: Bearer {token}
```

**Başarılı Yanıt (200):**
```json
{
    "data": [
        {
            "id": 1,
            "title": "Günlük Hedef",
            "message": "Bugün 2 saatlik hedefini tamamladın!",
            "is_read": false,
            "created_at": "2026-04-23T10:00:00+00:00"
        }
    ]
}
```

---

### PATCH /notifications/mark-all-read — Tümünü Okundu İşaretle

**URL:** `http://127.0.0.1:8000/api/v1/notifications/mark-all-read`

**Headers:**
```
Accept: application/json
Authorization: Bearer {token}
```

**Başarılı Yanıt (200):**
```json
{
    "message": "Tüm bildirimler okundu olarak işaretlendi."
}
```

---

## Hata Kodları

| HTTP Kodu | Açıklama |
|-----------|---------|
| `200` | Başarılı |
| `201` | Kayıt oluşturuldu |
| `401` | Kimlik doğrulaması gerekli / hatalı şifre |
| `404` | Kayıt bulunamadı |
| `405` | HTTP metodu desteklenmiyor |
| `422` | Validation hatası |
| `500` | Sunucu hatası |

### Validation Hatası Örneği (422)

```json
{
    "message": "Doğrulama hatası.",
    "errors": {
        "email": [
            "The email field is required."
        ],
        "password": [
            "The password field must be at least 8 characters."
        ]
    }
}
```

### Kimlik Doğrulama Hatası (401)

```json
{
    "message": "Kimlik doğrulaması gerekli."
}
```

---

## Tüm Endpointler Özet Tablosu

| Method | Endpoint | Açıklama | Auth |
|--------|----------|---------|------|
| POST | `/auth/register` | Kayıt ol | — |
| POST | `/auth/login` | Giriş yap | — |
| POST | `/auth/logout` | Çıkış yap | ✓ |
| GET | `/dashboard` | Dashboard verisi | ✓ |
| GET | `/study-sessions` | Seansları listele | ✓ |
| POST | `/study-sessions` | Seans oluştur | ✓ |
| PUT/PATCH | `/study-sessions/{id}` | Seans güncelle | ✓ |
| DELETE | `/study-sessions/{id}` | Seans sil (soft) | ✓ |
| PATCH | `/study-sessions/{id}/restore` | Seansı geri getir | ✓ |
| GET | `/goals` | Hedefleri listele | ✓ |
| POST | `/goals` | Hedef oluştur | ✓ |
| GET | `/notifications` | Bildirimleri listele | ✓ |
| PATCH | `/notifications/mark-all-read` | Tümünü okundu yap | ✓ |
