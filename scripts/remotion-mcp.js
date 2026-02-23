#!/usr/bin/env node
import https from 'https';

const args = process.argv.slice(2);
const command = args[0] || 'help';
const param = args.slice(1).join(' ');

const API_TOPICS = {
  interpolate: { url: 'https://www.remotion.dev/docs/interpolate', desc: 'Interpolate values between frames' },
  usecurrentframe: { url: 'https://www.remotion.dev/docs/use-current-frame', desc: 'Get current frame number' },
  usevideoconfig: { url: 'https://www.remotion.dev/docs/use-video-config', desc: 'Get video configuration (fps, duration, width, height)' },
  sequence: { url: 'https://www.remotion.dev/docs/sequence', desc: 'Sequence components in time' },
  series: { url: 'https://www.remotion.dev/docs/series', desc: 'Play items sequentially' },
  composition: { url: 'https://www.remotion.dev/docs/composition', desc: 'Define video compositions' },
  rendermedia: { url: 'https://www.remotion.dev/docs/render-media', desc: 'Render video from composition' },
  lambda: { url: 'https://www.remotion.dev/docs/lambda', desc: 'Cloud rendering with AWS Lambda' },
  audio: { url: 'https://www.remotion.dev/docs/audio', desc: 'Work with audio in videos' },
  video: { url: 'https://www.remotion.dev/docs/video', desc: 'Work with video files' },
  text: { url: 'https://www.remotion.dev/docs/text', desc: 'Render text in videos' },
  spring: { url: 'https://www.remotion.dev/docs/spring', desc: 'Spring animations' },
  staticfile: { url: 'https://www.remotion.dev/docs/static-file', desc: 'Serve static files' },
  continueanimation: { url: 'https://www.remotion.dev/docs/continue-animation', desc: 'Continue animations' },
  delay: { url: 'https://www.remotion.dev/docs/delay', desc: 'Delay execution' },
  random: { url: 'https://www.remotion.dev/docs/random', desc: 'Random number generation' },
  randomid: { url: 'https://www.remotion.dev/docs/random-id', desc: 'Generate random IDs' },
  loop: { url: 'https://www.remotion.dev/docs/loop', desc: 'Loop animations' },
  offthreadvideo: { url: 'https://www.remotion.dev/docs/offthreadvideo', desc: 'Off-thread video loading' },
  useanimation: { url: 'https://www.remotion.dev/docs/use-animation', desc: 'Use animations' },
  getcomposer: { url: 'https://www.remotion.dev/docs/get-composer', desc: 'Get composition root' },
  useimagesequence: { url: 'https://www.remotion.dev/docs/use-image-sequence', desc: 'Image sequence playback' },
  useclippinggroup: { url: 'https://www.remotion.dev/docs/use-clipping-group', desc: 'Clipping groups' },
  usecontext: { url: 'https://www.remotion.dev/docs/use-context', desc: 'React context in Remotion' },
  autoplay: { url: 'https://www.remotion.dev/docs/autoplay', desc: 'Auto-play videos' },
  looploop: { url: 'https://www.remotion.dev/docs/loop', desc: 'Loop media' },
  preview: { url: 'https://www.remotion.dev/docs/preview', desc: 'Preview compositions' },
  config: { url: 'https://www.remotion.dev/docs/config', desc: 'Remotion configuration' },
  still: { url: 'https://www.remotion.dev/docs/still', desc: 'Render still frames' },
  player: { url: 'https://www.remotion.dev/docs/player', desc: 'Video player component' },
  three: { url: 'https://www.remotion.dev/docs/three-gltf', desc: '3D with Three.js' },
  drei: { url: 'https://www.remotion.dev/docs/drei', desc: 'Drei helpers for Three.js' },
  charts: { url: 'https://www.remotion.dev/docs/charts', desc: 'Create charts' },
  ribbon: { url: 'https://www.remotion.dev/docs/ribbon', desc: 'Ribbon effect' },
  slidingsentences: { url: 'https://www.remotion.dev/docs/sliding-sentences', desc: 'Sliding text' },
  svgs: { url: 'https://www.remotion.dev/docs/svgs', desc: 'SVG support' },
  preload: { url: 'https://www.remotion.dev/docs/preload', desc: 'Preload assets' },
};

const EXAMPLES = {
  animations: 'https://www.remotion.dev/docs/animations',
  charts: 'https://www.remotion.dev/docs/charts',
  video: 'https://www.remotion.dev/docs/video-editing',
  audio: 'https://www.remotion.dev/docs/audio',
  text: 'https://www.remotion.dev/docs/text',
  ui: 'https://www.remotion.dev/docs/ui',
  '3d': 'https://www.remotion.dev/docs/three-gltf',
  player: 'https://www.remotion.dev/docs/player',
  lambda: 'https://www.remotion.dev/docs/lambda',
  all: 'https://www.remotion.dev/docs/examples',
};

