# -*- coding: utf-8 -*-
# Détecteur d'incohérences de PROSE : toute mention, dans nuance/sens_litteral/note/
# definition, d'une forme confluent qui N'EXISTE PLUS (forme "morte" = présente au
# baseline pré-nettoyage, absente du lexique actuel) = référence périmée à corriger.
import json, glob, os, re, subprocess
BASE = "e3c4584"  # commit avant les corrections de formes (Corpus fix v1)
files = sorted(glob.glob("ancien-confluent/lexique/*.json"))

def forms_of(d):
    out = set()
    for e in (d.get('dictionnaire') or {}).values():
        for t in (e.get('traductions') or []):
            cf = (t.get('confluent') or '').lower()
            if cf: out.add(cf)
    return out

# formes actuelles
cur_forms = set()
entries = []
for fp in files:
    fn = os.path.basename(fp)
    d = json.load(open(fp, encoding='utf-8'))
    cur_forms |= forms_of(d)
    for k, e in (d.get('dictionnaire') or {}).items():
        for t in (e.get('traductions') or []):
            entries.append((fn, k, t))

# formes au baseline (via git show)
base_forms = set()
for fp in files:
    rel = fp.replace('\\', '/')
    try:
        raw = subprocess.run(["git", "show", f"{BASE}:{rel}"], capture_output=True, text=True, encoding='utf-8')
        if raw.returncode == 0:
            base_forms |= forms_of(json.loads(raw.stdout))
    except Exception:
        pass

# Ensemble des racines/formes DÉCLARÉES (mention légitime même si plus autonome) :
# formes actuelles + formes-liées actuelles + racines data + racines étendues.
declared = set(cur_forms)
for fn, k, t in entries:
    if t.get('forme_liee'): declared.add(t['forme_liee'].lower())
try:
    dat = json.load(open("data/lexique.json", encoding='utf-8'))
    def w(o):
        if isinstance(o, dict):
            for kk in ('forme_base', 'forme_liee'):
                if o.get(kk): declared.add(o[kk].lower())
            for v in o.values(): w(v)
        elif isinstance(o, list):
            for v in o: w(v)
    w(dat)
except Exception: pass
try:
    ext = json.load(open("data/racines-etendues.json", encoding='utf-8'))
    for r, info in (ext.get('racines') or {}).items():
        declared.add(r.lower())
        if info.get('forme_liee'): declared.add(info['forme_liee'].lower())
except Exception: pass

dead = {f for f in (base_forms - declared) if len(f) >= 4}
print(f"baseline={len(base_forms)} déclarées={len(declared)} | MORTES (vraies)={len(dead)}")

FIELDS = ('nuance', 'sens_litteral', 'note', 'definition')
hits = []
for fn, k, t in entries:
    for fld in FIELDS:
        txt = t.get(fld) or ''
        for f in dead:
            if re.search(r'(?<![a-z])' + re.escape(f) + r'(?![a-z])', txt):
                hits.append((fn, k, fld, f))

from collections import Counter
byform = Counter(h[3] for h in hits)
print(f"\n=== INCOHÉRENCES DE PROSE : {len(hits)} mentions de formes mortes ({len(byform)} formes distinctes) ===")
for f, n in byform.most_common():
    exemples = [f"{h[0][:10]}/{h[1]}" for h in hits if h[3] == f][:3]
    print(f"  {f:16} x{n:3}  ex: {exemples}")
