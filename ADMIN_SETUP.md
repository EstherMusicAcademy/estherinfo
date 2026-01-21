# Admin 계정 설정 가이드

## 🎯 빠른 설정 (개발 환경)

개발 환경에서는 **X-Dev-User-Id** 헤더로 인증 우회 가능합니다.

브라우저 확장 프로그램 설치:
- Chrome: [ModHeader](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj)
- Firefox: [Modify Header Value](https://addons.mozilla.org/en-US/firefox/addon/modify-header-value/)

헤더 설정:
```
X-Dev-User-Id: dev-admin
X-Dev-Role: admin
```

이제 로그인 없이 모든 기능 사용 가능!

---

## 🚀 프로덕션 설정

### 1단계: 회원가입

http://localhost:3000/auth

```
이메일: admin@yourdomain.com
비밀번호: (강력한 비밀번호)
이름: 관리자
가입 유형: 직원 (staff)
```

### 2단계: Supabase에서 권한 변경

**Supabase 대시보드 → SQL Editor → New query**

```sql
-- 방금 가입한 계정을 admin으로 변경
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"admin"'
)
WHERE email = 'admin@yourdomain.com';

-- 이메일 확인 건너뛰기 (개발용)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@yourdomain.com';
```

### 3단계: 로그아웃 후 재로그인

브라우저 새로고침 또는 로그아웃 → 로그인

---

## 🔍 권한 확인

로그인 후 브라우저 콘솔에서:

```javascript
// 현재 사용자 정보 확인
fetch('/api/students')
  .then(r => r.json())
  .then(console.log)

// 에러 없이 데이터가 나오면 성공!
```

---

## 🛠️ 추가 사용자 생성

### 선생님 계정:
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"teacher"'
)
WHERE email = 'teacher@example.com';
```

### 학생 계정:
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"student"'
)
WHERE email = 'student@example.com';
```

---

## 🐛 문제 해결

### "접근 권한이 없습니다" 에러
→ SQL로 role 확인:
```sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users;
```

### 이메일 확인 필요 에러
→ 이메일 확인 스킵:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';
```
