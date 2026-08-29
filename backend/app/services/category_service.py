from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.user import User

DEFAULT_CATEGORIES_DATA = [
    # College
    {"name": "Tuition & Fees", "group": "College", "icon": "graduation-cap", "color": "#4F46E5"},
    {"name": "Books & Study Materials", "group": "College", "icon": "book-open", "color": "#6366F1"},
    {"name": "Stationery & Printing", "group": "College", "icon": "printer", "color": "#818CF8"},
    {"name": "Projects & Labs", "group": "College", "icon": "flask-conical", "color": "#4338CA"},
    
    # Food
    {"name": "Mess & Dining", "group": "Food", "icon": "utensils", "color": "#F59E0B"},
    {"name": "Canteen & Cafeteria", "group": "Food", "icon": "coffee", "color": "#D97706"},
    {"name": "Snacks & Tea", "group": "Food", "icon": "cookie", "color": "#B45309"},
    {"name": "Outside Food & Delivery", "group": "Food", "icon": "pizza", "color": "#EA580C"},
    {"name": "Groceries", "group": "Food", "icon": "shopping-cart", "color": "#10B981"},

    # Transport
    {"name": "Petrol / Fuel", "group": "Transport", "icon": "fuel", "color": "#06B6D4"},
    {"name": "Bus & Metro", "group": "Transport", "icon": "bus", "color": "#0284C7"},
    {"name": "Auto & Cab", "group": "Transport", "icon": "car", "color": "#0369A1"},
    {"name": "Train & Travel", "group": "Transport", "icon": "train", "color": "#075985"},

    # Lifestyle
    {"name": "Gym & Fitness", "group": "Lifestyle", "icon": "dumbbell", "color": "#EC4899"},
    {"name": "Shopping & Clothes", "group": "Lifestyle", "icon": "shopping-bag", "color": "#DB2777"},
    {"name": "Movies & Entertainment", "group": "Lifestyle", "icon": "film", "color": "#BE185D"},
    {"name": "Outings with Friends", "group": "Lifestyle", "icon": "users", "color": "#9D174D"},

    # Digital
    {"name": "Mobile Recharge", "group": "Digital", "icon": "smartphone", "color": "#8B5CF6"},
    {"name": "Internet / Wi-Fi", "group": "Digital", "icon": "wifi", "color": "#7C3AED"},
    {"name": "Streaming Subscriptions", "group": "Digital", "icon": "tv", "color": "#6D28D9"},
    {"name": "Software & AI Tools", "group": "Digital", "icon": "code", "color": "#5B21B6"},

    # Accommodation
    {"name": "Hostel Fee", "group": "Accommodation", "icon": "home", "color": "#14B8A6"},
    {"name": "PG / Room Rent", "group": "Accommodation", "icon": "building", "color": "#0D9488"},
    {"name": "Electricity & Water", "group": "Accommodation", "icon": "zap", "color": "#0F766E"},

    # Other
    {"name": "Medical & Pharmacy", "group": "Other", "icon": "heart-pulse", "color": "#EF4444"},
    {"name": "Emergency", "group": "Other", "icon": "shield-alert", "color": "#DC2626"},
    {"name": "Miscellaneous", "group": "Other", "icon": "help-circle", "color": "#64748B"},
]

# Living Situation Personalization Presets
LIVING_SITUATION_PRESETS: Dict[str, List[str]] = {
    "Home": [
        "Petrol / Fuel", "Bus & Metro", "Outside Food & Delivery",
        "Books & Study Materials", "Tuition & Fees", "Mobile Recharge",
        "Movies & Entertainment", "Shopping & Clothes", "Medical & Pharmacy", "Miscellaneous"
    ],
    "Hostel": [
        "Mess & Dining", "Canteen & Cafeteria", "Snacks & Tea", "Outside Food & Delivery",
        "Hostel Fee", "Internet / Wi-Fi", "Mobile Recharge", "Books & Study Materials",
        "Stationery & Printing", "Outings with Friends", "Medical & Pharmacy", "Miscellaneous"
    ],
    "PG": [
        "PG / Room Rent", "Electricity & Water", "Groceries", "Outside Food & Delivery",
        "Internet / Wi-Fi", "Mobile Recharge", "Bus & Metro", "Books & Study Materials",
        "Stationery & Printing", "Outings with Friends", "Medical & Pharmacy", "Miscellaneous"
    ]
}


def seed_user_categories(db: Session, user: User) -> List[Category]:
    """Seed personalized categories for a newly registered student."""
    categories_to_create = []
    
    # Priority list based on living situation
    preset_names = set(LIVING_SITUATION_PRESETS.get(user.living_situation, []))

    for item in DEFAULT_CATEGORIES_DATA:
        category = Category(
            user_id=user.id,
            name=item["name"],
            group=item["group"],
            icon=item["icon"],
            color=item["color"],
            is_default=True
        )
        categories_to_create.append(category)

    db.add_all(categories_to_create)
    db.commit()
    
    for cat in categories_to_create:
        db.refresh(cat)
        
    return categories_to_create


def get_user_categories(db: Session, user_id: int) -> List[Category]:
    """Retrieve all categories accessible to user (their own custom and seeded ones)."""
    return db.query(Category).filter(
        (Category.user_id == user_id) | (Category.user_id == None)
    ).order_by(Category.group, Category.name).all()
