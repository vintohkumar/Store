"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

const FALLBACK_SUMMARY = {
  announcement: "Free shipping across India on orders over Rs 1499",
  hero_title: "Traditional Clothing Curated for the Modern Indian Wardrobe",
  top_chip: "1200+",
  mid_chip: "100% Natural",
  bottom_chip: "Since 1998",
};

const FALLBACK_PRODUCTS = [
  {
    tag: "New",
    name: "Ivory Embroidered Kurta Set",
    fabric_note: "Premium cotton silk blend",
    price_inr: 2499,
    image_url:
      "https://images.unsplash.com/photo-1618244972963-dbad68f8d7d3?auto=format&fit=crop&w=900&q=80",
    alt: "Ivory embroidered kurta set",
  },
  {
    tag: "Trending",
    name: "Royal Indigo Saree",
    fabric_note: "Handloom-inspired drape",
    price_inr: 3299,
    image_url:
      "https://images.unsplash.com/photo-1625591339971-4ce33f59f72c?auto=format&fit=crop&w=900&q=80",
    alt: "Royal indigo saree",
  },
  {
    tag: "Limited",
    name: "Festive Maroon Sherwani",
    fabric_note: "Rich texture with classic finish",
    price_inr: 4999,
    image_url:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&w=900&q=80",
    alt: "Festive maroon sherwani",
  },
  {
    tag: "Classic",
    name: "Pastel Woven Dupatta",
    fabric_note: "Lightweight festive texture",
    price_inr: 1299,
    image_url:
      "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=900&q=80",
    alt: "Pastel woven dupatta",
  },
];

const FALLBACK_TESTIMONIALS = [
  {
    quote: "The fit, texture, and finishing are exceptional. Looks premium and feels effortless.",
    author: "Aditi",
    city: "Jaipur",
  },
  {
    quote: "Exactly the blend I wanted - traditional styling with contemporary comfort.",
    author: "Karan",
    city: "Pune",
  },
  {
    quote: "Fast delivery and beautiful quality. Our festive shopping starts here every season.",
    author: "Neha",
    city: "Delhi",
  },
];

const FAQ_ITEMS = [
  {
    question: "Do you offer size exchange?",
    answer: "Yes, we offer easy size exchange within 7 days for eligible products.",
  },
  {
    question: "Are the fabrics suitable for all seasons?",
    answer: "Most products are crafted for all-season comfort. Fabric details are listed on each product card.",
  },
  {
    question: "How long does delivery usually take?",
    answer: "Orders are usually delivered in 3-7 business days depending on your location.",
  },
  {
    question: "Is cash on delivery available?",
    answer: "Yes, COD is available in most serviceable pin codes across India.",
  },
];

const MEGA_PANELS = {
  men: [
    { title: "Apparel", items: ["Shirts", "Polos", "Jeans", "T-Shirts", "Sweatshirts", "Jackets"] },
    { title: "Underwear", items: ["Briefs", "Trunks", "Vests", "Lounge Sets"] },
    { title: "Footwear", items: ["Sneakers", "Sandals", "Slides", "Loafers"] },
    { title: "Accessories", items: ["Belts", "Wallets", "Backpacks", "Caps"] },
  ],
  women: [
    { title: "Ethnic Wear", items: ["Kurtas", "Sarees", "Dress Materials", "Dupattas"] },
    { title: "Western", items: ["Dresses", "Tops", "Denim", "Co-ord Sets"] },
    { title: "Footwear", items: ["Heels", "Flats", "Sneakers", "Sandals"] },
    { title: "Accessories", items: ["Handbags", "Jewellery", "Scarves", "Belts"] },
  ],
};

