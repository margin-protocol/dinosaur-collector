#!/usr/bin/env python3
"""Deterministic 60s portrait motion-graphics trailer. Existing art stays untouched.
Requires Python 3, Pillow, NumPy, ffmpeg; no downloads or API keys.
"""
from pathlib import Path
from functools import lru_cache
import argparse, json, math, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/review/event-001-trailer'
W,H=1080,1920;FPS=30;DURATION=60
INK='#272c2d';RED='#963b36';MUTED='#74685e';PAPER='#eee7d9';GOLD='#967c58'
SERIF='/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc'
BOLD='/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc'
SANS='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
SCENES=[
 (0,3,'opening'),(3,8,'bride'),(8,12,'puppet'),(12,17,'wen'),(17,22,'bounty'),
 (22,25,'du'),(25,28,'xu'),(28,31,'you'),(31,34,'lin'),(34,37,'cheng'),(37,40,'jian'),
 (40,45,'manor'),(45,50,'title'),(50,54,'pools'),(54,60,'schedule')]
RESIDENTS={
 'du':('杜今朝','靖安司辦案。','mo-005-du-jinzhao','mo-03-long-street'),
 'xu':('徐汀云','你想知道什麼？\n價錢另議。','mo-004-xu-tingyun','mo-07-ghost-market'),
 'you':('游未遲','這身衣裳，\n我見過三次。','mo-003-you-weichi','mo-08-old-mortuary'),
 'lin':('林晏洄','說話慢，你別急。','mo-007-lin-yanhui','mo-04-misty-river'),
 'cheng':('程不言','一方不曾允諾，\n何來兩姓之好？','mo-006-cheng-buyan','mo-05-ruined-temple'),
 'jian':('簡牧陽','有什麼壞掉的，\n交給我！','mo-008-jian-muyang','mo-06-peach-village')}
def clamp(x):return max(0.,min(1.,x))
def smooth(x):x=clamp(x);return x*x*(3-2*x)
@lru_cache(None)
def font(size,bold=False,sans=False):return ImageFont.truetype(SANS if sans else BOLD if bold else SERIF,size,index=3)
@lru_cache(None)
def img(path):return Image.open(ROOT/path).convert('RGBA')
@lru_cache(None)
def fit(path,width,height):return img(path).resize((width,height),Image.Resampling.LANCZOS)
def text_layer(lines,y,size=70,color=INK,align='center',x=100,gap=25,bold=False,tracking=0):
 layer=Image.new('RGBA',(W,H));d=ImageDraw.Draw(layer)
 for n,line in enumerate(lines.split('\n')):
  f=font(size,bold);length=d.textlength(line,font=f)+(len(line)-1)*tracking
  xx=(W-length)/2 if align=='center' else x
  if tracking:
   for ch in line:d.text((xx,y+n*(size+gap)),ch,font=f,fill=color);xx+=d.textlength(ch,font=f)+tracking
  else:d.text((xx,y+n*(size+gap)),line,font=f,fill=color)
 return layer
def over(frame,layer,opacity=1,dx=0,dy=0):
 if opacity<=0:return
 if opacity<.999:
  layer=layer.copy();layer.putalpha(layer.getchannel('A').point(lambda a:int(a*opacity)))
 frame.alpha_composite(layer,(int(dx),int(dy)))
def centered(frame,text,y,size=64,color=INK,opacity=1,**kwargs):over(frame,text_layer(text,y,size,color,**kwargs),opacity)
def asset_character(path,height=1070):
 im=img(path);box=im.getbbox();im=im.crop(box);return im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
@lru_cache(None)
def character(path,height=1070):return asset_character(path,height)
def place_character(frame,path,u,height=1070,x=None,y=280,fade=.65):
 im=character(path,height);xx=(W-im.width)//2 if x is None else x
 opacity=smooth(u/fade);dy=round(24*(1-smooth(u/.9)))
 over(frame,im,opacity,xx,y+dy)
# A stable paper-fibre field, generated as motion-graphics texture, not replacement artwork.
rng=np.random.default_rng(1001)
base=np.zeros((H,W,3),np.float32);base[:]=[238,231,217]
noise=rng.normal(0,1.6,(H,W,1));base+=noise
for row in range(0,H,3):base[row:row+1]+=rng.uniform(-.7,.7)
PAPER_IMG=Image.fromarray(np.clip(base,0,255).astype('uint8')).convert('RGBA')
Y,X=np.mgrid[0:480,0:270];X=X/270;Y=Y/480
INKFIELD=(np.hypot((X-.44)*1.0,(Y-.46)*.85)+.025*np.sin(X*63+Y*18)+.018*np.sin(Y*74-X*12)+.013*np.sin(X*119+Y*138))
@lru_cache(None)
def paper_base():
 p=PAPER_IMG.copy();d=ImageDraw.Draw(p);d.line((90,1730,990,1730),fill='#c9bcaa',width=1)
 over(p,text_layer('頁 間 居 民',1764,26,MUTED,tracking=3));return p
