/**
 * Red maple, lantern light, antique gold祥云, and traditional lattice edges.
 * An original decorative SVG overlay; uses no external assets.
 */
const leaves = [
  [92,16,-10,.9],[118,27,18,1],[149,19,-24,.9],[177,46,18,.94],
  [213,29,-21,1],[245,55,18,.84],[122,83,-11,.87],[85,102,27,.87],
  [180,90,-15,1],[233,107,10,.78],[268,89,15,.72],[147,118,-16,.83],
  [53,65,-5,.73],[281,45,-26,.77],[306,63,17,.68]
];
export default function ChinaHeroOrnament() {
  return (
    <div className="imperial-hero-ornament" aria-hidden="true">
      <svg viewBox="0 0 1150 330" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id="imperial-lantern" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9b362c"/>
            <stop offset=".5" stopColor="#f4b465"/>
            <stop offset="1" stopColor="#9c362c"/>
          </linearGradient>
          <radialGradient id="imperial-lantern-glow">
            <stop stopColor="#f8bd67" stopOpacity=".68"/>
            <stop offset="1" stopColor="#f8bd67" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <g fill="none" stroke="#572720" strokeWidth="5" strokeLinecap="round">
          <path d="M-15-8Q71 21 134 31T318 72M55-8q46 36 63 95M154 28q27 48 57 86M238 61q13 34 56 48"/>
          <path d="M34 14q47 32 57 83M89 32q3 40 31 73M199 57q4 26 23 55" strokeWidth="2.2"/>
        </g>
        {leaves.map(([x,y,rotate,scale],i)=>(
          <path key={i} transform={"translate("+x+" "+y+") rotate("+rotate+") scale("+scale+")"}
            d="M0-26 7-14 18-18 13-4 27 0 12 8 16 21 2 13 0 28-3 13-18 22-12 8-27 0-12-5-17-18-7-13Z"
            fill={i%3===0?"#b8402f":i%3===1?"#953125":"#c75239"}
            stroke="#7e2924" strokeWidth="1.1" opacity={i%4===0?.82:.95}/>
        ))}
        <g transform="translate(179 14)">
          <line x1="0" y1="0" x2="0" y2="80" stroke="#633d26" strokeWidth="2"/>
          <ellipse cx="0" cy="124" rx="55" ry="70" fill="url(#imperial-lantern-glow)"/>
          <path d="M-27 81Q-35 95-29 132Q-21 161 0 164Q21 161 29 132Q35 95 27 81Z"
            fill="url(#imperial-lantern)" stroke="#a74730" strokeWidth="3"/>
          <path d="M-29 88Q0 81 29 88M-28 153Q0 161 28 153" stroke="#673120" strokeWidth="5" fill="none"/>
          <path d="M-19 91Q-25 126-19 153M0 87v74M19 91Q25 126 19 153" stroke="#f6da96" strokeWidth="2.5" fill="none" opacity=".8"/>
          <rect x="-33" y="79" width="66" height="9" rx="3" fill="#752c25"/>
          <rect x="-25" y="157" width="50" height="9" rx="3" fill="#752c25"/>
          <path d="M0 166v33M-6 170v23M6 170v23" stroke="#9f3e2e" strokeWidth="3"/>
        </g>
        <g fill="none" stroke="#c49a5e" strokeWidth="2" opacity=".76" strokeLinecap="round">
          <path d="M29 255h82q35-41 75-6h29q18 0 16 17H16"/>
          <path d="M90 237q-8-19-24-17-19 3-19 19M148 258q12-35 39-24M114 270h128"/>
          <path d="M868 116h76q21-28 50-5h34q19-7 25 12H861"/>
          <path d="M943 103q-4-16-16-15-14 2-17 15M968 124h135"/>
          <path d="M937 266h48q32-37 65-12h38q18 2 23 20H933"/>
          <path d="M980 277h111M1053 241q16-20 35-8"/>
        </g>
        <g stroke="#8e4636" strokeWidth="5" fill="none" opacity=".77">
          <path d="M3 72V4h68M1079 4h67v68M4 259v67h69M1080 327h67v-67"/>
          <path d="M15 59V15h45M1090 15h44v44M15 272v42h43M1092 315h42v-44" strokeWidth="2.3"/>
        </g>
        <g stroke="#8e4636" strokeWidth="2" fill="none" opacity=".52">
          <path d="M27 16v16h16V16m0 16v16h16V32M1124 16v16h-16V16m0 16v16h-16V32"/>
          <path d="M27 313v-16h16v16m0-16v-16h16v16M1124 313v-16h-16v16m0-16v-16h-16v16"/>
        </g>
      </svg>
    </div>
  );
}
