/* Access gate for the admin page.
   shortcut: this checks the code in the browser, which only keeps casual visitors out; anyone can read
   the hash below and skip the gate. Before real data is connected, move the check to the server
   (Supabase Auth or an edge function) so the data itself refuses unsigned requests. */

// SHA-256 of the demo code. Change the code: run  node -e "console.log(require('crypto').createHash('sha256').update('NEW-CODE').digest('hex'))"
const CODE_HASH = '4efb0ba5a26bb5ed096a09262144e41eacc8c54d6127307733ae46cc2b4f8599';
const SESSION = 'polaris-admin-session';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const isSignedIn = () => { try { return sessionStorage.getItem(SESSION) === CODE_HASH; } catch { return false; } };
export async function signIn(code) {
  const ok = (await sha256(code.trim())) === CODE_HASH;
  if (ok) { try { sessionStorage.setItem(SESSION, CODE_HASH); } catch { /* private mode */ } }
  return ok;
}
export const signOut = () => { try { sessionStorage.removeItem(SESSION); } catch { /* nothing stored */ } };
