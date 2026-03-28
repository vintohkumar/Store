export const metadata = {
  title: "Vastra Atelier | Traditional Clothing Store",
  description:
    "Discover handcrafted traditional clothing with modern comfort. Shop premium sarees, kurtas, festive wear, and heritage fabrics.",
  openGraph: {
    title: "Vastra Atelier | Traditional Clothing Store",
    description: "Classic heritage craftsmanship meets modern style and comfort.",
    type: "website",
  },
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
