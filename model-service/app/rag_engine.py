"""
MallMind RAG (Retrieval-Augmented Generation) & LLM Orchestration Engine
Target: Alpha One Mall (Nexus Ahmedabad One, Vastrapur, Ahmedabad, Gujarat)

Architecture:
1. Canonical Ingestion: 30 verified stores, 11 facilities, 276 authentic products, and official mall FAQs.
2. Hybrid Indic Tokenization: Unicode regex preserving combining matras + character/word n-grams.
3. Neural Intent Guidance: TextCNN classifies 8 intents with class probabilities and confidence.
4. Structured Tool Calling: Orchestrates store search, product filtering (with budget constraints),
   facility lookup, grounded navigation routing, and mall FAQ retrieval.
5. Trilingual Grounding: Natural, layman-friendly conversational output in Gujarati, Hindi, or English.
"""
from __future__ import annotations

import os
import re
from typing import Any, Optional
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from .intent_classifier import IntentPredictor
except ImportError:
    from intent_classifier import IntentPredictor

APP_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(APP_DIR, "..", "data")
MODELS_DIR = os.path.join(APP_DIR, "..", "models")

# 30 Verified Stores of Nexus Ahmedabad One (Alpha One Mall) across 5 floors
ALPHA_ONE_SHOPS = [
    # Lower Ground (Floor -1)
    {
        "id": 1, "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 6,
        "name": "Smart Bazaar (Hypermarket)", "category": "Hypermarket & Groceries",
        "description": "Large-format hypermarket for fresh vegetables, fruits, groceries, dairy, and household essentials.",
        "brands": ["SmartChoice", "FreshHarvest", "DailyGold"],
        "keywords": "groceries supermarket hypermarket rashan sabji kariyana anaj dal oil atta provisions dukan bazaar શાકભાજી કરિયાણું બજાર સ્માર્ટ બજાર राशन सब्जी किराना दाल तेल आटा किराना दुकान बाज़ार सुपरमार्केट स्मार्ट बाज़ार",
        "directions": "Take Central Escalator down to Lower Ground, located along the North corridor."
    },
    {
        "id": 2, "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 7,
        "name": "The Body Shop", "category": "Beauty & Cosmetics",
        "description": "Cruelty-free botanical skincare, luxury body butters, shampoos, and natural fragrances.",
        "brands": ["The Body Shop", "British Rose", "Tea Tree"],
        "keywords": "skincare body wash perfume lotion beauty soap natural organic ધ બોડી શોપ સૌંદર્ય સાબુ પરફ્યુમ स्किनकेयर साबुन परफ्यूम सौंदर्य लोशन",
        "directions": "Lower Ground floor near the central escalator opposite Bata."
    },
    {
        "id": 3, "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 8,
        "name": "Miniso", "category": "Bags & Accessories",
        "description": "Japanese designer lifestyle retailer offering plush toys, travel pillows, organizers, and stationery.",
        "brands": ["Miniso", "Sanrio", "Marvel x Miniso"],
        "keywords": "lifestyle plushie cute stationery organizers travel bag bottles umbrella મીનીસો જાપાનીઝ રમકડાં બેગ मिनीसो खिलौने बैग स्टेशनरी छाता",
        "directions": "Lower Ground floor north corridor next to The Body Shop."
    },
    {
        "id": 4, "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 9,
        "name": "Bata Footwear", "category": "Footwear",
        "description": "Family footwear store with genuine leather formal shoes, casual sandals, sneakers, and school shoes.",
        "brands": ["Bata", "Hush Puppies", "Power"],
        "keywords": "shoes footwear sandals formal chappal jootey leather boots school shoes બાટા બૂટ ચંપલ પગરખાં બાટા શૂઝ સ્ટોર बाटा जूते जूता चप्पल सैंडल स्नीकर्स लेदर बूट्स बाटा फुटवियर",
        "directions": "Lower Ground floor south aisle directly opposite Staircase A."
    },
    {
        "id": 5, "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 10,
        "name": "Lenskart Opticals", "category": "Opticals",
        "description": "Precision eyewear studio with free 3D eye tests, blue-light computer glasses, and sunglasses.",
        "brands": ["John Jacobs", "Vincent Chase", "Air Flex"],
        "keywords": "specs glasses sunglasses frames lenses eyewear chashma eye test લેન્સકાર્ટ ચશ્મા સનગ્લાસ लेंसकार्ट चश्मा धूप का चश्मा लेंस लेंसकार्ट आई टेस्ट",
        "directions": "Lower Ground floor south side across from Miniso."
    },
    {
        "id": 6, "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 11,
        "name": "Apollo Pharmacy", "category": "Pharmacy & Wellness",
        "description": "24/7 chemist providing prescription medicines, first aid kits, multivitamins, and health monitors.",
        "brands": ["Apollo Life", "Himalaya", "Revital"],
        "keywords": "pharmacy medical chemist medicine health first aid vitamins sanitizer dawa bandage એપોલો દવા મેડિકલ ફાર્મસી अपोलो दवाई दवाईयां दवा मेडिकल फार्मेसी केमिस्ट अपोलो",
        "directions": "Lower Ground floor east aisle near the washroom."
    },

    # Ground Floor (Floor 0)
    {
        "id": 7, "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 26,
        "name": "Zara", "category": "Apparel",
        "description": "Flagship European high-street fashion house featuring premium men and women suits, blazers, and dresses.",
        "brands": ["Zara Man", "Zara Woman", "Zara TRF"],
        "keywords": "zara fashion clothes dresses blazers luxury suits jacket kapde western ઝારા કપડાં ફેશન ઝારા ज़ारा कपड़े कपड़े फैशन सूट जैकेट वेस्टर्न ड्रेसेस",
        "directions": "Ground Floor North wing, walk straight 30 meters from the Main Vastrapur Entrance."
    },
    {
        "id": 8, "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 27,
        "name": "H&M", "category": "Apparel",
        "description": "Swedish international fashion brand with trendy streetwear, conscious denim, hoodies, and basic tees.",
        "brands": ["H&M Divided", "H&M Conscious", "H&M Studio"],
        "keywords": "h&m hm clothes fashion streetwear hoodie t-shirt denim jeans kapde એચએન્ડએમ કપડાં ટીશર્ટ જીન્સ एचएंडएम कपड़े टीशर्ट जींस हुडी फैशन",
        "directions": "Ground Floor North corridor, directly across from the Central Escalator."
    },
    {
        "id": 9, "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 28,
        "name": "Shoppers Stop", "category": "Apparel",
        "description": "Multi-brand luxury department store featuring designer fragrances, premium apparel, and accessories.",
        "brands": ["Stop", "Life", "Fratini"],
        "keywords": "department store shopping perfumes cosmetics watches shirts dresses kapde શોપર્સ સ્ટોપ શર્ટ શોપિંગ शॉपर्स स्टॉप कपड़े परफ्यूम",
        "directions": "Ground Floor North East wing near the glass elevator."
    },
    {
        "id": 10, "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 29,
        "name": "Lifestyle Store", "category": "Apparel",
        "description": "Trendy departmental store offering contemporary youth apparel, shoes, bags, and beauty collections.",
        "brands": ["Ginger", "Code", "Fame Forever"],
        "keywords": "lifestyle fashion apparel clothes footwear handbag makeup style લાઇફસ્ટાઇલ કપડાં ફેશન લાઈફસ્ટાઈલ लाइफस्टाइल कपड़े फैशन",
        "directions": "Ground Floor South aisle, opposite Zara."
    },
    {
        "id": 11, "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 30,
        "name": "Starbucks Coffee", "category": "Dining & Food Court",
        "description": "World-renowned coffeehouse offering handcrafted espresso, cold brews, matcha lattes, and artisan cheesecakes.",
        "brands": ["Starbucks Reserve", "Teavana", "Starbucks Bakery"],
        "keywords": "coffee cafe starbucks cold brew tea snacks frappe pastry cheesecake સ્ટારબક્સ કાફે કોફી નાસ્તો स्टारबक्स कॉफी कैफे कोल्ड ब्रू चाय",
        "directions": "Ground Floor Central Atrium South side, right next to the central escalators."
    },
    {
        "id": 12, "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 31,
        "name": "Sephora Beauty", "category": "Beauty & Cosmetics",
        "description": "Prestigious international beauty hub with designer perfumes, lipsticks, and dermatologist skincare.",
        "brands": ["Sephora Collection", "Fenty Beauty", "Huda Beauty"],
        "keywords": "beauty makeup cosmetics perfume lipstick fragrance skincare luxury સેફોરા મેકઅપ પરફ્યુમ સેફોરા ब्यूटी सेफोरा मेकअप परफ्यूम लिपस्टिक सौंदर्य प्रसाधन",
        "directions": "Ground Floor South aisle next to the Information Desk."
    },

    # First Floor (Floor 1)
    {
        "id": 13, "floor": 1, "floor_name": "First Floor (1F)", "node_id": 46,
        "name": "Reliance Digital", "category": "Electronics",
        "description": "Ahmedabad premier consumer electronics mega-store: 5G iPhones, MacBooks, 4K TVs, and audio systems.",
        "brands": ["Apple", "Samsung", "Sony", "HP"],
        "keywords": "electronics laptops mobiles smartphones macbook iphone tv headphones soundbar રિલાયન્સ ડિજિટલ ઇલેક્ટ્રોનિક્સ લેપટોપ મોબાઇલ रिलायंस डिजिटल इलेक्ट्रॉनिक्स लैपटॉप स्मार्टफोन टीवी",
        "directions": "Take Central Escalator up to First Floor, located along the West Balcony."
    },
    {
        "id": 14, "floor": 1, "floor_name": "First Floor (1F)", "node_id": 47,
        "name": "Westside", "category": "Apparel",
        "description": "Tata premium retail brand with chic contemporary ethnic and western wear for the whole family.",
        "brands": ["Nuon", "Wardrobe", "Soleplay"],
        "keywords": "westside clothes fashion ethnic formal workwear dresses shirts વેસ્ટસાઇડ કપડાં ફેશન વેસ્ટસાઈડ वेस्टसाइड कपड़े फॉर्मल ड्रेस",
        "directions": "First Floor North corridor opposite Staircase A."
    },
    {
        "id": 15, "floor": 1, "floor_name": "First Floor (1F)", "node_id": 48,
        "name": "Pantaloons", "category": "Apparel",
        "description": "Vibrant ready-to-wear fashion destination for ethnic festival wear, casual denim, and kids apparel.",
        "brands": ["Rangmanch", "Akkriti", "Ajile"],
        "keywords": "pantaloons clothes festive kurta dress jeans kids wear પંતલૂન્સ કપડાં કુરતા પેન્ટાલૂન્સ पतलून पैंटालून्स कपड़े कुर्ता जीन्स",
        "directions": "First Floor North corridor near the Glass Elevator."
    },
    {
        "id": 16, "floor": 1, "floor_name": "First Floor (1F)", "node_id": 49,
        "name": "Nike Store", "category": "Sportswear",
        "description": "Official Nike store with Air Max sneakers, Pegasus running shoes, Jordan hoodies, and dri-fit gym gear.",
        "brands": ["Nike Pro", "Air Jordan", "Dri-FIT"],
        "keywords": "nike shoes sneakers running sports gym trainers sportswear નાઇકી શૂઝ બૂટ સ્પોર્ટ્સ નાઈકી नाइकी जूते स्नीकर्स स्पोर्ट्स रनिंग",
        "directions": "First Floor South balcony opposite Reliance Digital."
    },
    {
        "id": 17, "floor": 1, "floor_name": "First Floor (1F)", "node_id": 50,
        "name": "Skechers Footwear", "category": "Footwear",
        "description": "Ergonomic walking shoes, memory foam runners, slip-ins, and performance athletic footwear.",
        "brands": ["Skechers D-Lites", "GO WALK", "Arch Fit"],
        "keywords": "skechers walking shoes comfort slip-ins memory foam sneakers સ્કેચર્સ શૂઝ પગરખાં સ્કેચર્સ વૉકિંગ સ્નીકર્સ स्केचर्स जूते स्नीकर्स रनिंग फुटवियर",
        "directions": "First Floor South aisle directly across from the Central Escalator."
    },
    {
        "id": 18, "floor": 1, "floor_name": "First Floor (1F)", "node_id": 51,
        "name": "Puma Athletic", "category": "Sportswear",
        "description": "German athletic brand known for Nitro running shoes, Ferrari motorsport gear, and gym tracksuits.",
        "brands": ["Puma Nitro", "Scuderia Ferrari", "Puma Training"],
        "keywords": "puma shoes sneakers track pants motorsport gym athletic sports પુમા શૂઝ સ્પોર્ટ્સ પ્યુમા प्यूमा जूते स्नीकर्स ट्रैक पैंट",
        "directions": "First Floor South aisle near the first aid facility."
    },

    # Second Floor (Floor 2)
    {
        "id": 19, "floor": 2, "floor_name": "Second Floor (2F)", "node_id": 66,
        "name": "Hamleys Toys", "category": "Toys & Games",
        "description": "The finest toy shop in the world: Lego construction sets, Barbie dolls, Nerf blasters, and soft teddy bears.",
        "brands": ["Lego", "Barbie", "Nerf", "Hot Wheels"],
        "keywords": "toys hamleys lego barbie rc car games kids children dolls હેમલીઝ રમકડાં હેમલીઝ લેગો હેમલીસ हैमलीज़ खिलौने बार्बी लेगो खेल",
        "directions": "Take Central Escalator up to Second Floor, located on the West side."
    },
    {
        "id": 20, "floor": 2, "floor_name": "Second Floor (2F)", "node_id": 67,
        "name": "Home Centre", "category": "Home Decor",
        "description": "Inspiring home living store with modern sofas, dining sets, luxury bedding, wall clocks, and kitchenware.",
        "brands": ["Home Centre Elite", "Portico", "Stellar"],
        "keywords": "home decor furniture lamp cushions vase curtains bedsheet homeware હોમ સેન્ટર ઘર સજાવટ ફર્નિચર હોમસેન્ટર होम सेंटर घर की सजावट फर्नीचर",
        "directions": "Second Floor North corridor directly opposite the escalator."
    },
    {
        "id": 21, "floor": 2, "floor_name": "Second Floor (2F)", "node_id": 68,
        "name": "Fabindia Ethnic", "category": "Ethnic Wear",
        "description": "Handcrafted Indian artisan kurtas, dupattas, pure linen shirts, brass home decor, and organic teas.",
        "brands": ["Fabindia Organics", "Fabindia Cotton", "Rajwada"],
        "keywords": "fabindia kurta ethnic traditional organic cotton dupatta ફેબઇન્ડિયા કુર્તા ખાદી ફેબઇન્ડિયા फैबइंडिया कुर्ता पारंपरिक खादी दुपट्टा",
        "directions": "Second Floor North aisle next to Home Centre."
    },
    {
        "id": 22, "floor": 2, "floor_name": "Second Floor (2F)", "node_id": 69,
        "name": "Manyavar Mohey", "category": "Ethnic Wear",
        "description": "Grand wedding celebration store offering royal sherwanis, bridal lehengas, kurtas, and jodhpuri suits.",
        "brands": ["Manyavar Royale", "Mohey Bridal", "Kurta Sets"],
        "keywords": "manyavar sherwani wedding lehenga festive royal kurta lagan shadi માન્યવર શેરવાની લગ્ન માન્યવર મોહે मान्यवर शेरवानी शादी विवाह लहंगा कुर्ता",
        "directions": "Second Floor South corridor opposite Hamleys."
    },
    {
        "id": 23, "floor": 2, "floor_name": "Second Floor (2F)", "node_id": 70,
        "name": "Croma Electronics", "category": "Electronics",
        "description": "Tata electronics store specializing in premium audio soundbars, Apple iPads, Dell laptops, and cameras.",
        "brands": ["Croma Basics", "Apple", "Bose", "Dell"],
        "keywords": "croma electronics laptops headphones soundbar gadgets cameras ક્રોમા લેપટોપ ઇલેક્ટ્રોનિક્સ ગેજેટ્સ क्रोमा इलेक्ट्रॉनिक्स लैपटॉप हेडफोन कैमरा",
        "directions": "Second Floor South aisle across from Home Centre."
    },
    {
        "id": 24, "floor": 2, "floor_name": "Second Floor (2F)", "node_id": 71,
        "name": "Crossword Bookstores", "category": "Books & Stationery",
        "description": "Comprehensive literary haven with Indian and Gujarati bestsellers, novels, journals, and educational board games.",
        "brands": ["Penguin", "HarperCollins", "Rupa", "Navneet"],
        "keywords": "books novel literature reading stationery bookstore diary gujarati pustak ક્રોસવર્ડ પુસ્તક ચોપડી ક્રોસવર્ડ સ્ટેશનરી क्रॉसवर्ड किताबें पुस्तकें उपन्यास स्टेशनरी",
        "directions": "Second Floor South East corridor near the ICICI ATM."
    },

    # Third Floor (Floor 3 - Entertainment & Food Court)
    {
        "id": 25, "floor": 3, "floor_name": "Third Floor (3F - Food & Cinema)", "node_id": 86,
        "name": "Cinepolis 9-Screen Multiplex", "category": "Entertainment & Cinema",
        "description": "Ultra-luxury 9-screen multiplex theatre featuring IMAX, Dolby Atmos sound, VIP recliner seating, and live concession stands.",
        "brands": ["Cinepolis VIP", "IMAX Recliner", "Club Seating"],
        "keywords": "cinema movie theatre cinepolis film tickets imax pop corn picture સિનેમા ફિલ્મ મૂવી સિનેપોલિસ થિયેટર સિનેપોલીસ सिनेमा फिल्म मूवी थिएटर टिकट पिक्चर सिनेपोलिस",
        "directions": "Take Central Escalator up to the Third Floor; cinema lobby is right on the West wing."
    },
    {
        "id": 26, "floor": 3, "floor_name": "Third Floor (3F - Food & Cinema)", "node_id": 87,
        "name": "McDonalds & McCafe", "category": "Dining & Food Court",
        "description": "World-famous fast food counter serving McAloo Tikki, Maharaja Mac, crispy fries, nuggets, and McCafe coffees.",
        "brands": ["McAloo Tikki", "Big Spicy Paneer", "McFlurry"],
        "keywords": "mcdonalds burger fries shake mcflurry fast food snacks મેકડોનાલ્ડ્સ બર્ગર ફ્રેન્ચ ફ્રાઈસ મેકડોનાલ્ડ મૈकडॉनल्ड्स बर्गर फ्राइज़ मैकडॉनल्ड्स",
        "directions": "Third Floor Central Food Court, first outlet on the North side."
    },
    {
        "id": 27, "floor": 3, "floor_name": "Third Floor (3F - Food & Cinema)", "node_id": 88,
        "name": "KFC Express", "category": "Dining & Food Court",
        "description": "Crispy secret-recipe fried chicken, zinger burgers, chicken strips, popcorn buckets, and rice bowls.",
        "brands": ["Hot & Crispy", "Zinger Box", "Popcorn Chicken"],
        "keywords": "kfc chicken zinger burger fried chicken wings fast food કેએફસી ચિકન બર્ગર કેએફસી केएफसी चिकन बर्गर फ्राइड चिकन",
        "directions": "Third Floor Food Court next to McDonald's."
    },
    {
        "id": 28, "floor": 3, "floor_name": "Third Floor (3F - Food & Cinema)", "node_id": 89,
        "name": "Subway Sandwiches", "category": "Dining & Food Court",
        "description": "Freshly baked subs made to order with crisp garden veggies, paneer tikka, multigrain breads, and cookies.",
        "brands": ["Sub of the Day", "Paneer Tikka Sub", "Cookie Combo"],
        "keywords": "subway sub sandwich salad healthy cookies wrap સબવે સેન્ડવીચ સલાડ સબવે सबवे सैंडविच सलाद सबवे",
        "directions": "Third Floor Food Court South side opposite Cinepolis concourse."
    },
    {
        "id": 29, "floor": 3, "floor_name": "Third Floor (3F - Food & Cinema)", "node_id": 90,
        "name": "Dosa Plaza & Gujarati Thali", "category": "Dining & Food Court",
        "description": "Authentic fusion dosas, pav bhaji, pure Gujarati thali meals, khaman, and traditional Kathiyawadi farsan.",
        "brands": ["Schezwan Dosa", "Gujarati Special Thali", "Khaman Farsan"],
        "keywords": "dosa south indian gujarati thali farsan dhokla khaman thali lunch dinner ઢોસા થાળી ફરસાણ ગુજરાતી ભોજન દોસા ઢોસા પ્લાઝા डोसा गुजराती थाली ढोकला फरसाण भोजन डोसा प्लाजा",
        "directions": "Third Floor Food Court South aisle near the central dining hall."
    },
    {
        "id": 30, "floor": 3, "floor_name": "Third Floor (3F - Food & Cinema)", "node_id": 91,
        "name": "Timezone Gaming Arcade", "category": "Entertainment & Cinema",
        "description": "High-octane family entertainment centre with bowling lanes, VR rollercoaster simulators, bumper cars, and prize games.",
        "brands": ["Timezone Gold Card", "VR Rollercoaster", "Bowling Pass"],
        "keywords": "games arcade timezone bowling vr racing bumper car kids entertainment ટાઈમઝોન ગેમ્સ આર્કેડ બોલિંગ ટાઈમઝોન टाइमज़ोन गेमिंग आर्केड बॉलिंग गेम्स",
        "directions": "Third Floor East wing past the food court dining atrium."
    }
]

