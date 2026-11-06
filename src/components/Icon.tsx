type IconName = "compass" | "folder" | "bell" | "user" | "plus" | "search" | "sliders" | "leaf" | "close" | "back" | "shield";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const content = {
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="2" /><path d="M8.5 17c.6-1.4 1.8-2 3.5-2s2.9.6 3.5 2" /></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    sliders: <><path d="M4 7h10m4 0h2M4 17h2m4 0h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    leaf: <><path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15" /><path d="M5 19c3-5 6-8 10-10" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    back: <path d="m14 5-7 7 7 7M7 12h13" />,
    shield: <><path d="M12 2 4 5v6c0 5 3.2 9 8 11 4.8-2 8-6 8-11V5z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  }[name];

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{content}</svg>;
}
