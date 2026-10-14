import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import SetupNotice from "@/components/SetupNotice";

export const metadata = { title: "Register | Book Collection" };

export default function RegisterPage() {
  return (
    <div className="container narrow center">
      <h1 className="page-title">Create an account</h1>
      <p className="lead">Start tracking the books you want to read and have read.</p>
      <SetupNotice />
      <RegisterForm />
      <p className="lead">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