ALPHA_ONE_FACILITIES = [
    {
        "id": "fac_lg_washroom", "name": "Washroom (Lower Ground)", "type": "WASHROOM",
        "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 12,
        "keywords": "washroom restroom toilet bathroom loo lavatory mutralaya shauchalaya વોશરૂમ શૌચાલય ટોઇલેટ શૌચાલય शौचालय बाथरूम प्रसाधन टॉयलेट वॉशरूम",
        "directions": "Located on Lower Ground East corridor, past Apollo Pharmacy."
    },
    {
        "id": "fac_lg_atm", "name": "State Bank ATM (Lower Ground)", "type": "ATM",
        "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 13,
        "keywords": "atm cash money bank withdraw currency paisa sbi એટીએમ રોકડ પૈસા સ્ટેટ બેંક एटीएम पैसे बैंक नकद एसबीआई",
        "directions": "Located on Lower Ground East corridor, near Smart Bazaar entrance."
    },
    {
        "id": "fac_lg_parking", "name": "Valet & Basement Parking Access", "type": "PARKING_ACCESS",
        "floor": -1, "floor_name": "Lower Ground (LG)", "node_id": 14,
        "keywords": "parking car parking basement valet vehicle garage gadi ગાડી પાર્કિંગ વાલેટ બેસમેન્ટ पार्किंग कार गाड़ी बेसमेंट वैले",
        "directions": "Lower Ground floor West entrance with direct lift to basement parking."
    },
    {
        "id": "fac_g_washroom", "name": "Washroom (Ground Floor East)", "type": "WASHROOM",
        "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 32,
        "keywords": "washroom restroom toilet bathroom loo ground floor વોશરૂમ શૌચાલય ગ્રાઉન્ડ શૌચાલય शौचालय बाथरूम प्रसाधन टॉयलेट वॉशरूम",
        "directions": "Located on Ground Floor East wing, past Shoppers Stop."
    },
    {
        "id": "fac_g_atm", "name": "HDFC Bank ATM (Ground Floor)", "type": "ATM",
        "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 33,
        "keywords": "atm cash money bank withdraw hdfc paisa એટીએમ રોકડ એચડીએફસી एटीएम पैसे बैंक नकद एचडीएफसी",
        "directions": "Located on Ground Floor East aisle near the Central Atrium."
    },
    {
        "id": "fac_g_help", "name": "Nexus Guest Services & Helpdesk", "type": "CUSTOMER_SERVICE",
        "floor": 0, "floor_name": "Ground Floor (G)", "node_id": 34,
        "keywords": "information desk help customer service lost found wheelchair stroller પૂછપરછ સહાય સહાયતા કેન્દ્ર પૂછપરછ કેન્દ્ર पूछताछ सहायता केंद्र व्हीलचेयर",
        "directions": "Right at the Main Grand Entrance (Vastrapur Gate)."
    },
    {
        "id": "fac_f1_washroom", "name": "Washroom (First Floor)", "type": "WASHROOM",
        "floor": 1, "floor_name": "First Floor (1F)", "node_id": 52,
        "keywords": "washroom restroom toilet bathroom first floor વોશરૂમ શૌચાલય પહેલો માળ वॉशरूम शौचालय पहला फ्लोर",
        "directions": "Located on First Floor East end, past Puma Athletic."
    },
    {
        "id": "fac_f2_washroom", "name": "Washroom (Second Floor)", "type": "WASHROOM",
        "floor": 2, "floor_name": "Second Floor (2F)", "node_id": 72,
        "keywords": "washroom restroom toilet bathroom second floor વોશરૂમ શૌચાલય બીજો માળ वॉशरूम शौचालय दूसरा फ्लोर",
        "directions": "Located on Second Floor East end near Crossword Bookstores."
    },
    {
        "id": "fac_f2_atm", "name": "ICICI Bank ATM (Second Floor)", "type": "ATM",
        "floor": 2, "floor_name": "Second Floor (2F)", "node_id": 73,
        "keywords": "atm cash money bank withdraw icici paisa એટીએમ રોકડ આઈસીઆઈસીઆઈ एटीएम पैसे बैंक नकद आईसीआईसीआई",
        "directions": "Second Floor East aisle, next to Crossword."
    },
    {
        "id": "fac_f3_washroom", "name": "Washroom (Third Floor)", "type": "WASHROOM",
        "floor": 3, "floor_name": "Third Floor (3F - Food & Cinema)", "node_id": 92,
        "keywords": "washroom restroom toilet bathroom third floor વોશરૂમ શૌચાલય ત્રીજો માળ वॉशरूम शौचालय तीसरा फ्लोर",
        "directions": "Third Floor Food Court East end, near Timezone Arcade."
    },
    {
        "id": "fac_f3_foodcourt", "name": "Nexus Central Food Court Seating", "type": "FOOD_COURT",
        "floor": 3, "floor_name": "Third Floor (3F - Food & Cinema)", "node_id": 93,
        "keywords": "food court dining restaurant cafe coffee eat burger pizza thali lunch dinner khana peena જમવાનું ફૂડ કોર્ટ ભોજન ફૂડકોર્ટ फूड कोर्ट डाइनिंग खाना पीना भोजनालय",
        "directions": "Third Floor Central Atrium: take Central Escalator directly to 3rd Floor."
    }
]

