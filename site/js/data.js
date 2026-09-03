const VIRAI = {
  currency: "INR",
  freeShipThreshold: 3000,
  shipping: { standard: 99, express: 350 },
  landscapes: {
    kurinji:   { num:"01", tamil:"குறிஞ்சி", name:"Kurinji",   emotion:"Union",            line:"Mountain dawn, where love begins — the moment two people choose each other.", tone:"#56648C", tint:"#E7EAF1",
                 atmo:{ d:"img/11.webp", m:"img/11_Kurinji_1242x2208.webp", alt:"Kurinji mountain landscape at dawn, mist settling over layered blue hills" } },
    mullai:    { num:"02", tamil:"முல்லை",    name:"Mullai",    emotion:"Waiting",          line:"Forest jasmine — patience made fragrant, faithfulness kept quietly.",         tone:"#55624B", tint:"#E4E8E0",
                 atmo:{ d:"img/12.webp", m:"img/12_Mullai_1242x2208.webp", alt:"Mullai forest landscape at dusk, deep green woodland with white jasmine flowers" } },
    marutham:  { num:"03", tamil:"மருதம்",    name:"Marutham",  emotion:"Playful Conflict", line:"River country — quarrels that end in laughter, love in its full summer.",     tone:"#A2593B", tint:"#F1E4DC",
                 atmo:{ d:"img/13.webp", m:"img/13_Marutham_1242x2208.webp", alt:"Marutham river-country landscape, rain-soaked paddy fields and warm earth" } },
    neithal:   { num:"04", tamil:"நெய்தல்",    name:"Neithal",   emotion:"Longing",          line:"The salt coast — loving someone who is far away.",                            tone:"#75909E", tint:"#E2EAED",
                 atmo:{ d:"img/14.webp", m:"img/14_Neithal_1242x2208.webp", alt:"Neithal coastal landscape, grey-blue sea meeting a wet rocky shoreline" } },
    palai:     { num:"05", tamil:"பாலை",      name:"Palai",     emotion:"Separation",       line:"Dry lands — absence held with dignity, until return.",                        tone:"#8B7F6C", tint:"#ECE7DD",
                 atmo:{ d:"img/15.webp", m:"img/15_Palai_1242x2208.webp", alt:"Palai dry landscape, golden terrain and sparse vegetation under a white-hot sky" } }
  },
  families: ["floral","woody","earthy","fresh"],
  familyLabels: { floral:"Floral", woody:"Woody", earthy:"Earthy", fresh:"Fresh" },
  products: [
    {
      id:"kurinji-candle",
      name:"Kurinji · Union Candle",
      sub:"Wild blue florals over cool forest honey",
      landscape:"kurinji", type:"Candle", family:["floral","fresh"],
      price:2850, size:"240 g", burn:"≈ 50 hours", dims:"9 cm × 10 cm", weight:"640 g",
      notes:{ top:["Mountain air","Wild lavender"], heart:["Blue florals","Shola honey"], base:["Soft woods","White musk"] },
      shortScent:"Mountain dawn — wild blue florals settling into warm forest honey.",
      longScent:"It opens with cool mountain air and a whisper of wild lavender. At its heart, blue florals unfold over shola honey, drying down to soft woods and a trace of white musk. A scent like early light on a hillside.",
      story:"For beginnings. For the moment two people choose each other and the world feels newly made. Light it when something is starting.",
      img:{ a:"img/1a.webp", b:"img/1b.webp", c:"img/1c.webp" },
      art:{ bg:"linear-gradient(160deg,#E7EAF1 0%,#C7CEDF 52%,#56648C 100%)", glow:"radial-gradient(circle at 68% 30%,#F2F1EA 0%,transparent 55%)" },
      featured:true
    },
    {
      id:"mullai-candle",
      name:"Mullai · Waiting Candle",
      sub:"Night jasmine, green leaves, patient musk",
      landscape:"mullai", type:"Candle", family:["floral"],
      price:2850, size:"240 g", burn:"≈ 50 hours", dims:"9 cm × 10 cm", weight:"640 g",
      notes:{ top:["Green leaf","Dew"], heart:["Night jasmine","Mullai blossom"], base:["Clean musk","Blond woods"] },
      shortScent:"Forest jasmine at dusk — patient, green, and quietly sure.",
      longScent:"Crushed green leaf and evening dew open onto night jasmine in full bloom. Beneath it, clean musk and blond woods hold everything steady — a fragrance about waiting without anxiety.",
      story:"For the one who waits well. For distance that is only geography. For promises being kept slowly.",
      img:{ a:"img/2a.webp", b:"img/2b.webp", c:"img/2c.webp" },
      art:{ bg:"linear-gradient(160deg,#E4E8E0 0%,#BECBB8 52%,#55624B 100%)", glow:"radial-gradient(circle at 30% 26%,#F3F2E9 0%,transparent 55%)" },
      featured:true
    },
    {
      id:"marutham-candle",
      name:"Marutham · Playful Conflict Candle",
      sub:"Rain on dry earth, paddy water, tender woods",
      landscape:"marutham", type:"Candle", family:["earthy"],
      price:2850, size:"240 g", burn:"≈ 50 hours", dims:"9 cm × 10 cm", weight:"640 g",
      notes:{ top:["Ozone","Green rice stem"], heart:["Wet earth","Marigold"], base:["Tender wood","Amber"] },
      shortScent:"First rain on river-country earth — warmth after a storm of words.",
      longScent:"The electric hush before rain, then wet earth and marigold rising from river-country soil. Tender woods and soft amber remain, the way laughter returns after a quarrel.",
      story:"For love in its loud, living season. For the fight you both know will end folded into each other.",
      img:{ a:"img/3a.webp", b:"img/3b.webp", c:"img/3c.webp" },
      art:{ bg:"linear-gradient(160deg,#F1E4DC 0%,#DFB49E 52%,#A2593B 100%)", glow:"radial-gradient(circle at 70% 70%,#F6EBDD 0%,transparent 58%)" },
      featured:false
    },
    {
      id:"neithal-candle",
      name:"Neithal · Longing Candle",
      sub:"Salt air, sea foam, white lily",
      landscape:"neithal", type:"Candle", family:["fresh"],
      price:2850, size:"240 g", burn:"≈ 50 hours", dims:"9 cm × 10 cm", weight:"640 g",
      notes:{ top:["Sea salt","Cool mist"], heart:["White lily","Sea foam"], base:["Driftwood","Grey amber"] },
      shortScent:"Salt wind over a grey sea — the ache of missing someone specific.",
      longScent:"Cold sea salt and mist drift into white lily and sea foam. Driftwood and grey amber anchor it — clean, mineral, a little melancholy. The smell of standing at the edge of the water, thinking of one person.",
      story:"For longing across distance. For the letter not yet sent. For loving someone who is far away.",
      img:{ a:"img/4a.webp", b:"img/4b.webp", c:"img/4c.webp" },
      art:{ bg:"linear-gradient(160deg,#E2EAED 0%,#B4C6CF 52%,#75909E 100%)", glow:"radial-gradient(circle at 34% 30%,#F1F3EF 0%,transparent 55%)" },
      featured:true
    },
    {
      id:"palai-candle",
      name:"Palai · Separation Candle",
      sub:"Smoked woods, dry amber, desert myrrh",
      landscape:"palai", type:"Candle", family:["woody"],
      price:2850, size:"240 g", burn:"≈ 50 hours", dims:"9 cm × 10 cm", weight:"640 g",
      notes:{ top:["Sun-scorched air","Dry grass"], heart:["Smoked woods","Myrrh"], base:["Warm amber","Vetiver"] },
      shortScent:"Sun-baked earth and smoked woods — absence, held with dignity.",
      longScent:"Dry grass and hot air give way to smoked woods and resinous myrrh. Warm amber and vetiver settle deep and stay — a fragrance for separation that does not collapse into despair.",
      story:"For seasons apart. For the strength of what remains when someone steps away and is still yours.",
      img:{ a:"img/5a.webp", b:"img/5b.webp", c:"img/5c.webp" },
      art:{ bg:"linear-gradient(160deg,#ECE7DD 0%,#CDC0AA 52%,#8B7F6C 100%)", glow:"radial-gradient(circle at 62% 32%,#F4EFE4 0%,transparent 56%)" },
      featured:false
    },
    {
      id:"kurinji-travel",
      name:"Kurinji · Union Travel Candle",
      sub:"The mountain dawn, made portable",
      landscape:"kurinji", type:"Travel Candle", family:["floral","fresh"],
      price:1150, size:"90 g", burn:"≈ 18 hours", dims:"6 cm × 7 cm", weight:"220 g",
      notes:{ top:["Mountain air","Wild lavender"], heart:["Blue florals","Shola honey"], base:["Soft woods","White musk"] },
      shortScent:"The Kurinji scent, small enough to carry.",
      longScent:"Our Kurinji composition — cool air, wild lavender, blue florals over honeyed woods — poured into a travel-sized vessel for journeys and first meetings.",
      story:"A beginning, in miniature. The easiest way to meet Virai.",
      img:{ a:"img/6a.webp", b:"img/6b.webp", c:"img/6c.webp" },
      art:{ bg:"linear-gradient(160deg,#EDF0F5 0%,#C7CEDF 60%,#56648C 100%)", glow:"radial-gradient(circle at 66% 28%,#FFFFFF 0%,transparent 52%)" },
      featured:false
    },
    {
      id:"mullai-travel",
      name:"Mullai · Waiting Travel Candle",
      sub:"Night jasmine, made portable",
      landscape:"mullai", type:"Travel Candle", family:["floral"],
      price:1150, size:"90 g", burn:"≈ 18 hours", dims:"6 cm × 7 cm", weight:"220 g",
      notes:{ top:["Green leaf","Dew"], heart:["Night jasmine","Mullai blossom"], base:["Clean musk","Blond woods"] },
      shortScent:"The Mullai scent, small enough to carry.",
      longScent:"Night jasmine and green leaf, steady musk beneath — the Mullai composition in a travel vessel, for hotel rooms and waiting rooms alike.",
      story:"Patience travels with you now.",
      img:{ a:"img/7a.webp", b:"img/7b.webp", c:"img/7c.webp" },
      art:{ bg:"linear-gradient(160deg,#EBEEE6 0%,#BECBB8 60%,#55624B 100%)", glow:"radial-gradient(circle at 30% 24%,#FAFAF2 0%,transparent 52%)" },
      featured:false
    },
    {
      id:"neithal-travel",
      name:"Neithal · Longing Travel Candle",
      sub:"Salt air and white lily, made portable",
      landscape:"neithal", type:"Travel Candle", family:["fresh"],
      price:1150, size:"90 g", burn:"≈ 18 hours", dims:"6 cm × 7 cm", weight:"220 g",
      notes:{ top:["Sea salt","Cool mist"], heart:["White lily","Sea foam"], base:["Driftwood","Grey amber"] },
      shortScent:"The Neithal scent, small enough to carry.",
      longScent:"Sea salt, white lily, driftwood — the ache of the coastline distilled into a travel vessel.",
      story:"For sending your weather to someone far away.",
      img:{ a:"img/8a.webp", b:"img/8b.webp", c:"img/8c.webp" },
      art:{ bg:"linear-gradient(160deg,#EAF1F3 0%,#B4C6CF 60%,#75909E 100%)", glow:"radial-gradient(circle at 36% 30%,#FBFCF9 0%,transparent 52%)" },
      featured:false
    },
    {
      id:"discovery-set",
      name:"Ainthinai Discovery Set",
      sub:"Five landscapes, five mini candles",
      landscape:null, type:"Set", family:["floral","woody","earthy","fresh"],
      price:3600, size:"5 × 40 g", burn:"≈ 8 hours each", dims:"Gift box 22 cm × 12 cm", weight:"520 g",
      notes:{ top:["Five openings"], heart:["Five hearts"], base:["Five bases"] },
      shortScent:"Every landscape of Ainthinai, in one quiet box.",
      longScent:"All five landscapes — Kurinji's mountain dawn, Mullai's forest jasmine, Marutham's first rain, Neithal's salt coast, Palai's smoked woods — poured as five 40 g minis in a keepsake box.",
      story:"The complete emotional range of Collection 01. Find which landscape is yours before committing to full size. Our most-gifted object.",
      img:{ a:"img/9a.webp", b:"img/9b.webp", c:"img/9c.webp" },
      art:{ bg:"linear-gradient(150deg,#F1EDE4 0%,#DCD5C6 45%,#A9A08D 100%)", glow:"radial-gradient(circle at 50% 22%,#FFFDF6 0%,transparent 55%)" },
      featured:true
    },
    {
      id:"complete-collection",
      name:"Ainthinai Complete Collection",
      sub:"All five full-size landscapes",
      landscape:null, type:"Set", family:["floral","woody","earthy","fresh"],
      price:12500, size:"5 × 240 g", burn:"≈ 250 hours total", dims:"Five vessels + archive box", weight:"3.4 kg",
      notes:{ top:["—"], heart:["—"], base:["—"] },
      shortScent:"The whole of Ainthinai, full size, archive-boxed.",
      longScent:"Every landscape of Collection 01 at full size — five 240 g candles presented in an archival keepsake box with the Ainthinai field guide.",
      story:"For the collector, or for a house that wants every mood of love within reach. Our most complete expression of Collection 01.",
      img:{ a:"img/10a.webp", b:"img/10b.webp", c:"img/10c.webp" },
      art:{ bg:"linear-gradient(150deg,#EFEBE2 0%,#C9C2B2 50%,#6E675A 100%)", glow:"radial-gradient(circle at 44% 20%,#FFFEF8 0%,transparent 52%)" },
      featured:false
    }
  ],
  brand: {
    homeHero:{ d:"img/16.webp", m:"img/17.webp", wd:1672, hd:941, wm:852, hm:1846,
               altD:"The Virai world — soft candlelight beside a quiet Tamil landscape", altM:"The Virai world — candlelight over a calm landscape at dusk" },
    houseIntro:{ src:"img/26.webp", w:1024, h:1536, alt:"Warm wax being poured in the Virai studio" },
    craftWax:{ src:"img/18.webp", w:1448, h:1086, alt:"Raw wax in soft directional light, showing its natural texture" },
    craftVessel:{ src:"img/19.webp", w:1448, h:1086, alt:"Handcrafted candle vessels resting in the studio" },
    craftPaper:{ src:"img/20.webp", w:1448, h:1086, alt:"Virai packaging papers and cord arranged flat" },
    weddingsHero:{ d:"img/21.webp", m:null, wd:1672, hd:941, alt:"An event table set with many Virai candles glowing softly" },
    corporateHero:{ d:"img/22.webp", m:null, wd:1672, hd:941, alt:"A premium Virai gift prepared for corporate gifting" },
    storyStill:{ src:"img/23.webp", w:1122, h:1402, alt:"Still life of Virai materials — wax, vessel and craft tools" },
    giftStill:{ src:"img/24.webp", w:1586, h:992, alt:"A Virai gift wrapped in rice paper with cord and a handwritten card" },
    memoryHeader:{ d:"img/25.webp", m:null, wd:1774, hd:887, alt:"White jasmine flowers at dusk, soft and half in shadow" },
    details:{
      wax:{ src:"img/27.webp", w:1448, h:1086, alt:"Macro texture of finished candle wax surface" },
      wick:{ src:"img/28.webp", w:1448, h:1086, alt:"Macro detail of a cotton candle wick and its fibres" },
      vessel:{ src:"img/29.webp", w:1448, h:1086, alt:"Macro detail of a vessel rim, showing thickness and reflections" },
      oils:{ src:"img/30.webp", w:1448, h:1086, alt:"Fragrance materials during formulation, warm and atmospheric" },
      paper:{ src:"img/31.webp", w:1448, h:1086, alt:"Close-up of textured handmade paper used in Virai packaging" }
    },
    logo:{ src:"img/virai-logo.webp", alt:"Virai" }
  },
  IMG: {
    meta:{
      "img/1a.webp":{w:1122,h:1402},"img/1b.webp":{w:1254,h:1254},"img/1c.webp":{w:1254,h:1254},
      "img/2a.webp":{w:1003,h:1568},"img/2b.webp":{w:1254,h:1254},"img/2c.webp":{w:1254,h:1254},
      "img/3a.webp":{w:1122,h:1402},"img/3b.webp":{w:1254,h:1254},"img/3c.webp":{w:1254,h:1254},
      "img/4a.webp":{w:1122,h:1402},"img/4b.webp":{w:1254,h:1254},"img/4c.webp":{w:1254,h:1254},
      "img/5a.webp":{w:1003,h:1568},"img/5b.webp":{w:1254,h:1254},"img/5c.webp":{w:1254,h:1254},
      "img/6a.webp":{w:1003,h:1568},"img/6b.webp":{w:1254,h:1254},"img/6c.webp":{w:1254,h:1254},
      "img/7a.webp":{w:1122,h:1402},"img/7b.webp":{w:1254,h:1254},"img/7c.webp":{w:1254,h:1254},
      "img/8a.webp":{w:897,h:1752},"img/8b.webp":{w:1254,h:1254},"img/8c.webp":{w:1254,h:1254},
      "img/9a.webp":{w:1254,h:1254},"img/9b.webp":{w:1254,h:1254},"img/9c.webp":{w:1254,h:1254},
      "img/10a.webp":{w:1122,h:1402},"img/10b.webp":{w:1254,h:1254},"img/10c.webp":{w:1254,h:1254},
      "img/11.webp":{w:1672,h:941},"img/12.webp":{w:1672,h:941},"img/13.webp":{w:1672,h:941},
      "img/14.webp":{w:1672,h:941},"img/15.webp":{w:1672,h:941},
      "img/16.webp":{w:1672,h:941},"img/17.webp":{w:852,h:1846},
      "img/18.webp":{w:1448,h:1086},"img/19.webp":{w:1448,h:1086},"img/20.webp":{w:1448,h:1086},
      "img/21.webp":{w:1672,h:941},"img/22.webp":{w:1672,h:941},
      "img/23.webp":{w:1122,h:1402},"img/24.webp":{w:1586,h:992},"img/25.webp":{w:1774,h:887},
      "img/26.webp":{w:1024,h:1536},
      "img/27.webp":{w:1448,h:1086},"img/28.webp":{w:1448,h:1086},"img/29.webp":{w:1448,h:1086},
      "img/30.webp":{w:1448,h:1086},"img/31.webp":{w:1448,h:1086}
    },
    derived:{
      "img/1a.webp":720,"img/1b.webp":720,"img/1c.webp":720,
      "img/2a.webp":720,"img/2b.webp":720,"img/2c.webp":720,
      "img/3a.webp":720,"img/3b.webp":720,"img/3c.webp":720,
      "img/4a.webp":720,"img/4b.webp":720,"img/4c.webp":720,
      "img/5a.webp":720,"img/5b.webp":720,"img/5c.webp":720,
      "img/6a.webp":720,"img/6b.webp":720,"img/6c.webp":720,
      "img/7a.webp":720,"img/7b.webp":720,"img/7c.webp":720,
      "img/8a.webp":720,"img/8b.webp":720,"img/8c.webp":720,
      "img/9a.webp":720,"img/9b.webp":720,"img/9c.webp":720,
      "img/10a.webp":720,"img/10b.webp":720,"img/10c.webp":720,
      "img/11.webp":1400,"img/12.webp":1400,"img/13.webp":1400,"img/14.webp":1400,"img/15.webp":1400,
      "img/16.webp":1200,"img/18.webp":1200,"img/19.webp":1200,"img/20.webp":1200,
      "img/21.webp":1200,"img/22.webp":1200,"img/23.webp":1200,"img/24.webp":1200,"img/25.webp":1200,"img/26.webp":1200,
      "img/27.webp":900,"img/28.webp":900,"img/29.webp":900,"img/30.webp":900,"img/31.webp":900
    }
  }
};

VIRAI.productById = function(id){
  return this.products.find(function(p){ return p.id === id; }) || null;
};
VIRAI.landscapeList = function(){
  var self = this;
  return Object.keys(this.landscapes).map(function(k){
    return Object.assign({ key:k }, self.landscapes[k]);
  });
};
