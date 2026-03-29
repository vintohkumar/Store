import Link from "next/link";

export default function CartPage() {
  return (
    <main className="utility-page">
      <section className="utility-card">
        <p className="eyebrow">Cart</p>
        <h1>Your cart is ready for integration</h1>
        <p>
          This page is connected from the header icon. Next step: bind cart store and checkout
          summary from backend order APIs.
        </p>
        <Link href="/" className="btn btn-primary">
          Continue Shopping
        </Link>
      </section>
    </main>
  );
}
