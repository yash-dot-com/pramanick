import fs from 'node:fs/promises';
const names=['punch-lines','announce-title','hero-launch','laptop-frame','agent-steps','status-cycle','block-wordmark','cursor-track','phone-frame','dot-bloom'];
for(const name of names){
 const response=await fetch(`https://snapcn.dev/r/${name}.json`);
 if(!response.ok) throw new Error(`${name}: ${response.status}`);
 const item=await response.json();
 await fs.writeFile(`/tmp/pramanik-v2-${name}.json`,JSON.stringify(item));
 for(const file of item.files??[]) {
   const content=file.content.replaceAll('@/lib/snap-cn-ui','../../lib').replaceAll('@/components/snap-cn/','./');
   const path=`components/snap-cn/${name}.tsx`;
   await fs.writeFile(path,content);
 }
 console.log(name,item.dependencies,item.registryDependencies);
}
