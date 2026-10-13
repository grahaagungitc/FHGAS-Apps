import GoogleAuthExperience from "@/components/GoogleAuthExperience";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; mode?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;

  return (
      <GoogleAuthExperience
        initialError={resolvedParams?.error}
        initialMode={resolvedParams?.mode === "signup" ? "signup" : "login"}
      />
  );
}