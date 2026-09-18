export function DecorativeBirds(){
  return <div className="romantic-scene" aria-hidden="true">
    <svg className="hummingbird hummingbird-left" viewBox="0 0 220 170" role="presentation">
      <defs>
        <linearGradient id="hbLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cf467b"/>
          <stop offset=".55" stopColor="#e974a7"/>
          <stop offset="1" stopColor="#df6731"/>
        </linearGradient>
      </defs>
      <g fill="url(#hbLeft)">
        <path d="M112 80c-23-30-62-42-98-24 31 1 54 13 70 35-28-6-53 1-72 22 32-11 62-6 84 12 14 11 30 14 48 9-9-19-11-37-5-55-9 1-18 1-27 1Z"/>
        <path d="M118 77c10-30 33-54 72-70-20 20-31 39-35 57 23-9 43-8 61 3-30 1-54 11-71 29-8 8-17 15-27 20 1-13 1-26 0-39Z"/>
        <ellipse cx="118" cy="92" rx="24" ry="17"/>
        <circle cx="139" cy="85" r="10"/>
        <path d="M146 84 215 74 151 92Z"/>
        <path d="M102 106 74 153 111 119Z"/>
        <path d="M116 109 99 158 128 118Z"/>
      </g>
      <circle cx="142" cy="82" r="2.5" fill="#2d2322"/>
    </svg>

    <svg className="hummingbird hummingbird-right" viewBox="0 0 220 170" role="presentation">
      <defs>
        <linearGradient id="hbRight" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#df6731"/>
          <stop offset=".5" stopColor="#e6ad76"/>
          <stop offset="1" stopColor="#cf467b"/>
        </linearGradient>
      </defs>
      <g fill="url(#hbRight)">
        <path d="M112 80c-23-30-62-42-98-24 31 1 54 13 70 35-28-6-53 1-72 22 32-11 62-6 84 12 14 11 30 14 48 9-9-19-11-37-5-55-9 1-18 1-27 1Z"/>
        <path d="M118 77c10-30 33-54 72-70-20 20-31 39-35 57 23-9 43-8 61 3-30 1-54 11-71 29-8 8-17 15-27 20 1-13 1-26 0-39Z"/>
        <ellipse cx="118" cy="92" rx="24" ry="17"/>
        <circle cx="139" cy="85" r="10"/>
        <path d="M146 84 215 74 151 92Z"/>
        <path d="M102 106 74 153 111 119Z"/>
        <path d="M116 109 99 158 128 118Z"/>
      </g>
      <circle cx="142" cy="82" r="2.5" fill="#2d2322"/>
    </svg>

    <svg className="floral floral-left" viewBox="0 0 220 260" role="presentation">
      <defs>
        <linearGradient id="petalPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4afc8"/>
          <stop offset="1" stopColor="#cf467b"/>
        </linearGradient>
        <linearGradient id="petalOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3b47d"/>
          <stop offset="1" stopColor="#df6731"/>
        </linearGradient>
      </defs>
      <path d="M25 255C61 190 91 142 165 69" stroke="#a18463" strokeWidth="3" fill="none" opacity=".5"/>
      <path d="M66 188c-29-1-43-15-47-35 24-5 43 4 52 28Z" fill="#c9a97d" opacity=".7"/>
      <path d="M119 123c-21-12-27-30-20-48 22 5 36 18 39 40Z" fill="#c9a97d" opacity=".65"/>
      <g transform="translate(154 58)">
        <ellipse rx="18" ry="34" transform="rotate(0)" fill="url(#petalOrange)"/>
        <ellipse rx="18" ry="34" transform="rotate(60)" fill="url(#petalOrange)"/>
        <ellipse rx="18" ry="34" transform="rotate(120)" fill="url(#petalOrange)"/>
        <circle r="11" fill="#f3c270"/>
      </g>
      <g transform="translate(92 143) scale(.8)">
        <ellipse rx="18" ry="34" transform="rotate(0)" fill="url(#petalPink)"/>
        <ellipse rx="18" ry="34" transform="rotate(60)" fill="url(#petalPink)"/>
        <ellipse rx="18" ry="34" transform="rotate(120)" fill="url(#petalPink)"/>
        <circle r="11" fill="#f3c270"/>
      </g>
    </svg>

    <svg className="floral floral-right" viewBox="0 0 220 260" role="presentation">
      <defs>
        <linearGradient id="petalPink2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4afc8"/>
          <stop offset="1" stopColor="#cf467b"/>
        </linearGradient>
        <linearGradient id="petalOrange2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c093"/>
          <stop offset="1" stopColor="#df6731"/>
        </linearGradient>
      </defs>
      <path d="M195 255C160 190 129 142 55 69" stroke="#a18463" strokeWidth="3" fill="none" opacity=".5"/>
      <path d="M154 188c29-1 43-15 47-35-24-5-43 4-52 28Z" fill="#c9a97d" opacity=".7"/>
      <path d="M101 123c21-12 27-30 20-48-22 5-36 18-39 40Z" fill="#c9a97d" opacity=".65"/>
      <g transform="translate(66 58)">
        <ellipse rx="18" ry="34" transform="rotate(0)" fill="url(#petalPink2)"/>
        <ellipse rx="18" ry="34" transform="rotate(60)" fill="url(#petalPink2)"/>
        <ellipse rx="18" ry="34" transform="rotate(120)" fill="url(#petalPink2)"/>
        <circle r="11" fill="#f3c270"/>
      </g>
      <g transform="translate(128 143) scale(.8)">
        <ellipse rx="18" ry="34" transform="rotate(0)" fill="url(#petalOrange2)"/>
        <ellipse rx="18" ry="34" transform="rotate(60)" fill="url(#petalOrange2)"/>
        <ellipse rx="18" ry="34" transform="rotate(120)" fill="url(#petalOrange2)"/>
        <circle r="11" fill="#f3c270"/>
      </g>
    </svg>

    <span className="floating-petal fp-one"/>
    <span className="floating-petal fp-two"/>
    <span className="floating-petal fp-three"/>
    <span className="floating-petal fp-four"/>
  </div>;
}