function help() {
  return `
╔════════════════════════════════════════════════════════════╗
║           Remotion Docs MCP - Help                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Usage: node remotion-mcp.js <command> [params]           ║
║                                                            ║
║  Commands:                                                 ║
║                                                            ║
║    search <query>     Search documentation                ║
║    api <name>         Get API reference                   ║
║    examples [category] Get examples by category           ║
║    list               List all available APIs             ║
║    help               Show this help                       ║
║                                                            ║
║  Examples:                                                 ║
║                                                            ║
║    node remotion-mcp.js search interpolate               ║
║    node remotion-mcp.js api useCurrentFrame               ║
║    node remotion-mcp.js examples charts                   ║
║    node remotion-mcp.js list                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`.trim();
}

function search(query) {
  const q = query.toLowerCase();
  const results = [];
  
  // Search in API topics
  for (const [name, info] of Object.entries(API_TOPICS)) {
    if (name.includes(q) || info.desc.toLowerCase().includes(q)) {
      results.push({ name, ...info, type: 'API' });
    }
  }
  
  // Search in examples
  for (const [name, url] of Object.entries(EXAMPLES)) {
    if (name.includes(q)) {
      results.push({ name, url, desc: 'Examples collection', type: 'Examples' });
    }
  }
  
  if (results.length === 0) {
    return `
🔍 No exact matches for "${query}"

📚 Try these resources:
   • Full docs: https://www.remotion.dev/docs/
   • Search:    https://www.remotion.dev/search?q=${encodeURIComponent(query)}
   • Examples:  https://www.remotion.dev/docs/examples
`.trim();
  }
  
  let output = `🔍 Results for "${query}":\n\n`;
  
  const apis = results.filter(r => r.type === 'API');
  const examples = results.filter(r => r.type === 'Examples');
  
  if (apis.length > 0) {
    output += '📖 APIs:\n';
    for (const r of apis) {
      output += `   • ${r.name}: ${r.url}\n`;
      output += `     ${r.desc}\n\n`;
    }
  }
  
  if (examples.length > 0) {
    output += '📁 Examples:\n';
    for (const r of examples) {
      output += `   • ${r.name}: ${r.url}\n`;
    }
  }
  
  return output.trim();
}

function getApi(name) {
  const key = name.toLowerCase();
  const api = API_TOPICS[key];
  
  if (!api) {
    return `
❓ Unknown API: "${name}"

📚 Full API reference: https://www.remotion.dev/docs/api
🔍 Search: https://www.remotion.dev/search?q=${encodeURIComponent(name)}
`.trim();
  }
  
  return `
╔════════════════════════════════════════════════════════════╗
║  📖 API: ${name.toUpperCase().padEnd(45)}║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  ${api.desc}                      ║
║                                                            ║
║  📄 Documentation: ${api.url}                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`.trim();
}

function listApis() {
  let output = `
╔════════════════════════════════════════════════════════════╗
║           All Available Remotion APIs                     ║
╠════════════════════════════════════════════════════════════╣
`.trim();
  
  // Core APIs
  output += '\n\n📦 Core APIs:\n';
  const core = ['interpolate', 'usecurrentframe', 'usevideoconfig', 'sequence', 'series', 'composition'];
  for (const api of core) {
    output += `   • ${api}: ${API_TOPICS[api].url}\n`;
  }
  
  // Media APIs  
  output += '\n\n🎬 Media APIs:\n';
  const media = ['video', 'audio', 'offthreadvideo', 'loop', 'staticfile'];
  for (const api of media) {
    output += `   • ${api}: ${API_TOPICS[api].url}\n`;
  }
  
  // Animation APIs
  output += '\n\n✨ Animation APIs:\n';
  const anims = ['spring', 'useanimation', 'continueanimation', 'delay', 'random', 'randomid'];
  for (const api of anims) {
    output += `   • ${api}: ${API_TOPICS[api].url}\n`;
  }
  
  // Rendering APIs
  output += '\n\n🎥 Rendering APIs:\n';
  const render = ['rendermedia', 'lambda', 'preview', 'still', 'player', 'config'];
  for (const api of render) {
    output += `   • ${api}: ${API_TOPICS[api].url}\n`;
  }
  
  output += '\n\n📚 More: https://www.remotion.dev/docs/api';
  
  return output;
}

function getExamples(category) {
  const cat = category?.toLowerCase() || 'all';
  const url = EXAMPLES[cat] || EXAMPLES.all;
  
  return `
📁 Examples: ${cat}

🔗 ${url}

Available categories:
${Object.entries(EXAMPLES).map(([k, v]) => `   • ${k}: ${v}`).join('\n')}
`.trim();
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('🔧 Remotion Docs MCP Server');
  console.log('═══════════════════════════════════════════\n');
  
  switch (command) {
    case 'search':
      console.log(search(param));
      break;
    case 'api':
      console.log(getApi(param));
      break;
    case 'examples':
    case 'example':
      console.log(getExamples(param));
      break;
    case 'list':
      console.log(listApis());
      break;
    default:
      console.log(help());
  }
}

main().catch(console.error);
