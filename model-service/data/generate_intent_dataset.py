"""
Generates a comprehensive multilingual text-intent dataset for Deep Learning Model 1 (TextCNN).
Represents Alpha One Mall (Nexus Ahmedabad One, Vastrapur, Ahmedabad).

Includes all 8 required intents:
  1. FIND_STORE
  2. FIND_PRODUCT
  3. NAVIGATION
  4. FACILITY_SEARCH
  5. PRODUCT_COMPARISON
  6. PRODUCT_REFINEMENT
  7. MALL_INFORMATION
  8. UNKNOWN

Multilingual Coverage:
  - English (high-street & conversational)
  - Gujarati (native Gujarati script & Romanized Gujarati)
  - Hindi (Devanagari script & Romanized Hindi)
  - Code-mixed retail phrasing (e.g. "Bata na formal shoes", "₹2000 se kam ke sneakers")
"""
import csv
import os
import random

SEED = 42
random.seed(SEED)

SHOPS = [
    "Zara", "H&M", "Shoppers Stop", "Lifestyle", "Starbucks", "Sephora",
    "Marks & Spencer", "Tommy Hilfiger", "Calvin Klein", "Levi's", "Skechers", "Forever 21",
    "Reliance Digital", "Croma", "Home Centre", "Hamleys", "Puma", "Under Armour",
    "Cinépolis", "McDonald's", "KFC", "Subway", "Pizza Hut", "Taco Bell",
    "Smart Bazaar", "Bata Footwear", "The Body Shop", "Miniso", "Lenskart", "Apollo Pharmacy"
]

CATEGORIES = [
    "Apparel", "Footwear", "Electronics", "Beauty & Cosmetics", "Dining & Food Court",
    "Multiplex & Entertainment", "Toys & Games", "Home Decor", "Opticals", "Pharmacy & Wellness",
    "Hypermarket & Groceries", "Sportswear"
]

PRODUCTS = [
    "running shoes", "sneakers", "formal shoes", "sandals", "t-shirts", "shirts", "jeans", "hoodies",
    "dresses", "blazers", "perfume", "lipstick", "laptops", "smartphones", "headphones", "television",
    "toys", "board games", "coffee", "burgers", "groceries", "sunglasses", "vitamins", "first aid kit"
]

FACILITIES_EN = ["washroom", "restroom", "ATM", "cash machine", "food court", "parking", "customer helpdesk", "glass elevator", "escalator"]
FACILITIES_GU = ["વોશરૂમ", "શૌચાલય", "એટીએમ", "ફૂડ કોર્ટ", "પાર્કિંગ", "હેલ્પડેસ્ક", "લિફ્ટ", "એલિવેટર", "સીડી"]
FACILITIES_HI = ["वॉशरूम", "शौचालय", "एटीएम", "फूड कोर्ट", "पार्किंग", "हेल्पडेस्क", "लिफ्ट", "एलीवेटर", "सीढ़ियां"]

FLOORS = ["Lower Ground", "Ground Floor", "Floor 1", "Floor 2", "Floor 3", "LG", "G", "1F", "2F", "3F"]
BUDGETS = ["500", "1000", "1500", "2000", "3000", "5000", "10000", "50000"]

