# UI Components Usage Guide

## LoadingSpinner

```tsx
import { LoadingSpinner, LoadingCard, LoadingDots } from "@/components/ui/LoadingSpinner";

// Small spinner
<LoadingSpinner size="sm" />

// Medium spinner (default)
<LoadingSpinner size="md" />

// Large spinner
<LoadingSpinner size="lg" />

// Full screen loading
<LoadingSpinner fullScreen />

// Loading card skeleton
<LoadingCard />

// Loading dots animation
<LoadingDots />
```

## Toast Notifications

```tsx
import { useToast } from "@/components/ui/Toast";

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast("성공적으로 저장되었습니다!", "success");
  };

  const handleError = () => {
    showToast("오류가 발생했습니다.", "error");
  };

  const handleWarning = () => {
    showToast("주의가 필요합니다.", "warning");
  };

  const handleInfo = () => {
    showToast("정보를 확인하세요.", "info");
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
      <button onClick={handleWarning}>Warning</button>
      <button onClick={handleInfo}>Info</button>
    </div>
  );
}
```

## Form Components

```tsx
import { FormInput, FormTextarea, FormSelect } from "@/components/ui/FormInput";

function MyForm() {
  const [errors, setErrors] = useState({});

  return (
    <form>
      {/* Input with icon */}
      <FormInput
        label="이메일"
        type="email"
        required
        error={errors.email}
        helperText="유효한 이메일을 입력하세요"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />

      {/* Textarea */}
      <FormTextarea
        label="내용"
        required
        rows={5}
        error={errors.content}
        placeholder="내용을 입력하세요..."
      />

      {/* Select */}
      <FormSelect
        label="과목"
        required
        error={errors.subject}
        options={[
          { value: "", label: "과목 선택" },
          { value: "vocal", label: "보컬" },
          { value: "piano", label: "피아노" },
        ]}
      />
    </form>
  );
}
```

## Page Transition

Already integrated in layout.tsx - pages will automatically fade in when navigating.

## Example: Complete Form with Toast

```tsx
"use client";

import { useState } from "react";
import { FormInput, FormTextarea } from "@/components/ui/FormInput";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ExamplePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력하세요";
    }
    if (!formData.email.includes("@")) {
      newErrors.email = "유효한 이메일을 입력하세요";
    }
    if (!formData.message.trim()) {
      newErrors.message = "메시지를 입력하세요";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("입력 내용을 확인하세요", "error");
      return;
    }

    setLoading(true);
    try {
      // API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast("성공적으로 제출되었습니다!", "success");
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
    } catch (error) {
      showToast("오류가 발생했습니다", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">문의하기</h1>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-surface p-8">
          <FormInput
            label="이름"
            required
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            error={errors.name}
          />

          <FormInput
            label="이메일"
            type="email"
            required
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            error={errors.email}
          />

          <FormTextarea
            label="메시지"
            required
            rows={5}
            value={formData.message}
            onChange={(e) => {
              setFormData({ ...formData, message: e.target.value });
              if (errors.message) setErrors({ ...errors, message: "" });
            }}
            error={errors.message}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>제출 중...</span>
              </>
            ) : (
              "제출하기"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
```