function formatPriceINR(amount) {
  const formatted = new Intl.NumberFormat("en-IN").format(Number(amount) || 0);
  return `Rs ${formatted}`;
}

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeSearchLabel, setActiveSearchLabel] = useState("");
  const [summary, setSummary] = useState(FALLBACK_SUMMARY);
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);
  const [openFaq, setOpenFaq] = useState(null);
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  const year = useMemo(() => new Date().getFullYear(), []);

  function handleCardMouseMove(event) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    const rotateY = (relativeX - 0.5) * 12;
    const rotateX = (0.5 - relativeY) * 12;
    const translateX = (relativeX - 0.5) * 10;
    const translateY = (relativeY - 0.5) * 10;
    const pointerX = `${(relativeX * 100).toFixed(2)}%`;
    const pointerY = `${(relativeY * 100).toFixed(2)}%`;

    card.style.setProperty("--rotateX", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--rotateY", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--translateX", `${translateX.toFixed(2)}px`);
    card.style.setProperty("--translateY", `${translateY.toFixed(2)}px`);
    card.style.setProperty("--pointerX", pointerX);
    card.style.setProperty("--pointerY", pointerY);
  }

  function handleCardMouseLeave(event) {
    const card = event.currentTarget;
    card.style.setProperty("--rotateX", "0deg");
    card.style.setProperty("--rotateY", "0deg");
    card.style.setProperty("--translateX", "0px");
    card.style.setProperty("--translateY", "0px");
    card.style.setProperty("--pointerX", "50%");
    card.style.setProperty("--pointerY", "50%");
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchJson(endpoint) {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      return response.json();
    }

    async function hydrate() {
      try {
        const [summaryData, productsData, testimonialsData] = await Promise.all([
          fetchJson("/api/landing-summary"),
          fetchJson("/api/featured-products"),
          fetchJson("/api/testimonials"),
        ]);

        if (!isMounted) {
          return;
        }

        if (summaryData && typeof summaryData === "object") {
          setSummary((prev) => ({ ...prev, ...summaryData }));
        }
        if (Array.isArray(productsData) && productsData.length > 0) {
          setProducts(productsData);
        }
        if (Array.isArray(testimonialsData) && testimonialsData.length > 0) {
          setTestimonials(testimonialsData);
        }
      } catch {
        // Keep fallback content when API is unavailable.
      }
    }

    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -30px 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [products, testimonials]);

  useEffect(() => {
    const syncAuthState = () => {
      if (typeof window === "undefined") {
        return;
      }
      setIsLoggedIn(Boolean(window.localStorage.getItem("va_auth_user")));
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    return () => window.removeEventListener("storage", syncAuthState);
  }, []);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!profileMenuRef.current) {
        return;
      }
      if (!profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("va_auth_user");
      window.dispatchEvent(new Event("storage"));
    }
    setIsLoggedIn(false);
    setIsProfileMenuOpen(false);
  }

  const filteredProducts = useMemo(() => {
    if (!activeSearch) {
      return products;
    }
    const query = activeSearch.toLowerCase();
    return products.filter((product) => {
      const bag = `${product.name || ""} ${product.fabric_note || ""} ${product.tag || ""}`.toLowerCase();
      return bag.includes(query);
    });
  }, [products, activeSearch]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const term = searchDraft.trim();
    setActiveSearch(term);
    setActiveSearchLabel(term);
    setIsSearchOpen(true);

    const section = document.getElementById("bestsellers");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function clearSearch() {
    setSearchDraft("");
    setActiveSearch("");
    setActiveSearchLabel("");
    setIsSearchOpen(false);
  }

  return (
    <>
      <div className="announcement-bar">
        <p>{summary.announcement}</p>
        <a href="#featured">Explore Collection</a>
      </div>

      <header className="site-header" id="top">
        <div className="container header-top">
          <a className="brand" href="#top" aria-label="Vastra Atelier home">
            <span className="brand-mark">VA</span>
            <span className="brand-text">Vastra Atelier</span>
          </a>

          <div className="header-actions">
            <div
              className={`search-trigger-wrap ${isSearchOpen ? "is-open" : ""}`}
              onMouseEnter={() => setIsSearchOpen(true)}
              onMouseLeave={() => {
                if (!searchDraft.trim()) {
                  setIsSearchOpen(false);
                }
              }}
            >
              <button
                className="icon-action"
                type="button"
                aria-label="Search"
                title="Search"
                onClick={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 0);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="M20 20l-4.2-4.2"></path>
                </svg>
              </button>
              <form className="header-search-inline" onSubmit={handleSearchSubmit} role="search">
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search products"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                />
                <button type="submit">Search</button>
              </form>
            </div>

            <Link className="icon-action" href="/cart" aria-label="Cart" title="Cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h2l1.2 8.3a1.5 1.5 0 0 0 1.5 1.3h7.6a1.5 1.5 0 0 0 1.5-1.2L19 8H7"></path>
                <circle cx="10" cy="19" r="1.4"></circle>
                <circle cx="16" cy="19" r="1.4"></circle>
              </svg>
            </Link>
            <div className="profile-menu-wrap" ref={profileMenuRef}>
              <button
                className="icon-action"
                type="button"
                aria-label="User profile"
                title="User profile"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8.2" r="3.2"></circle>
                  <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0"></path>
                </svg>
              </button>

              {isProfileMenuOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-top">
                    <h4>Welcome</h4>
                    <p>Access your account and manage your orders</p>
                    {!isLoggedIn ? (
                      <Link
                        href="/login"
                        className="profile-primary-btn"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        LOGIN / SIGNUP
                      </Link>
                    ) : (
                      <button type="button" className="profile-primary-btn" onClick={handleLogout}>
                        LOGOUT
                      </button>
                    )}
                  </div>

                  <ul className="profile-menu-list">
                    <li>
                      <Link href="/orders" onClick={() => setIsProfileMenuOpen(false)}>
                        Orders
                      </Link>
                    </li>
                    <li>
                      <Link href="/favorites" onClick={() => setIsProfileMenuOpen(false)}>
                        Wishlist
                      </Link>
                    </li>
                    <li>
                      <Link href="/giftcards" onClick={() => setIsProfileMenuOpen(false)}>
                        Giftcards
                      </Link>
                    </li>
                    <li>
                      <a href="#contact" onClick={() => setIsProfileMenuOpen(false)}>
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <Link className="icon-action" href="/favorites" aria-label="Favorites" title="Favorites">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20s-6.5-3.9-8.6-7.5C1.7 9.6 3 6 6.8 6c2 0 3.4 1.2 4.2 2.4C11.8 7.2 13.2 6 15.2 6c3.8 0 5.1 3.6 3.4 6.5C16.5 16.1 12 20 12 20z"></path>
              </svg>
            </Link>

            <button
              className="menu-toggle"
              type="button"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <div className="mega-nav-wrap" onMouseLeave={() => setActivePanel(null)}>
          <nav className="mega-nav container" aria-label="Primary categories">
            <button type="button" className="nav-pill">
              Sale
            </button>
            <button type="button" className="nav-pill">
              New Arrivals
            </button>
            <button
              type="button"
              className={`nav-pill ${activePanel === "men" ? "active" : ""}`}
              onMouseEnter={() => setActivePanel("men")}
              onFocus={() => setActivePanel("men")}
              onClick={() => setActivePanel((prev) => (prev === "men" ? null : "men"))}
              aria-expanded={activePanel === "men"}
            >
              Men
            </button>
            <button
              type="button"
              className={`nav-pill ${activePanel === "women" ? "active" : ""}`}
              onMouseEnter={() => setActivePanel("women")}
              onFocus={() => setActivePanel("women")}
              onClick={() => setActivePanel((prev) => (prev === "women" ? null : "women"))}
              aria-expanded={activePanel === "women"}
            >
              Women
            </button>
            <button type="button" className="nav-pill">
              Accessories
            </button>
          </nav>

          {activePanel && (
            <div className="mega-panel">
              <div className="container mega-panel-grid">
                {MEGA_PANELS[activePanel].map((column) => (
                  <div key={column.title}>
                    <h4>{column.title}</h4>
                    <ul>
                      {column.items.map((item) => (
                        <li key={item}>
                          <a href="#featured">{item}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav className={`mobile-nav ${isMenuOpen ? "is-open" : ""}`} aria-label="Mobile navigation">
          <a href="#featured" onClick={() => setIsMenuOpen(false)}>
            Sale
          </a>
          <a href="#featured" onClick={() => setIsMenuOpen(false)}>
            New Arrivals
          </a>
          <a href="#craft" onClick={() => setIsMenuOpen(false)}>
            Men
          </a>
          <a href="#bestsellers" onClick={() => setIsMenuOpen(false)}>
            Women
          </a>
          <a href="#story" onClick={() => setIsMenuOpen(false)}>
            Accessories
          </a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)}>
            Contact
          </a>
          <Link className="btn btn-primary" href="/login" onClick={() => setIsMenuOpen(false)}>
            Login with OTP
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero section-diagonal" id="hero">
          <div className="hero-overlay"></div>
          <div className="container hero-grid">
            <div className="hero-copy reveal">
              <p className="eyebrow">Heritage Weaves, Contemporary Grace</p>
              <h1>{summary.hero_title}</h1>
              <p>
                Discover handcrafted silhouettes, breathable premium fabrics, and festive classics made
                for comfort, elegance, and timeless expression.
              </p>
              <div className="hero-cta">
                <a href="#featured" className="btn btn-primary">
                  Explore Collections
                </a>
                <a href="#craft" className="btn btn-ghost">
                  Our Craft Story
                </a>
              </div>
            </div>

            <div className="hero-visual reveal">
              <div className="hero-frame">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80"
                  alt="Traditional clothing model in festive outfit"
                />
              </div>

              <div className="floating-chip chip-top">
                <strong>{summary.top_chip}</strong>
                <span>Handpicked designs</span>
              </div>
              <div className="floating-chip chip-mid">
                <strong>{summary.mid_chip}</strong>
                <span>Breathable fabrics</span>
              </div>
              <div className="floating-chip chip-bottom">
                <strong>{summary.bottom_chip}</strong>
                <span>Artisan legacy</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pillars container reveal" id="pillars">
          <article className="pillar-card">
            <div className="icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4l6 4v8l-6 4-6-4V8l6-4z" />
                <path d="M9 10l3 2 3-2" />
              </svg>
            </div>
            <h3>Authentic Weaves</h3>
            <p>Curated handloom textures and tradition-rich patterns from skilled artisans.</p>
          </article>
          <article className="pillar-card">
            <div className="icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 14c2-6 14-6 16 0" />
                <path d="M6 14v2a6 6 0 0 0 12 0v-2" />
                <path d="M9 8h6" />
              </svg>
            </div>
            <h3>Premium Comfort</h3>
            <p>Soft and breathable materials that elevate everyday and occasion wear alike.</p>
          </article>
          <article className="pillar-card">
            <div className="icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 12h12" />
                <path d="M12 6v12" />
                <path d="M4 4h16v16H4z" />
              </svg>
            </div>
            <h3>Artisan Finish</h3>
            <p>Fine detailing, careful stitching, and premium silhouettes with modern tailoring.</p>
          </article>
          <article className="pillar-card">
            <div className="icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 7h18" />
                <path d="M6 7v10h12V7" />
                <path d="M9 11h6" />
              </svg>
            </div>
            <h3>Nationwide Delivery</h3>
            <p>Fast, reliable shipping across India with secure packaging and easy support.</p>
          </article>
        </section>

        <section className="featured section-diagonal-light" id="featured">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">Featured Categories</p>
              <h2>Shop by Collection</h2>
            </div>

            <div className="category-grid">
              <article className="category-card reveal">
                <img
                  src="https://images.unsplash.com/photo-1595341595379-cf0f7f6bd7f9?auto=format&fit=crop&w=900&q=80"
                  alt="Men traditional collection"
                />
                <div className="category-meta">
                  <h3>Men Traditional</h3>
                  <a href="#bestsellers">View Collection</a>
                </div>
              </article>
              <article className="category-card reveal">
                <img
                  src="https://images.unsplash.com/photo-1647701203103-e3f392f74538?auto=format&fit=crop&w=900&q=80"
                  alt="Women ethnic collection"
                />
                <div className="category-meta">
                  <h3>Women Ethnic</h3>
                  <a href="#bestsellers">View Collection</a>
                </div>
              </article>
              <article className="category-card reveal">
                <img
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
                  alt="Festive wear collection"
                />
                <div className="category-meta">
                  <h3>Festive Wear</h3>
                  <a href="#bestsellers">View Collection</a>
                </div>
              </article>
              <article className="category-card reveal">
                <img
                  src="https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?auto=format&fit=crop&w=900&q=80"
                  alt="Premium fabrics collection"
                />
                <div className="category-meta">
                  <h3>Premium Fabrics</h3>
                  <a href="#bestsellers">View Collection</a>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="highlight container reveal" id="craft">
          <div className="highlight-image">
            <img
              src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80"
              alt="Artisan crafting traditional fabric"
            />
          </div>
          <div className="highlight-copy">
            <p className="eyebrow">Signature Collection</p>
            <h2>Woven by Heritage, Styled for Today</h2>
            <p>
              Our curated signature line brings hand-finished craftsmanship into modern wardrobes
              through breathable textures, refined silhouettes, and expressive detail.
            </p>
            <a className="btn btn-primary" href="#bestsellers">
              Shop Signature Collection
            </a>
          </div>
        </section>

        <section className="bestsellers section-diagonal" id="bestsellers">
          <div className="container">
            <div className="section-head reveal">
              <p className="eyebrow">Best Sellers</p>
              <h2>Trending Styles This Season</h2>
              {activeSearch ? (
                <div className="search-feedback">
                  <p>
                    Search results for: <strong>"{activeSearchLabel}"</strong>
                  </p>
                  <button type="button" onClick={clearSearch}>
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article
                  key={product.name}
                  className="product-card product-card-3d reveal"
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                >
                  <div className="product-card-shell">
                    <div className="card-glow"></div>
                    <div className="card-shine"></div>
                    <div className="product-media">
                      <img src={product.image_url} alt={product.alt || product.name} />
                      <span className="product-chip">{product.tag || "Classic"}</span>
                    </div>
                    <div className="product-meta">
                      <h3>{product.name}</h3>
                      <p>{product.fabric_note || "Premium traditional fabric"}</p>
                      <div className="product-meta-row">
                        <strong>{formatPriceINR(product.price_inr)}</strong>
                        <button type="button" className="card-action-btn">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {filteredProducts.length === 0 ? (
              <div className="search-empty-state">
                <p>No products found for "{activeSearchLabel}".</p>
                <button type="button" className="btn btn-ghost" onClick={clearSearch}>
                  Reset Search
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="story container reveal" id="story">
          <div className="section-head">
            <p className="eyebrow">Our Craft Story</p>
            <h2>From Loom to Landmark Looks</h2>
          </div>
          <div className="story-grid">
            <article>
              <h3>1. Source</h3>
              <p>We partner with trusted weaving clusters known for timeless textile traditions.</p>
            </article>
            <article>
              <h3>2. Refine</h3>
              <p>Every silhouette is shaped with modern fit, breathable comfort, and elegant form.</p>
            </article>
            <article>
              <h3>3. Deliver</h3>
              <p>Your chosen pieces arrive quality-checked, beautifully packed, and ready to wear.</p>
            </article>
          </div>
        </section>

        <section className="testimonials section-diagonal-light reveal" id="reviews">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Customer Love</p>
              <h2>Trusted by Families Across India</h2>
            </div>
            <div className="testimonial-grid">
              {testimonials.map((item) => (
                <blockquote key={`${item.author}-${item.city}`}>
                  "{item.quote}"
                  <cite>
                    - {item.author}, {item.city}
                  </cite>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="faq container reveal" id="faq">
          <div className="section-head">
            <p className="eyebrow">Need Help?</p>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article key={item.question} className="faq-item">
                  <button
                    className="faq-question"
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    {item.question}
                  </button>
                  <div className="faq-answer" style={{ maxHeight: isOpen ? "140px" : "0" }}>
                    <p>{item.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="final-cta" id="contact">
          <div className="container final-cta-wrap reveal">
            <h2>Celebrate the Season in Signature Traditional Style</h2>
            <p>Explore premium festive edits crafted to make every moment memorable.</p>
            <a className="btn btn-primary" href="#featured">
              Shop Festive Collection
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <a className="brand footer-brand" href="#top">
              <span className="brand-mark">VA</span>
              <span className="brand-text">Vastra Atelier</span>
            </a>
            <p>Classic textile heritage, designed for contemporary India.</p>
          </div>
          <div>
            <h3>Quick Links</h3>
            <ul>
              <li>
                <a href="#featured">Collections</a>
              </li>
              <li>
                <a href="#craft">Craft Story</a>
              </li>
              <li>
                <a href="#bestsellers">Best Sellers</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Policies</h3>
            <ul>
              <li>
                <a href="#faq">Shipping and Returns</a>
              </li>
              <li>
                <a href="#faq">Privacy Policy</a>
              </li>
              <li>
                <a href="#faq">Terms and Conditions</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Newsletter</h3>
            <form className="newsletter" action="#" method="post">
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input id="email" type="email" placeholder="Enter your email" required />
              <button type="submit">Join</button>
            </form>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© {year} Vastra Atelier. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
