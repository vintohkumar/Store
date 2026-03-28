from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "api",
        }
    )


@app.get("/api/landing-summary")
def landing_summary():
    return jsonify(
        {
            "announcement": "New festive edit live now - Free shipping across India on orders over Rs 1499",
            "hero_title": "Classic Textile Heritage with a Modern, Statement-Ready Finish",
            "top_chip": "1400+ Designs",
            "mid_chip": "Pure Fabrics",
            "bottom_chip": "Since 1998",
        }
    )


@app.get("/api/featured-products")
def featured_products():
    return jsonify(
        [
            {
                "tag": "New",
                "name": "Ivory Embroidered Kurta Set",
                "fabric_note": "Premium cotton silk blend",
                "price_inr": 2499,
                "image_url": "https://images.unsplash.com/photo-1618244972963-dbad68f8d7d3?auto=format&fit=crop&w=900&q=80",
                "alt": "Ivory embroidered kurta set",
            },
            {
                "tag": "Trending",
                "name": "Royal Indigo Saree",
                "fabric_note": "Handloom-inspired drape",
                "price_inr": 3299,
                "image_url": "https://images.unsplash.com/photo-1625591339971-4ce33f59f72c?auto=format&fit=crop&w=900&q=80",
                "alt": "Royal indigo saree",
            },
            {
                "tag": "Limited",
                "name": "Festive Maroon Sherwani",
                "fabric_note": "Rich texture with classic finish",
                "price_inr": 4999,
                "image_url": "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&w=900&q=80",
                "alt": "Festive maroon sherwani",
            },
            {
                "tag": "Classic",
                "name": "Pastel Woven Dupatta",
                "fabric_note": "Lightweight festive texture",
                "price_inr": 1299,
                "image_url": "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=900&q=80",
                "alt": "Pastel woven dupatta",
            },
        ]
    )


@app.get("/api/testimonials")
def testimonials():
    return jsonify(
        [
            {
                "quote": "The fit, texture, and finishing are exceptional. Looks premium and feels effortless.",
                "author": "Aditi",
                "city": "Jaipur",
            },
            {
                "quote": "Exactly the blend I wanted - traditional styling with contemporary comfort.",
                "author": "Karan",
                "city": "Pune",
            },
            {
                "quote": "Fast delivery and beautiful quality. Our festive shopping starts here every season.",
                "author": "Neha",
                "city": "Delhi",
            },
        ]
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
