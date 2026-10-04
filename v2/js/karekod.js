/* Karekod (QR): biletteki kod. Dış kütüphane yok. Bayt kipi, hata düzeltme
   seviyesi M, sürüm 1 – 2 (en çok 26 bayt); rezervasyon numarası sürüm 1'e sığar.
   Doğruluğu testte bağımsız bir çözücüyle (jsQR) ölçülür.
   Canlıda kodun içeriği sunucunun imzaladığı bir değer olacak. */

/* sürüm → [boyut, veri sözcüğü, hata düzeltme sözcüğü, hizalama merkezi] */
const V={1:[21,16,10,0],2:[25,28,16,18]};

/* GF(256), indirgeme polinomu 0x11D */
const mul=(a,b)=>{let r=0;for(let i=7;i>=0;i--){r=(r<<1)^((r>>>7)*0x11D);r^=((b>>>i)&1)*a}return r&255};
function rsDivisor(n){const r=new Array(n).fill(0);r[n-1]=1;let root=1;
  for(let i=0;i<n;i++){for(let j=0;j<n;j++){r[j]=mul(r[j],root);if(j+1<n)r[j]^=r[j+1]}root=mul(root,2)}return r}
function rsRemainder(data,div){const r=div.map(()=>0);
  for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>{r[i]^=mul(c,f)})}return r}

/* Metnin karekod matrisi: true koyu modül */
export function karekod(text){
  const bytes=[...new TextEncoder().encode(text)];
  const ver=bytes.length<=14?1:bytes.length<=26?2:0;if(!ver)throw new Error('karekod: metin çok uzun');
  const [n,dc,ec,al]=V[ver];
  /* veri bitleri: kip 0100, 8 bit uzunluk, baytlar, sonlandırıcı, dolgu */
  const bits=[];const put=(v,len)=>{for(let i=len-1;i>=0;i--)bits.push((v>>>i)&1)};
  put(4,4);put(bytes.length,8);bytes.forEach(b=>put(b,8));
  put(0,Math.min(4,dc*8-bits.length));while(bits.length%8)bits.push(0);
  const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(''),2));
  for(let p=0;data.length<dc;p++)data.push(p%2?0x11:0xEC);
  const words=data.concat(rsRemainder(data,rsDivisor(ec)));

  const m=[...Array(n)].map(()=>Array(n).fill(false)),fn=[...Array(n)].map(()=>Array(n).fill(false));
  const set=(x,y,d)=>{m[y][x]=d;fn[y][x]=true};
  /* bulucu desenler ve ayraçları */
  for(const [cx,cy] of [[3,3],[n-4,3],[3,n-4]])
    for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=n||y>=n)continue;
      const d=Math.max(Math.abs(dx),Math.abs(dy));set(x,y,d!==2&&d!==4)}
  /* zamanlama */
  for(let i=8;i<n-8;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
  /* hizalama (sürüm 2) */
  if(al)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(al+dx,al+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
  /* biçim bilgisi: seviye M, maske 0 → 0x5412 */
  const f=0x5412,fb=i=>((f>>>i)&1)===1;
  for(let i=0;i<=5;i++)set(8,i,fb(i));
  set(8,7,fb(6));set(8,8,fb(7));set(7,8,fb(8));
  for(let i=9;i<15;i++)set(14-i,8,fb(i));
  for(let i=0;i<8;i++)set(n-1-i,8,fb(i));
  for(let i=8;i<15;i++)set(8,n-15+i,fb(i));
  set(8,n-8,true);
  /* veri: sağ alttan zikzak, maske 0 ((x+y) çift ise ters) */
  let k=0;
  for(let right=n-1;right>=1;right-=2){if(right===6)right=5;
    for(let v=0;v<n;v++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?n-1-v:v;
      if(fn[y][x])continue;
      const b=k<words.length*8?((words[k>>>3]>>>(7-(k&7)))&1)===1:false;k++;
      m[y][x]=b!==((x+y)%2===0)}}
  return m;
}

/* SVG: 4 modül sessiz alanla */
export function karekodSvg(text,label){
  const m=karekod(text),n=m.length,q=4;let d='';
  m.forEach((row,y)=>row.forEach((on,x)=>{if(on)d+='M'+(x+q)+' '+(y+q)+'h1v1h-1z'}));
  return '<svg class="qr" viewBox="0 0 '+(n+2*q)+' '+(n+2*q)+'" role="img" aria-label="'+(label||'Karekod')+'" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>';
}
