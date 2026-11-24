"""
Comprehensive Multilingual RAG Retrieval Evaluation Suite (Phase 4).
Evaluates Precision@K, Recall@K, Mean Reciprocal Rank (MRR), and Latency
across 150+ queries (50+ in Gujarati, 50+ in Hindi, 50+ in English).
"""
import json
import os
import time
import numpy as np

try:
    from .rag_engine import rag_engine
except ImportError:
    from rag_engine import rag_engine

# 150+ Labelled Test Queries (>=50 per language) with Ground Truth Target Names
EVAL_QUERIES = [
    # ================= GUJARATI QUERIES (52 items) =================
    # Store Search
    {"q": "મને ઝારા સ્ટોર ક્યાં મળશે?", "target": "Zara", "lang": "gu", "type": "store"},
    {"q": "બાટા શૂઝ કયા માળે આવેલું છે?", "target": "Bata Footwear", "lang": "gu", "type": "store"},
    {"q": "સ્માર્ટ બજાર ગ્રોસરી ક્યાં છે?", "target": "Smart Bazaar (Hypermarket)", "lang": "gu", "type": "store"},
    {"q": "રિલાયન્સ ડિજિટલ કયા ફ્લોર પર છે?", "target": "Reliance Digital", "lang": "gu", "type": "store"},
    {"q": "સિનેપોલિસ મલ્ટિપ્લેક્સ ક્યાં આવેલું છે?", "target": "Cinepolis 9-Screen Multiplex", "lang": "gu", "type": "store"},
    {"q": "એચએન્ડએમ કપડાંની દુકાન ક્યાં છે?", "target": "H&M", "lang": "gu", "type": "store"},
    {"q": "મેકડોનાલ્ડ્સ બર્ગર ક્યાં મળશે?", "target": "McDonalds & McCafe", "lang": "gu", "type": "store"},
    {"q": "કેએફસી ચિકન કયા માળે છે?", "target": "KFC Express", "lang": "gu", "type": "store"},
    {"q": "સ્ટારબક્સ કોફી શોપ ક્યાં આવેલી છે?", "target": "Starbucks Coffee", "lang": "gu", "type": "store"},
    {"q": "સેફોરા બ્યુટી ક્યાં છે?", "target": "Sephora Beauty", "lang": "gu", "type": "store"},
    {"q": "લેન્સકાર્ટ ચશ્માની દુકાન ક્યાં છે?", "target": "Lenskart Opticals", "lang": "gu", "type": "store"},
    {"q": "ક્રોસવર્ડ પુસ્તકો ક્યાં મળશે?", "target": "Crossword Bookstores", "lang": "gu", "type": "store"},
    {"q": "હેમલીઝ રમકડાંની દુકાન ક્યાં છે?", "target": "Hamleys Toys", "lang": "gu", "type": "store"},
    {"q": "હોમ સેન્ટર ફર્નિચર કયા માળે છે?", "target": "Home Centre", "lang": "gu", "type": "store"},
    {"q": "ફેબઇન્ડિયા કુર્તા ક્યાં મળશે?", "target": "Fabindia Ethnic", "lang": "gu", "type": "store"},
    {"q": "માન્યવર લગ્ન શેરવાની ક્યાં છે?", "target": "Manyavar Mohey", "lang": "gu", "type": "store"},
    {"q": "ક્રોમા ઇલેક્ટ્રોનિક્સ કયા માળે આવેલું છે?", "target": "Croma Electronics", "lang": "gu", "type": "store"},
    {"q": "સબવે સેન્ડવીચ ક્યાં છે?", "target": "Subway Sandwiches", "lang": "gu", "type": "store"},
    {"q": "ઢોસા પ્લાઝા અને ગુજરાતી થાળી ક્યાં મળશે?", "target": "Dosa Plaza & Gujarati Thali", "lang": "gu", "type": "store"},
    {"q": "નાઇકી સ્પોર્ટ્સ શૂઝ ક્યાં મળશે?", "target": "Nike Store", "lang": "gu", "type": "store"},
    {"q": "સ્કેચર્સ વૉકિંગ શૂઝ ક્યાં છે?", "target": "Skechers Footwear", "lang": "gu", "type": "store"},
    {"q": "પુમા સ્પોર્ટ્સ વેર ક્યાં છે?", "target": "Puma Athletic", "lang": "gu", "type": "store"},
    {"q": "વેસ્ટસાઇડ ફેશન કયા માળે છે?", "target": "Westside", "lang": "gu", "type": "store"},
    {"q": "પેન્ટાલૂન્સ કપડાં ક્યાં મળશે?", "target": "Pantaloons", "lang": "gu", "type": "store"},
    {"q": "ધ બોડી શોપ લોશન ક્યાં છે?", "target": "The Body Shop", "lang": "gu", "type": "store"},
    {"q": "મીનીસો ક્યાં આવેલું છે?", "target": "Miniso", "lang": "gu", "type": "store"},
    {"q": "એપોલો ફાર્મસી ક્યાં છે?", "target": "Apollo Pharmacy", "lang": "gu", "type": "store"},
    {"q": "ટાઈમઝોન ગેમિંગ આર્કેડ ક્યાં છે?", "target": "Timezone Gaming Arcade", "lang": "gu", "type": "store"},
    {"q": "શોપર્સ સ્ટોપ કયા માળે છે?", "target": "Shoppers Stop", "lang": "gu", "type": "store"},
    {"q": "લાઇફસ્ટાઇલ સ્ટોર ક્યાં છે?", "target": "Lifestyle Store", "lang": "gu", "type": "store"},

    # Facilities & Navigation in Gujarati
    {"q": "નજીકમાં એટીએમ ક્યાં છે?", "target": "ATM", "lang": "gu", "type": "facility"},
    {"q": "વોશરૂમ કઈ બાજુ છે?", "target": "Washroom", "lang": "gu", "type": "facility"},
    {"q": "બેઝમેન્ટ કાર પાર્કિંગ ક્યાં છે?", "target": "Parking", "lang": "gu", "type": "facility"},
    {"q": "ગ્રાઉન્ડ ફ્લોર પર વોશરૂમ ક્યાં આવેલું છે?", "target": "Washroom", "lang": "gu", "type": "facility"},
    {"q": "વ્હીલચેર માટે લિફ્ટ ક્યાં છે?", "target": "Helpdesk", "lang": "gu", "type": "facility"},
    {"q": "ફૂડ કોર્ટ કયા માળે છે?", "target": "Food Court", "lang": "gu", "type": "facility"},
    {"q": "પૂછપરછ હેલ્પડેસ્ક ક્યાં છે?", "target": "Helpdesk", "lang": "gu", "type": "facility"},

    # Romanized Gujarati
    {"q": "Mane Zara store kyaan malse?", "target": "Zara", "lang": "gu", "type": "romanized"},
    {"q": "Bata na shoes kaya floor par chhe?", "target": "Bata Footwear", "lang": "gu", "type": "romanized"},
    {"q": "Cinepolis cinema ma movie tickets kyaan malse?", "target": "Cinepolis 9-Screen Multiplex", "lang": "gu", "type": "romanized"},
    {"q": "Smart Bazaar hypermarket kyaan aavelo chhe?", "target": "Smart Bazaar (Hypermarket)", "lang": "gu", "type": "romanized"},
    {"q": "Najikma ATM kyaan chhe?", "target": "ATM", "lang": "gu", "type": "romanized"},
    {"q": "Washroom kai baaju chhe?", "target": "Washroom", "lang": "gu", "type": "romanized"},
    {"q": "Starbucks coffee kyaan chhe?", "target": "Starbucks Coffee", "lang": "gu", "type": "romanized"},
    {"q": "Reliance Digital par laptop jova chhe.", "target": "Reliance Digital", "lang": "gu", "type": "romanized"},
    {"q": "Hamleys na ramkda kaya floor par chhe?", "target": "Hamleys Toys", "lang": "gu", "type": "romanized"},
    {"q": "KFC chicken burger khavu chhe.", "target": "KFC Express", "lang": "gu", "type": "romanized"},
    {"q": "Mane McDonald's sudhi lai jao.", "target": "McDonalds & McCafe", "lang": "gu", "type": "romanized"},
    {"q": "Lenskart na chashma kaya floor par chhe?", "target": "Lenskart Opticals", "lang": "gu", "type": "romanized"},
    {"q": "Nike na sneakers kyaan malse?", "target": "Nike Store", "lang": "gu", "type": "romanized"},
    {"q": "Puma na track pants jova chhe.", "target": "Puma Athletic", "lang": "gu", "type": "romanized"},
    {"q": "Skechers na running shoes kyaanthi malse?", "target": "Skechers Footwear", "lang": "gu", "type": "romanized"},

    # ================= HINDI QUERIES (52 items) =================
    # Store Search
    {"q": "ज़ारा स्टोर कहाँ स्थित है?", "target": "Zara", "lang": "hi", "type": "store"},
    {"q": "बाटा के जूते किस फ्लोर पर मिलेंगे?", "target": "Bata Footwear", "lang": "hi", "type": "store"},
    {"q": "सिनेपोलिस मल्टीप्लेक्स किस फ्लोर पर है?", "target": "Cinepolis 9-Screen Multiplex", "lang": "hi", "type": "store"},
    {"q": "स्मार्ट बाज़ार राशन की दुकान किधर है?", "target": "Smart Bazaar (Hypermarket)", "lang": "hi", "type": "store"},
    {"q": "रिलायंस डिजिटल इलेक्ट्रॉनिक्स कहाँ है?", "target": "Reliance Digital", "lang": "hi", "type": "store"},
    {"q": "एचएंडएम के कपड़े किस फ्लोर पर मिलते हैं?", "target": "H&M", "lang": "hi", "type": "store"},
    {"q": "मैकडॉनल्ड्स बर्गर कहाँ मिलेगा?", "target": "McDonalds & McCafe", "lang": "hi", "type": "store"},
    {"q": "केएफसी फ्राइड चिकन किस फ्लोर पर है?", "target": "KFC Express", "lang": "hi", "type": "store"},
    {"q": "स्टारबक्स कैफे किधर है?", "target": "Starbucks Coffee", "lang": "hi", "type": "store"},
    {"q": "सेफोरा ब्यूटी कॉस्मेटिक्स कहाँ मिलेगा?", "target": "Sephora Beauty", "lang": "hi", "type": "store"},
    {"q": "लेंसकार्ट चश्मा कहाँ मिलेगा?", "target": "Lenskart Opticals", "lang": "hi", "type": "store"},
    {"q": "क्रॉसवर्ड किताबों की दुकान कहाँ है?", "target": "Crossword Bookstores", "lang": "hi", "type": "store"},
    {"q": "हैमलीज़ खिलौने कहाँ मिलेंगे?", "target": "Hamleys Toys", "lang": "hi", "type": "store"},
    {"q": "होम सेंटर फर्नीचर किस फ्लोर पर है?", "target": "Home Centre", "lang": "hi", "type": "store"},
    {"q": "फैबइंडिया कुर्ता कहाँ मिलेगा?", "target": "Fabindia Ethnic", "lang": "hi", "type": "store"},
    {"q": "मान्यवर शादी शेरवानी किस फ्लोर पर है?", "target": "Manyavar Mohey", "lang": "hi", "type": "store"},
    {"q": "क्रोमा लैपटॉप और टीवी कहाँ मिलेगा?", "target": "Croma Electronics", "lang": "hi", "type": "store"},
    {"q": "सबवे सैंडविच की दुकान कहाँ है?", "target": "Subway Sandwiches", "lang": "hi", "type": "store"},
    {"q": "डोसा प्लाजा गुजराती थाली किधर है?", "target": "Dosa Plaza & Gujarati Thali", "lang": "hi", "type": "store"},
    {"q": "नाइकी रनिंग शूज कहाँ मिलेंगे?", "target": "Nike Store", "lang": "hi", "type": "store"},
    {"q": "स्केचर्स मेमोरी फोम जूते कहाँ मिलेंगे?", "target": "Skechers Footwear", "lang": "hi", "type": "store"},
    {"q": "प्यूमा स्पोर्ट्स कपड़े कहाँ हैं?", "target": "Puma Athletic", "lang": "hi", "type": "store"},
    {"q": "वेस्टसाइड वेस्टर्न ड्रेसेस कहाँ मिलेंगी?", "target": "Westside", "lang": "hi", "type": "store"},
    {"q": "पैंटालून्स कपड़े की दुकान कहाँ है?", "target": "Pantaloons", "lang": "hi", "type": "store"},
    {"q": "द बॉडी शॉप स्किनकेयर कहाँ है?", "target": "The Body Shop", "lang": "hi", "type": "store"},
    {"q": "मिनीसो जापानी बैग कहाँ मिलेंगे?", "target": "Miniso", "lang": "hi", "type": "store"},
    {"q": "अपोलो फार्मेसी दवाई की दुकान कहाँ है?", "target": "Apollo Pharmacy", "lang": "hi", "type": "store"},
    {"q": "टाइमज़ोन गेमिंग जोन कहाँ है?", "target": "Timezone Gaming Arcade", "lang": "hi", "type": "store"},
    {"q": "शॉपर्स स्टॉप किस फ्लोर पर है?", "target": "Shoppers Stop", "lang": "hi", "type": "store"},
    {"q": "लाइफस्टाइल स्टोर कहाँ स्थित है?", "target": "Lifestyle Store", "lang": "hi", "type": "store"},

    # Facilities in Hindi
    {"q": "सबसे नज़दीकी एटीएम कहाँ है?", "target": "ATM", "lang": "hi", "type": "facility"},
    {"q": "शौचालय किस तरफ है?", "target": "Washroom", "lang": "hi", "type": "facility"},
    {"q": "गाड़ी की बेसमेंट पार्किंग किधर है?", "target": "Parking", "lang": "hi", "type": "facility"},
    {"q": "फूड कोर्ट कौन से फ्लोर पर है?", "target": "Food Court", "lang": "hi", "type": "facility"},
    {"q": "सहायता केंद्र या हेल्पडेस्क कहाँ है?", "target": "Helpdesk", "lang": "hi", "type": "facility"},
    {"q": "व्हीलचेयर के लिए लिफ्ट कहाँ है?", "target": "Helpdesk", "lang": "hi", "type": "facility"},
    {"q": "क्या ग्राउंड फ्लोर पर वॉशरूम है?", "target": "Washroom", "lang": "hi", "type": "facility"},

    # Romanized Hindi
    {"q": "Mujhe Zara store kahan milega?", "target": "Zara", "lang": "hi", "type": "romanized"},
    {"q": "Bata ke formal shoes kis floor par hain?", "target": "Bata Footwear", "lang": "hi", "type": "romanized"},
    {"q": "Cinepolis multiplex kahan par hai?", "target": "Cinepolis 9-Screen Multiplex", "lang": "hi", "type": "romanized"},
    {"q": "Smart Bazaar hypermarket kidhar hai?", "target": "Smart Bazaar (Hypermarket)", "lang": "hi", "type": "romanized"},
    {"q": "Sabse nazdeeki ATM kahan hai?", "target": "ATM", "lang": "hi", "type": "romanized"},
    {"q": "Washroom kis side hai?", "target": "Washroom", "lang": "hi", "type": "romanized"},
    {"q": "Starbucks cold brew kahan milegi?", "target": "Starbucks Coffee", "lang": "hi", "type": "romanized"},
    {"q": "Reliance Digital par iPhone dekhna hai.", "target": "Reliance Digital", "lang": "hi", "type": "romanized"},
    {"q": "Hamleys toys shop kis floor par hai?", "target": "Hamleys Toys", "lang": "hi", "type": "romanized"},
    {"q": "KFC chicken burger khana hai.", "target": "KFC Express", "lang": "hi", "type": "romanized"},
    {"q": "McDonald's tak kaise jayein?", "target": "McDonalds & McCafe", "lang": "hi", "type": "romanized"},
    {"q": "Lenskart ke sunglasses kahan milenge?", "target": "Lenskart Opticals", "lang": "hi", "type": "romanized"},
    {"q": "Nike ke sports shoes kahan hain?", "target": "Nike Store", "lang": "hi", "type": "romanized"},
    {"q": "Puma ke sneakers kahan milenge?", "target": "Puma Athletic", "lang": "hi", "type": "romanized"},
    {"q": "Skechers ke walking shoes kidhar milte hain?", "target": "Skechers Footwear", "lang": "hi", "type": "romanized"},

    # ================= ENGLISH QUERIES (52 items) =================
    {"q": "Where is Zara store located?", "target": "Zara", "lang": "en", "type": "store"},
    {"q": "Which floor is Bata footwear on?", "target": "Bata Footwear", "lang": "en", "type": "store"},
    {"q": "Take me to Cinepolis 9-screen multiplex.", "target": "Cinepolis 9-Screen Multiplex", "lang": "en", "type": "store"},
    {"q": "Where can I find groceries at Smart Bazaar?", "target": "Smart Bazaar (Hypermarket)", "lang": "en", "type": "store"},
    {"q": "Where is Reliance Digital electronics?", "target": "Reliance Digital", "lang": "en", "type": "store"},
    {"q": "I want to buy clothes at H&M.", "target": "H&M", "lang": "en", "type": "store"},
    {"q": "Where is McDonald's fast food counter?", "target": "McDonalds & McCafe", "lang": "en", "type": "store"},
    {"q": "Which floor has KFC fried chicken?", "target": "KFC Express", "lang": "en", "type": "store"},
    {"q": "Where is Starbucks coffee shop located?", "target": "Starbucks Coffee", "lang": "en", "type": "store"},
    {"q": "Find Sephora cosmetics and perfumes.", "target": "Sephora Beauty", "lang": "en", "type": "store"},
    {"q": "Where can I get eye tests at Lenskart?", "target": "Lenskart Opticals", "lang": "en", "type": "store"},
    {"q": "Looking for Crossword bookstore novels.", "target": "Crossword Bookstores", "lang": "en", "type": "store"},
    {"q": "Where is Hamleys toy store for kids?", "target": "Hamleys Toys", "lang": "en", "type": "store"},
    {"q": "Find Home Centre furniture and home decor.", "target": "Home Centre", "lang": "en", "type": "store"},
    {"q": "Where is Fabindia ethnic wear?", "target": "Fabindia Ethnic", "lang": "en", "type": "store"},
    {"q": "I want wedding sherwanis from Manyavar.", "target": "Manyavar Mohey", "lang": "en", "type": "store"},
    {"q": "Where can I find Croma electronics?", "target": "Croma Electronics", "lang": "en", "type": "store"},
    {"q": "Guide me to Subway sandwiches.", "target": "Subway Sandwiches", "lang": "en", "type": "store"},
    {"q": "Where is Dosa Plaza and Gujarati Thali?", "target": "Dosa Plaza & Gujarati Thali", "lang": "en", "type": "store"},
    {"q": "Show me Nike running shoes.", "target": "Nike Store", "lang": "en", "type": "store"},
    {"q": "Where can I try Skechers slip-in shoes?", "target": "Skechers Footwear", "lang": "en", "type": "store"},
    {"q": "Find Puma athletic sportswear.", "target": "Puma Athletic", "lang": "en", "type": "store"},
    {"q": "Where is Westside fashion store?", "target": "Westside", "lang": "en", "type": "store"},
    {"q": "Take me to Pantaloons clothing.", "target": "Pantaloons", "lang": "en", "type": "store"},
    {"q": "Where is The Body Shop organic skincare?", "target": "The Body Shop", "lang": "en", "type": "store"},
    {"q": "I want to visit Miniso lifestyle store.", "target": "Miniso", "lang": "en", "type": "store"},
    {"q": "Where can I buy medicines at Apollo Pharmacy?", "target": "Apollo Pharmacy", "lang": "en", "type": "store"},
    {"q": "Take me to Timezone arcade and bowling.", "target": "Timezone Gaming Arcade", "lang": "en", "type": "store"},
    {"q": "Which floor has Shoppers Stop department store?", "target": "Shoppers Stop", "lang": "en", "type": "store"},
    {"q": "Where is Lifestyle store located?", "target": "Lifestyle Store", "lang": "en", "type": "store"},

    # Facilities in English
    {"q": "Where is the nearest ATM cash machine?", "target": "ATM", "lang": "en", "type": "facility"},
    {"q": "Show me the nearest restroom or washroom.", "target": "Washroom", "lang": "en", "type": "facility"},
    {"q": "Where is the basement car parking access?", "target": "Parking", "lang": "en", "type": "facility"},
    {"q": "Which floor is the food court dining on?", "target": "Food Court", "lang": "en", "type": "facility"},
    {"q": "Where is the customer service information desk?", "target": "Helpdesk", "lang": "en", "type": "facility"},
    {"q": "Can I borrow a wheelchair at the mall?", "target": "Helpdesk", "lang": "en", "type": "facility"},
    {"q": "Where is the washroom on ground floor?", "target": "Washroom", "lang": "en", "type": "facility"},

    # Code-Mixed / Conversational English
    {"q": "I am looking for formal jootey under 2000 rupees.", "target": "Bata Footwear", "lang": "en", "type": "code_mixed"},
    {"q": "Where can I find rashan and groceries in Lower Ground?", "target": "Smart Bazaar (Hypermarket)", "lang": "en", "type": "code_mixed"},
    {"q": "Where can I buy traditional kurta for shadi?", "target": "Manyavar Mohey", "lang": "en", "type": "code_mixed"},
    {"q": "I want to buy chashma at Lenskart.", "target": "Lenskart Opticals", "lang": "en", "type": "code_mixed"},
    {"q": "Where can I get khana peena in third floor?", "target": "Food Court", "lang": "en", "type": "code_mixed"},
    {"q": "Which store sells iPhone and MacBook in this mall?", "target": "Reliance Digital", "lang": "en", "type": "product"},
    {"q": "I want to buy Lego sets for my kids.", "target": "Hamleys Toys", "lang": "en", "type": "product"},
    {"q": "Show me sneakers under 3000 rupees.", "target": "Bata Footwear", "lang": "en", "type": "budget"},
    {"q": "Where can I get artisan cheesecake and cold brew?", "target": "Starbucks Coffee", "lang": "en", "type": "product"},
    {"q": "Where is the IMAX screen in Cinepolis?", "target": "Cinepolis 9-Screen Multiplex", "lang": "en", "type": "store"},
    {"q": "Do you have a chemist for bandages and first aid?", "target": "Apollo Pharmacy", "lang": "en", "type": "store"},
    {"q": "Where can I buy Japanese plushies and travel pillows?", "target": "Miniso", "lang": "en", "type": "store"},
    {"q": "Which shop sells luxury lipstick and Fenty beauty?", "target": "Sephora Beauty", "lang": "en", "type": "store"},
    {"q": "Where is the ICICI Bank ATM in second floor?", "target": "ATM", "lang": "en", "type": "facility"},
    {"q": "Where is the HDFC ATM on ground floor?", "target": "ATM", "lang": "en", "type": "facility"}
]


