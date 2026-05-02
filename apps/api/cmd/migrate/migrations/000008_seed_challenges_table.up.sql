INSERT INTO challenges (
    name,
    description,
    duration_ms,
    seed_type,
    difficulty,
    active,
    config_json,
    created_at,
    updated_at
) VALUES
(
    'Static Scenario',
    'A static aiming challenge for 1 minute.',
    60000,
    'fixed',
    1,
    TRUE,
    '{"type":"static","targets":1,"pattern":"fixed"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Tracking Scenario',
    'A tracking challenge for 1 minute.',
    60000,
    'fixed',
    2,
    TRUE,
    '{"type":"tracking","targets":1,"pattern":"moving"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);