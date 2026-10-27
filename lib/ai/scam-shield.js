/**
 * Narrow deterministic China travel fraud-advice path.
 * Only call after normal safety classification. Never verify links, QR codes,
 * sellers, payment accounts, or users; never echo submitted links or secrets.
 */
const specificEn = [
  /\b(?:is|was|could|might)\s+(?:this|it|that|the\s+(?:link|site|qr(?:\s+code)?|seller|agent|ticket|booking|payment))\b.{0,120}\b(?:safe|legit(?:imate)?|real|official|trustworthy|fake|a scam|fraudulent|phishing)\b/i,
  /\b(?:can i trust|should i (?:pay|send money|scan|use|click)|check (?:this|whether|if)|verify (?:this|if|whether)|help me (?:check|verify))\b.{0,120}\b(?:link|qr|ticket|booking|payment|alipay|wechat|weixin|merchant|seller|agency|travel agent|refund|website|site)\b/i,
  /\b(?:scammed|a scam|fraud|phishing|fake (?:ticket|booking|payment|qr|travel agent|tour guide)|impersonat(?:ion|ing)|suspicious (?:payment|link|seller|qr|agent|ticket))\b.{0,140}\b(?:travel|trip|china|ticket|tour|hotel|booking|payment|qr|alipay|wechat|weixin|agent|refund|link|seller)\b/i,
  /\b(?:travel|trip|china|ticket|tour|hotel|booking|payment|qr|alipay|wechat|weixin|agent|refund|link|seller)\b.{0,140}\b(?:scammed|a scam|phishing|fake (?:ticket|booking|payment|qr|travel agent)|impersonat(?:ion|ing)|suspicious (?:payment|link|seller|qr|agent|ticket))\b/i,
  /\b(?:agent|seller|guide|driver|hotel|ticket office|tour operator)\b.{0,110}\b(?:asked|wants|told|insists|pressur(?:es|ing))\b.{0,100}\b(?:personal (?:account|wallet|qr)|private (?:account|wallet)|outside (?:the )?(?:app|platform)|pay (?:off|outside).?platform)\b/i
];
const specificZh = [
  /(?:这个|這個|这条|這條|二维码|二維碼|商家|卖家|賣家|旅行社|票|门票|門票|付款|支付|网址|網站).{0,85}(?:安全吗|安全嗎|靠谱吗|靠譜嗎|是真的吗|是真的嗎|是假的吗|是假的嗎|是官网吗|是官網嗎|可信吗|可信嗎|诈骗吗|詐騙嗎|骗局|騙局|钓鱼|釣魚)/u,
  /(?:安全吗|安全嗎|靠谱吗|靠譜嗎|正规吗|正規嗎|是不是诈骗|是不是詐騙|怎么核实|怎麼核實|帮我核实|幫我核實|如何验证|如何驗證).{0,90}(?:链接|連結|网址|網址|二维码|二維碼|收款|支付|支付宝|支付寶|微信|门票|門票|车票|車票|旅行社|票|酒店|預訂|预订|卖家|賣家)/u,
  /(?:机票|機票|门票|門票|车票|車票|旅行|旅游|旅遊|酒店|预订|預訂|支付|付款|扫码|掃碼|支付宝|支付寶|微信|收款|链接|連結|网站|網站).{0,100}(?:被骗|被騙|诈骗|詐騙|骗局|騙局|钓鱼|釣魚|冒充|假冒|假票|可疑收款)/u,
  /(?:被骗|被騙|诈骗|詐騙|骗局|騙局|钓鱼|釣魚|冒充|假冒|假票|可疑收款).{0,100}(?:机票|機票|门票|門票|车票|車票|旅行|旅游|旅遊|酒店|预订|預訂|支付|付款|扫码|掃碼|支付宝|支付寶|微信|收款|链接|連結|网站|網站)/u,
  /(?:票务|票務|导游|導遊|旅行社|酒店|卖家|賣家|商家).{0,85}(?:要求|叫我|让我|讓我|催我).{0,85}(?:私人|个人|個人).{0,30}(?:账户|帳戶|账号|賬號|二维码|二維碼|收款码|收款碼|转账|轉賬)/u
];
const exposureEn = /\b(?:already paid|i paid|have paid|sent (?:them )?money|transferred (?:the )?money|lost money|charged my card|gave (?:them )?my (?:otp|verification code|password|card details)|they took my money)\b/i;
const exposureZh = /(?:已经付款|已經付款|已付款|付款了|已经转账|已經轉賬|转账了|轉賬了|钱转了|錢轉了|被骗了|被騙了|损失了钱|損失了錢|提供了验证码|提供了驗證碼|泄露了密码|洩露了密碼)/u;
const riskEn = /\b(?:scam(?:med)?|fraud|phish|fake|suspicious|unofficial|unknown seller|personal (?:account|wallet)|qr code|qr|booking agent|ticket agent|travel agent|payment link|refund link|wechat|weixin|alipay)\b/i;
const riskZh = /(?:诈骗|詐騙|被骗|被騙|骗局|騙局|可疑|非官方|私人收款|个人收款|個人收款|扫码|掃碼|二维码|二維碼|旅行社|票务|票務|假票|退款链接|退款連結|支付宝|支付寶|微信)/u;

