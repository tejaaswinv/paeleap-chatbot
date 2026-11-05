/**
 * Three original vector postcards for the journey prompts. Decorative art
 * only, no remote images/fonts and no pre-written chat responses.
 */
export default function ChinaDestinationArt({ index = 0 }) {
  const type = index % 3;
  return (
    <svg className={"imperial-destination-art art-"+type} viewBox="0 0 420 186"
      preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {type === 0 ? (
        <>
          <circle cx="330" cy="34" r="30" fill="#eeb570" opacity=".65"/>
          <path d="M0 120 95 90 175 115 264 82 420 125V186H0Z" fill="#a9322b" opacity=".45"/>
          <path d="M0 146 98 120 198 143 293 109 420 153V186H0Z" fill="#611c1c" opacity=".58"/>
          <g transform="translate(162 38)" stroke="#edbd74" strokeWidth="1.4">
            <path d="M0 56 68 38 140 56 140 63 0 63Z" fill="#e9b26b"/>
            <path d="M14 69H127V135H14Z" fill="#a53f32"/>
            <path d="M-20 66Q35 57 68 5Q106 55 163 66Q130 77 68 67Q12 77-20 66Z" fill="#52211e" strokeWidth="2"/>
            <path d="M-9 57Q39 44 68 12 102 45 151 57" fill="none" stroke="#f3c782" strokeWidth="3"/>
            <path d="M-20 66Q69 85 163 66" fill="none" stroke="#efb56c" strokeWidth="4"/>
            <path d="M15 79H125" strokeWidth="5"/>
            {Array.from({length:6},(_,i)=><g key={i}>
              <path d={"M"+(23+i*18)+" 84v48"} stroke="#db9a5b" strokeWidth="4"/>
              <rect x={24+i*18} y="90" width="10" height="19" fill="#75231f" strokeWidth=".8"/>
            </g>)}
            <path d="M8 133H133M-5 138H148" strokeWidth="4"/>
            <path d="M-36 145H180" stroke="#eec485" strokeWidth="6"/>
          </g>
          <g fill="none" stroke="#f5ca83" opacity=".85">
            <path d="M0 143Q29 134 50 144T101 144M-25 164Q28 151 65 165T140 164"/>
            <path d="M278 161Q309 147 348 162T425 158"/>
          </g>
        </>
      ) : type === 1 ? (
        <>
          <circle cx="335" cy="44" r="34" fill="#f3d5a5" opacity=".8"/>
          <path d="M0 103Q68 69 113 86T221 79Q330 46 420 88V186H0Z" fill="#8aa295" opacity=".62"/>
          <path d="M0 132Q87 112 160 126T288 106Q365 90 420 122V186H0Z" fill="#648a7b" opacity=".65"/>
          <path d="M0 141Q96 126 171 142T338 139Q389 126 420 147V186H0Z" fill="#c9e1d2"/>
          <g fill="none" stroke="#fbf3de" opacity=".86">
            <path d="M10 152h155m-98 8h123m88-5h127m-89 11h78"/>
          </g>
          <g transform="translate(249 25)" stroke="#384e44" strokeWidth="1.7">
            <path d="M14 87h108v5H14zM29 36h79v55H29z" fill="#d2b47e"/>
            <path d="M-7 41Q30 29 70-1Q105 28 147 41Q111 46 70 38Q27 46-7 41Z" fill="#244b40" strokeWidth="3"/>
            <path d="M-2 36Q33 26 70 6Q104 27 143 36" stroke="#bba56d" strokeWidth="2" fill="none"/>
            <path d="M40 46v44m29-47v47m28-44v44" strokeWidth="7"/>
            <path d="M24 64h90" stroke="#e7cf9b" strokeWidth="6"/>
            <path d="M12 97h113" strokeWidth="6"/>
          </g>
          <g fill="none" stroke="#315f45" strokeLinecap="round">
            <path d="M34 0q8 35-8 67M49-9Q59 17 44 53M71-5Q74 33 57 76" strokeWidth="4"/>
            {Array.from({length:6},(_,i)=><path key={i} d={"M"+(34+i*4)+" "+(18+i*6)+"q-31-12-46 8"} strokeWidth="2"/>)}
          </g>
          <g fill="#e5acb4" opacity=".9">
            <ellipse cx="61" cy="162" rx="9" ry="4"/><ellipse cx="118" cy="169" rx="7" ry="3"/>
            <ellipse cx="198" cy="157" rx="8" ry="4"/>
          </g>
        </>
      ) : (
        <>
          <circle cx="331" cy="38" r="35" fill="#e1a871" opacity=".54"/>
          <path d="M0 95 54 68 114 86 163 52 234 71 292 36 420 80V186H0Z" fill="#b37958" opacity=".65"/>
          <path d="M0 111 101 78 167 112 252 73 320 92 420 64V186H0Z" fill="#894b38" opacity=".8"/>
          <path d="M0 147 94 117 192 137 265 113 420 127V186H0Z" fill="#5c342b"/>
          <g transform="translate(258 50)" fill="#e2ad7d" stroke="#9a5b3e" strokeWidth="1.5">
            <path d="M14 22Q23 0 47-5Q78-4 93 24L100 75 86 110 10 110 -3 77Z" fill="#c89068"/>
            <path d="M24 29Q29 5 50 4 76 8 82 34V80H24Z" fill="#deb28a"/>
            <path d="M44 34q-13-6-18 8 3 13 16 12m15-20q16-6 22 8-3 13-18 12" fill="none"/>
            <path d="M39 63q12 7 26-1m-12-9 3 11-4 3M27 80q24 17 49 0" fill="none" strokeWidth="3"/>
            <path d="M21 15q22-19 58 0M13 115h90" strokeWidth="5" fill="none"/>
            <path d="M12 104Q48 90 94 104L113 139H-3Z" fill="#b77755"/>
          </g>
          <g fill="none" stroke="#f7d4a1" opacity=".48">
            <path d="M-20 136Q15 120 45 137T104 136M-10 160Q40 143 92 157T164 159"/>
            <path d="M158 100q22-31 58-14m-38 20q21-19 47-10"/>
          </g>
        </>
      )}
      <rect x="1" y="1" width="418" height="184" fill="none" stroke="#f9d28a" strokeWidth="2" opacity=".42"/>
      <path d="M4 24V4h20M396 4h20v20M4 162v20h20M396 182h20v-20"
        fill="none" stroke="#f5c480" strokeWidth="2" opacity=".8"/>
    </svg>
  );
}
