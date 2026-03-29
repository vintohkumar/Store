import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="utility-page">
      <section className="utility-card">
        <p className="eyebrow">Profile</p>
        <h1>User profile space is prepared</h1>
        <p>
          This page is connected from the profile icon. Next step: attach OTP session state and
          user account details from the Flask auth APIs.
        </p>
        <div className="utility-actions">
          <Link href="/login" className="btn btn-primary">
            Login with OTP
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
