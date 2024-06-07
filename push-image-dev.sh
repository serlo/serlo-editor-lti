set -e

docker build . -f Dockerfile.dev -t eu.gcr.io/serlo-shared/editor-as-lti-tool:dev
docker push eu.gcr.io/serlo-shared/editor-as-lti-tool:dev
sleep 1
kubectl delete pod -n editor -l app=editor
