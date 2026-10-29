import React, {useState} from 'react';
import {apiRequest} from '../../lib/apiClient';
export default function ProfessionalPhoto({photo,name,onSaved}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function upload(event) {
  const file=event.target.files?.[0]; event.target.value=''; if(!file)return;
  setError('');setBusy(true);
  try {
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Choose a JPG, PNG or WebP photo under 5 MB.');
   const bitmap=await createImageBitmap(file);
   const canvas=document.createElement('canvas');const scale=Math.min(1,512/Math.max(bitmap.width,bitmap.height));
   canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(!blob||blob.size>512*1024)throw Error('Please choose a simpler or smaller photo.');
   const data=new FormData();data.append('photo',blob,'profile.png');
   await apiRequest('/api/care/profile/photo',{method:'POST',body:data});await onSaved();
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <div className="professional-photo"><div className="professional-avatar">{photo?<img src={photo} alt={name+' profile'}/>:<span aria-label="No profile photo">{name?.charAt(0)||'P'}</span>}</div><div><h3>Profile picture</h3><p>Shown on your published profile. Choose a clear professional portrait.</p><label className="professional-upload">{busy?'Uploading…':'Upload photo'}<input aria-label="Upload profile picture" disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/></label><small>JPG, PNG or WebP · up to 5 MB</small>{error&&<p role="alert" className="care-error">{error}</p>}</div></div>;
}
