"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface PricingCtaButtonProps {
  plan: "STARTER" | "PRO";
  label: string;
  highlight?: boolean;
}

export function PricingCtaButton({ plan, label, highlight }: PricingCtaButtonProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  function handleClick() {
    if (isSignedIn) {
      router.push(`/dashboard/billing?upgrade=${plan}`);
    } else {
      const redirectUrl = encodeURIComponent(`/dashboard/billing?upgrade=${plan}`);
      router.push(`/sign-up?redirect_url=${redirectUrl}`);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
        highlight
          ? "bg-brand-600 text-white hover:bg-brand-700"
          : "bg-gray-900 text-white hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
