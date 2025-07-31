#!/bin/bash

# Test the payment intent endpoint
curl -X POST http://localhost:5000/api/v1/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1999, "currency": "usd", "metadata": {"tourId": "123", "userId": "test-user-123"}}'
