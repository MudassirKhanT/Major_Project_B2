import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary-600/10 blur-[100px] rounded-full pointer-events-none" />
      <SignIn />
    </main>
  );
}
