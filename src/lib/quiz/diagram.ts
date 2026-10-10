type Point = [number, number];
export type Diagram = { paths: { d: string; dashed: boolean; thick: boolean }[]; dots: Point[]; labels: { at: Point; text: string }[]; viewBox: string };
/** Small TikZ drawing subset, parsed as data; no TeX engine, eval, file or network access. */
export function parseDiagram(source: string): Diagram {
  if(source.length>20000) throw new Error("Сызба тым үлкен.");
  const coords: Record<string,Point> = {};
  const paths: Diagram['paths']=[], dots: Point[]=[], labels: Diagram['labels']=[], points: Point[]=[];
  const point=(value:string):Point=> {
    const v=value.trim();
    if(coords[v]) return coords[v];
    if(!/^-?\d*\.?\d+\s*[, :]\s*-?\d*\.?\d+$/.test(v)) throw new Error(`Сызба координатасы танылмады: ${v}`);
    const [a,b]=v.split(/[, :]+/).map(Number);
    if(!Number.isFinite(a+b)||Math.abs(a)>1000||Math.abs(b)>1000) throw new Error("Сызба өлшемі тым үлкен.");
    return v.includes(':') ? [Math.cos(a*Math.PI/180)*b,Math.sin(a*Math.PI/180)*b] : [a,b];
  };
  const xy=(p:Point)=>`${p[0]*50},${-p[1]*50}`;
  const body=source.replace(/(?<!\\)%[^\n]*/g,'').replace(/\\begin\{tikzpicture\}(?:\[[^\]]*\])?/g,'').replace(/\\end\{tikzpicture\}/g,'');
  for(const raw of body.split(';')) {
    let s=raw.trim(); if(!s) continue;
    const coordinate=s.match(/^\\coordinate\s*\((\w+)\)\s+at\s*\(([^)]+)\)$/);
    if(coordinate) {coords[coordinate[1]]=point(coordinate[2]);continue;}
    const command=s.match(/^\\(draw|path|filldraw|node)(?:\[([^\]]*)\])?\s*/);
    if(!command) throw new Error("Сызбада тек draw, path, filldraw, coordinate, node қолданыңыз.");
    const style=command[2]??'';s=s.slice(command[0].length);
    let current:Point=[0,0], origin:Point=[0,0], path='', operation='M';
    if(command[1]==='node') s=`node[${style}] ${s}`;
    while(s.trim()) {
      s=s.trim(); let match:RegExpMatchArray|null;
      if((match=s.match(/^node(?:\[([^\]]*)\])?(?:\s+at\s*\(([^)]+)\))?\s*\{(\$[^$]*\$|[^{}]*)\}/))) {
        const p=match[2]?point(match[2]):current;
        const align=match[1]??'';
        const at:Point=[p[0]+(align.includes('right')?.3:align.includes('left')?-.3:0),p[1]+(align.includes('above')?.3:align.includes('below')?-.3:0)];
        labels.push({at,text:match[3]});points.push(at);s=s.slice(match[0].length);continue;
      }
      if((match=s.match(/^\+\+\(([^)]+)\)/))) {
        const delta=point(match[1]);origin=current;current=[current[0]+delta[0],current[1]+delta[1]];
        path+=`M${xy(current)} `;points.push(current);s=s.slice(match[0].length);continue;
      }
      if((match=s.match(/^\(([^)]+)\)/))) {
        const next=point(match[1]);
        if(operation==='-|') path+=`L${xy([next[0],current[1]])} L${xy(next)} `;
        else if(operation==='|-') path+=`L${xy([current[0],next[1]])} L${xy(next)} `;
        else path+=`${operation}${xy(next)} `;
        current=next;origin=next;points.push(next);operation='M';s=s.slice(match[0].length);continue;
      }
      if((match=s.match(/^(--|-\||\|-)/))) {operation=match[1]==='--'?'L':match[1];s=s.slice(match[0].length);continue;}
      if((match=s.match(/^arc\s*\((-?[\d.]+):(-?[\d.]+):([\d.]+)\)/))) {
        const [a,b,r]=match.slice(1).map(Number);
        if(!Number.isFinite(a+b+r)||r>1000) throw new Error('Сызба доғасы дұрыс емес.');
        for(let k=1;k<=32;k++){const angle=(a+(b-a)*k/32)*Math.PI/180;const p:Point=[origin[0]+r*Math.cos(angle),origin[1]+r*Math.sin(angle)];path+=`L${xy(p)} `;points.push(p);current=p;}
        s=s.slice(match[0].length);continue;
      }
      if((match=s.match(/^circle\s*\(([\d.]+)pt\)/))) {dots.push(current);s=s.slice(match[0].length);continue;}
      throw new Error(`Қолдау жоқ TikZ бөлігі: ${s.slice(0,50)}`);
    }
    if(path && command[1]!=='path') paths.push({d:path,dashed:style.includes('dashed'),thick:style.includes('thick')});
  }
  if(!points.length) throw new Error('Сызба бос.');
  const xs=points.map(p=>p[0]*50),ys=points.map(p=>-p[1]*50);
  const minX=Math.min(...xs)-65,minY=Math.min(...ys)-35;
  return {paths,dots,labels,viewBox:`${minX} ${minY} ${Math.max(...xs)-minX+65} ${Math.max(...ys)-minY+35}`};
}
