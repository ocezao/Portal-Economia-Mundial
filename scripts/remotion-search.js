#!/usr/bin/env node
import https from 'https';

const query = process.argv[2] || 'remotion';

function searchRemotion(query) {
  return new Promise((resolve, reject) => {
    const url = `https://www.remotion.dev/search?q=${encodeURIComponent(query)}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', reject);
  });
}

async function main() {
  const query = process.argv.slice(2).join(' ') || 'remotion';
  
  console.log(`🔍 Searching Remotion docs for: "${query}"`);
  console.log('='.repeat(50));
  console.log();
  console.log(`📚 Documentation: https://www.remotion.dev/docs/`);
  console.log(`🔎 Search URL:   https://www.remotion.dev/search?q=${encodeURIComponent(query)}`);
  console.log();
  console.log('='.repeat(50));
  console.log();
  
  // Common Remotion topics
  const topics = {
    'interpolate': 'https://www.remotion.dev/docs/interpolate',
    'usecurrentframe': 'https://www.remotion.dev/docs/use-current-frame',
    'usevideoconfig': 'https://www.remotion.dev/docs/use-video-config',
    'sequence': 'https://www.remotion.dev/docs/sequence',
    'composition': 'https://www.remotion.dev/docs/composition',
    'rendermedia': 'https://www.remotion.dev/docs/render-media',
    'lambda': 'https://www.remotion.dev/docs/lambda',
    'audio': 'https://www.remotion.dev/docs/audio',
    'video': 'https://www.remotion.dev/docs/video',
    'text': 'https://www.remotion.dev/docs/text',
    'spring': 'https://www.remotion.dev/docs/spring',
    'series': 'https://www.remotion.dev/docs/series',
    'staticfile': 'https://www.remotion.dev/docs/static-file',
    'continueanimation': 'https://www.remotion.dev/docs/continue-animation',
    'delay': 'https://www.remotion.dev/docs/delay',
    'random': 'https://www.remotion.dev/docs/random',
    'randomid': 'https://www.remotion.dev/docs/random-id',
    'loop': 'https://www.remotion.dev/docs/loop',
    'offthreadvideo': 'https://www.remotion.dev/docs/offthreadvideo',
    'useanimation': 'https://www.remotion.dev/docs/use-animation',
  };
  
  const queryLower = query.toLowerCase().replace(/\s+/g, '');
  
  console.log('📖 Related topics found:');
  console.log();
  
  for (const [topic, url] of Object.entries(topics)) {
    if (topic.includes(queryLower) || queryLower.includes(topic)) {
      console.log(`  • ${topic}: ${url}`);
    }
  }
  
  console.log();
  console.log('='.repeat(50));
  console.log('💡 Tip: Visit https://www.remotion.dev/docs/ for full documentation');
}

main().catch(console.error);
