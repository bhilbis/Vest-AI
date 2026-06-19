"use client"

import { GradeSettings } from "@/components/kuliah/GradeSettings"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default function KuliahSettingsPage() {
  return (
    <PageWrapper maxWidth="lg">
      <GradeSettings />
    </PageWrapper>
  )
}
