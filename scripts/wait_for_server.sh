if ! timeout 120 bash -c 'until tail -f output.log | grep -m 1 "Registered platform:"; do sleep 1; done'; then
    echo "Error: Server is not working correctly." >&2
    exit 1
fi