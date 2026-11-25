# 把劇情 thread 交的 md（docs/event-001/MO-xx.md）轉成 js/event-mo-story.js
# 格式：## 開打前／## 打完後／## 上卷結尾 或 ## 下卷結尾（→ ending）；每行一段
import json, glob
SEC = {'開打前': 'before', '打完後': 'after', '上卷結尾': 'ending', '下卷結尾': 'ending'}
out = {}
for f in sorted(glob.glob('docs/event-001/MO-*.md')):
    sid = f.split('/')[-1][:-3].lower(); secs = {}; cur = None
    for line in open(f, encoding='utf-8'):
        line = line.strip()
        if line.startswith('## '): cur = SEC[line[3:].strip()]; secs[cur] = []
        elif cur and line: secs[cur].append(line)
    out[sid] = {k: '\n'.join(v) for k, v in secs.items()}
js = "// 墨痕江湖劇情（湘 11/25 定稿，原稿 docs/event-001/MO-xx.md；用 python3 tools/event-story.py 重新產生）\n// 每行一段：「角色：「台詞」」是對話，整行（）是旁白。before＝關卡頁開打前，after＝首次通關的戰報，ending＝MO-05 上卷結尾／MO-10 尾聲\nexport const MO_STORY = " + json.dumps(out, ensure_ascii=False, indent=2) + ";\n"
open('js/event-mo-story.js', 'w', encoding='utf-8').write(js)
print(sorted(out), [k for k in out if 'ending' in out[k]])
