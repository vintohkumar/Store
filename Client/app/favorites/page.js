import Link from "next/link";

export default function FavoritesPage() {
  return (
    <main className="utility-page">
      <section className="utility-card">
        <p className="eyebrow">Favorites</p>
        <h1>Saved styles will appear here</h1>
        <p>
          This page is connected from the header icon. Next step: persist wishlist items per user
          and sync with product catalog.
        </p>
        <Link href="/" className="btn btn-primary">
          Explore Collection
        </Link>
      </section>
    </main>
  );
}
