# Lottery Search System Doc

ระบบ Lottery Search System ใช้สำหรับค้นหาสลากเลข 6 หลักจำนวนมาก โดยรองรับ pattern ที่มีตัวเลขและ wildcard `*` เช่น `****23`, `1****5`, `123***`

| Client | ส่ง search pattern, แสดงเลขที่ถูก hold, แจ้ง release เมื่อ search ใหม่หรือออกจากหน้า |
| Lottery Search Service | validate pattern, search candidate, hold/release ticket, confirm purchase |
| PostgreSQL | เก็บ ticket ทั้งหมดและสถานะจริง เช่น `available`, `sold` |
| Redis | เก็บ hold/reservation ชั่วคราว เพื่อกันการแจก ticket ซ้ำพร้อมกัน |

Flow หลัก:

1. User search pattern เช่น `****56`
2. Service release ticket เดิมของ session ก่อน ถ้ามี
3. Service query PostgreSQL เพื่อหา ticket ที่ยัง `available`
4. Service พยายาม hold candidate ใน Redis แบบ atomic
5. ถ้า hold สำเร็จ จึง return ticket number ให้ user
6. ถ้า user search เลขอื่นหรือออกจากหน้า ระบบ release ticket เดิม
7. ถ้า user ซื้อจริง ระบบ update PostgreSQL transaction ให้เป็น `sold`

## Database

ใช้ PostgreSQL เป็น primary database เพราะข้อมูล ticket และการขายต้องการความถูกต้องระดับ transaction

ตัวอย่าง table:

```sql
tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number CHAR(6) NOT NULL UNIQUE,
  d1 SMALLINT NOT NULL,
  d2 SMALLINT NOT NULL,
  d3 SMALLINT NOT NULL,
  d4 SMALLINT NOT NULL,
  d5 SMALLINT NOT NULL,
  d6 SMALLINT NOT NULL,
  status VARCHAR(20) NOT NULL, -- available, sold
  sold_to_user_id BIGINT NULL,
  sold_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
)
```

เหตุผล:

- รองรับ ACID transaction เหมาะกับการเปลี่ยน ticket จาก `available` เป็น `sold`
- รองรับ index และ query ข้อมูลระดับ 1M+ ได้ดี
- ใช้ row-level locking / atomic update ได้ตอนซื้อจริง
- Operational complexity ต่ำกว่า search engine แยก เช่น Elasticsearch

### Search ด้วย `d1-d6`

เก็บ `ticket_number` เต็มไว้แสดงผล และแยกเลขแต่ละตำแหน่งเป็น `d1-d6` เพื่อให้ search wildcard กลายเป็น query ตามตำแหน่ง

ตัวอย่าง `ticket_number = 123456`:

```text
d1 = 1, d2 = 2, d3 = 3, d4 = 4, d5 = 5, d6 = 6
```

ถ้า user search `****56` ระบบแปลงเป็น:

```sql
SELECT id, ticket_number
FROM tickets
WHERE status = 'available'
  AND d5 = 5
  AND d6 = 6
ORDER BY id
LIMIT 100;
```

ตัวอย่าง pattern:

| Pattern  | Condition                      |
| -------- | ------------------------------ |
| `****56` | `d5 = 5 AND d6 = 6`            |
| `1****5` | `d1 = 1 AND d6 = 5`            |
| `123***` | `d1 = 1 AND d2 = 2 AND d3 = 3` |

Index ที่แนะนำ:

```sql
CREATE INDEX idx_tickets_status_d1 ON tickets(status, d1);
CREATE INDEX idx_tickets_status_d2 ON tickets(status, d2);
CREATE INDEX idx_tickets_status_d3 ON tickets(status, d3);
CREATE INDEX idx_tickets_status_d4 ON tickets(status, d4);
CREATE INDEX idx_tickets_status_d5 ON tickets(status, d5);
CREATE INDEX idx_tickets_status_d6 ON tickets(status, d6);
```

สำหรับ pattern ที่ใช้บ่อย สามารถเพิ่ม composite index เช่น:

```sql
CREATE INDEX idx_tickets_status_d5_d6 ON tickets(status, d5, d6);
CREATE INDEX idx_tickets_status_d1_d6 ON tickets(status, d1, d6);
CREATE INDEX idx_tickets_status_d1_d2_d3 ON tickets(status, d1, d2, d3);
```

### Redis

ใช้ Redis สำหรับ distributed hold/reservation:

```text
hold:ticket:{ticket_id} = {session_id}
hold:session:{session_id} = {ticket_id}
```

เหตุผล:

- `SET key value NX` เป็น atomic operation
- ทุก application instance เห็น hold state เดียวกัน
- เหมาะกับ state ชั่วคราวระหว่าง user กำลังเลือก ticket
- ลดการ lock ใน PostgreSQL ระหว่าง search ซึ่งเกิดบ่อยกว่าการซื้อจริง

### ป้องกันผลลัพธ์ซ้ำและการแจกสลากซ้ำ

