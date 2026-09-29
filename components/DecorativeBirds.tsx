// Botanical ornament drawn in the official pink–orange palette. Unlike the
// previous stock floral photograph, it contains orchids and a hummingbird.
export function DecorativeBirds() {
  return <div className="romantic-scene" aria-hidden="true">
    <svg className="botanical-frame" viewBox="0 0 1500 700" preserveAspectRatio="xMidYMid slice" role="presentation" focusable="false">
      <defs>
        <linearGradient id="orchid-pink" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFE1EF"/><stop offset=".58" stopColor="#D86190"/><stop offset="1" stopColor="#E0258A"/></linearGradient>
        <linearGradient id="orchid-orange" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFE8B8"/><stop offset=".58" stopColor="#DC8B51"/><stop offset="1" stopColor="#F78806"/></linearGradient>
        <linearGradient id="orchid-center" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#F78806"/><stop offset=".65" stopColor="#D00BB7"/><stop offset="1" stopColor="#80296D"/></linearGradient>
        <linearGradient id="bird-body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#30B09D"/><stop offset=".5" stopColor="#168478"/><stop offset="1" stopColor="#753E86"/></linearGradient>
        <linearGradient id="bird-wing" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#B76C9F"/><stop offset="1" stopColor="#56476F"/></linearGradient>
        <g id="pink-orchid">
          <ellipse cx="0" cy="-25" rx="26" ry="39" fill="url(#orchid-pink)" stroke="#D86190" strokeWidth="1" transform="rotate(-8)"/>
          <ellipse cx="-32" cy="-6" rx="30" ry="22" fill="url(#orchid-pink)" stroke="#D86190" strokeWidth="1" transform="rotate(22)"/>
          <ellipse cx="32" cy="-6" rx="30" ry="22" fill="url(#orchid-pink)" stroke="#D86190" strokeWidth="1" transform="rotate(-22)"/>
          <ellipse cx="-20" cy="24" rx="22" ry="31" fill="url(#orchid-pink)" stroke="#D86190" strokeWidth="1" transform="rotate(42)"/>
          <ellipse cx="20" cy="24" rx="22" ry="31" fill="url(#orchid-pink)" stroke="#D86190" strokeWidth="1" transform="rotate(-42)"/>
          <path d="M-17 -1Q0 -15 17 -1L13 18Q0 33 -13 18Z" fill="url(#orchid-center)"/>
          <path d="M-8 8Q0 19 8 8" fill="none" stroke="#FFE8A3" strokeWidth="3"/>
          <circle cx="0" cy="4" r="4" fill="#FFF2C9"/>
          <g stroke="#AA246F" opacity=".35" strokeWidth=".9" fill="none"><path d="M0 -8V-51M-11 -9L-46 -19M10 -9L46 -19M-11 14L-34 45M11 14L34 45"/></g>
        </g>
        <g id="orange-orchid">
          <ellipse cx="0" cy="-25" rx="26" ry="39" fill="url(#orchid-orange)" stroke="#D45025" strokeWidth="1" transform="rotate(-8)"/>
          <ellipse cx="-32" cy="-6" rx="30" ry="22" fill="url(#orchid-orange)" stroke="#D45025" strokeWidth="1" transform="rotate(22)"/>
          <ellipse cx="32" cy="-6" rx="30" ry="22" fill="url(#orchid-orange)" stroke="#D45025" strokeWidth="1" transform="rotate(-22)"/>
          <ellipse cx="-20" cy="24" rx="22" ry="31" fill="url(#orchid-orange)" stroke="#D45025" strokeWidth="1" transform="rotate(42)"/>
          <ellipse cx="20" cy="24" rx="22" ry="31" fill="url(#orchid-orange)" stroke="#D45025" strokeWidth="1" transform="rotate(-42)"/>
          <path d="M-18 -2Q0 -19 18 -2L14 18Q0 31 -14 18Z" fill="#C63763"/>
          <path d="M-9 7Q0 19 9 7" fill="none" stroke="#FFE8A3" strokeWidth="3"/>
          <circle cx="0" cy="3" r="4" fill="#FFF2C9"/>
        </g>
        <g id="leaf"><path d="M0 0Q-20 -29 10 -60Q31 -27 0 0Z" fill="#5C936E" stroke="#4E7F61" strokeWidth="1"/><path d="M0 0L10 -57" fill="none" stroke="#D7DDA3" strokeWidth="1"/></g>
        <g id="bud"><path d="M0 10Q-22 -9 -11 -24Q0 -37 12 -23Q22 -8 0 10Z" fill="url(#orchid-orange)" stroke="#D86190" strokeWidth="1"/></g>
      </defs>
      <g fill="none" stroke="#6B936C" strokeWidth="5" strokeLinecap="round">
        <path d="M-22 655C65 606 30 460 94 382S128 205 45 127"/>
        <path d="M-20 570C89 540 125 480 188 390S231 302 220 264"/>
        <path d="M-6 687C120 670 158 614 248 606S320 580 350 537"/>
        <path d="M1522 620C1448 558 1475 451 1417 352S1410 169 1509 56"/>
        <path d="M1512 675C1410 644 1330 607 1262 599S1180 570 1130 549"/>
        <path d="M1500 430C1400 439 1353 380 1315 308"/>
      </g>
      <g opacity=".9">
        <use href="#leaf" transform="translate(37 440) rotate(-50) scale(.8)"/>
        <use href="#leaf" transform="translate(97 357) rotate(62) scale(.9)"/>
        <use href="#leaf" transform="translate(135 507) rotate(64)"/>
        <use href="#leaf" transform="translate(210 620) rotate(-15)"/>
        <use href="#leaf" transform="translate(1408 360) rotate(-55)"/>
        <use href="#leaf" transform="translate(1370 530) rotate(62)"/>
        <use href="#leaf" transform="translate(1270 593) rotate(-26)"/>
      </g>
      <g>
        <use href="#orange-orchid" transform="translate(16 110) scale(1.1)"/>
        <use href="#orange-orchid" transform="translate(51 245) scale(.82) rotate(-12)"/>
        <use href="#pink-orchid" transform="translate(102 395) scale(1.16) rotate(15)"/>
        <use href="#orange-orchid" transform="translate(202 374) scale(.92) rotate(-15)"/>
        <use href="#pink-orchid" transform="translate(38 561) scale(1.13) rotate(9)"/>
        <use href="#pink-orchid" transform="translate(216 600) scale(1.08) rotate(-12)"/>
        <use href="#orange-orchid" transform="translate(315 617) scale(.76)"/>
        <use href="#pink-orchid" transform="translate(1472 73) scale(1.15) rotate(13)"/>
        <use href="#orange-orchid" transform="translate(1430 219) scale(.98) rotate(-10)"/>
        <use href="#orange-orchid" transform="translate(1492 352) scale(1.12) rotate(8)"/>
        <use href="#pink-orchid" transform="translate(1414 455) scale(.97) rotate(-18)"/>
        <use href="#orange-orchid" transform="translate(1322 577) scale(.91) rotate(12)"/>
        <use href="#pink-orchid" transform="translate(1480 637) scale(1.23)"/>
        <use href="#pink-orchid" transform="translate(1156 611) scale(.83) rotate(-18)"/>
        <use href="#bud" transform="translate(160 296) rotate(-35)"/>
        <use href="#bud" transform="translate(282 571) rotate(32)"/>
        <use href="#bud" transform="translate(1360 273) rotate(36)"/>
        <use href="#bud" transform="translate(1202 543) rotate(-34)"/>
      </g>
      <g transform="translate(336 305) rotate(-9)">
        <path d="M10 35Q-20 94 -47 130Q-22 112 -6 103Q-13 135 -32 160Q12 142 38 87Z" fill="url(#bird-wing)" opacity=".95"/>
        <path d="M12 48Q-36 -27 -9 -119Q28 -72 53 31Z" fill="url(#bird-wing)" stroke="#75617C" strokeWidth="2"/>
        <path d="M25 49Q42 -31 114 -83Q110 -2 65 66Z" fill="url(#bird-wing)" stroke="#75617C" strokeWidth="2"/>
        <path d="M23 27Q-5 -4 -28 1Q-46 8 -45 25L-119 42L-44 32Q-12 74 16 102Q57 113 63 66Q58 41 23 27Z" fill="url(#bird-body)" stroke="#346D76" strokeWidth="2"/>
        <path d="M-43 25Q-24 15 -12 26L6 49Q-9 48 -19 41Z" fill="#D00BB7"/>
        <path d="M9 58Q33 70 59 63Q49 98 19 91Z" fill="#ECF5E9"/>
        <circle cx="-31" cy="20" r="4" fill="#1E2438"/><circle cx="-32" cy="19" r="1.3" fill="#fff"/>
        <path d="M-14 54Q-3 91 20 109Q8 112 -5 99" fill="none" stroke="#F5DECC" strokeWidth="3"/>
        <g fill="none" stroke="#E8D4D9" opacity=".55" strokeWidth="1.3">
          <path d="M-5 -107L35 32M2 -90L43 38M20 -75L50 42M108 -77L51 49M98 -60L48 57M83 -35L49 60"/>
        </g>
      </g>
    </svg>
  </div>;
}
