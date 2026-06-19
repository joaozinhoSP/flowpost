const token = 'nfc_Zy92EsD19enoSdT1TpBRKVoFprLoQo3s2807';
const base = 'https://api.netlify.com/api/v1';
const siteId = 'd49c5ed9-d369-4bdc-8275-3206af3e07e9';
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const r = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) console.log(`${method} ${path}: ${r.status} ${r.statusText}`);
  return r;
}

async function main() {
  // 1. Check current site settings for deploy_lock
  console.log('=== Current site settings ===');
  const siteRes = await api('GET', `/sites/${siteId}`);
  const site = await siteRes.json();
  console.log('deploy_lock:', JSON.stringify(site.deploy_lock));
  console.log('prevent_non_git_prod_deploys:', site.prevent_non_git_prod_deploys);

  // 2. Update site: disable deploy lock
  console.log('\n=== Disabling deploy lock ===');
  const updateRes = await api('PUT', `/sites/${siteId}`, {
    deploy_lock: { enabled: false }
  });
  const updated = await updateRes.json();
  console.log('deploy_lock after:', JSON.stringify(updated.deploy_lock));

  // 3. Create a new production deploy
  console.log('\n=== Creating production deploy ===');
  try {
    const deployRes = await api('POST', `/sites/${siteId}/deploys`, {
      deploy_context: 'production',
      build: true
    });
    if (deployRes.ok) {
      const deploy = await deployRes.json();
      console.log('Deploy created:', deploy.id, deploy.state, deploy.deploy_url);
    }
  } catch(e) {
    console.log('Deploy failed:', e.message);
  }
}

main().catch(console.error);