// Generic FAQ requests about paying in China or avoiding scams are excluded.
export function scamPreventionReply(message, language = "en") {
  if (typeof message !== "string" || !message.trim() || message.length > 1500) return null;
  const text = message.normalize("NFKC").replace(/[\p{Cf}\u034f]/gu, "");
  // Preserve published FAQ identity for broad advice requests such as
  // "如何避免旅游骗局？" and "中国旅行如何防范诈骗？".
  const genericZh = /^(?:(?:在中国|在中國|中国旅行|中國旅行|旅游|旅遊).{0,10})?(?:(?:如何|怎么|怎麼|怎样|怎樣).{0,12})?(?:避免|防范|防範|预防|預防|识别|識別|防止).{0,16}(?:骗局|騙局|诈骗|詐騙|假票)[？?。!！\s]*$/u;
  const genericEn = /\b(?:how (?:can|do) i|what precautions should|i want to)\b.{0,130}\b(?:avoid|prevent|precautions|tips|scammed by unofficial ticket sellers)\b|\bwhat precautions should (?:a )?tourists? take\b/i;
  const describedItem = /\b(?:this|that|these|my|someone (?:sent|asked)|already paid|i paid|verify this|can i trust this)\b|https?:\/\/|\bqr\b/i;
  if (genericZh.test(text.trim()) || (genericEn.test(text) && !describedItem.test(text))) return null;
  if (![...specificEn, ...specificZh].some(rule => rule.test(text))) return null;
  const exposed = (exposureEn.test(text) || exposureZh.test(text)) && (riskEn.test(text) || riskZh.test(text));
  const reply = exposed
    ? language === "zh"
      ? "先暂停进一步付款和沟通，不要提供验证码、登录密码或银行卡资料。保存订单、聊天和付款凭证的截图（不必发送给我）。尽快通过银行或支付平台的官方应用联系客服，询问冻结账户、申诉或追款的可能性；也可以向当地警方及相关平台举报。不要相信要求再次付款才能“追回损失”的陌生人。我无法实时验证交易，也不能保证追回款项。"
      : "Stop further payments and do not share verification codes, passwords, or card details. Keep copies of the order, messages, and payment receipts for your records (no need to send them here). Contact your bank or payment provider using its official app or independently found support channel to ask about freezing, disputing, or recovering the payment. Report the incident to the platform and local police where appropriate. Beware of anyone demanding another fee to 'recover' lost money. I cannot verify this transaction or guarantee recovery."
    : language === "zh"
      ? "我无法实时检查这个链接、二维码、卖家或收款账户，因此不能判断它一定安全或一定是诈骗。付款前请自行打开景区、交通运营方或预订平台的官方应用或网站，核对订单、商户名称及支付页面。不要仅凭聊天消息中的链接付款，也不要向陌生人的私人账户转账、分享验证码或登录密码。若对方催促你绕过正常付款流程，请先停止交易并通过官方客服核实。不要在聊天中发送完整银行卡资料或验证码。"
      : "I cannot check this link, QR code, seller, or payment account live, so I cannot confirm it is safe or fraudulent. Before paying, independently open the attraction, transport operator, or booking platform's official website or app. Compare the order, merchant name, and checkout flow. Don't rely solely on links in a message, transfer to an unknown person's wallet, or share one-time codes or passwords. If someone pressures you to pay outside the normal platform checkout, stop and contact official support independently. Please don't paste full card details or verification codes into chat.";
  return Object.freeze({kind: exposed ? "possible_payment_exposure" : "unverified_payment_or_booking",reply,
    liveChecked:false,linkChecked:false,merchantVerified:false});
}
