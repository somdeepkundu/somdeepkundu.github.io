/*
 * Programme data for Sunday 25 October 2026.
 * Source: the official printed festival guide (pages "25th Oct. Sunday", "Poetry Garden" and "Workshops").
 *
 * How to edit: see docs/DATA.md. Every session needs a unique `id`, a `venue` id that exists in
 * data/campus.js, and 24-hour `start` / `end` times in IST. Run `python3 tools/validate.py` after editing.
 *
 * This file is a plain script (not a module) so the app also works when opened straight from disk.
 */
window.LITFEST_PROGRAMME = {
  festival: "Godrej Literature Live! The Mumbai LitFest",
  edition: "2026",
  venue: "NCPA, Nariman Point, Mumbai",
  timezone: "Asia/Kolkata",
  utcOffset: "+05:30",
  arriveBeforeMinutes: 15,
  officialSite: "https://litlive.in",

  categories: {
    "book-launch":  "Book launch",
    "performance":  "Performance",
    "awards":       "Awards",
    "literary":     "Literary",
    "mumbai":       "Mumbai",
    "current-affairs": "Current affairs",
    "gender":       "Gender",
    "tech-ai":      "Technology & AI",
    "environment":  "Environment",
    "business":     "Business & economics",
    "history":      "History",
    "poetry":       "Poetry",
    "biography":    "Biography",
    "workshop":     "Workshop"
  },

  /* One entry per festival day. Add Friday and Saturday here later; the app shows a day switcher
     automatically when there is more than one day. */
  days: [{
    date: "2026-10-25",
    label: "Sunday 25 October",
    short: "Sun 25 Oct",
    window: { start: "10:00", end: "21:00" },

    sessions: [
      {
        id: "leading-the-way", venue: "little", start: "10:30", end: "11:15",
        title: "Leading the Way",
        subtitle: "New lenses on corporate practices",
        people: "Garima Deveshwar-Bahl, Sutapa Banerjee, Swati Apte",
        chair: "Vivek Hurry",
        categories: ["tech-ai", "business"], isl: true
      },
      {
        id: "poetic-self", venue: "doorbeen", start: "11:00", end: "12:30",
        title: "The Poetic Self", kind: "Workshop",
        subtitle: "Capturing the personal in verse",
        people: "Workshop by Paula Fourie",
        categories: ["workshop", "poetry"], isl: false
      },
      {
        id: "prolific-pen", venue: "jbt", start: "11:30", end: "12:30",
        title: "The Prolific Pen",
        subtitle: "Exploring the ethics and convictions underlying his oeuvre",
        people: "Shashi Tharoor in conversation with Anindita Ghose",
        categories: ["literary"], isl: true
      },
      {
        id: "limits-of-change", venue: "et", start: "11:30", end: "12:30",
        title: "Excerpts from Limits of Change", kind: "Performance",
        subtitle: "India's forgotten story in the Korean War",
        people: "Performed by Parvathi Nayar, Sukanya Umesh, Venkataraghavan",
        categories: ["performance", "history"], isl: true
      },
      {
        id: "breaking-the-metre", venue: "little", start: "11:45", end: "12:30",
        title: "Breaking the Metre",
        subtitle: "Launch of Eeva Maria al-Khazaali's 'The Male God', followed by a discussion on the appeal of switching from poetry to fiction",
        people: "Eeva Maria al-Khazaali, Susannah Dickey",
        chair: "Rehana Munir",
        categories: ["book-launch", "literary"], isl: true
      },
      {
        id: "cosy-crime", venue: "little", start: "13:00", end: "14:30",
        title: "Cosy Crime", kind: "Workshop",
        subtitle: "Decisions and dilemmas!",
        people: "Workshop by Paul Waters",
        categories: ["workshop"], isl: false
      },
      {
        id: "we-dare", venue: "jbt", start: "13:30", end: "14:30",
        title: "We Dare",
        overline: "Celebrating Women: The Shashi Baliga Memorial Session",
        subtitle: "Launch of 'The Good Reporter', followed by a discussion on reporting fearlessly from tough terrain",
        people: "Harinder Baweja, Kavita Bundelkhandi",
        chair: "Faye D'Souza",
        categories: ["book-launch", "current-affairs", "gender"], isl: true
      },
      {
        id: "sultan-padamsee-awards", venue: "godrej", start: "13:30", end: "14:30",
        title: "The Sultan Padamsee Playwriting Awards 2026", kind: "Awards",
        subtitle: "Performed excerpts from this year's shortlist, followed by the presentation of the awards",
        people: "Performed by Theatre Group Bombay",
        categories: ["awards", "performance"], isl: true
      },
      {
        id: "booked-for-life", venue: "et", start: "13:30", end: "14:30",
        title: "Booked for Life",
        subtitle: "The unbearable lightness of reading",
        people: "Shanta Gokhale in conversation with Sonali Kulkarni",
        categories: ["biography", "mumbai", "literary"], isl: true
      },
      {
        id: "more-of-less", venue: "doorbeen", start: "15:00", end: "15:45",
        title: "More of Less",
        subtitle: "Short fiction is meeting the moment",
        people: "Jane Borges, Sanghamitra Biswas, Vivaan Shah",
        chair: "Natasha Joshi",
        categories: ["literary"], isl: true
      },
      {
        id: "caught-in-the-nets", venue: "godrej", start: "15:00", end: "16:00",
        title: "Caught in the Nets",
        subtitle: "Launch of 'Eating Against The Tide', followed by a discussion on the changes faced by the Koli community",
        people: "Kadambari Koli-Tandel, Mukta Patil, Prachita Koli",
        chair: "Saee Koranne-Khandekar",
        categories: ["book-launch", "environment", "mumbai"], isl: true
      },
      {
        id: "big-draw", venue: "little", start: "15:00", end: "16:00",
        title: "The Big Draw",
        subtitle: "Launch of Jehangir Sorabjee's 'Bombay: An Illustrated History'",
        people: "Straight Talk by Jehangir Sorabjee, followed by a conversation with Asad Lalljee",
        categories: ["book-launch", "mumbai", "history"], isl: true
      },
      {
        id: "trapped-in-the-algorithm", venue: "et", start: "15:00", end: "16:00",
        title: "Trapped in the Algorithm",
        subtitle: "How the internet is shaping identity, fame, and addiction",
        people: "Anurag Minus Verma, Ria Chopra",
        chair: "Aditi Mittal",
        categories: ["tech-ai", "current-affairs", "gender"], isl: true
      },
      {
        id: "choices-we-make", venue: "jbt", start: "16:30", end: "17:30",
        title: "The Choices We Make",
        subtitle: "Launch of Shefali Shah's autobiography 'The Audacity of Being'",
        people: "Shefali Shah in conversation with Jane Borges",
        categories: ["book-launch", "biography"], isl: true
      },
      {
        id: "art-works", venue: "godrej", start: "16:30", end: "17:30",
        title: "Art Works",
        subtitle: "80 years of chronicling culture",
        people: "Straight Talk by Naman Ahuja, followed by a conversation with Sidharth Bhatia",
        categories: ["literary"], isl: true
      },
      {
        id: "lives-and-landscapes", venue: "little", start: "16:30", end: "17:30",
        title: "Lives and Landscapes",
        subtitle: "Short stories about the interplay between people and their geographies",
        people: "Bela Negi, Jim Wungramyao Kasom, Lilli Luuk",
        chair: "Rupangi Sharma",
        categories: ["literary"], isl: true
      },
      {
        id: "poetry-in-the-park", venue: "egarden", start: "17:00", end: "19:30",
        title: "Poetry in the Park", kind: "Open mic",
        subtitle: "Open mic by Poets of Mumbai",
        people: "Poets of Mumbai",
        categories: ["poetry"], isl: false
      },
      {
        id: "rhythm-house", venue: "egarden", start: "18:00", end: "18:40",
        title: "Rhythm House", kind: "Performance",
        subtitle: "Poems from around the world",
        people: "Jasmine Gardosi, Kevin Mclean, Paula Fourie",
        categories: ["poetry"], isl: false
      },
      {
        id: "mucho-gusto-mumbai", venue: "little", start: "18:00", end: "19:00",
        title: "Mucho Gusto Mumbai!",
        subtitle: "Launch of 'Pulse: An Anthology of Contemporary Spanish Poetry'",
        people: "Akshay Kale, Devika Bakshi, Miriam Reyes",
        chair: "Menka Shivdasani",
        categories: ["book-launch", "literary"], isl: true
      },
      {
        id: "litlive-awards", venue: "et", start: "18:00", end: "19:00",
        title: "Godrej Literature Live! Awards 2026", kind: "Awards",
        subtitle: "Presentation of the Lifetime Achievement Award to Irwin Allan Sealy, followed by the literary awards in fiction, non-fiction, business and short story categories",
        people: "Lifetime Achievement Award: Irwin Allan Sealy",
        categories: ["awards"], isl: true
      },
      {
        id: "wordplay", venue: "godrej", start: "18:00", end: "19:30",
        title: "Wordplay", kind: "Workshop",
        subtitle: "Dialogue carries a story",
        people: "Workshop by Susannah Dickey",
        categories: ["workshop"], isl: false
      },
      {
        id: "crafting-tomorrow", venue: "jbt", start: "19:30", end: "20:30",
        title: "Crafting Tomorrow", kind: "Closing address",
        subtitle: "The impact of AI on India's economy",
        people: "Straight Talk by Kaushik Basu, followed by a conversation with Govindraj Ethiraj",
        categories: ["tech-ai", "business"], isl: true
      }
    ]
  }],

  /* Accessibility and house rules, from the festival guide ("Please note" and "Calling all literature lovers"). */
  access: {
    partner: "Access for All",
    notes: [
      { icon: "access", title: "Wheelchair access", text: "Step-free entrances are marked on the festival map. Turn on Step-free to see them and to route to them." },
      { icon: "hands", title: "Indian Sign Language", text: "Most theatre sessions have ISL interpretation. Use the ISL filter in the programme." },
      { icon: "calm", title: "Sensory calming tent", text: "Find your calm at the Access for All sensory calming tent in the Experimental Garden.", marker: 6 },
      { icon: "aid", title: "First aid", text: "A first aid kit is available at the registration desk. The festival desk can help with anything else.", marker: 1 }
    ],
    rules: [
      "Seating is first come, first served, and entry depends on seat availability.",
      "Booked a session? Be there at least 15 minutes before it starts, or your seat goes to the on-the-spot queue.",
      "Keep your Literature Lover! badge handy.",
      "Switch off mobile phones during performances.",
      "No food, drinks, cameras, bottles, handbags, cans or tins inside the venues.",
      "Children under 6, including babies in arms, are not allowed.",
      "Please separate your waste to help reduce landfill."
    ]
  },

  /* All-day things to do around the campus. `marker` refers to an amenity number in data/campus.js. */
  around: [
    { marker: 3, title: "Kitab Khana Bookstore", text: "Grab books by the authors you just heard." },
    { marker: 9, title: "Book signing", text: "Meet authors after their sessions at the Festival Hub and the Sunken Garden." },
    { marker: 4, title: "Book Swap", text: "Drop off a book you've read and pick up a well-loved one." },
    { marker: 10, title: "Italian Excellence: Pinocchio's New Clothes", text: "An exhibit where no two noses are alike." },
    { marker: 6, title: "Sensory calming tent", text: "A quiet space run by Access for All." },
    { marker: 7, title: "Food and drink", text: "Refuel with snacks and chai between sessions." },
    { marker: 1, title: "Festival desk", text: "Help and information. A first aid kit is available at the registration desk." }
  ]
};
