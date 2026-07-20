const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Sbhav/.gemini/antigravity/brain/0393ab45-c7a7-466b-a77f-d955cda9b5f5/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');
for (let l of lines) {
  if (l.includes('"USER_INPUT"') && l.includes('ISSUE 1') && l.includes('ISSUE 2')) {
    const data = JSON.parse(l);
    fs.writeFileSync('C:/Users/Sbhav/.gemini/antigravity/brain/0393ab45-c7a7-466b-a77f-d955cda9b5f5/scratch/user_prompt.txt', data.content);
  }
}
