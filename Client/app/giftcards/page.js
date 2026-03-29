import Link from "next/link";

export default function GiftCardsPage() {
  return (
    <main className="utility-page">
      <section className="utility-card">
        <p className="eyebrow">Giftcards</p>
        <h1>Gift card center is ready</h1>
        <p>
          This placeholder route is connected from the profile dropdown. You can add gift card
          purchase and redemption flows next.
        </p>
        <Link href="/" className="btn btn-primary">
          Explore Store
        </Link>
      </section>
    </main>
  );
}
