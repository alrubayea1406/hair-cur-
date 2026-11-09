// Make Node's built-in fetch respect HTTPS_PROXY (needed in cloud sandboxes).
import {EnvHttpProxyAgent, setGlobalDispatcher} from 'undici';

if (process.env.HTTPS_PROXY || process.env.https_proxy) {
  setGlobalDispatcher(new EnvHttpProxyAgent());
}
