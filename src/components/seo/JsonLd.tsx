"use client";

import React from "react";

interface WebApplicationSchema {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    "@type": string;
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    "@type": string;
    ratingValue: string;
    ratingCount: string;
  };
}

interface OrganizationSchema {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo?: string;
  description: string;
  sameAs?: string[];
}

interface BreadcrumbSchema {
  "@context": string;
  "@type": string;
  itemListElement: Array<{
    "@type": string;
    position: number;
    name: string;
    item?: string;
  }>;
}

type JsonLdSchema =
  | WebApplicationSchema
  | OrganizationSchema
  | BreadcrumbSchema;

interface JsonLdProps {
  data: JsonLdSchema | JsonLdSchema[];
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdData = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLdData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

// Pre-configured schemas for Vest AI
export const VestAISchemas = {
  webApplication: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Vest AI",
    url: "https://go-aoixsy.my.id",
    description:
      "Platform analisis saham berbasis AI yang membantu investor membuat keputusan investasi cerdas dengan teknologi machine learning dan real-time market data.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IDR",
    },
  } as WebApplicationSchema,

  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vest AI",
    url: "https://go-aoixsy.my.id",
    description: "AI-powered investment and stock analysis platform",
    sameAs: [
      // Add your social media profiles here
      // 'https://twitter.com/vestai',
      // 'https://facebook.com/vestai',
      // 'https://linkedin.com/company/vestai',
    ],
  } as OrganizationSchema,

  createBreadcrumb: (items: Array<{ name: string; url?: string }>) =>
    ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(item.url && { item: item.url }),
      })),
    } as BreadcrumbSchema),
};

// Usage example component
export function VestAIStructuredData() {
  return (
    <JsonLd data={[VestAISchemas.webApplication, VestAISchemas.organization]} />
  );
}
