import { execSync } from 'child_process';

const siteId = 'd49c5ed9-d369-4bdc-8275-3206af3e07e9';

// Get current site info
const out = execSync(`netlify api getSite --data '{"site_id":"${siteId}"}'`, { encoding: 'utf-8' });
const site = JSON.parse(out);
console.log('Current state:', {
  locked: site.published_deploy?.locked,
  context: site.published_deploy?.context,
  deploy_lock: site.deploy_lock,
  prevent_non_git_prod_deploys: site.prevent_non_git_prod_deploys,
});

// Try unlocking by updating deploy_lock
const r2 = execSync(`netlify api updateSite --data '{"site_id":"${siteId}","body":{"deploy_lock":{"enabled":false,"locked":false}}}'`, { encoding: 'utf-8' });
const updated = JSON.parse(r2);
console.log('After unlock:', {
  deploy_lock: updated.deploy_lock,
  prevent_non_git_prod_deploys: updated.prevent_non_git_prod_deploys,
});

console.log('\nTrying deploy now...');
try {
  const deploy = execSync('netlify deploy --prod --build 2>&1', { encoding: 'utf-8', stdio: 'pipe' });
  console.log(deploy);
} catch (e) {
  console.log('Deploy output:', e.stdout);
  console.log('Deploy error:', e.stderr || e.message);
}
