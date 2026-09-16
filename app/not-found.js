import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container narrow center">
      <h1 className="page-title">Page not found</h1>
      <p className="lead">Check the address, or go back to the homepage.</p>
      <div className="button-row center-row">
        <Link href="/" className="btn-light">HOME</Link>
      </div>
    </div>
  );
}
