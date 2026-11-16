// 測試用的假 GitHub contents API（記憶體內），不連真實網路
module.exports = function fakeGitHub(repo = 'tester/private-data') {
  const files = new Map(); let n = 0;
  const handler = async (route) => {
    const req = route.request(); const url = new URL(req.url());
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return json(204, {});
    if ((req.headers().authorization || '') !== 'Bearer good-token') return json(401, { message: 'Bad credentials' });
    if (url.pathname === `/repos/${repo}`) return json(200, { private: true });
    const prefix = `/repos/${repo}/contents/`;
    if (!url.pathname.startsWith(prefix)) return json(404, {});
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (req.method() === 'GET') {
      if (files.has(path)) return json(200, { type: 'file', name: path.split('/').pop(), path, sha: files.get(path).sha, content: files.get(path).content });
      const kids = [...files.keys()].filter((k) => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/'));
      return kids.length ? json(200, kids.map((k) => ({ type: 'file', name: k.split('/').pop(), path: k, sha: files.get(k).sha }))) : json(404, {});
    }
    const body = JSON.parse(req.postData() || '{}');
    if (req.method() === 'PUT') {
      if (files.has(path) && body.sha !== files.get(path).sha) return json(422, { message: 'sha required' });
      files.set(path, { content: body.content, sha: `sha${++n}` }); return json(201, { content: { path } });
    }
    if (req.method() === 'DELETE') { files.delete(path); return json(200, {}); }
    return json(405, {});
  };
  const read = (path) => files.has(path) ? Buffer.from(files.get(path).content, 'base64').toString('utf8') : null;
  const write = (path, text) => files.set(path, { content: Buffer.from(text).toString('base64'), sha: `sha${++n}` });
  return { handler, files, read, write, repo };
};
