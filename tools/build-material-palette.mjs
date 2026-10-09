// Explicit maintainer measurement. Runtime never reads a game path or third-party plugin.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {decodeRaster,meanTextureColour,sha256} from '../src/pixels.mjs';
const [oldSource,textures,gameConf]=process.argv.slice(2);
if(!oldSource||!textures||!gameConf)throw new Error('original palette-data.ts, actual texture directory, game.conf required');
const mapping=readFileSync(oldSource),conf=readFileSync(gameConf);
const pairs=[...mapping.toString().matchAll(/node: '([^']+)', texture: '([^']+)'/g)];
if(pairs.length!==63)throw new Error('expected the original full 63-entry mapping');
const entries=[];
for(const [,nodeName,texture] of pairs){
 if(texture.includes('/')||texture.includes('..'))throw new Error('invalid mapping texture');
 const bytes=readFileSync(join(textures,texture)),decoded=await decodeRaster(bytes);
 entries.push({nodeName,texture,textureSha256:sha256(bytes),...meanTextureColour(decoded.data)});
}
const palette={source:{origin:'HanaWorlds picture-blocks structure-painter',revision:'db87d6f802d975f63144986ca56b979abfacaa23',
 mappingSha256:sha256(mapping),gameConfSha256:sha256(conf),gameVersion:/^version\s*=\s*(.+)$/m.exec(conf.toString())?.[1],
 evidence:'MEASURED_VOXELIBRE_TEXTURE_INDEX; CURRENT_WORLD_TEXTURE_BINDING_UNKNOWN',entries:entries.length,
 method:'alpha-byte-weighted linear-light mean, original node/texture associations; no filename colour inference'},entries};
writeFileSync(resolve('src/material-palette.json'),JSON.stringify(palette,null,2)+'\n');
console.log(JSON.stringify({texturesMeasured:entries.length,paletteSha256:sha256(Buffer.from(JSON.stringify(palette))),source:palette.source}));
