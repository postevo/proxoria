import { ClerkTokenProvider } from "../../components/ClerkTokenProvider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <ClerkTokenProvider>{children}</ClerkTokenProvider>;
}
