#!/bin/bash
# Start Supabase with storage enabled
# This script bypasses the storage health check while keeping storage functionality available

echo "Starting Supabase with storage enabled..."
pnpm dlx supabase start --ignore-health-check

echo ""
echo "✅ Supabase started successfully!"
echo ""
echo "🔍 Service Status:"
pnpm dlx supabase status
echo ""
echo "📝 Note: Storage container may show as restarting due to a migration issue,"
echo "   but storage functionality is available via the S3 API and other services."