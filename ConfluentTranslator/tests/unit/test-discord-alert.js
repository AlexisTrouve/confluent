/**
 * Test de discordAlert (monitoring couche 1).
 *
 * QUOI : verrouille le THROTTLE (anti-spam) et la garantie BEST-EFFORT (jamais de throw, no-op sans
 *        webhook). On ne teste PAS le POST réel (réseau) — il est vérifié en live.
 * POURQUOI : si reportError throw ou n'est pas throttlé, il casse l'app ou noie Discord — les deux
 *        ruinent le monitoring. Logique déterministe testée sans réseau.
 */
'use strict';
const { reportError, shouldAlert, _resetThrottle } = require('../../src/utils/discordAlert');

let pass = 0, fail = 0;
const check = (l, c) => { if (c) { pass++; console.log('  ✓ ' + l); } else { fail++; console.log('  ✗ ' + l); } };

console.log('\n[1] Throttle (anti-spam) par label');
_resetThrottle();
check('1er appel → alerte', shouldAlert('x', 1000, 5000) === true);
check('doublon dans la fenêtre → coupé', shouldAlert('x', 2000, 5000) === false);
check('après la fenêtre → ré-alerte', shouldAlert('x', 7000, 5000) === true);
check('label différent → indépendant (pas throttlé)', shouldAlert('y', 2000, 5000) === true);

console.log('\n[2] Best-effort : jamais de throw, no-op sans webhook');
delete process.env.DISCORD_WEBHOOK_URL;
let threw = false;
try { reportError('test', new Error('boom'), { a: 1 }); } catch (e) { threw = true; }
check('sans webhook → ne throw pas (no-op)', threw === false);
try { reportError('t2', null); reportError('t3', undefined, null); reportError('t4', 'string err'); } catch (e) { threw = true; }
check('entrées nulles/bizarres → ne throw pas', threw === false);

console.log(`\n${fail === 0 ? '✓' : '✗'} discord-alert : ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
