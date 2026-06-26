import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreateOrganization } from "@clerk/nextjs";

export default async function OnboardingPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");
  if (orgId) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your organization</h1>
        <p className="text-gray-500 mt-2">Set up a team to start using the AI Gateway.</p>
      </div>
      <CreateOrganization afterCreateOrganizationUrl="/onboarding/setup" />
    </div>
  );
}
