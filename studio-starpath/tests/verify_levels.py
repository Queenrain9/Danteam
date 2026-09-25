"""Recompute shortest seal-delivery and optional-treat paths for every committed stage.
Run: python studio-starpath/tests/verify_levels.py
No runtime dependencies; this is a deterministic rules-level QA gate.
"""
from pathlib import Path
from heapq import heappush, heappop
import json
LEVELS=json.loads((Path(__file__).resolve().parents[1]/"src/levels.json").read_text())

def min_cost(rows,need_treat=False):
    start=(0,6,False,False)
    distances={start:0}
    heap=[(0,start)]
    while heap:
        cost,(x,y,key,treat)=heappop(heap)
        if distances[(x,y,key,treat)]!=cost: continue
        if (x,y)==(6,0) and key and (not need_treat or treat): return cost
        for dx,dy in ((0,-1),(1,0),(0,1),(-1,0)):
            nx,ny=x+dx,y+dy
            if not 0<=nx<7 or not 0<=ny<7: continue
            tile=rows[ny][nx]
            if tile=="#" or (tile=="D" and not key):continue
            k=key or tile=="K"
            t=treat or tile=="C"
            dest=(nx,ny,k,t)
            new=cost+(2 if tile=="~" else 1)
            if new>=distances.get(dest,10**9):continue
            distances[dest]=new
            heappush(heap,(new,dest))
    return None

for index,level in enumerate(LEVELS,1):
    rows=level["rows"]
    assert len(rows)==7 and all(len(row)==7 for row in rows),index
    assert rows[6][0]=="S" and rows[0][6]=="H" and rows[0][5]=="D",index
    assert sum(row.count("K") for row in rows)==1,index
    assert sum(row.count("C") for row in rows)==1,index
    direct=min_cost(rows)
    treat=min_cost(rows,True)
    assert direct is not None and direct==level["shortest"],index
    assert treat is not None and treat==level["treatShortest"],index
    assert direct<=level["budget"] and treat<=level["budget"],index
    assert treat-direct>=2,index
    print("PASS",index,"direct",direct,"treat",treat,"budget",level["budget"])
print("ALL 12 LEVELS SOLVABLE WITH AND WITHOUT TREAT")
