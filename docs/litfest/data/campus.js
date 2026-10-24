/*
 * NCPA campus geometry, traced from the official printed festival map.
 *
 * Coordinates are in "map units": the printed map rasterised at 220 dpi and cropped, so
 * x runs left to right (0 to about 1220) and y runs top to bottom (0 to about 1110),
 * with Marine Drive sea face at the top and Gate 1 (facing Hotel Oberoi) on the right.
 * The map is a schematic, not a survey. See docs/MAP.md for how to retrace it for another year.
 */
window.LITFEST_CAMPUS = {
  viewBox: [-10, -46, 1250, 1176],
  boundary: { x: 25, y: 65, w: 1110, h: 1038, r: 84 },

  /* Places that host sessions (type "indoor" or "outdoor") or are a hub. */
  venues: [
    {
      id: "jbt", name: "Jamshed Bhabha Theatre", short: "Jamshed Bhabha", lane: "J. Bhabha", type: "indoor",
      shape: [[237,763],[485,763],[525,803],[582,803],[582,975],[478,975],[458,1013],[222,1013],[157,948],[157,850]],
      label: [372, 892], node: [150, 893],
      entries: [{ at: [148, 893], dir: 0 }],
      access: [[182, 803], [482, 997]]
    },
    {
      id: "godrej", name: "Godrej Theatre", short: "Godrej", lane: "Godrej", type: "indoor",
      shape: [[682,808],[740,808],[740,912],[582,912],[582,870],[682,870]],
      label: [661, 891], node: [742, 902],
      entries: [{ at: [752, 902], dir: 180 }],
      access: [],
      note: "Enter from the Sunken Garden side."
    },
    {
      id: "et", name: "Experimental Theatre", short: "Experimental", lane: "Experim.", type: "indoor",
      shape: [[582,670],[682,670],[682,870],[582,870]],
      label: [632, 770], labelRotate: -90, node: [690, 720],
      entries: [{ at: [694, 720], dir: 180 }],
      access: [[700, 768]]
    },
    {
      id: "little", name: "Little Theatre", short: "Little", lane: "Little", type: "indoor",
      shape: [[683,973],[848,973],[848,1072],[683,1072]],
      label: [765, 1022], node: [772, 1090],
      entries: [{ at: [772, 1086], dir: 270 }],
      access: [[743, 962]]
    },
    {
      id: "egarden", name: "Experimental Garden", short: "Exp. Garden", lane: "Garden", type: "outdoor",
      shape: [[623,488],[730,488],[730,650],[623,650]],
      label: [676, 470], node: [636, 660],
      entries: [{ at: [636, 656], dir: 270 }],
      access: [[717, 666]],
      note: "Home of the Poetry Garden."
    },
    {
      id: "doorbeen", name: "The Doorbeen Library Tent", short: "Doorbeen Tent", lane: "Doorbeen", place: "Sunken Garden", type: "outdoor",
      shape: [[740,815],[880,815],[880,912],[740,912]],
      label: [810, 878], node: [888, 902],
      entries: [{ at: [886, 902], dir: 180 }],
      access: [[872, 798]],
      note: "Inside the Sunken Garden."
    },
    {
      id: "hub", name: "Festival Hub", short: "Festival Hub", type: "hub",
      shape: [[550,250],[550,763],[237,763],[237,692],[357,546],[325,518],[372,463]],
      label: [430, 690], node: [556, 660],
      entries: [{ at: [530, 280], dir: 90 }, { at: [234, 694], dir: -45 }, { at: [556, 660], dir: 180 }],
      access: [[574, 628]],
      note: "Bookstore, book swap, food and the festival desk."
    }
  ],

  /* Buildings shown for orientation only. */
  buildings: [
    [[122,250],[185,250],[185,268],[212,268],[233,190],[233,158],[280,158],[277,205],[300,218],[326,245],[342,292],[348,352],[485,190],[537,190],[122,642],[122,610],[160,568],[158,540],[122,540],[122,480],[158,480],[158,445],[122,445]],
    [[560,243],[615,243],[615,592],[560,592]],
    [[848,973],[1076,973],[1076,1072],[848,1072]]
  ],

  parking: [
    [33,220,29,640], [745,680,133,28], [745,733,133,29],
    [960,790,27,125], [1008,792,28,143], [1040,792,27,143]
  ],

  gates: [
    { id: "g1", name: "Gate 1", hint: "Facing Hotel Oberoi", at: [1135, 865], side: "right" },
    { id: "g2", name: "Gate 2", hint: "Marine Drive", at: [600, 65], side: "top" },
    { id: "g3", name: "Gate 3", hint: "Marine Drive", at: [100, 65], side: "top" }
  ],

  /* Walkways. Each is a polyline; shared points join them into one network for directions.
     `hidden: true` links are walkable but not drawn (open lawns and garden floors). */
  paths: [
    { pts: [[100,65],[100,765],[100,893],[100,1010],[112,1042],[140,1060],[172,1063],[618,1063]] },
    { pts: [[100,893],[150,893]] },
    { pts: [[100,765],[234,694]] },
    { pts: [[600,65],[600,150],[545,214],[530,280]] },
    { pts: [[530,280],[430,560],[485,560],[485,660],[556,660],[618,660]] },
    { pts: [[618,660],[636,660],[700,660],[700,720]] },
    { pts: [[700,720],[922,720],[922,798],[922,902],[922,940],[700,940],[700,720]] },
    { pts: [[690,720],[700,720]] },
    { pts: [[778,798],[922,798]] },
    { pts: [[888,902],[922,902]] },
    { pts: [[700,940],[618,945],[618,1063]] },
    { pts: [[618,1063],[650,1063],[650,1090],[772,1090]] },
    { pts: [[1135,865],[1095,865],[1095,965],[922,965],[922,940]] },
    { pts: [[234,694],[485,660]], hidden: true },
    { pts: [[888,902],[742,902]], hidden: true }
  ],

  /* Numbered amenities, as printed on the map legend. */
  amenities: {
    1:  { name: "Festival Desk", at: [[425,622],[157,835],[890,873]] },
    2:  { name: "Workshops", at: [[710,535],[660,690],[608,892],[827,833],[823,997]] },
    3:  { name: "Kitab Khana Bookstore", at: [[490,735]] },
    4:  { name: "Book Swap", at: [[320,735]] },
    5:  { name: "Poetry in the Park", at: [[710,577]] },
    6:  { name: "Sensory Calming Tent", at: [[645,515]] },
    7:  { name: "Food and drink", at: [[352,580],[790,833]] },
    8:  { name: "The Doorbeen Library Tent", at: [[862,833]] },
    9:  { name: "Book Signing", at: [[480,510],[755,833]] },
    10: { name: "Italian Excellence: Pinocchio's New Clothes", at: [[645,565]] }
  },

  /* Live location.
     `centre` is NCPA (Wikipedia: 18°55′30″N 72°49′14″E). Inside `campusRadius` metres the app treats you as on campus.
     `metresPerUnit` is an estimate from the campus area (about 32,000 m²); it is only used for walking-time hints.
     The blue "you are here" dot appears only after at least two `points` are recorded on site, because the printed
     map is a schematic. Record them with index.html?calibrate (see docs/MAP.md) and paste the result here. */
  geo: {
    centre: [18.9251, 72.8206],
    campusRadius: 230,
    metresPerUnit: 0.17,
    walkMetresPerMinute: 65,
    points: []
  },

  labels: {
    sea: { text: "Marine Drive sea face", at: [700, -12] },
    side: { text: "Facing Hotel Oberoi", at: [1196, 480] },
    title: { text: "NCPA campus", at: [800, 330] }
  }
};
