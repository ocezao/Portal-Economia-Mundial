-- Initial schema for PEM Analytics
-- Creates partitioned events_raw table

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Main events table (partitioned by month)
CREATE TABLE IF NOT EXISTS events_raw (
    event_id VARCHAR(32) NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    event_name VARCHAR(100) NOT NULL,
    user_id UUID,
    session_id UUID,
    anonymous BOOLEAN DEFAULT false,
    url TEXT NOT NULL,
    referrer TEXT,
    ip_hash VARCHAR(16),
    user_agent_hash VARCHAR(32),
    geo_country VARCHAR(2),
    geo_region VARCHAR(10),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    properties JSONB DEFAULT '{}',
    
    PRIMARY KEY (event_id, event_time)
) PARTITION BY RANGE (event_time);

-- Indexes on parent table (will be inherited by partitions)
CREATE INDEX IF NOT EXISTS idx_events_raw_event_time ON events_raw(event_time);
CREATE INDEX IF NOT EXISTS idx_events_raw_user_id ON events_raw(user_id);
CREATE INDEX IF NOT EXISTS idx_events_raw_event_name ON events_raw(event_name);
CREATE INDEX IF NOT EXISTS idx_events_raw_url ON events_raw(url);

-- GIN index for JSONB properties
CREATE INDEX IF NOT EXISTS idx_events_raw_properties ON events_raw USING GIN(properties);

-- Note: UNIQUE INDEX on event_id is created per-partition by partition-manager.sh
-- This is required for the ON CONFLICT (event_id) DO NOTHING to work