@lru_cache(None)
def fog_layer():
 fog=Image.new('RGBA',(1450,760));d=ImageDraw.Draw(fog)
 for i in range(15):
  xx=int(rng.integers(-150,1300));yy=int(rng.integers(0,650));d.ellipse((xx,yy,xx+500,yy+140),fill=(240,237,226,32))
 return fog.filter(ImageFilter.GaussianBlur(45))
@lru_cache(None)
def background_plate(path,dark=False,anchor=.5):
 im=img(path);scale=max(1180/im.width,1440/im.height);im=im.resize((int(im.width*scale),int(im.height*scale)),Image.Resampling.LANCZOS)
 left=int((im.width-1180)*anchor);im=im.crop((left,0,left+1180,1440))
 if dark:im=ImageEnhance.Color(im).enhance(.65);im=ImageEnhance.Brightness(im).enhance(.52)
 alpha=np.ones((1440,1180),np.uint8)*255;alpha[940:]=np.linspace(255,0,500,dtype='uint8')[:,None];im.putalpha(Image.fromarray(alpha));return im
def scene_base(path,u,dark=False,anchor=.5):
 frame=paper_base().copy();bg=background_plate(path,dark,anchor);pan=int(25*math.sin(u*.15));over(frame,bg,1,-50+pan,125-int(u*3))
 return frame
def label(frame,left,right='墨痕江湖'):
 d=ImageDraw.Draw(frame);d.text((96,161),left,font=font(26,sans=True),fill=MUTED);box=d.textbbox((0,0),right,font=font(26,sans=True));d.text((984-(box[2]-box[0]),161),right,font=font(26,sans=True),fill=MUTED)
def slash(frame,u,when=.15):
 p=clamp((u-when)/.30)
 if p<=0 or u>when+.85:return
 im=Image.new('RGBA',(W,H));d=ImageDraw.Draw(im);ax,ay=-100,1240;bx,by=1180,400;ex=ax+(bx-ax)*p;ey=ay+(by-ay)*p
 d.polygon([(ax-12,ay-24),(ex-12,ey-24),(ex+10,ey+25),(ax+16,ay+20)],fill=(28,36,38,235));d.line([(ax,ay),(ex,ey)],fill=(238,231,217,220),width=5)
 for j in range(5):d.line([(ax,ay+j*12),(ex-70,ey+j*4)],fill=(28,36,38,140),width=2)
 over(frame,im,1-smooth((u-when-.45)/.4))
def particles(frame,t,red=True):
 d=ImageDraw.Draw(frame,'RGBA')
 for i in range(8):
  xx=int((i*173+math.sin(t*.5+i)*55+t*16)%1180-50);yy=int((i*257+t*(21+i))%1050+180)
  if red:d.ellipse((xx,yy,xx+7,yy+15),fill=(145,55,49,55))
  else:d.ellipse((xx,yy,xx+3,yy+3),fill=(221,211,186,80))
def ribbons(frame,u):
 # Two flowing red silk strips are drawn as vector motion graphics over the manor.
 if u<.35 or u>3:return
 im=Image.new('RGBA',(W,H));d=ImageDraw.Draw(im)
 for k in range(2):
  xx=np.linspace(-200,1280,90);yy=760+k*320+125*np.sin(xx/240-u*2.8+k);width=40+12*np.sin(xx/170+u)
  pts=list(zip(xx,yy-width))+list(zip(xx[::-1],(yy+width)[::-1]));
  if u<2.05:d.polygon(pts,fill=(152,33,39,225))
  else:
   cut=50;left=[p for p in pts if p[0]<W/2-cut];right=[p for p in pts if p[0]>W/2+cut]
   offset=int((u-2.05)*340);d.polygon([(x-offset,y-offset*.3) for x,y in left],fill=(152,33,39,225));d.polygon([(x+offset,y+offset*.3) for x,y in right],fill=(152,33,39,225))
 over(frame,im,1-smooth((u-2.5)/.5))
