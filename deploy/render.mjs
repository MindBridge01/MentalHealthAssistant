import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

export function releasePlan(env) {
  assert(env.RENDER_API_KEY, 'Configure the environment secret RENDER_API_KEY.');
  assert(/^(tea|usr)-[a-z0-9]+$/.test(env.RENDER_OWNER_ID || ''), 'Set the intended RENDER_OWNER_ID.');
  const services = JSON.parse(env.RENDER_SERVICES_JSON || '[]');
  assert(Array.isArray(services) && services.length === 5, 'List web, models, chatbot, ingestion and retention services in RENDER_SERVICES_JSON.');
  const images = {app: env.APP_IMAGE, models: env.MODELS_IMAGE};
  for (const value of Object.values(images)) assert(/^ghcr\.io\/[a-z0-9/_-]+@sha256:[a-f0-9]{64}$/.test(value || ''), 'Use immutable GHCR image digests.');
  assert(new Set(services.map(service => service.id)).size === services.length, 'Service IDs must be unique.');
  for (const service of services) {
    assert(/^srv-[a-z0-9]+$/.test(service.id), 'Invalid Render service ID.');
    assert(['web', 'models', 'chatbot', 'ingestion', 'retention'].includes(service.name), 'Unknown deployment role.');
    assert(service.image === (service.name === 'models' ? 'models' : 'app'), 'Incorrect service image.');
  }
  assert.equal(new Set(services.map(service => service.name)).size, 5);
  // Apply compatible migrations on web before restarting dependent workers.
  const order = ['web', 'models', 'chatbot', 'ingestion', 'retention'];
  return services.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)).map(service => ({...service, imageUrl: images[service.image]}));
}
export async function deployRelease({env = process.env, fetchImpl = fetch, sleep = delay, log = console.log} = {}) {
  const plan = releasePlan(env);
  async function api(path, method = 'GET', body) {
    const response = await fetchImpl(`https://api.render.com/v1${path}`, {
      method, headers: {Authorization: `Bearer ${env.RENDER_API_KEY}`, 'Content-Type': 'application/json'},
      ...(body ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(30000),
    });
    // Provider error bodies can contain sensitive configuration. Never print them.
    assert(response.ok, `Render ${method} request failed (${response.status}).`);
    return response.status === 204 ? null : response.json();
  }
  const current = new Map();
  // Validate the complete target set before making any change.
  for (const service of plan) {
    const existing = await api(`/services/${service.id}`);
    assert.equal(existing.ownerId, env.RENDER_OWNER_ID, 'Service belongs to a different workspace.');
    assert.equal(existing.imagePath?.split(/[@:](?=[^/]*$)/)[0], service.imageUrl.split('@')[0], 'Service image repository does not match.');
    current.set(service.id, existing);
  }
  for (const service of plan) {
    const existing = current.get(service.id);
    const image = {ownerId: existing.ownerId, imagePath: service.imageUrl};
    if (existing.registryCredential?.id) image.registryCredentialId = existing.registryCredential.id;
    // Persist the digest for future restarts AND cron runs; a one-off override is insufficient.
    await api(`/services/${service.id}`, 'PATCH', {image, autoDeployTrigger: 'off'});
    const created = await api(`/services/${service.id}/deploys`, 'POST', {imageUrl: service.imageUrl});
    assert(created.id, 'Render did not return a deployment ID.');
    log(`${service.name}: deployment started.`);
    let live = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      const deployment = await api(`/services/${service.id}/deploys/${created.id}`);
      if (deployment.status === 'live') {live = true; break;}
      assert(!['build_failed', 'pre_deploy_failed', 'update_failed', 'canceled', 'deactivated'].includes(deployment.status), `${service.name}: deployment ${deployment.status}. Subsequent services were not changed.`);
      await sleep(10000);
    }
    assert(live, `${service.name}: deployment timed out. Inspect Render before retrying.`);
    log(`${service.name}: live.`);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) deployRelease().catch(error => {console.error(error.message); process.exitCode = 1;});
