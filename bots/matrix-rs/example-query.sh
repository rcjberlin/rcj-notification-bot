#!/bin/bash

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"token":"test","room":"!internal_id:example.com","content":"Hello from HTTP"}' http://localhost:2001/send