def run_rag_evaluation():
    print(f"Executing Multilingual RAG Retrieval Benchmark across {len(EVAL_QUERIES)} labelled queries...")
    
    latencies = []
    p1_hits = 0
    p3_hits = 0
    reciprocal_ranks = []
    
    results_by_lang = {"gu": {"count": 0, "p1": 0, "p3": 0, "rr": []},
                       "hi": {"count": 0, "p1": 0, "p3": 0, "rr": []},
                       "en": {"count": 0, "p1": 0, "p3": 0, "rr": []}}

    detailed_records = []

    for item in EVAL_QUERIES:
        q = item["q"]
        target = item["target"].lower()
        lang = item["lang"]

        t0 = time.perf_counter()
        retrieved = rag_engine.retrieve(q, top_k=3)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        latencies.append(elapsed_ms)

        retrieved_names = [r[0]["name"].lower() for r in retrieved]
        
        # Check P@1 and P@3
        hit_rank = 0
        for rank, name in enumerate(retrieved_names, start=1):
            if target in name or any(part in name for part in target.split() if len(part) > 3):
                hit_rank = rank
                break

        is_p1 = (hit_rank == 1)
        is_p3 = (hit_rank > 0 and hit_rank <= 3)
        rr = 1.0 / hit_rank if hit_rank > 0 else 0.0

        if is_p1:
            p1_hits += 1
        if is_p3:
            p3_hits += 1
        reciprocal_ranks.append(rr)

        # By language
        results_by_lang[lang]["count"] += 1
        if is_p1:
            results_by_lang[lang]["p1"] += 1
        if is_p3:
            results_by_lang[lang]["p3"] += 1
        results_by_lang[lang]["rr"].append(rr)

        detailed_records.append({
            "query": q,
            "target": item["target"],
            "lang": lang,
            "retrieved_top1": retrieved_names[0] if retrieved_names else None,
            "hit_rank": hit_rank,
            "reciprocal_rank": round(rr, 3),
            "latency_ms": round(elapsed_ms, 2)
        })

    total = len(EVAL_QUERIES)
    precision_at_1 = p1_hits / total
    precision_at_3 = p3_hits / total
    mrr = float(np.mean(reciprocal_ranks))
    mean_latency = float(np.mean(latencies))
    p95_latency = float(np.percentile(latencies, 95))

    lang_summary = {}
    for l, data in results_by_lang.items():
        n = data["count"]
        lang_summary[l] = {
            "query_count": n,
            "precision_at_1": round(data["p1"] / n, 3) if n else 0,
            "precision_at_3": round(data["p3"] / n, 3) if n else 0,
            "mrr": round(float(np.mean(data["rr"])), 3) if n else 0
        }

    summary = {
        "benchmark": "MallMind AI Multilingual RAG Retrieval (TF-IDF + Subword/Character N-Grams)",
        "total_queries_evaluated": total,
        "precision_at_1": round(precision_at_1, 3),
        "precision_at_3": round(precision_at_3, 3),
        "mean_reciprocal_rank": round(mrr, 3),
        "average_retrieval_latency_ms": round(mean_latency, 2),
        "p95_retrieval_latency_ms": round(p95_latency, 2),
        "metrics_by_language": lang_summary,
        "sample_detailed_logs": detailed_records[:10]
    }

    out_file = os.path.join(os.path.dirname(__file__), "..", "models", "rag_eval_summary.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print("MULTILINGUAL RAG EVALUATION BENCHMARK RESULTS:")
    print(f"Total Labelled Queries: {total}")
    print(f"Precision@1: {summary['precision_at_1'] * 100:.1f}%")
    print(f"Precision@3 / Recall@3: {summary['precision_at_3'] * 100:.1f}%")
    print(f"Mean Reciprocal Rank (MRR): {summary['mean_reciprocal_rank']:.3f}")
    print(f"Mean Retrieval Latency: {summary['average_retrieval_latency_ms']} ms | P95: {summary['p95_retrieval_latency_ms']} ms")
    print("Language Breakdown:")
    for l, metrics in lang_summary.items():
        l_name = "Gujarati" if l == "gu" else "Hindi" if l == "hi" else "English"
        print(f"  [{l_name} ({l})] Queries: {metrics['query_count']}, P@1: {metrics['precision_at_1'] * 100:.1f}%, P@3: {metrics['precision_at_3'] * 100:.1f}%, MRR: {metrics['mrr']}")
    print("=" * 65)

    return summary

if __name__ == "__main__":
    run_rag_evaluation()
