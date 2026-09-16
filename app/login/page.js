import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Log in | Book Collection" };

export default function LoginPage() {
  return (
    <div className="container narrow center">
      <h1 className="page-title">Log in</h1>
      <p className="lead">Welcome back. Log in to see your books.</p>
      <LoginForm />
      <p className="lead">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </div>
  );
}
