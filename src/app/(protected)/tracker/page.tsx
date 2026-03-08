"use client"

import { UnifiedDashboard } from "@/components/tracker/dashboard/UnifiedDashboard"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default function TrackerPage() {
  return (
    <PageWrapper maxWidth="lg">
      <UnifiedDashboard />
    </PageWrapper>
  )
}
