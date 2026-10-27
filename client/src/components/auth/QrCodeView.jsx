import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
export default function QrCodeView({otpAuthUrl,secret}) {
 const [image,setImage]=useState('');
 useEffect(()=>{let active=true;if(otpAuthUrl) QRCode.toDataURL(otpAuthUrl,{width:200,margin:2}).then(url=>{if(active)setImage(url);}).catch(()=>setImage(''));return ()=>{active=false;};},[otpAuthUrl]);
 return <div className="portal-authenticator">{image && <img src={image} width="200" height="200" alt="Scan to add MindBridge to your authenticator" style={{margin:'auto'}}/>}<p>Or enter this setup key manually</p><code style={{wordBreak:'break-all'}}>{secret}</code><p className="registration-footnote">Keep this key private. QR generated on your device.</p></div>;
}