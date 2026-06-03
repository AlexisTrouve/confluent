# -*- coding: utf-8 -*-
# AUDIT 100% — test de cohérence vérifiable du corpus. Objectif : ZÉRO violation.
# Catégories : A phonotactique · B forme≠composition (squelette consonne) ·
# C racines non déclarées (fantômes) · D homophones (1 forme -> N concepts).
import json, glob, os, unicodedata
from collections import defaultdict
def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn').strip()
VOY = set('aeiouy'); LETT = set('abdeiklmnoprstuvyz')
LIAISONS = {'i','ie','ii','iu','u','ui','a','aa','ae','ao','o','oa','e','ei','ea','eo'}
GLUE = {'n','m','zo','zoo','su'}  # négation, pluriel, glue euphonique
def phonok(f):
    if not f: return "vide"
    if any(c not in LETT for c in f): return "char interdit"
    run=0
    for c in f:
        run = 0 if c in VOY else run+1
        if run>=3: return "3 consonnes"
    if len(f)>=2 and f[0] not in VOY and f[1] not in VOY: return "attaque CC"
    return None
def cons(s):  # squelette consonantique
    return ''.join(c for c in s if c not in VOY)

# --- registre des racines déclarées ---
declared=set()
data=json.load(open("data/lexique.json",encoding='utf-8'))
def walk(o):
    if isinstance(o,dict):
        if 'forme_base' in o or 'forme_liee' in o:
            for k in ('forme_base','forme_liee'):
                if o.get(k): declared.add(o[k].lower())
        for v in o.values(): walk(v)
    elif isinstance(o,list):
        for v in o: walk(v)
walk(data)
# racines étendues déclarées (registre Fork 1)
try:
    ext=json.load(open("data/racines-etendues.json",encoding='utf-8'))
    for r,info in (ext.get('racines') or {}).items():
        declared.add(r.lower())
        if info.get('forme_liee'): declared.add(info['forme_liee'].lower())
except Exception: pass
entries=[]
for fp in glob.glob("ancien-confluent/lexique/*.json"):
    fn=os.path.basename(fp); d=json.load(open(fp,encoding='utf-8'))
    for k,e in (d.get('dictionnaire') or {}).items():
        for t in (e.get('traductions') or []):
            cf=(t.get('confluent') or '').lower()
            comp=t.get('composition') or e.get('composition') or ''
            rac=t.get('racines') or e.get('racines') or []
            entries.append((fn,k,cf,comp,rac,t))
            if cf: declared.add(cf)
            if t.get('forme_liee'): declared.add(t['forme_liee'].lower())

# A. phonotactique
A=[(fn,k,cf) for fn,k,cf,comp,rac,t in entries if cf and phonok(cf)]
# B. forme != composition (squelette consonne diffère)
B=[]
for fn,k,cf,comp,rac,t in entries:
    if comp and '-' in comp and cf:
        join=comp.replace('-','').lower()
        if cons(join)!=cons(cf): B.append((fn,k,cf,comp))
# C. racines fantômes (segment de composition ni racine déclarée ni liaison/glue)
phantom=defaultdict(list)
for fn,k,cf,comp,rac,t in entries:
    if comp and '-' in comp:
        for seg in comp.split('-'):
            s=seg.lower()
            if s in LIAISONS or s in GLUE or not s: continue
            if s not in declared:
                phantom[s].append(k)
# D. homophones : 1 forme -> plusieurs concepts FR distincts (hors synonymes même entrée)
# Polysémie VOULUE (Fork 2) : ne compte pas comme violation.
POLY_OK={'sora','seli','viku','mori','vuku','temi','savu','kesa','aska','pisutemi','pupupasu',
         'keko','lina','pasu','piki','taku','seliloli','vukumako',
         'sili','tani'}  # sili=regard/œil/signe (polysémie cardinale du peuple du regard) ; tani=vallée/pronom-3sg (documenté, contexte-désambiguïsé)
byform=defaultdict(set)
for fn,k,cf,comp,rac,t in entries:
    if cf: byform[cf].add(norm(k))
def intentional(f,ks):
    if f in POLY_OK: return True
    if norm(f) in ks: return True  # nom propre listé sous sa forme + sa glose FR
    return False
homophones={f:ks for f,ks in byform.items() if len(ks)>1 and not intentional(f,ks)}

print(f"TOTAL traductions: {len(entries)} | racines déclarées: {len(declared)}")
print(f"\nA. PHONOTACTIQUE invalide : {len(A)}")
for x in A[:20]: print("   ",x)
print(f"\nB. FORME != COMPOSITION (squelette consonne) : {len(B)}")
for fn,k,cf,comp in B[:40]: print(f"    [{fn[:12]}] {k:24} {cf:16} comp={comp}")
print(f"\nC. RACINES FANTÔMES (non déclarées) : {len(phantom)} racines distinctes")
for s in sorted(phantom, key=lambda x:-len(phantom[x])):
    print(f"    {s:8} x{len(phantom[s]):2}  ex: {phantom[s][:4]}")
print(f"\nD. HOMOPHONES (1 forme -> N concepts) : {len(homophones)}")
for f,ks in sorted(homophones.items()):
    print(f"    {f:14} -> {sorted(ks)}")