ALPHA_ONE_FAQS = [
    {
        "topic": "operating_hours",
        "title": "Mall Operating Hours",
        "keywords": "timings hours open close opening closing time time table સમય ક્યારે ખુલે છે બંધ થવાનો સમય સમયપત્રક समय खुलने का समय बंद होने का समय",
        "en": "Nexus Ahmedabad One (Alpha One Mall) is open from 10:00 AM to 10:00 PM every day of the week, including public holidays. Cinépolis multiplex remains open until midnight for late-night shows.",
        "gu": "નેક્સસ અમદાવાદ વન (આલ્ફા વન મોલ) દરરોજ સવારે 10:00 થી રાત્રે 10:00 વાગ્યા સુધી ખુલ્લો રહે છે. સિનેપોલિસ મલ્ટિપ્લેક્સ મોડી રાતના શો માટે મધ્યરાત્રિ સુધી ખુલ્લું રહે છે.",
        "hi": "नेक्सस अहमदाबाद वन (अल्फा वन मॉल) प्रतिदिन सुबह 10:00 बजे से रात 10:00 बजे तक खुला रहता है। सिनेपोलिस मल्टीप्लेक्स देर रात के शो के लिए आधी रात तक खुला रहता है।"
    },
    {
        "topic": "parking",
        "title": "Basement Parking & Charges",
        "keywords": "parking charges fee car parking bike two wheeler valet basement પાર્કિંગ ચાર્જ ભાડું ફી ગાડી પાર્કિંગ પાર્કિંગની જગ્યા पार्किंग शुल्क कार पार्किंग बाइक चार्ज",
        "en": "Nexus Ahmedabad One offers multi-level underground parking across Basements B1 and B2 with 1,200+ car capacity. Standard four-wheeler parking is ₹50 for the first 4 hours, and two-wheeler parking is ₹20. Valet parking is available at the Vastrapur Grand Gate.",
        "gu": "નેક્સસ અમદાવાદ વન બેઝમેન્ટ B1 અને B2 માં 1200 થી વધુ કાર માટે વિશાળ પાર્કિંગ આપે છે. ફોર-વ્હીલર પાર્કિંગ ચાર્જ પ્રથમ 4 કલાક માટે ₹50 અને ટુ-વ્હીલર માટે ₹20 છે. વસ્ત્રાપુર ગેટ પર વાલેટ પાર્કિંગ ઉપલબ્ધ છે.",
        "hi": "नेक्सस अहमदाबाद वन के बेसमेंट B1 और B2 में 1200 से अधिक कारों के लिए पार्किंग उपलब्ध है। चार पहिया वाहन का शुल्क पहले 4 घंटे के लिए ₹50 और दोपहिया का ₹20 है। मुख्य गेट पर वैले पार्किंग भी उपलब्ध है।"
    },
    {
        "topic": "wheelchair_accessibility",
        "title": "Wheelchair Accessibility & Glass Elevators",
        "keywords": "wheelchair accessibility handicap disabled elevator lift glass elevator ramp વ્હીલચેર દિવ્યાંગ લિફ્ટ એલિવેટર એક્સેસિબલ સહાય व्हीलचेयर लिफ्ट दिव्यांग पहुंच एलीवेटर",
        "en": "The mall is 100% wheelchair accessible with zero-step entry ramps at Vastrapur Grand Entrance and North Lake Gate. Complimentary wheelchairs can be borrowed at the Ground Floor Guest Services & Helpdesk (Node 34). Glass Elevators A and B connect all floors (LG, G, 1F, 2F, 3F).",
        "gu": "આખો મોલ સંપૂર્ણપણે વ્હીલચેર અનુકૂળ છે. ગ્રાઉન્ડ ફ્લોર ગેસ્ટ હેલ્પડેસ્ક (Node 34) પરથી મફત વ્હીલચેર મેળવી શકો છો. ગ્લાસ એલિવેટર A અને B દ્વારા તમામ પાંચ માળ પર પહોંચી શકાય છે.",
        "hi": "यह मॉल पूरी तरह से व्हीलचेयर अनुकूल है। ग्राउंड फ्लोर सहायता केंद्र (Node 34) पर मुफ्त व्हीलचेयर उपलब्ध है। ग्लास लिफ्ट A और B सभी 5 मंजिलों (LG, G, 1F, 2F, 3F) को जोड़ती हैं।"
    },
    {
        "topic": "location_address",
        "title": "Mall Address & Location",
        "keywords": "address location where is mall contact map vastrapur lake pin code સરનામું મોલનું સરનામું મોલ ક્યાં છે વસ્ત્રાપુર તળાવ ફોન નંબર પિનકોડ पता मॉल का पता मॉल कहाँ स्थित है वस्त्रापुर झील पिनकोड फोन नंबर",
        "en": "Nexus Ahmedabad One (Alpha One Mall) is situated at Plot No-216, TPU 1, Opposite Vastrapur Lake, Vastrapur, Ahmedabad, Gujarat 380015. Customer Helpdesk contact: +91-79-4019-1111.",
        "gu": "નેક્સસ અમદાવાદ વન (આલ્ફા વન મોલ) વસ્ત્રાપુર તળાવ સામે, વસ્ત્રાપુર, અમદાવાદ - 380015 પર આવેલો છે. હેલ્પડેસ્ક સંપર્ક: 079-4019-1111.",
        "hi": "नेक्सस अहमदाबाद वन वस्त्रापुर झील के सामने, वस्त्रापुर, अहमदाबाद, गुजरात - 380015 पर स्थित है। सहायता केंद्र संपर्क: +91-79-4019-1111."
    }
]

