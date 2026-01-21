# Supabase 데이터베이스 설정 가이드

## 1단계: SQL Editor에서 스키마 생성

Supabase 대시보드 → **SQL Editor** → **New query**

아래 SQL을 복사해서 실행하세요.

---

## 기본 테이블 생성

```sql
-- 사용자 프로필 테이블 (auth.users 확장)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 학생 테이블
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  name TEXT NOT NULL,
  grade INTEGER,
  school TEXT,
  phone TEXT,
  parent_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 선생님 테이블
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  name TEXT NOT NULL,
  subjects TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 과목 테이블
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 평가 테이블
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id),
  subject_id UUID REFERENCES public.subjects(id),
  score INTEGER,
  comments TEXT,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 모의고사 테이블
CREATE TABLE public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  subjects JSONB,
  total_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 업무 로그 테이블
CREATE TABLE public.work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id),
  student_id UUID REFERENCES public.students(id),
  title TEXT NOT NULL,
  description TEXT,
  work_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 연습실 예약 테이블
CREATE TABLE public.practice_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.practice_rooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) 정책 설정

```sql
-- RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- user_profiles 정책
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- students 정책
CREATE POLICY "Admins and teachers can view all students"
  ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Students can view their own data"
  ON public.students FOR SELECT
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- evaluations 정책
CREATE POLICY "Teachers can view evaluations"
  ON public.evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Teachers can create evaluations"
  ON public.evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );

-- subjects 정책 (모두 읽기 가능)
CREATE POLICY "Anyone can view subjects"
  ON public.subjects FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- mock_tests 정책
CREATE POLICY "Teachers can view all mock tests"
  ON public.mock_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Students can view their own mock tests"
  ON public.mock_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_id
      AND user_id = auth.uid()
    )
  );

-- work_logs 정책
CREATE POLICY "Teachers can view all work logs"
  ON public.work_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Teachers can create work logs"
  ON public.work_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );

-- practice_rooms 정책
CREATE POLICY "Anyone can view practice rooms"
  ON public.practice_rooms FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage practice rooms"
  ON public.practice_rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- reservations 정책
CREATE POLICY "Users can view their own reservations"
  ON public.reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_id
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Users can create reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_id
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'teacher')
    )
  );
```

---

## 트리거 함수 생성 (자동 updated_at)

```sql
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 추가
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mock_tests_updated_at
  BEFORE UPDATE ON public.mock_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_logs_updated_at
  BEFORE UPDATE ON public.work_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 회원가입 시 프로필 자동 생성

```sql
-- 회원가입 시 user_profiles 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 트리거 연결
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 2단계: Authentication 설정

Supabase 대시보드 → **Authentication** → **Providers**

1. **Email** 활성화
2. **Confirm email** 설정 (선택)
3. **Site URL** 설정:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

4. **Redirect URLs** 추가:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

---

## 3단계: Storage 설정 (선택)

파일 업로드가 필요하면:

Supabase 대시보드 → **Storage** → **Create bucket**

1. Bucket 이름: `student-files`
2. Public: 체크 (공개) 또는 해제 (비공개)
3. RLS 정책 설정

---

## 완료!

이제 Next.js 앱에서 Supabase를 사용할 수 있습니다! 🎉

테스트 방법:
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// 학생 목록 가져오기
const { data, error } = await supabase
  .from('students')
  .select('*')

console.log(data)
```