ใช้การป้องกัน 3 ชั้น เพื่อแยกหน้าที่ระหว่าง search, purchase และ release ให้ชัดเจน

#### 1. Search / Hold Layer: Redis

ก่อน return ticket ให้ user ระบบต้อง hold ticket ใน Redis สำเร็จก่อนเสมอ

```text
SET hold:ticket:{ticket_id} {session_id} NX
```

- ถ้าสำเร็จ แปลว่า session นี้ได้ ticket ใบนั้น
- ถ้าไม่สำเร็จ แปลว่ามีคนอื่น hold อยู่แล้ว ให้ลอง candidate ถัดไป
- เพราะ `SET NX` เป็น atomic operation จึงกัน race condition ระหว่างหลาย app instances ได้
- User จะเห็น ticket ได้เฉพาะใบที่ hold สำเร็จแล้วเท่านั้น

#### 2. Purchase Layer: PostgreSQL Transaction

ตอนซื้อจริง ต้อง update PostgreSQL แบบ atomic เพื่อกันกรณี ticket ถูกขายซ้ำ

```sql
UPDATE tickets
SET status = 'sold',
    sold_to_user_id = $user_id,
    sold_at = now(),
    updated_at = now()
WHERE id = $ticket_id
  AND status = 'available'
RETURNING id, ticket_number;
```

ถ้า `RETURNING` ไม่มี row แปลว่า ticket ไม่ available แล้ว ต้อง reject purchase

หลังซื้อสำเร็จ:

- ลบ hold key จาก Redis
- PostgreSQL เป็นตัวบันทึกสถานะจริงว่า ticket ถูกขายแล้ว
- search ครั้งถัดไปจะไม่เจอ ticket นี้ เพราะ filter `status = 'available'`

#### 3. Release Layer: Owner-Safe Release

Ticket จะถูก release เมื่อ:

- user search เลขอื่น
- user ออกจากหน้าหรือปิดหน้า แล้ว client ส่ง release request
- user purchase สำเร็จ

การ release ต้องลบเฉพาะ ticket ที่ session นั้นเป็นเจ้าของอยู่เท่านั้น:

```text
delete hold:ticket:{ticket_id} only if value == session_id
delete hold:session:{session_id}
```

## สรุป

ระบบที่เสนอใช้ PostgreSQL + Redis โดยแบ่งหน้าที่ชัดเจน:

- PostgreSQL เก็บ ticket ทั้งหมดและเป็น source of truth สำหรับสถานะ `available` / `sold`
- PostgreSQL แยกเลขเป็น `d1-d6` เพื่อให้ wildcard search แปลงเป็น condition ตามตำแหน่ง เช่น `****56` เป็น `d5 = 5 AND d6 = 6`
- ถ้ารองรับลอตเตอรี่ไทย 100 ล้านใบ โดยแบ่งเป็น 100 ชุด ชุดละ 1 ล้านใบ ให้เพิ่ม `set_no` และใช้ unique key เป็น `(set_no, ticket_number)` เพราะเลขเดียวกันสามารถมีได้หลายชุด
- สำหรับข้อมูลระดับ 100M rows ยังใช้ design นี้ได้ แต่ควรทำ PostgreSQL partition ตาม `set_no` และสร้าง partial/composite index เฉพาะ ticket ที่ `available` เพื่อให้ search เร็วและลด index size
- Redis ใช้สำหรับ distributed hold เพื่อป้องกันไม่ให้หลาย user ได้ ticket ใบเดียวกันพร้อมกัน
- การขายจริงใช้ PostgreSQL atomic transaction เพื่อยืนยันความถูกต้องขั้นสุดท้าย

### ข้อดี

- Search wildcard อ่านง่าย เพราะแปลงเป็น condition ตามตำแหน่ง
- ใช้ storage น้อย เพราะไม่ต้องสร้าง row เพิ่มสำหรับทุก search pattern
- Redis กัน duplicate hold ได้เร็วและรองรับหลาย app instances
- ไม่ต้องเพิ่ม search engine แยก

### ข้อเสีย / Trade-offs

- ต้องเพิ่ม column `d1-d6` และ parse ticket number ตอน import
- ต้องเลือก index ให้เหมาะกับ pattern ที่ search บ่อย
- ถ้า pattern กว้างมาก เช่น `******` ต้องใช้ batching และ distribution strategy
- Redis เป็น transient state จึงต้องมี recovery plan กรณี Redis restart หรือ client หาย
- การไม่มี timeout อาจทำให้ ticket ค้าง hold ถ้า client ไม่ส่ง release

แนวทางนี้เร็วพอสำหรับ 1M+ records และสามารถขยายไปถึง 100M records ได้เมื่อใช้ partition/index ที่เหมาะสม ระบบ scale ได้ด้วยหลาย application instances และป้องกัน duplicate simultaneous selection ได้ด้วย Redis atomic reservation ร่วมกับ PostgreSQL transaction
