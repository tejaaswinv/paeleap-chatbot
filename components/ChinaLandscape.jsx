import { useId } from "react";

/**
 * Original vector landscape, drawn in code with no external image requests.
 * Decorative only; all informative text is ordinary, accessible HTML.
 */
export default function ChinaLandscape() {
  const gradientPrefix = useId().replace(/:/g, "");
  return (
    <div className="china-landscape" aria-hidden="true">
      <div className="china-landscape-orbit china-landscape-orbit-one" />
      <div className="china-landscape-orbit china-landscape-orbit-two" />
      <div className="china-scene-lantern china-scene-lantern-left"><span /></div>
      <div className="china-scene-lantern china-scene-lantern-right"><span /></div>
      <svg viewBox="0 0 1200 470" className="china-scene-svg" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={`${gradientPrefix}-c-mountain-back`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8bdb1" stopOpacity=".2" />
            <stop offset="1" stopColor="#749b8e" stopOpacity=".46" />
          </linearGradient>
          <linearGradient id={`${gradientPrefix}-c-mountain-mid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#56786d" stopOpacity=".23" />
            <stop offset="1" stopColor="#345f58" stopOpacity=".64" />
          </linearGradient>
          <linearGradient id={`${gradientPrefix}-c-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b6d4c6" stopOpacity=".18" />
            <stop offset=".56" stopColor="#a6c5b6" stopOpacity=".54" />
            <stop offset="1" stopColor="#f0e5d0" stopOpacity=".82" />
          </linearGradient>
          <linearGradient id={`${gradientPrefix}-c-mist`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff9ed" stopOpacity="0" />
            <stop offset="1" stopColor="#fff9ed" stopOpacity=".8" />
          </linearGradient>
          <radialGradient id={`${gradientPrefix}-c-sun-glow`}>
            <stop offset="0" stopColor="#e7ad73" stopOpacity=".55" />
            <stop offset="1" stopColor="#e7ad73" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle className="china-scene-sun-glow" cx="806" cy="128" r="116" fill={`url(#${gradientPrefix}-c-sun-glow)`} />
        <circle cx="806" cy="128" r="44" fill="#dc9671" opacity=".85" />
        <circle cx="806" cy="128" r="49" fill="none" stroke="#ba695b" strokeWidth="1" opacity=".28" />

        <g className="china-scene-cloud china-scene-cloud-one" fill="none" stroke="#b88b68" strokeWidth="2.2" strokeLinecap="round" opacity=".47">
          <path d="M119 115c29-18 47 6 65-8 22-17 48-10 51 7h33c18 0 23 16 12 23H95" />
          <path d="M164 147h98M195 156h52" />
        </g>
        <g className="china-scene-cloud china-scene-cloud-two" fill="none" stroke="#9e9885" strokeWidth="2" strokeLinecap="round" opacity=".4">
          <path d="M955 91c18-19 44-13 52 0 16-14 39-9 47 7h52c16 0 21 16 4 19H934" />
          <path d="M965 130h96M995 139h52" />
        </g>

        <g className="china-scene-birds" fill="none" stroke="#4c5a50" strokeLinecap="round" strokeWidth="2.2" opacity=".6">
          <path d="m601 114 12 6 11-6m13-7 9 5 9-5m-80 27 7 4 8-4" />
        </g>

        <g className="china-scene-mountain-rear">
          <path d="M-30 296Q58 270 116 225Q143 205 161 170Q208 219 240 239Q296 211 325 178Q370 222 418 241Q476 194 497 143Q559 205 611 234Q653 217 679 185Q754 260 814 270Q875 202 912 159Q980 238 1040 248Q1091 214 1135 190L1230 294v160H-30Z" fill={`url(#${gradientPrefix}-c-mountain-back)`} />
          <path d="M133 222q16-36 28-52 16 27 33 39M478 190q13-31 19-47 19 31 37 44M897 195q8-18 15-36 17 24 29 34" fill="none" stroke="#b3bcb1" strokeWidth="2" opacity=".45" />
        </g>
        <g className="china-scene-mountain-middle">
          <path d="M-35 350Q60 308 109 275Q158 242 191 211Q229 267 272 290Q323 267 360 231Q399 271 449 304Q512 266 545 223Q599 273 660 308Q706 283 748 245Q809 291 875 310Q951 266 1005 232Q1095 294 1230 325V470H-35Z" fill={`url(#${gradientPrefix}-c-mountain-mid)`} />
        </g>

        <path d="M0 317c212 41 370 41 547 0 194-45 429-18 653 15v138H0Z" fill={`url(#${gradientPrefix}-c-water)`} />
        <path d="M0 329c180 31 348 20 505-10 225-46 466-1 695 11" fill="none" stroke="#fff9ed" strokeWidth="12" opacity=".34" />
        <g className="china-scene-water" fill="none" stroke="#49786e" strokeLinecap="round" opacity=".34">
          <path d="M80 371h151m-125 12h65m145-7h167m78 15h153m35-23h155m-515 50h187m135-4h204m-640 17h175m526-25h106" />
          <path d="M731 345h79m-57 12h142m-681 52h85" />
        </g>

        <g className="china-scene-island" fill="#36594b">
          <path d="M818 317q22-26 48-23 26-17 48 0 20-5 33 25Z" opacity=".45" />
          <path d="M793 326q57-16 158 0" stroke="#31564c" strokeWidth="2" fill="none" opacity=".4"/>
        </g>
        <g className="china-scene-pavilion" transform="translate(855 224)">
          <path d="M-49 52h98M-39 6h78M-32 5v48M32 5v48M-18 9v44M18 9v44" fill="none" stroke="#403d33" strokeWidth="4" />
          <path d="M-64 2Q-28-13-3-39 21-12 63 2Q34 4 0-2Q-34 4-64 2Z" fill="#5f5346" />
          <path d="M-47-2Q-22-15-3-32 16-11 49-2" fill="none" stroke="#a97652" strokeWidth="2"/>
          <path d="M-48 17h96M-53 57h106M-61 63h122" fill="none" stroke="#423e33" strokeWidth="3" />
          <path d="M-17 23h34v30h-34Z" fill="#e3cc9e" opacity=".7" />
          <path d="M-2 21v32" stroke="#805b40" strokeWidth="2"/>
        </g>
        <g className="china-scene-bridge" fill="none" stroke="#535a4b" strokeLinecap="round">
          <path d="M152 338q129-102 258 0" strokeWidth="6" opacity=".66" />
          <path d="M152 338q129-62 258 0" strokeWidth="4" opacity=".55" />
          <path d="M165 327q115-87 232 0" strokeWidth="2" opacity=".6" />
          <path d="M184 312v24m43-43v43m51-53v53m53-43v43m44-22v22" strokeWidth="3" opacity=".5"/>
        </g>
        <g className="china-scene-reeds" fill="none" stroke="#547363" strokeWidth="2" strokeLinecap="round" opacity=".46">
          <path d="M0 421q54-13 77-48M0 436q43-10 70-23M0 413q32 0 57-58M1199 434q-60-21-88-63M1199 425q-44-18-71-10M1199 445q-64-30-89-12" />
        </g>
        <rect y="412" width="1200" height="58" fill={`url(#${gradientPrefix}-c-mist)`} />
      </svg>
      <div className="china-scene-bottom-fade" />
    </div>
  );
}
