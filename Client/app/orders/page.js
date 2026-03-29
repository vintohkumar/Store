import Link from "next/link";

export default function OrdersPage() {
  return (
    <main className="utility-page">
      <section className="utility-card">
        <p className="eyebrow">Orders</p>
        <h1>Your order timeline will appear here</h1>
        <p>
          This placeholder route is connected from the profile dropdown. Next step is integrating
          order history APIs.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </section>
    </main>
  );
}
