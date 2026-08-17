import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Sign in — FoodDash" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <LoginForm />
      <div className="rounded-lg border bg-white p-4 text-sm text-neutral-600">
        <p className="font-medium text-neutral-900">Demo accounts (password: password123)</p>
        <ul className="mt-2 space-y-1">
          <li>customer@fooddash.test — browse, order, track</li>
          <li>vendor1@fooddash.test — kitchen dashboard</li>
          <li>admin@fooddash.test — platform overview</li>
        </ul>
      </div>
    </div>
  );
}
