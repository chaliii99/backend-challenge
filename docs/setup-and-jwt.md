# Setup and JWT Guide

เอกสารนี้อธิบายวิธีติดตั้ง วิธีรันโปรเจกต์ และวิธีใช้งาน JWT token กับ API

## Requirements

- Node.js 20 หรือใหม่กว่า
- npm
- MongoDB ที่รันอยู่บนเครื่อง หรือ MongoDB connection string ที่ใช้งานได้

## Installation

ติดตั้ง dependencies:

```bash
npm install
```

สร้างไฟล์ `.env` จากตัวอย่าง:

```bash
cp .env.example .env
```

ตัวอย่างค่า `.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=backend_challenge
JWT_SECRET=change-me
JWT_EXPIRES_IN=1d
```

## Environment Variables

| Name              | Required           | Description                                                          |
| ----------------- | ------------------ | -------------------------------------------------------------------- |
| `PORT`            | No                 | Port ของ API server ค่าเริ่มต้นคือ `3000`                            |
| `NODE_ENV`        | No                 | Runtime environment เช่น `development` หรือ `production`             |
| `MONGODB_URI`     | No                 | MongoDB connection string ค่าเริ่มต้นคือ `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | No                 | ชื่อ database ค่าเริ่มต้นคือ `backend_challenge`                     |
| `JWT_SECRET`      | Yes for production | Secret สำหรับ sign และ verify JWT                                    |
| `JWT_EXPIRES_IN`  | No                 | อายุ token ค่าเริ่มต้นคือ `1d`                                       |

หมายเหตุ: ถ้า `NODE_ENV=production` ห้ามใช้ `JWT_SECRET=change-me`

## Run Project

รันแบบ development:

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

รันจากไฟล์ build:

```bash
npm start
```

รัน tests:

```bash
npm test
```

หลังจาก server ทำงานแล้ว เปิด Swagger UI ได้ที่:

```text
http://localhost:3000/api-docs
```

OpenAPI JSON:

```text
http://localhost:3000/api-docs.json
```

## JWT Guide

JWT ใช้สำหรับเรียก protected API ใต้ `/api/users`

Protected routes:

- `POST /api/users`
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

## วิธีสร้าง JWT Token

สร้าง JWT token ได้จากการสมัครสมาชิกหรือ login

### 1. สมัครสมาชิก

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

Response จะมี `data.token`:

```json
{
  "data": {
    "user": {
      "id": "665f1f77bcf86cd799439011",
      "name": "Alice",
      "email": "alice@example.com",
      "createdAt": "2026-06-14T10:00:00.000Z",
      "updatedAt": "2026-06-14T10:00:00.000Z"
    },
    "token": "<jwt-token>"
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

Response จะมี `data.token`:

```json
{
  "data": {
    "user": {
      "id": "665f1f77bcf86cd799439011",
      "name": "Alice",
      "email": "alice@example.com",
      "createdAt": "2026-06-14T10:00:00.000Z",
      "updatedAt": "2026-06-14T10:00:00.000Z"
    },
    "token": "<jwt-token>"
  }
}
```

ให้ copy ค่า `data.token` จาก response ไปใช้กับ API ที่ต้อง login

## วิธีใช้งาน JWT Token กับ API

ส่ง token ผ่าน header:

```http
Authorization: Bearer <jwt-token>
```

ตัวอย่างเรียก list users:

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer <jwt-token>"
```

ตัวอย่างเรียก get user by ID:

```bash
curl http://localhost:3000/api/users/665f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <jwt-token>"
```

ตัวอย่างสร้าง user:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "name": "Bob",
    "email": "bob@example.com",
    "password": "password123"
  }'
```

## JWT Errors

ถ้าไม่ส่ง token:

```json
{
  "error": {
    "message": "Missing authorization token"
  }
}
```

ถ้า token ไม่ถูกต้องหรือหมดอายุ:

```json
{
  "error": {
    "message": "Invalid authorization token"
  }
}
```

## Assumptions and Design Decisions

- ใช้ TypeScript ตาม requirement ของโปรเจกต์
- ใช้ Express สำหรับ HTTP routing
- ใช้ MongoDB `_id` เป็น public `id` ใน API response
- Hash password ด้วย `bcryptjs`
- JWT ใช้ algorithm `HS256`
- User endpoints ใต้ `/api/users` ถูกป้องกันด้วย JWT middleware