def compose(name,u):
 if name=='opening':
  frame=paper_base().copy();q=smooth((u-.10)/2.0)
  field=INKFIELD;mask=np.clip((q*.50-field)*18,0,1);im=Image.new('RGBA',(270,480),(34,43,43,0));im.putalpha(Image.fromarray((mask*245).astype('uint8')));im=im.resize((W,H),Image.Resampling.BILINEAR);over(frame,im)
  centered(frame,'一紙紅妝。\n一場出逃。',690,86,'#f3ebdc',opacity=smooth((u-.6)/.7),gap=38)
  centered(frame,'頁間居民 · EVENT 001',1110,30,'#e3cdb1',opacity=smooth((u-1)/.6),tracking=3)
  return frame
 if name=='bride':
  frame=scene_base('assets/scene/event-mo/mo-01-bamboo-sedan.webp',u,False,.75);label(frame,'01  /  花轎空空')
  if u>.65:place_character(frame,'assets/characters/siang-117-haitang-bride.webp',u-.65,height=975,y=335)
  centered(frame,'「我要嫁給誰？」',1370,72,opacity=smooth((u-.8)/.6))
  centered(frame,'「怎麼都沒有人問過我？」',1490,62,opacity=smooth((u-2.25)/.6))
 elif name=='puppet':
  frame=scene_base('assets/scene/event-mo/mo-01-bamboo-sedan.webp',u,True,.55);label(frame,'02  /  紙傀抬頭')
  place_character(frame,'assets/enemies/event-mo/mo-01-wedding-puppet.webp',u,height=1100,y=260,fade=1.1)
  fog=fog_layer();over(frame,fog,.85,-int(u*30),600)
  centered(frame,'紙人的臉上，',1405,70,opacity=smooth((u-.4)/.6))
  centered(frame,'畫著一模一樣的笑。',1515,66,opacity=smooth((u-1.3)/.6))
 elif name=='wen':
  frame=scene_base('assets/scene/event-mo/mo-04-misty-river.webp',u,True);label(frame,'03  /  遇見止水')
  place_character(frame,'assets/characters/mo-001-wen-zhishui.webp',u-.25,height=1070,y=260)
  slash(frame,u);centered(frame,'聞 止 水',1350,45,MUTED,opacity=smooth((u-.8)/.5));centered(frame,'「站我後面。」',1460,95,opacity=smooth((u-1.2)/.7))
 elif name=='bounty':
  frame=scene_base('assets/scene/event-mo/mo-02-inn.webp',u);label(frame,'04  /  十萬兩客棧')
  # A typographic bounty notice; the source illustration is kept unchanged.
  notice=Image.new('RGBA',(700,690),'#e4d6be');d=ImageDraw.Draw(notice);d.rectangle((25,25,674,664),outline='#9f8970',width=2);d.text((225,55),'懸 賞',font=font(73,True),fill=INK);d.text((155,185),'活捉 · 十萬兩',font=font(51,True),fill=RED);d.line((75,295,625,295),fill='#bba78a',width=2)
  thumb=character('assets/characters/siang-117-haitang-bride.webp',290);notice.alpha_composite(thumb,((700-thumb.width)//2,330));over(frame,notice,smooth(u/.7),190,325)
  place_character(frame,'assets/characters/siang-117-haitang-bride.webp',u-1.65,height=540,x=540,y=830)
  centered(frame,'「我好貴喔。」',1450,92,RED,opacity=smooth((u-2.1)/.4))
  centered(frame,'海棠新娘小湘',1590,32,MUTED,opacity=smooth((u-2.1)/.4))
 elif name in RESIDENTS:
  person,quote,art,bg=RESIDENTS[name];frame=scene_base(f'assets/scene/event-mo/{bg}.webp',u)
  label(frame,'江湖眾人  /  '+str(list(RESIDENTS).index(name)+1).zfill(2))
  place_character(frame,f'assets/characters/{art}.webp',u,height=1040,y=285,fade=.34)
  centered(frame,person,1330,83,opacity=smooth((u-.12)/.3),tracking=8)
  centered(frame,quote,1470,64,opacity=smooth((u-.18)/.3),gap=24)
 elif name=='manor':
  frame=scene_base('assets/scene/event-mo/mo-09-red-manor.webp',u,True);label(frame,'紅帖山莊  /  不再退讓')
  place_character(frame,'assets/characters/mo-001-wen-zhishui.webp',u-1.5,height=990,y=340)
  ribbons(frame,u);slash(frame,u,2.0)
  centered(frame,'「她說了，',1375,90,opacity=smooth((u-2.2)/.4));centered(frame,'不嫁。」',1500,118,RED,opacity=smooth((u-2.6)/.4))
 elif name=='title':
  frame=paper_base().copy();label(frame,'頁間居民 · EVENT 001','限定劇情活動')
  # Preserve the entire landscape key visual; no title baked over characters.
  art=fit('assets/events/mo/key-visual.webp',1080,608);over(frame,art,1,0,500)
  edge=Image.new('RGBA',(W,H));aa=np.zeros((H,W),dtype='uint8');aa[1150:1300]=np.linspace(0,255,150,dtype='uint8')[:,None];aa[1300:]=255;edge.paste(PAPER_IMG,(0,0));edge.putalpha(Image.fromarray(aa));over(frame,edge)
  centered(frame,'十萬兩紅妝',1285,142,INK,opacity=smooth((u-.45)/.7),tracking=2)
  centered(frame,'此 生 護 卿',1505,53,RED,opacity=smooth((u-1.4)/.7),tracking=5)
 elif name=='pools':
  frame=paper_base().copy();label(frame,'墨玉閣  /  上下卷卡池')
  centered(frame,'相逢於江湖',290,74)
  for n,(kind,caption) in enumerate([('up','上卷  11/26 12:00 開放'),('down','下卷  11/29 12:00 開放')]):
   art=fit(f'assets/events/mo/pool-{kind}.webp',940,470);over(frame,art,smooth((u-n*.35)/.4),70,475+n*580);centered(frame,caption,960+n*580,37,MUTED,opacity=smooth((u-n*.35)/.4))
 elif name=='schedule':
  frame=paper_base().copy();label(frame,'頁間居民 · EVENT 001','台灣時間 UTC+8')
  centered(frame,'十萬兩紅妝',330,111,tracking=2);centered(frame,'此 生 護 卿',505,38,RED,tracking=5)
  d=ImageDraw.Draw(frame)
  for n,(line,when) in enumerate([('上卷・紅妝出逃','11/26 12:00'),('下卷・江湖不嫁','11/29 12:00'),('活動討伐至','12/10'),('墨玉閣至','12/17')]):
   yy=650+n*206;centered(frame,line,yy,35,MUTED);centered(frame,when,yy+58,76,INK);d.line((180,yy+180,900,yy+180),fill='#d0c1ab',width=1)
  centered(frame,'SSR 聞止水',1510,48,RED);centered(frame,'SSR 海棠新娘小湘  登場',1585,47,RED)
 else:raise ValueError(name)
 if name not in ('pools','schedule'):particles(frame,u,not name=='puppet')
 return frame
# Ink-bleed transitions reveal the incoming plate; at most .42s to protect reading time.
@lru_cache(None)
def transition_mask(index):
 cx=[.2,.8,.5,.1][index%4];cy=[.45,.6,.2,.7][index%4]
 return np.hypot((X-cx)*.9,(Y-cy)*1.2)+.03*np.sin(X*67+Y*20)+.019*np.sin(Y*91+X*35)
def frame_at(t):
 idx=next((i for i,(start,end,_) in enumerate(SCENES) if start<=t<end),len(SCENES)-1);start,end,name=SCENES[idx];u=t-start;frame=compose(name,u)
 if idx and u<.42:
  previous=compose(SCENES[idx-1][2],SCENES[idx-1][1]-SCENES[idx-1][0]-.01)
  field=transition_mask(idx);q=u/.42;alpha=np.clip((q*1.6-field)*18,0,1);mask=Image.fromarray((alpha*255).astype('uint8')).resize((W,H),Image.Resampling.BILINEAR);frame=Image.composite(frame,previous,mask)
 if t>59.5:
  black=Image.new('RGBA',(W,H),(31,33,34,255));over(frame,black,smooth((t-59.5)/.5))
 return frame.convert('RGB')
def make_audio():
 sr=48000;audio=np.zeros((sr*DURATION,2),np.float64);prng=np.random.default_rng(2001)
 def add(sig,start,pan=0):
  pos=int(start*sr);n=min(len(sig),len(audio)-pos)
  if n<=0:return
  audio[pos:pos+n,0]+=sig[:n]*(.75-pan*.2);audio[pos:pos+n,1]+=sig[:n]*(.75+pan*.2)
 def pluck(freq,start,amp=.15,dur=3.5,pan=0):
  tt=np.arange(int(sr*dur))/sr;sig=np.zeros_like(tt)
  for h in range(1,10):
   decay=np.exp(-tt*(1.25+.28*h));sig+=np.sin(2*np.pi*freq*h*tt+.005*np.sin(tt*8))*decay/(h**1.35)
  sig*=np.minimum(tt/.006,1);add(sig*amp,start,pan)
 # Original sparse pentatonic composition, string-like synthesized timbre; no borrowed recording.
 melody=[(0.4,220),(2,329.63),(3.4,293.66),(5.4,261.63),(7,220),(8.3,146.83),(10.1,164.81),(12.2,196),(13.6,293.66),(15,329.63),(17.3,392),(18.2,440),(19.2,523.25),(20.1,392),
 (22,261.63),(23.2,392),(25,293.66),(26.2,440),(28,329.63),(29.2,493.88),(31,293.66),(32.2,440),(34,261.63),(35.2,392),(37,329.63),(38.2,523.25),(40,146.83),(41,196),(42.15,293.66),(43.2,392),(45.1,261.63),(46.1,329.63),(47.2,392),(48.1,523.25),(50.1,440),(51.5,392),(53,329.63),(54.2,261.63),(56.2,392),(58.1,261.63)]
 for i,(start,f) in enumerate(melody):pluck(f,start,.10 if start<12 else .13,pan=(-1)**i*.55)
 for start,f in [(0,110),(8,73.416),(12,98),(22,130.81),(28,110),(34,87.31),(40,73.416),(45,130.81),(50,110),(54,130.81)]:pluck(f,start,.12,5.5)
 # Paper rustle / ink drop / sword air, original synthesized sound effects.
 for start,amp,dur in [(0.35,.12,.5),(8.1,.035,1.2),(12.15,.19,.7),(40.5,.07,1.2),(42,.23,.75)]:
  tt=np.arange(int(sr*dur))/sr;noise=prng.normal(0,1,len(tt));noise=np.convolve(noise,np.ones(9)/9,mode='same');env=np.sin(np.pi*tt/dur)**2;add(noise*env*amp,start)
 for start in [12.2,22,40,42.2,45]:
  tt=np.arange(sr)/sr;sig=np.sin(2*np.pi*(57*tt+30*(1-np.exp(-tt*12))/12))*np.exp(-tt*8);add(sig*.13,start)
 # Small rising plucks punctuate the joke, without a cartoon voice.
 pluck(659.25,19.2,.07,1.4,.5);pluck(783.99,19.42,.06,1.4,-.5)
 dry=audio.copy()
 for delay,gain in [(.13,.12),(.31,.10),(.47,.07)]:
  shift=int(delay*sr);audio[shift:]+=dry[:-shift,::-1]*gain
 audio[:sr]*=np.linspace(0,1,sr)[:,None];audio[-sr*2:]*=np.linspace(1,0,sr*2)[:,None]
 peak=np.max(np.abs(audio));audio*=.78/max(peak,.78)
 path=OUT/'soundtrack-original.wav'
 with wave.open(str(path),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((np.clip(audio,-1,1)*32767).astype('<i2').tobytes())
 return path
def main():
 p=argparse.ArgumentParser();p.add_argument('--render',action='store_true');p.add_argument('--width',type=int,default=1080);p.add_argument('--stills',action='store_true');p.add_argument('--audio',action='store_true');a=p.parse_args();OUT.mkdir(parents=True,exist_ok=True)
 if a.audio:make_audio();print('Original soundtrack generated.',flush=True)
 if a.stills:
  dest=OUT/'stills';dest.mkdir(exist_ok=True)
  for t in [1.9,6,10,15,20,23.7,26.7,29.7,32.7,35.7,38.7,43.8,48,52,57]:frame_at(t).save(dest/f'{t:04.1f}.jpg',quality=92)
  print('15 keyframes exported.',flush=True)
 if a.render:
  width=a.width;height=width*16//9;dest=OUT/('event-001-shiwanliang-hongzhuang.mp4' if width==1080 else 'preview-720.mp4');audio=OUT/'soundtrack-original.wav'
  if not audio.exists():make_audio()
  cmd=['ffmpeg','-y','-hide_banner','-loglevel','warning','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{width}x{height}','-r',str(FPS),'-i','pipe:0','-i',str(audio),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-af','loudnorm=I=-18:TP=-1.5:LRA=11','-ar','48000','-t',str(DURATION),'-movflags','+faststart',str(dest)]
  proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
  try:
   for i in range(FPS*DURATION):
    frame=frame_at(i/FPS)
    if width!=W:frame=frame.resize((width,height),Image.Resampling.LANCZOS)
    proc.stdin.write(frame.tobytes())
    if i%150==0:print(f'Render {i/FPS:04.1f}/{DURATION}s',flush=True)
  finally:proc.stdin.close()
  if proc.wait():raise RuntimeError('ffmpeg failed')
  print(f'RENDERED {dest}',flush=True)
if __name__=='__main__':main()
