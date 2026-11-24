import requests

floors = requests.get('http://localhost:8085/api/floors').json()
total_shops = 0
total_facs = 0

for f in floors:
    num = f['floorNumber']
    m = requests.get(f'http://localhost:8085/api/floors/{num}/map').json()
    shops = m['shops']
    facs = m['facilities']
    total_shops += len(shops)
    total_facs += len(facs)
    print(f"Floor {num} ({f['label']}): {len(shops)} shops, {len(facs)} facilities")
    for s in shops:
        print(f"  Shop #{s['id']}: {s['name']} (Cat: {s['category']}, Node: {s['navigationNodeId']}, x={s['x']}, y={s['y']})")
    for fac in facs:
        print(f"  Facility #{fac['id']}: {fac['label']} (Type: {fac['type']}, Node: {fac['navigationNodeId']}, x={fac['x']}, y={fac['y']})")

print(f"\nTOTAL: {total_shops} shops, {total_facs} facilities across {len(floors)} floors.")
