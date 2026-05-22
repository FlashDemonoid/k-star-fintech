#!/bin/bash

echo "Deploying K Star Fintech to Kubernetes..."

kubectl apply -f namespace/namespace.yaml
kubectl apply -f secrets/secrets.yaml
kubectl apply -f configmaps/configmaps.yaml
kubectl apply -f deployments/databases.yaml
kubectl apply -f deployments/kafka.yaml
kubectl apply -f services/services.yaml

echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=mysql -n kstar --timeout=120s
kubectl wait --for=condition=ready pod -l app=mongodb -n kstar --timeout=120s
kubectl wait --for=condition=ready pod -l app=kafka -n kstar --timeout=120s

kubectl apply -f deployments/services.yaml
kubectl apply -f ingress/ingress.yaml
kubectl apply -f hpa/hpa.yaml

echo ""
echo "Done! Check status:"
echo "  kubectl get all -n kstar"