CANONICAL_BRANDS = {
    "nike": {
        "canonical_name": "Nike",
        "shop_name": "Nike Store",
        "shop_id": 16,
        "floor_name": "First Floor (1F)",
        "node_id": 49,
        "sub_brands": ["Nike Pro", "Air Jordan", "Dri-FIT"],
        "aliases": ["nike", "નાઇકી", "નાઈકી", "नाइकी", "nike pro", "air jordan", "dri-fit", "air max", "pegasus"]
    },
    "bata": {
        "canonical_name": "Bata",
        "shop_name": "Bata Footwear",
        "shop_id": 6,
        "floor_name": "Lower Ground (LG)",
        "node_id": 25,
        "sub_brands": ["Bata", "Power", "Hush Puppies"],
        "aliases": ["bata", "બાટા", "बाटा", "power", "hush puppies", "north star"]
    },
    "puma": {
        "canonical_name": "Puma",
        "shop_name": "Puma Athletic",
        "shop_id": 18,
        "floor_name": "First Floor (1F)",
        "node_id": 51,
        "sub_brands": ["Puma Nitro", "Scuderia Ferrari", "Puma Training"],
        "aliases": ["puma", "પુમા", "પ્યુમા", "प्यूमा", "puma nitro"]
    },
    "skechers": {
        "canonical_name": "Skechers",
        "shop_name": "Skechers Footwear",
        "shop_id": 17,
        "floor_name": "First Floor (1F)",
        "node_id": 50,
        "sub_brands": ["Skechers D-Lites", "GO WALK", "Arch Fit"],
        "aliases": ["skechers", "સ્કેચર્સ", "स्केचर्स", "go walk", "arch fit", "d-lites"]
    },
    "zara": {
        "canonical_name": "Zara",
        "shop_name": "Zara",
        "shop_id": 7,
        "floor_name": "Ground Floor (G)",
        "node_id": 26,
        "sub_brands": ["Zara Man", "Zara Woman", "Zara TRF"],
        "aliases": ["zara", "ઝારા", "ज़ारा"]
    },
    "h&m": {
        "canonical_name": "H&M",
        "shop_name": "H&M",
        "shop_id": 8,
        "floor_name": "Ground Floor (G)",
        "node_id": 27,
        "sub_brands": ["H&M Divided", "H&M Conscious", "H&M Studio"],
        "aliases": ["h&m", "hm", "એચએન્ડએમ", "एचएंडएम"]
    },
    "westside": {
        "canonical_name": "Westside",
        "shop_name": "Westside",
        "shop_id": 14,
        "floor_name": "First Floor (1F)",
        "node_id": 47,
        "sub_brands": ["Nuon", "Wardrobe", "Soleplay"],
        "aliases": ["westside", "વેસ્ટસાઇડ", "वेस्टसाइड", "nuon", "wardrobe", "soleplay"]
    },
    "pantaloons": {
        "canonical_name": "Pantaloons",
        "shop_name": "Pantaloons",
        "shop_id": 15,
        "floor_name": "First Floor (1F)",
        "node_id": 48,
        "sub_brands": ["Rangmanch", "Akkriti", "Ajile"],
        "aliases": ["pantaloons", "પંતલૂન્સ", "પેન્ટાલૂન્સ", "पतलून", "पैंटालून्स", "rangmanch", "akkriti", "ajile"]
    },
    "shoppers stop": {
        "canonical_name": "Shoppers Stop",
        "shop_name": "Shoppers Stop",
        "shop_id": 9,
        "floor_name": "Ground Floor (G)",
        "node_id": 28,
        "sub_brands": ["Stop", "Life", "Fratini"],
        "aliases": ["shoppers stop", "શોપર્સ સ્ટોપ", "शॉपर्स स्टॉप"]
    },
    "lifestyle": {
        "canonical_name": "Lifestyle",
        "shop_name": "Lifestyle Store",
        "shop_id": 10,
        "floor_name": "Ground Floor (G)",
        "node_id": 29,
        "sub_brands": ["Ginger", "Code", "Fame Forever"],
        "aliases": ["lifestyle", "લાઇફસ્ટાઇલ", "लाइफस्टाइल"]
    },
    "croma": {
        "canonical_name": "Croma",
        "shop_name": "Croma Electronics",
        "shop_id": 23,
        "floor_name": "Second Floor (2F)",
        "node_id": 70,
        "sub_brands": ["Croma Basics", "Apple", "Bose", "Dell"],
        "aliases": ["croma", "ક્રોમા", "क्रोमा"]
    },
    "reliance digital": {
        "canonical_name": "Reliance Digital",
        "shop_name": "Reliance Digital",
        "shop_id": 13,
        "floor_name": "First Floor (1F)",
        "node_id": 46,
        "sub_brands": ["Apple", "Samsung", "Sony", "HP"],
        "aliases": ["reliance digital", "રિલાયન્સ ડિજિટલ", "रिलायंस डिजिटल"]
    },
    "smart bazaar": {
        "canonical_name": "Smart Bazaar",
        "shop_name": "Smart Bazaar (Hypermarket)",
        "shop_id": 1,
        "floor_name": "Lower Ground (LG)",
        "node_id": 20,
        "sub_brands": ["SmartChoice", "FreshHarvest", "DailyGold"],
        "aliases": ["smart bazaar", "સ્માર્ટ બજાર", "स्मार्ट बाजार", "smartchoice"]
    }
}