TEMPLATES = {
    "FIND_STORE": [
        # English
        ("Where is {shop}?", "T_FS_EN_1"),
        ("Find {shop} store for me.", "T_FS_EN_2"),
        ("Which floor is {shop} on?", "T_FS_EN_3"),
        ("Do you have a {shop} in Nexus Ahmedabad One?", "T_FS_EN_4"),
        ("I want to visit {shop}.", "T_FS_EN_5"),
        ("Is {shop} open right now?", "T_FS_EN_6"),
        ("Looking for a {category} shop.", "T_FS_EN_7"),
        # Gujarati Native
        ("{shop} સ્ટોર ક્યાં આવેલો છે?", "T_FS_GU_1"),
        ("મને {shop} કયા માળે મળશે?", "T_FS_GU_2"),
        ("શું આ મોલમાં {shop} છે?", "T_FS_GU_3"),
        ("મારે {category} ની દુકાન શોધવી છે.", "T_FS_GU_4"),
        # Gujarati Romanized
        ("{shop} store kyaan aavelo chhe?", "T_FS_GUR_1"),
        ("Mane {shop} kaya floor par malse?", "T_FS_GUR_2"),
        ("Shu aa mall ma {shop} chhe?", "T_FS_GUR_3"),
        # Hindi Native
        ("{shop} स्टोर कहाँ पर है?", "T_FS_HI_1"),
        ("मुझे {shop} किस फ्लोर पर मिलेगा?", "T_FS_HI_2"),
        ("क्या इस मॉल में {shop} की दुकान है?", "T_FS_HI_3"),
        ("{category} की दुकान किधर है?", "T_FS_HI_4"),
        # Hindi Romanized
        ("{shop} store kahan par hai?", "T_FS_HIR_1"),
        ("Mujhe {shop} kis floor par milega?", "T_FS_HIR_2"),
        ("Kya is mall mein {shop} hai?", "T_FS_HIR_3"),
    ],

    "FIND_PRODUCT": [
        # English
        ("Where can I buy {product}?", "T_FP_EN_1"),
        ("Show me stores selling {product}.", "T_FP_EN_2"),
        ("I need to find {product}.", "T_FP_EN_3"),
        ("Do you have {product} available here?", "T_FP_EN_4"),
        ("Looking for good {product}.", "T_FP_EN_5"),
        # Gujarati Native
        ("મને {product} ક્યાંથી મળશે?", "T_FP_GU_1"),
        ("મારે સારા {product} ખરીદવા છે.", "T_FP_GU_2"),
        ("આ મોલમાં {product} કઈ દુકાને મળશે?", "T_FP_GU_3"),
        # Gujarati Romanized
        ("Mane {product} kyaanthi malse?", "T_FP_GUR_1"),
        ("Mare saara {product} kharidva chhe.", "T_FP_GUR_2"),
        ("Aa mall ma {product} kai dukane malse?", "T_FP_GUR_3"),
        # Hindi Native
        ("मुझे {product} कहाँ मिलेंगे?", "T_FP_HI_1"),
        ("मुझे अच्छे {product} खरीदने हैं।", "T_FP_HI_2"),
        ("{product} किस दुकान पर उपलब्ध है?", "T_FP_HI_3"),
        # Hindi Romanized
        ("Mujhe {product} kahan milenge?", "T_FP_HIR_1"),
        ("Mujhe acche {product} kharidne hain.", "T_FP_HIR_2"),
        ("{product} kis shop par milta hai?", "T_FP_HIR_3"),
    ],

    "NAVIGATION": [
        # English
        ("Take me to {shop}.", "T_NAV_EN_1"),
        ("Give me walking directions to {shop}.", "T_NAV_EN_2"),
        ("How do I get to {shop} from here?", "T_NAV_EN_3"),
        ("Guide me to {floor}.", "T_NAV_EN_4"),
        ("Start navigation to {shop}.", "T_NAV_EN_5"),
        # Gujarati Native
        ("મને {shop} સુધી લઈ જાઓ.", "T_NAV_GU_1"),
        ("{shop} પહોંચવાનો રસ્તો બતાવો.", "T_NAV_GU_2"),
        ("અહીંથી {shop} કેવી રીતે જવાય?", "T_NAV_GU_3"),
        # Gujarati Romanized
        ("Mane {shop} sudhi lai jao.", "T_NAV_GUR_1"),
        ("{shop} pahochvano rasto batavo.", "T_NAV_GUR_2"),
        ("Aahin thi {shop} kevi rite javay?", "T_NAV_GUR_3"),
        # Hindi Native
        ("मुझे {shop} तक ले चलिए।", "T_NAV_HI_1"),
        ("{shop} जाने का रास्ता दिखाइए।", "T_NAV_HI_2"),
        ("यहाँ से {shop} कैसे जाऊं?", "T_NAV_HI_3"),
        # Hindi Romanized
        ("Mujhe {shop} tak le chaliye.", "T_NAV_HIR_1"),
        ("{shop} jaane ka raasta dikhaiye.", "T_NAV_HIR_2"),
        ("Yahan se {shop} kaise jaun?", "T_NAV_HIR_3"),
    ],

    "FACILITY_SEARCH": [
        # English
        ("Where is the nearest {facility}?", "T_FAC_EN_1"),
        ("I need to find an {facility}.", "T_FAC_EN_2"),
        ("Which floor has a {facility}?", "T_FAC_EN_3"),
        ("Is there an accessible elevator nearby?", "T_FAC_EN_4"),
        # Gujarati Native
        ("નજીકમાં {facility_gu} ક્યાં છે?", "T_FAC_GU_1"),
        ("મને સૌથી નજીકનું {facility_gu} બતાવો.", "T_FAC_GU_2"),
        ("વ્હીલચેર માટે એલિવેટર ક્યાં છે?", "T_FAC_GU_3"),
        # Gujarati Romanized
        ("Najikma {facility} kyaan chhe?", "T_FAC_GUR_1"),
        ("Mane sauthi najiknu {facility} batavo.", "T_FAC_GUR_2"),
        # Hindi Native
        ("सबसे नज़दीकी {facility_hi} कहाँ है?", "T_FAC_HI_1"),
        ("मुझे {facility_hi} जाना है।", "T_FAC_HI_2"),
        ("व्हीलचेयर के लिए लिफ्ट किधर है?", "T_FAC_HI_3"),
        # Hindi Romanized
        ("Sabse nazdeeki {facility} kahan hai?", "T_FAC_HIR_1"),
        ("Mujhe {facility} jaana hai.", "T_FAC_HIR_2"),
    ],

    "PRODUCT_COMPARISON": [
        # English
        ("Compare {product} between {shop1} and {shop2}.", "T_PC_EN_1"),
        ("Which is cheaper: {shop1} or {shop2} for {product}?", "T_PC_EN_2"),
        ("What is the difference in price for {product} at {shop1} vs {shop2}?", "T_PC_EN_3"),
        # Gujarati Native
        ("{shop1} અને {shop2} ના {product} વચ્ચે શું તફાવત છે?", "T_PC_GU_1"),
        ("{product} માટે {shop1} સસ્તું છે કે {shop2}?", "T_PC_GU_2"),
        # Gujarati Romanized
        ("{shop1} ane {shop2} na {product} ma shu farak chhe?", "T_PC_GUR_1"),
        # Hindi Native
        ("{shop1} और {shop2} के {product} में क्या अंतर है?", "T_PC_HI_1"),
        ("{product} के लिए {shop1} सस्ता है या {shop2}?", "T_PC_HI_2"),
        # Hindi Romanized
        ("{shop1} aur {shop2} ke {product} mein kya difference hai?", "T_PC_HIR_1"),
    ],

    "PRODUCT_REFINEMENT": [
        # English
        ("Show me {product} under ₹{budget}.", "T_PR_EN_1"),
        ("Filter {product} below {budget} rupees.", "T_PR_EN_2"),
        ("Only show items under ₹{budget}.", "T_PR_EN_3"),
        ("Looking for affordable {product} within ₹{budget}.", "T_PR_EN_4"),
        # Gujarati Native
        ("મને ₹{budget}થી ઓછી કિંમતના {product} બતાવો.", "T_PR_GU_1"),
        ("₹{budget} ની અંદરના સારા {product} ફિલ્ટર કરો.", "T_PR_GU_2"),
        # Gujarati Romanized
        ("Mane ₹{budget} thi ochi kimatna {product} batavo.", "T_PR_GUR_1"),
        ("₹{budget} ni andar na {product} jova chhe.", "T_PR_GUR_2"),
        # Hindi Native
        ("मुझे ₹{budget} से कम के {product} दिखाइए।", "T_PR_HI_1"),
        ("₹{budget} के बजट में {product} फिल्टर कीजिए।", "T_PR_HI_2"),
        # Hindi Romanized
        ("Mujhe ₹{budget} se kam ke {product} dikhaiye.", "T_PR_HIR_1"),
        ("₹{budget} ke under ke {product} search karo.", "T_PR_HIR_2"),
    ],

    "MALL_INFORMATION": [
        # English
        ("What are the mall operating hours?", "T_MI_EN_1"),
        ("When does Alpha One Mall close today?", "T_MI_EN_2"),
        ("Is parking free at Nexus Ahmedabad One?", "T_MI_EN_3"),
        ("What is the mall address and contact number?", "T_MI_EN_4"),
        ("Where is the grand entrance located in Vastrapur?", "T_MI_EN_5"),
        # Gujarati Native
        ("આ મોલ કેટલા વાગ્યા સુધી ખુલ્લો રહે છે?", "T_MI_GU_1"),
        ("નેક્સસ અમદાવાદ વન નો સમય શું છે?", "T_MI_GU_2"),
        ("મોલ માં પાર્કિંગ ચાર્જ કેટલો છે?", "T_MI_GU_3"),
        # Gujarati Romanized
        ("Aa mall ketla vaagya sudhi khullo rahe chhe?", "T_MI_GUR_1"),
        ("Nexus Ahmedabad One no timing shu chhe?", "T_MI_GUR_2"),
        # Hindi Native
        ("मॉल खुलने और बंद होने का समय क्या है?", "T_MI_HI_1"),
        ("अल्फा वन मॉल कब बंद होता है?", "T_MI_HI_2"),
        ("क्या मॉल में फ्री वाईफाई या पार्किंग है?", "T_MI_HI_3"),
        # Hindi Romanized
        ("Mall open hone aur close hone ka time kya hai?", "T_MI_HIR_1"),
        ("Nexus Ahmedabad One ka timing kya hai?", "T_MI_HIR_2"),
    ],

    "UNKNOWN": [
        ("What is the weather outside in Ahmedabad?", "T_UNK_1"),
        ("Tell me a funny joke.", "T_UNK_2"),
        ("How to book flight tickets to Mumbai?", "T_UNK_3"),
        ("Who is the prime minister of India?", "T_UNK_4"),
        ("કંઈક રમુજી કહો.", "T_UNK_5"),
        ("અમદાવાદમાં આજનું હવામાન કેવું છે?", "T_UNK_6"),
        ("Mujhe cricket score batao.", "T_UNK_7"),
        ("आज की ताज़ा ख़बर क्या है?", "T_UNK_8"),
        ("asdfghjkl qwerty 12345", "T_UNK_9"),
        ("blablabla nothing here", "T_UNK_10"),
    ],
}

