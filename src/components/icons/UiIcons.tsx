type IconProps = {
  className?: string;
};

export function IconSun({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="4" strokeWidth={1.6} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95-6.95-1.4 1.4M6.45 17.55l-1.4 1.4m0-13.9 1.4 1.4m11.1 11.1 1.4 1.4" />
    </svg>
  );
}

export function IconMoon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 12.8A8 8 0 1111.2 3 7 7 0 0021 12.8z" />
    </svg>
  );
}

export function IconLogout({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10 17l5-5-5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12H3" />
    </svg>
  );
}

export function IconLightbulb({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 18h6m-5 3h4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 10a4 4 0 118 0c0 1.7-.9 2.9-2 4l-.5 1.5h-3L10 14c-1.1-1.1-2-2.3-2-4z" />
    </svg>
  );
}

export function IconStar({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M11.48 3.5l2.3 4.66 5.14.75-3.72 3.63.88 5.12-4.6-2.42-4.6 2.42.88-5.12L4.04 8.9l5.14-.75 2.3-4.66z"
      />
    </svg>
  );
}

export function IconTool({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M14.7 6.3a4 4 0 01-5 5L4 17l3 3 5.7-5.7a4 4 0 005-5l-3 3-3-3 3-3z" />
    </svg>
  );
}

export function IconWarning({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3l10 18H2L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 9v5m0 4h.01" />
    </svg>
  );
}

export function IconFileList({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M14 3v5h5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 13h6M9 17h6" />
    </svg>
  );
}

export function IconVideo({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="5" width="15" height="14" rx="2" strokeWidth={1.6} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M18 9l3-2v10l-3-2" />
    </svg>
  );
}

export function IconCalendar({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="4" width="18" height="17" rx="2" strokeWidth={1.6} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 2v4M16 2v4M3 9h18" />
    </svg>
  );
}

export function IconBan({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="9" strokeWidth={1.6} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6.5 6.5l11 11" />
    </svg>
  );
}

export function IconLink({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M10 13a5 5 0 007.1 0l2.8-2.8a5 5 0 00-7.1-7.1L11 4.8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M14 11a5 5 0 00-7.1 0L4.1 13.9a5 5 0 007.1 7.1L13 19.2" />
    </svg>
  );
}

export function IconUser({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="8" r="4" strokeWidth={1.6} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 20a8 8 0 0116 0" />
    </svg>
  );
}

export function IconEye({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M1.5 12.5C2.8 8.2 6.7 5 12 5s9.2 3.2 10.5 7.5C21.2 16.8 17.3 20 12 20s-9.2-3.2-10.5-7.5z"
      />
      <circle cx="12" cy="12.5" r="3.2" strokeWidth={1.6} />
    </svg>
  );
}
