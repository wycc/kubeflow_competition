kubectl cp build.tgz -n competition $(kubectl get pods -n competition -l app=my-app -o jsonpath='{.items[0].metadata.name}'):/tmp/build.tgz
kubectl cp src/server/main.py  -n competition $(kubectl get pods -n competition -l app=my-app -o jsonpath='{.items[0].metadata.name}'):/server
kubectl exec -n competition  $(kubectl get pods -n competition -l app=my-app -o jsonpath='{.items[0].metadata.name}') -- tar -xzf /tmp/build.tgz -C /app
kubectl exec -n competition  $(kubectl get pods -n competition -l app=my-app -o jsonpath='{.items[0].metadata.name}') -- pkill python