def generate_samples():
    rows = []
    
    for intent, template_list in TEMPLATES.items():
        for template, template_id in template_list:
            # Generate 15-20 diverse variations per template
            n_repeats = 16 if intent != "UNKNOWN" else 10
            for _ in range(n_repeats):
                shop = random.choice(SHOPS)
                shop1, shop2 = random.sample(SHOPS, 2)
                cat = random.choice(CATEGORIES)
                prod = random.choice(PRODUCTS)
                fac = random.choice(FACILITIES_EN)
                fac_gu = random.choice(FACILITIES_GU)
                fac_hi = random.choice(FACILITIES_HI)
                fl = random.choice(FLOORS)
                bud = random.choice(BUDGETS)

                filled = template.format(
                    shop=shop, shop1=shop1, shop2=shop2, category=cat, product=prod,
                    facility=fac, facility_gu=fac_gu, facility_hi=fac_hi, floor=fl, budget=bud
                )
                rows.append({"text": filled, "intent": intent, "template_id": template_id})

    random.shuffle(rows)
    return rows

def main():
    rows = generate_samples()
    out_dir = os.path.join(os.path.dirname(__file__))
    out_file = os.path.join(out_dir, "intent_dataset.csv")
    
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "intent", "template_id"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} multilingual intent training examples.")
    counts = {}
    for r in rows:
        counts[r["intent"]] = counts.get(r["intent"], 0) + 1
    for intent, count in sorted(counts.items()):
        print(f"  {intent}: {count}")

if __name__ == "__main__":
    main()
