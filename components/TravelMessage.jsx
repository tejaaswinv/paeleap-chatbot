import { formatTravelBlocks } from "../lib/client/message-format.js";

/** Render untrusted model output as React text; never as raw HTML. */
function InlineEmphasis({ text }) {
  const pieces=String(text||"").split(/(\*\*[^*\n]+\*\*)/gu);
  return pieces.map((piece,index)=>{
    if(piece.startsWith("**")&&piece.endsWith("**")&&piece.length>4)
      return <strong key={index}>{piece.slice(2,-2)}</strong>;
    return piece;
  });
}

export default function TravelMessage({content}) {
  const blocks=formatTravelBlocks(content);
  if(!blocks.length)return <p className="travel-prose">{content}</p>;
  return <div className="travel-answer" data-travel-answer="formatted">
    {blocks.map((block,index)=>{
      if(block.kind==="day")return (
        <section className="travel-day" key={index}>
          <div className="travel-day-heading">
            <span className="travel-day-symbol" aria-hidden="true">◈</span>
            <h3><InlineEmphasis text={block.title}/></h3>
          </div>
          {block.text && <p className="travel-day-summary"><InlineEmphasis text={block.text}/></p>}
        </section>
      );
      if(block.kind==="heading")return <h3 className="travel-subheading" key={index}><InlineEmphasis text={block.text}/></h3>;
      if(block.kind==="list"){
        const Tag=block.ordered?"ol":"ul";
        return <Tag className="travel-list" key={index}>
          {block.items.map((item,i)=><li key={i}><InlineEmphasis text={item}/></li>)}
        </Tag>;
      }
      return <p key={index} className="travel-prose"><InlineEmphasis text={block.text}/></p>;
    })}
  </div>;
}
