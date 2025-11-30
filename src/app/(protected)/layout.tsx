import { SessionWrapper } from "@/components/layout/session-wrapper";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <SessionWrapper>{children}</SessionWrapper>
}