class MallRAGEngine:
    """
    RAG Vector Store, TextCNN Neural Intent Integration & LLM Orchestrator.
    Grounded in Alpha One Mall (Nexus Ahmedabad One) data truth.
    """

    def __init__(self):
        self.documents: list[dict[str, Any]] = []
        self.corpus: list[str] = []
        self.products: list[dict[str, Any]] = []
        
        # Multilingual Indic Tokenizer preserving combining matras
        self.vectorizer = TfidfVectorizer(
            token_pattern=r"(?u)[^\s,.;:!?()\"'\[\]{}]+",
            ngram_range=(1, 2),
            sublinear_tf=True
        )
        self.tfidf_matrix = None
        self.intent_predictor: Optional[IntentPredictor] = None
        
        self._load_intent_model()
        self._load_catalog()
        self._build_index()

    def _load_intent_model(self):
        intent_model_path = os.path.join(MODELS_DIR, "intent_model.pt")
        if os.path.exists(intent_model_path):
            try:
                self.intent_predictor = IntentPredictor(intent_model_path)
            except Exception as e:
                print(f"[RAG] Warning: Could not load intent model from {intent_model_path}: {e}")
                self.intent_predictor = None

    def _load_catalog(self):
        catalog_path = os.path.join(DATA_DIR, "catalog.csv")
        if os.path.exists(catalog_path):
            try:
                df = pd.read_csv(catalog_path)
                self.products = df.to_dict(orient="records")
            except Exception as e:
                print(f"[RAG] Warning: Could not load catalog from {catalog_path}: {e}")
                self.products = []

    def _build_index(self):
        self.documents = []
        self.corpus = []

        # 1. Index all 30 Alpha One Mall shops
        for s in ALPHA_ONE_SHOPS:
            text = f"{s['name']} {s['category']} {s['description']} {' '.join(s['brands'])} {s['keywords']} {s['floor_name']}"
            doc = {
                "type": "shop",
                "id": s["id"],
                "name": s["name"],
                "category": s["category"],
                "floor": s["floor"],
                "floor_name": s["floor_name"],
                "node_id": s["node_id"],
                "directions": s["directions"],
                "brands": s["brands"],
                "text": text,
            }
            self.documents.append(doc)
            self.corpus.append(text)

        # 2. Index all 11 facilities
        for f in ALPHA_ONE_FACILITIES:
            text = f"{f['name']} {f['type']} {f['keywords']} {f['floor_name']}"
            doc = {
                "type": "facility",
                "id": f["id"],
                "name": f["name"],
                "category": f["type"],
                "floor": f["floor"],
                "floor_name": f["floor_name"],
                "node_id": f["node_id"],
                "directions": f["directions"],
                "brands": [],
                "text": text,
            }
            self.documents.append(doc)
            self.corpus.append(text)

        # 3. Index official mall FAQs
        for faq in ALPHA_ONE_FAQS:
            text = f"{faq['title']} {faq['topic']} {faq['keywords']} {faq['en']} {faq['gu']} {faq['hi']}"
            doc = {
                "type": "faq",
                "id": f"faq_{faq['topic']}",
                "name": faq["title"],
                "category": "Mall FAQ",
                "floor": 0,
                "floor_name": "All Floors",
                "node_id": 34,  # Default to Helpdesk
                "faq_data": faq,
                "text": text,
            }
            self.documents.append(doc)
            self.corpus.append(text)

        # 4. Index active products from catalog
        for p in self.products:
            p_text = f"{p['name']} {p.get('brand', '')} {p.get('category', '')} {p.get('shop_name', '')} {p.get('color', '')}"
            doc = {
                "type": "product",
                "id": p["product_id"],
                "name": p["name"],
                "category": p["category"],
                "floor": p["floor_number"],
                "floor_name": f"Floor {p['floor_number']}",
                "node_id": self._find_shop_node(p.get("shop_name")),
                "shop_name": p.get("shop_name"),
                "effective_price": float(p.get("effective_price", 0.0)),
                "price": float(p.get("price", 0.0)),
                "brand": str(p.get("brand", "")),
                "text": p_text,
            }
            self.documents.append(doc)
            self.corpus.append(p_text)

        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

    def _find_shop_node(self, shop_name: Optional[str]) -> int:
        if not shop_name:
            return 21
        s_clean = shop_name.lower().strip()
        for s in ALPHA_ONE_SHOPS:
            if s["name"].lower().strip() in s_clean or s_clean in s["name"].lower().strip():
                return s["node_id"]
        return 21

    def retrieve(self, query: str, top_k: int = 3, doc_type: Optional[Any] = None) -> list[tuple[dict[str, Any], float]]:
        """Vector similarity retrieval from RAG knowledge store with optional doc_type filtering."""
        cleaned = re.sub(r"[^\w\s\u0900-\u097F\u0A80-\u0AFF₹$]", " ", query.lower()).strip()
        if not cleaned:
            return []

        allowed_types = set([doc_type] if isinstance(doc_type, str) else doc_type) if doc_type else None

        try:
            query_vec = self.vectorizer.transform([cleaned])
            sims = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

            # Boost documents that match explicit entity names, store names, or key category words
            query_tokens = set(re.findall(r"\w+", cleaned))
            generic_stopwords = {"store", "shop", "mall", "outlet", "market", "centre", "center", "stoor", "stora"}
            boosted_sims = sims.copy()
            for idx, doc in enumerate(self.documents):
                doc_name = doc.get("name", "").lower()
                doc_type_val = doc.get("type", "")
                doc_cat = doc.get("category", "")

                # Exact name token match (e.g. "zara", "bata", "nike", "smart bazaar", "starbucks", "cinepolis")
                name_tokens = set(re.findall(r"\w+", doc_name)) - generic_stopwords
                if name_tokens and name_tokens.issubset(query_tokens):
                    boosted_sims[idx] += 0.5
                elif any(t in query_tokens for t in name_tokens if len(t) >= 4 and t not in generic_stopwords):
                    boosted_sims[idx] += 0.25

                # Exact brand list match
                for b in doc.get("brands", []):
                    b_tokens = set(re.findall(r"\w+", b.lower())) - generic_stopwords
                    if b_tokens and b_tokens.issubset(query_tokens):
                        boosted_sims[idx] += 0.35
                        break

                # Category keyword match for ambiguous queries like "shoe store", "coffee", "grocery"
                if any(k in query_tokens for k in ["shoe", "shoes", "footwear", "sneaker", "sneakers", "પગરખાં", "શૂઝ", "બૂટ", "जूते", "जूता", "स्नीकर्स"]):
                    if doc_cat == "Footwear":
                        boosted_sims[idx] += 0.65
                    elif "shoe" in doc.get("text", "").lower():
                        boosted_sims[idx] += 0.20
                if any(k in query_tokens for k in ["grocery", "groceries", "supermarket", "hypermarket", "કરિયાણું", "ગ્રોસરી", "किराना", "राशन"]):
                    if "smart bazaar" in doc_name or "hypermarket" in doc_cat.lower():
                        boosted_sims[idx] += 0.50
                if any(k in query_tokens for k in ["coffee", "cafe", "espresso", "કોફી", "કાફે", "कॉफी", "कैफे"]):
                    if "starbucks" in doc_name or "cafe" in doc_name:
                        boosted_sims[idx] += 0.50
                if any(k in query_tokens for k in ["clothes", "clothing", "apparel", "dress", "shirt", "કપડાં", "કપડા", "कपड़े"]):
                    if doc_cat == "Apparel":
                        boosted_sims[idx] += 0.40
                if any(k in query_tokens for k in ["movie", "cinema", "multiplex", "film", "સિનેમા", "ફિલ્મ", "सिनेमा", "फिल्म"]):
                    if "cinepolis" in doc_name or "cinema" in doc_name:
                        boosted_sims[idx] += 0.50

            ranked_indices = np.argsort(boosted_sims)[::-1]

            results = []
            for idx in ranked_indices:
                score = float(boosted_sims[idx])
                if score < 0.03:
                    break
                doc = self.documents[idx]
                if allowed_types and doc["type"] not in allowed_types:
                    continue
                results.append((doc, score))
                if len(results) >= top_k:
                    break
            return results
        except Exception:
            return []

    def detect_language(self, text: str, whisper_detected_lang: Optional[str] = None) -> tuple[str, str]:
        """Detects language and returns (Language Name, ISO Code: 'gu', 'hi', or 'en')."""
        # 1. Native Gujarati Unicode range: \u0A80-\u0AFF
        if re.search(r"[\u0A80-\u0AFF]", text):
            return ("Gujarati", "gu")

        # 2. Native Devanagari Unicode range for Hindi: \u0900-\u097F
        if re.search(r"[\u0900-\u097F]", text):
            return ("Hindi", "hi")

        # 3. Whisper language detection (if high confidence)
        if whisper_detected_lang:
            code = whisper_detected_lang.lower().strip()
            if code in ("gu", "gujarati"):
                return ("Gujarati", "gu")
            if code in ("hi", "hindi"):
                return ("Hindi", "hi")
            if code in ("en", "english"):
                return ("English", "en")

        # 4. Romanized Gujarati vocabulary heuristic
        gujarati_roman_words = {
            "mane", "kya", "kyaan", "kyaarthi", "malse", "malashe", "chhe", "che",
            "jovu", "kem", "kevi", "rite", "jamvanu", "pustak", "ramkda", "bajar",
            "ochi", "kimat", "kimatna", "batavo", "sudhi", "pahochvano", "aahin", "thi"
        }
        words = set(re.findall(r"\w+", text.lower()))
        if words.intersection(gujarati_roman_words):
            return ("Gujarati", "gu")

        # 5. Romanized Hindi vocabulary heuristic
        hindi_roman_words = {
            "kahan", "hai", "chahiye", "dikhaye", "dikhaiye", "paas", "kidhar", "jootey",
            "kapde", "paisa", "khana", "kitne", "kaise", "jaana", "chaliye", "nazdeeki",
            "milega", "milenge", "se", "kam", "ke", "liye", "batao"
        }
        if words.intersection(hindi_roman_words):
            return ("Hindi", "hi")

        return ("English", "en")

    def _extract_budget(self, text: str) -> Optional[float]:
        """Extracts monetary budget constraint (e.g. ₹2000, 1500 rs, under 2000)."""
        match = re.search(r"(?:₹|rs\.?|inr|રૂપિયા|रुपये)?\s*(\d{2,6})\s*(?:₹|rs\.?|inr|રૂપિયા|रुपये|rupees)?", text, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                if val >= 50:  # Sensible minimum price
                    return val
            except ValueError:
                pass
        return None

    def _extract_query_constraints(self, query: str) -> dict[str, Any]:
        """
        Extracts explicit hard constraints from user query:
        - brand: canonical brand dictionary or None
        - category: 'Footwear', 'Apparel', 'Electronics', 'Hypermarket & Groceries', etc.
        - budget: maximum monetary ceiling or None
        - is_running: whether query specifically seeks running shoes/gear
        """
        q_lower = query.lower()

        # 1. Budget extraction
        budget = None
        budget_match = re.search(
            r"(?:under|below|less\s+than|within|upto|up\s+to|max|maximum|₹|rs\.?|inr|રૂપિયા|रुपये)?\s*"
            r"(?:₹|rs\.?|inr|રૂપિયા|रुपये)?\s*(\d{2,6})\s*"
            r"(?:₹|rs\.?|inr|rupees|રૂપિયા|રુપયે|रुपये|thi\s*ochi|થી\s*ઓછી|થી\s*ઓછા|se\s*kam|સે\s*કમ|से\s*कम)?",
            q_lower
        )
        if budget_match:
            try:
                v = float(budget_match.group(1))
                if 50 <= v <= 500000:
                    budget = v
            except (ValueError, TypeError):
                budget = None

        # 2. Brand extraction across canonical mall brands and multilingual aliases
        detected_brand = None
        for brand_key, b_info in CANONICAL_BRANDS.items():
            for alias in b_info["aliases"]:
                pattern = rf"(?:\b|\s|^){re.escape(alias)}(?:\b|\s|$|ના|નાં|ની|નો|નું|કે|કી|का|के)"
                if re.search(pattern, q_lower) or alias in q_lower:
                    detected_brand = b_info
                    break
            if detected_brand:
                break

        # 3. Category extraction
        detected_category = None
        is_shoes = any(t in q_lower for t in ["shoe", "shoes", "running", "sneaker", "sneakers", "footwear", "sandals", "boots", "loafers", "પગરખાં", "શૂઝ", "બૂટ", "સ્નીકર્સ", "ચંપલ", "રનિંગ", "जूते", "जूता", "स्नीकर्स", "सैंडल", "रनिंग"])
        is_apparel = any(t in q_lower for t in ["cloth", "clothes", "clothing", "apparel", "dress", "shirt", "t-shirt", "hoodie", "jacket", "jeans", "pants", "track pants", "kurta", "sherwani", "lehenga", "suit", "કપડાં", "કપડા", "શર્ટ", "ટીશર્ટ", "કુર્તા", "શેરવાની", "જીન્સ", "कपड़े", "कपड़ा", "शर्ट", "टीशर्ट", "कुर्ता", "शेरवानी", "जींस"])
        is_electronics = any(t in q_lower for t in ["laptop", "macbook", "phone", "smartphone", "iphone", "tv", "television", "soundbar", "headphones", "earphones", "ipad", "tablet", "camera", "લેપટોપ", "મોબાઇલ", "ફોન", "હેડફોન", "लैपटॉप", "मोबाइल", "फोन", "हेडफोन"])
        is_grocery = any(t in q_lower for t in ["grocery", "groceries", "milk", "vegetables", "fruits", "flour", "rice", "oil", "snacks", "કરિયાણું", "ગ્રોસરી", "દૂધ", "શાકભાજી", "રાશન", "किराना", "दूध", "सब्जियां"])

        if is_shoes:
            detected_category = "Footwear"
        elif is_apparel:
            detected_category = "Apparel"
        elif is_electronics:
            detected_category = "Electronics"
        elif is_grocery:
            detected_category = "Hypermarket & Groceries"

        is_running = any(t in q_lower for t in ["running", "રનિંગ", "रनिंग", "runner", "runners"])

        return {
            "brand": detected_brand,
            "category": detected_category,
            "budget": budget,
            "is_running": is_running
        }

    def reason_and_generate(
        self,
        query: str,
        whisper_lang: Optional[str] = None,
        whisper_prob: float = 1.0
    ) -> dict[str, Any]:
        """
        Orchestrates LLM query processing:
        ASR -> Language Detection -> TextCNN Intent Classification ->
        Grounded Tool Execution (Store/Product/Facility/FAQ) -> Trilingual Layman Output.
        """
        lang_name, lang_code = self.detect_language(query, whisper_lang)
        
        # 1. TextCNN Intent Classification
        intent = "FIND_STORE"
        confidence = round(whisper_prob, 2)
        probabilities = {}
        needs_clarification = False

        if self.intent_predictor:
            intent_res = self.intent_predictor.predict(query)
            intent = intent_res["intent"]
            confidence = round(intent_res["confidence"], 2)
            probabilities = intent_res["probabilities"]
            needs_clarification = intent_res.get("needs_clarification", intent_res.get("low_confidence", False))

        # 2. Budget extraction for product queries
        budget = self._extract_budget(query)
        if budget is not None and intent not in ("PRODUCT_REFINEMENT", "FIND_PRODUCT"):
            intent = "PRODUCT_REFINEMENT"

        # 3. Tool Execution & Intent Routing
        action = "NAVIGATE"
        destination = None
        retrieved_context = []
        layman_text = ""

        # Non-mall chatter filter (weather, jokes, sports, politics)
        chatter_keywords = ["joke", "weather", "cricket", "flight", "president", "minister", "हवामान", "હવામાન", "રમૂજી", "ખબર", "मौसम", "क्रिकेट"]
        is_chatter = any(k in query.lower() for k in chatter_keywords)

        # --- A. UNKNOWN / GIBBERISH / CLARIFICATION ---
        if intent == "UNKNOWN" or is_chatter or (confidence < 0.35 and not self.retrieve(query, top_k=1)):
            action = "CLARIFY"
            if lang_code == "gu":
                layman_text = (
                    "નમસ્તે! મને તમારો પ્રશ્ન બરાબર સમજાતો નથી. "
                    "તમે પૂછી શકો છો: 'ઝારા સ્ટોર ક્યાં છે?', 'મને શૂઝ ક્યાંથી મળશે?' "
                    "અથવા 'સિનેપોલિસ કેવી રીતે જવું?'."
                )
            elif lang_code == "hi":
                layman_text = (
                    "नमस्ते! मुझे आपका सवाल स्पष्ट रूप से समझ नहीं आया। "
                    "आप पूछ सकते हैं: 'Zara स्टोर कहाँ है?', 'मुझे जूते कहाँ मिलेंगे?' "
                    "या 'Cinepolis कैसे जाएं?'."
                )
            else:
                layman_text = (
                    "Hello! I couldn't find a matching store, product, or service for that request. "
                    "Please ask for store names (e.g. 'Where is Zara?'), categories ('Show me running shoes'), "
                    "or amenities ('Where is the ATM?')."
                )
            return {
                "query": query,
                "detected_language": lang_name,
                "language_code": lang_code,
                "confidence": confidence,
                "predicted_intent": intent,
                "class_probabilities": probabilities,
                "needs_clarification": True,
                "layman_text": layman_text,
                "action": action,
                "destination": None,
                "retrieved_context": []
            }

        # --- B. MALL INFORMATION / FAQ TOOL ---
        if intent == "MALL_INFORMATION":
            faq_retrieved = self.retrieve(query, top_k=1, doc_type="faq")
            if faq_retrieved:
                faq_doc, score = faq_retrieved[0]
                faq_data = faq_doc["faq_data"]
                action = "INFO"
                destination = {
                    "id": faq_doc["id"],
                    "name": faq_doc["name"],
                    "category": "Mall FAQ",
                    "floor": 0,
                    "floor_name": "Ground Floor Helpdesk",
                    "node_id": 34,
                    "score": round(score, 3)
                }
                layman_text = faq_data.get(lang_code, faq_data["en"])
                return {
                    "query": query,
                    "detected_language": lang_name,
                    "language_code": lang_code,
                    "confidence": confidence,
                    "predicted_intent": intent,
                    "class_probabilities": probabilities,
                    "needs_clarification": False,
                    "layman_text": layman_text,
                    "action": action,
                    "destination": destination,
                    "retrieved_context": [{"name": faq_doc["name"], "score": round(score, 3)}]
                }

        # --- B2. SHOPPING JOURNEY: CART, COMPARISON & ORDER CONFIRMATION ---
        q_lower = query.lower()
        is_cart_total = any(k in q_lower for k in ["total in my cart", "total amount in my cart", "total in cart", "amount in my cart", "check my cart", "what is in my cart", "મારા કાર્ટ", "કાર્ટમાં કેટલા", "કાર્ટની રકમ", "કાર્ટ ટોટલ", "कार्ट का टोटल", "मेरे कार्ट", "कार्ट में कितना"])
        is_add_cart = (
            ("add" in q_lower and any(w in q_lower for w in ["cart", "bag", "basket"]))
            or any(k in q_lower for k in ["put in cart", "કાર્ટમાં ઉમેરો", "બેગમાં ઉમેરો", "કાર્ટ માં ઉમેરો", "કાર્ટમાં નાખો", "कार्ट में जोड़ें", "कार्ट में डालो", "कार्ट में एड"])
        )
        is_purchase_order = any(k in q_lower for k in ["place order", "pay now", "buy now", "confirm purchase", "place my order", "ઓર્ડર કરો", "ઓર્ડર કન્ફર્મ", "ખરીદી કરો", "ऑर्डर करें", "ऑर्डर कन्फर्म", "पेमेंट करो"])
        is_compare_query = intent == "PRODUCT_COMPARISON" or any(k in q_lower for k in ["compare", "versus", "સરખાવો", "તુલના કરો", "તુલના", "तुलना करें", "तुलना", "कंपेयर"])

        if is_purchase_order:
            action = "REQUIRE_CONFIRMATION"
            if lang_code == "gu":
                layman_text = "તમારી સુરક્ષા માટે, ઓર્ડર આપવા માટે ચેકઆઉટ સ્ક્રીન પર તમારી પુષ્ટિ જરૂરી છે. કૃપા કરીને કાર્ટ પેજ પર જઈને સેન્ડબોક્સ પેમેન્ટ કન્ફર્મ કરો."
            elif lang_code == "hi":
                layman_text = "आपकी सुरक्षा के लिए, ऑर्डर फाइनल करने से पहले चेकआउट पेज पर आपकी पुष्टि आवश्यक है। कृपया कार्ट पेज पर जाकर सैंडबॉक्स पेमेंट कन्फर्म करें।"
            else:
                layman_text = "For your security, placing an order requires explicit confirmation on the checkout page. Please review your items and confirm your sandbox payment."

            return {
                "query": query,
                "detected_language": lang_name,
                "language_code": lang_code,
                "confidence": confidence,
                "predicted_intent": "ORDER_CONFIRMATION",
                "class_probabilities": probabilities,
                "needs_clarification": False,
                "layman_text": layman_text,
                "action": action,
                "destination": None,
                "retrieved_context": []
            }

        if is_cart_total:
            action = "CART_TOTAL"
            if lang_code == "gu":
                layman_text = "તમે તમારું શોપિંગ બેગ જોઈ શકો છો. તમારા કાર્ટની વસ્તુઓ અને કુલ રકમ સ્ક્રીન પર અપડેટ થઈ ગઈ છે."
            elif lang_code == "hi":
                layman_text = "आप अपने शॉपिंग बैग का स्टेटस देख सकते हैं। आपके कार्ट की कुल राशि और आइटम्स स्क्रीन पर उपलब्ध हैं।"
            else:
                layman_text = "You can view your shopping bag anytime. Your active cart summary and subtotal are ready on screen."

            return {
                "query": query,
                "detected_language": lang_name,
                "language_code": lang_code,
                "confidence": confidence,
                "predicted_intent": "CART_QUERY",
                "class_probabilities": probabilities,
                "needs_clarification": False,
                "layman_text": layman_text,
                "action": action,
                "destination": None,
                "retrieved_context": []
            }

        if is_add_cart:
            action = "ADD_TO_CART"
            constraints = self._extract_query_constraints(query)
            cat = constraints["category"] or "Footwear"
            req_brand = constraints["brand"]
            candidates = [p for p in self.products if p["category"] == cat]
            if req_brand:
                brand_items = [p for p in candidates if p["shop_name"] == req_brand["shop_name"]]
                if brand_items:
                    candidates = brand_items
            selected_item = candidates[0] if candidates else self.products[0]

            if lang_code == "gu":
                layman_text = f"પ્રોડક્ટ તમારા શોપિંગ બેગમાં ઉમેરવામાં આવી રહી છે: {selected_item['name']} (₹{int(selected_item['effective_price'])}). કાર્ટમાં જઈને ઓર્ડર પૂર્ણ કરી શકો છો."
            elif lang_code == "hi":
                layman_text = f"प्रोडक्ट आपके शॉपिंग बैग में जोड़ा जा रहा है: {selected_item['name']} (₹{int(selected_item['effective_price'])})। आप कार्ट में जाकर ऑर्डर पूरा कर सकते हैं।"
            else:
                layman_text = f"Adding {selected_item['name']} (₹{int(selected_item['effective_price'])}) to your shopping cart. You can review quantities and checkout anytime."

            return {
                "query": query,
                "detected_language": lang_name,
                "language_code": lang_code,
                "confidence": confidence,
                "predicted_intent": "ADD_TO_CART",
                "class_probabilities": probabilities,
                "needs_clarification": False,
                "layman_text": layman_text,
                "action": action,
                "destination": {
                    "id": selected_item["product_id"],
                    "name": selected_item["shop_name"],
                    "product_name": selected_item["name"],
                    "price": selected_item["effective_price"],
                    "product_id": selected_item["product_id"]
                },
                "retrieved_context": [
                    {"name": selected_item["name"], "price": selected_item["effective_price"], "shop": selected_item["shop_name"]}
                ]
            }

        if is_compare_query:
            action = "COMPARE_PRODUCTS"
            # Find candidate items to compare
            constraints = self._extract_query_constraints(query)
            cat = constraints["category"] or "Footwear"
            matches = [p for p in self.products if p["category"] == cat][:2]
            if len(matches) < 2:
                matches = self.products[:2]

            p1, p2 = matches[0], matches[1]
            if lang_code == "gu":
                layman_text = f"પ્રોડક્ટ્સની સરખામણી તૈયાર છે: {p1['name']} (₹{int(p1['effective_price'])}) વિરુદ્ધ {p2['name']} (₹{int(p2['effective_price'])}). વિગતવાર તુલના સ્ક્રીન પર જોઈ શકો છો."
            elif lang_code == "hi":
                layman_text = f"प्रोडक्ट्स की तुलना तैयार है: {p1['name']} (₹{int(p1['effective_price'])}) बनाम {p2['name']} (₹{int(p2['effective_price'])})। विस्तृत फीचर्स स्क्रीन पर देख सकते हैं।"
            else:
                layman_text = f"Product comparison ready: {p1['name']} (₹{int(p1['effective_price'])}) vs {p2['name']} (₹{int(p2['effective_price'])}). Side-by-side details are shown."

            return {
                "query": query,
                "detected_language": lang_name,
                "language_code": lang_code,
                "confidence": confidence,
                "predicted_intent": "PRODUCT_COMPARISON",
                "class_probabilities": probabilities,
                "needs_clarification": False,
                "layman_text": layman_text,
                "action": action,
                "destination": None,
                "retrieved_context": [
                    {"name": p1["name"], "price": p1["effective_price"], "shop": p1["shop_name"]},
                    {"name": p2["name"], "price": p2["effective_price"], "shop": p2["shop_name"]}
                ]
            }

        # --- C. PRODUCT & BRAND SEARCH WITH HARD CONSTRAINTS TOOL ---
        constraints = self._extract_query_constraints(query)
        req_brand = constraints["brand"]
        req_cat = constraints["category"]
        req_budget = constraints["budget"]
        is_running = constraints["is_running"]

        is_product_query = (
            intent in ("PRODUCT_REFINEMENT", "FIND_PRODUCT")
            or req_budget is not None
            or (req_cat is not None and (req_brand is not None or any(term in query.lower() for term in ["buy", "price", "under", "malse", "milenge", "batavo", "dikhaiye", "dikhaye", "show", "options", "વિકલ્પ", "ખરીદવા"])))
        )

        if is_product_query:
            # 1. Category Filtering
            cat_filtered = self.products
            if req_cat:
                cat_filtered = [p for p in cat_filtered if p["category"] == req_cat or (req_cat == "Footwear" and "shoe" in p["name"].lower())]

            # 2. Sub-category (Running) Filtering
            if is_running and req_cat == "Footwear":
                running_items = [p for p in cat_filtered if "running" in p["name"].lower() or "runner" in p["name"].lower()]
                if running_items:
                    cat_filtered = running_items

            # 3. Exact Brand Matching
            exact_brand_products = []
            if req_brand:
                b_canonical = req_brand["canonical_name"].lower()
                b_shop = req_brand["shop_name"].lower()
                b_subs = [s.lower() for s in req_brand["sub_brands"]]
                for p in cat_filtered:
                    p_shop = p.get("shop_name", "").lower()
                    p_brand = str(p.get("brand", "")).lower()
                    p_name = p.get("name", "").lower()
                    if p_shop == b_shop or p_brand in b_subs or b_canonical in p_name or b_canonical in p_brand:
                        exact_brand_products.append(p)
            else:
                exact_brand_products = cat_filtered

            # 4. Budget Constraint Application
            if req_budget is not None:
                budget_matches = [p for p in exact_brand_products if p.get("effective_price", 999999) <= req_budget]
            else:
                budget_matches = exact_brand_products

            # --- CASE C1: Explicit brand requested, but ZERO matches under budget! ---
            if req_brand and req_budget is not None and not budget_matches:
                # Find genuine inventory for the requested brand to quote actual prices
                all_brand_items = [p for p in self.products if p.get("shop_name", "").lower() == req_brand["shop_name"].lower()]
                if req_cat:
                    brand_cat = [p for p in all_brand_items if p["category"] == req_cat or (req_cat == "Footwear" and "shoe" in p["name"].lower())]
                    if brand_cat:
                        all_brand_items = brand_cat
                brand_min_price = min([p["effective_price"] for p in all_brand_items]) if all_brand_items else None

                # Find valid, honest alternatives in the requested category and budget
                alt_products = [p for p in cat_filtered if p.get("effective_price", 999999) <= req_budget]
                alt_products.sort(key=lambda x: x["effective_price"])

                action = "SHOW_ALTERNATIVES" if alt_products else "NO_MATCH"
                b_title = req_brand["canonical_name"]
                cat_name = "running shoes" if is_running else ("shoes" if req_cat == "Footwear" else (req_cat or "products"))

                if lang_code == "gu":
                    min_info = f" ({b_title} ની કિંમત ₹{int(brand_min_price)} થી શરૂ થાય છે)" if brand_min_price else ""
                    alt_info = ""
                    if alt_products:
                        top_alt = alt_products[0]
                        alt_info = f" વિકલ્પ તરીકે, {top_alt['shop_name']} ({top_alt['floor_number']} Floor) પર {top_alt['name']} (₹{int(top_alt['effective_price'])}) ઉપલબ્ધ છે."
                    layman_text = (
                        f"નેક્સસ અમદાવાદ વનમાં {req_brand['shop_name']} ({req_brand['floor_name']}) પર ₹{int(req_budget)} ની અંદર કોઈ {b_title} {cat_name} ઉપલબ્ધ નથી{min_info}.{alt_info}"
                    )
                elif lang_code == "hi":
                    min_info = f" ({b_title} की कीमतें ₹{int(brand_min_price)} से शुरू होती हैं)" if brand_min_price else ""
                    alt_info = ""
                    if alt_products:
                        top_alt = alt_products[0]
                        alt_info = f" विकल्प के तौर पर, {top_alt['shop_name']} (Floor {top_alt['floor_number']}) में {top_alt['name']} (₹{int(top_alt['effective_price'])}) उपलब्ध है।"
                    layman_text = (
                        f"नेक्सस अहमदाबाद वन में {req_brand['shop_name']} ({req_brand['floor_name']}) पर ₹{int(req_budget)} के अंदर कोई {b_title} {cat_name} उपलब्ध नहीं हैं{min_info}.{alt_info}"
                    )
                else:
                    min_info = f" (prices at {req_brand['shop_name']} start at ₹{int(brand_min_price)})" if brand_min_price else ""
                    alt_info = ""
                    if alt_products:
                        top_alt = alt_products[0]
                        alt_info = f" As an alternative under ₹{int(req_budget)}, {top_alt['shop_name']} (Floor {top_alt['floor_number']}) offers {top_alt['name']} at ₹{int(top_alt['effective_price'])}."
                    layman_text = (
                        f"No {b_title} {cat_name} are available under ₹{int(req_budget)} at Nexus Ahmedabad One{min_info}.{alt_info}"
                    )

                return {
                    "query": query,
                    "detected_language": lang_name,
                    "language_code": lang_code,
                    "confidence": confidence,
                    "predicted_intent": intent,
                    "class_probabilities": probabilities,
                    "needs_clarification": False,
                    "layman_text": layman_text,
                    "action": action,
                    "destination": {
                        "id": req_brand["shop_id"],
                        "name": req_brand["shop_name"],
                        "category": req_cat or "Retail",
                        "floor": 1,
                        "floor_name": req_brand["floor_name"],
                        "node_id": req_brand["node_id"],
                        "score": 0.85,
                        "is_alternative": True if alt_products else False,
                        "alternative_shop": alt_products[0]["shop_name"] if alt_products else None
                    },
                    "retrieved_context": [
                        {"name": ap["name"], "price": ap["effective_price"], "shop": ap["shop_name"], "is_alternative": True, "alternative_for": b_title}
                        for ap in alt_products[:3]
                    ]
                }

            # --- CASE C2: Matching products found (exact brand or any-brand) ---
            if budget_matches:
                budget_matches.sort(key=lambda x: x["effective_price"])
                top_p = budget_matches[0]
                action = "SHOW_PRODUCTS"
                destination = {
                    "id": top_p["product_id"],
                    "name": top_p["shop_name"],
                    "product_name": top_p["name"],
                    "price": top_p["effective_price"],
                    "category": top_p["category"],
                    "floor": top_p["floor_number"],
                    "floor_name": f"Floor {top_p['floor_number']}",
                    "node_id": self._find_shop_node(top_p["shop_name"]),
                    "score": 0.98
                }
                b_name_tag = f"{req_brand['canonical_name']} " if req_brand else ""
                budget_tag = f" under ₹{int(req_budget)}" if req_budget else ""
                budget_tag_gu = f" ₹{int(req_budget)} ની અંદર" if req_budget else ""
                budget_tag_hi = f" ₹{int(req_budget)} के अंदर" if req_budget else ""

                if lang_code == "gu":
                    layman_text = (
                        f"{top_p['shop_name']} ({top_p['floor_number']} Floor) પર {b_name_tag}{budget_tag_gu} વિકલ્પો ઉપલબ્ધ છે. "
                        f"મુખ્ય પસંદગી: {top_p['name']} (₹{int(top_p['effective_price'])}). મેપ પર રસ્તો જોઈ શકો છો."
                    )
                elif lang_code == "hi":
                    layman_text = (
                        f"{top_p['shop_name']} (Floor {top_p['floor_number']}) में {b_name_tag}{budget_tag_hi} विकल्प उपलब्ध हैं। "
                        f"मुख्य विकल्प: {top_p['name']} (₹{int(top_p['effective_price'])})। नेविगेशन शुरू करने के लिए तैयार है।"
                    )
                else:
                    layman_text = (
                        f"Found {len(budget_matches)} {b_name_tag}options{budget_tag} at {top_p['shop_name']} (Floor {top_p['floor_number']}). "
                        f"Top match: {top_p['name']} at ₹{int(top_p['effective_price'])}. Walking directions are ready."
                    )

                return {
                    "query": query,
                    "detected_language": lang_name,
                    "language_code": lang_code,
                    "confidence": confidence,
                    "predicted_intent": intent,
                    "class_probabilities": probabilities,
                    "needs_clarification": False,
                    "layman_text": layman_text,
                    "action": action,
                    "destination": destination,
                    "retrieved_context": [
                        {"name": mp["name"], "price": mp["effective_price"], "shop": mp["shop_name"], "is_alternative": False}
                        for mp in budget_matches[:3]
                    ]
                }

            # --- CASE C3: Brand requested has ZERO inventory in that category ---
            if req_brand:
                b_title = req_brand["canonical_name"]
                action = "NO_MATCH"
                cat_desc = req_cat or "requested items"
                if lang_code == "gu":
                    layman_text = f"નેક્સસ અમદાવાદ વનમાં {req_brand['shop_name']} પાસે {cat_desc} નો સ્ટોક ઉપલબ્ધ નથી."
                elif lang_code == "hi":
                    layman_text = f"नेक्सस अहमदाबाद वन में {req_brand['shop_name']} के पास {cat_desc} का कोई स्टॉक उपलब्ध नहीं है।"
                else:
                    layman_text = f"No matching {b_title} {cat_desc} found in inventory at Nexus Ahmedabad One."

                return {
                    "query": query,
                    "detected_language": lang_name,
                    "language_code": lang_code,
                    "confidence": confidence,
                    "predicted_intent": intent,
                    "class_probabilities": probabilities,
                    "needs_clarification": False,
                    "layman_text": layman_text,
                    "action": action,
                    "destination": None,
                    "retrieved_context": []
                }

        # --- D. FACILITY SEARCH TOOL ---
        if intent == "FACILITY_SEARCH":
            fac_retrieved = self.retrieve(query, top_k=1, doc_type="facility")
            if fac_retrieved:
                top_doc, top_score = fac_retrieved[0]
                action = "NAVIGATE"
                destination = {
                    "id": top_doc["id"],
                    "name": top_doc["name"],
                    "category": top_doc["category"],
                    "floor": top_doc["floor"],
                    "floor_name": top_doc["floor_name"],
                    "node_id": top_doc["node_id"],
                    "score": round(top_score, 3)
                }
                name = top_doc["name"]
                floor_name = top_doc["floor_name"]
                directions = top_doc["directions"]

                if lang_code == "gu":
                    layman_text = f"સૌથી નજીકનું {name} {floor_name} પર આવેલું છે. {directions} મેપ પર બ્લુ લાઇન ફોલો કરો."
                elif lang_code == "hi":
                    layman_text = f"सबसे नज़दीकी {name} {floor_name} पर स्थित है। {directions} Floor Map पर रास्ता देख सकते हैं।"
                else:
                    layman_text = f"The nearest {name} is on the {floor_name}. {directions} Follow the blue path on the map."

                return {
                    "query": query,
                    "detected_language": lang_name,
                    "language_code": lang_code,
                    "confidence": confidence,
                    "predicted_intent": intent,
                    "class_probabilities": probabilities,
                    "needs_clarification": False,
                    "layman_text": layman_text,
                    "action": action,
                    "destination": destination,
                    "retrieved_context": [{"name": top_doc["name"], "score": round(top_score, 3)}]
                }

        # --- E. STORE & NAVIGATION DEFAULT RETRIEVAL TOOL ---
        if intent in ("FIND_STORE", "NAVIGATION"):
            retrieved = self.retrieve(query, top_k=3, doc_type=["shop", "facility"])
            if not retrieved:
                retrieved = self.retrieve(query, top_k=3)
        else:
            retrieved = self.retrieve(query, top_k=3)
        if not retrieved:
            action = "CLARIFY"
            if lang_code == "gu":
                layman_text = (
                    "નમસ્તે! મને નેક્સસ અમદાવાદ વન માં આ નામની કોઈ દુકાન કે પ્રોડક્ટ મળી નથી. "
                    "કૃપા કરીને સ્ટોરનું સાચું નામ અથવા કેટેગરી પૂછો."
                )
            elif lang_code == "hi":
                layman_text = (
                    "नमस्ते! मुझे नेक्सस अहमदाबाद वन में इससे मिलता-जुलता कोई स्टोर या प्रोडक्ट नहीं मिला। "
                    "कृपया स्टोर का नाम या श्रेणी दोबारा चेक करें।"
                )
            else:
                layman_text = (
                    "Hello! I could not find that store or brand at Nexus Ahmedabad One. "
                    "Please verify the brand name or search by category (e.g., 'Apparel', 'Footwear', 'Electronics')."
                )
            return {
                "query": query,
                "detected_language": lang_name,
                "language_code": lang_code,
                "confidence": confidence,
                "predicted_intent": intent,
                "class_probabilities": probabilities,
                "needs_clarification": True,
                "layman_text": layman_text,
                "action": action,
                "destination": None,
                "retrieved_context": []
            }

        top_doc, top_score = retrieved[0]
        name = top_doc["name"]
        floor_name = top_doc["floor_name"]
        category = top_doc.get("category", "")
        directions = top_doc.get("directions", f"Located on {floor_name}.")
        node_id = top_doc["node_id"]
        floor = top_doc["floor"]
        action = "NAVIGATE"

        destination = {
            "id": top_doc["id"],
            "name": name,
            "category": category,
            "floor": floor,
            "floor_name": floor_name,
            "node_id": node_id,
            "score": round(top_score, 3)
        }

        # Trilingual Layman Explanation
        if lang_code == "gu":
            if top_doc["type"] == "facility":
                layman_text = (
                    f"{name} {floor_name} પર આવેલું છે. "
                    f"{directions} "
                    f"ગૂગલ મેપ્સ પર 'Start Walking' દબાવીને સીધો રસ્તો જોઈ શકો છો."
                )
            else:
                layman_text = (
                    f"તમને {name} ({category}) {floor_name} પર મળશે. "
                    f"{directions} "
                    f"મેપ પર બ્લુ લાઈન તમને દુકાન સુધી પહોંચાડશે!"
                )
        elif lang_code == "hi":
            if top_doc["type"] == "facility":
                layman_text = (
                    f"{name} {floor_name} पर स्थित है। "
                    f"{directions} "
                    f"आप सीधा Floor Map पर 'Start Walking' क्लिक करके रास्ता देख सकते हैं।"
                )
            else:
                layman_text = (
                    f"आपको {name} ({category}) {floor_name} पर मिलेगा। "
                    f"{directions} "
                    f"Google Maps Indoor navigation में इसका blue line route दिखाया गया है!"
                )
        else:
            if top_doc["type"] == "facility":
                layman_text = (
                    f"{name} is located on the {floor_name}. "
                    f"{directions} "
                    f"Indoor Google Maps navigation is ready -- click Start Walking to begin navigation."
                )
            else:
                brands_str = f" featuring {', '.join(top_doc.get('brands', []))}" if top_doc.get("brands") else ""
                layman_text = (
                    f"{name} is on the {floor_name} ({category}{brands_str}). "
                    f"{directions} "
                    f"Indoor Google Maps walking route is ready with turn-by-turn guidance!"
                )

        return {
            "query": query,
            "detected_language": lang_name,
            "language_code": lang_code,
            "confidence": confidence,
            "predicted_intent": intent,
            "class_probabilities": probabilities,
            "needs_clarification": False,
            "layman_text": layman_text,
            "action": action,
            "destination": destination,
            "retrieved_context": [
                {
                    "name": d["name"],
                    "floor": d.get("floor_name", ""),
                    "category": d.get("category", ""),
                    "score": round(s, 3)
                }
                for d, s in retrieved
            ]
        }


# Singleton instance
rag_engine = MallRAGEngine()
