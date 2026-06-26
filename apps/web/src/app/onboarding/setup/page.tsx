import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingSetupWizard } from "../../../components/OnboardingSetupWizard";

export default async function OnboardingSetupPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-brand-600">AI Gateway</span>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">Let&apos;s get you set up</h1>
          <p className="text-gray-500 text-sm mt-1">
            This takes about 3 minutes. You&apos;ll make your first AI call by the end.
          </p>
        </div>
        <OnboardingSetupWizard />
      </div>
    </div>
  );
}
