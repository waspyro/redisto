local keys = {}
local values = {}
local base_key = KEYS[1]

local function get_upper(rel_key, sep)
    local full_key = base_key .. sep .. rel_key
    local up_branches = redis.call('smembers', '$' .. full_key)
    local up_values = redis.call('smembers', '#' .. full_key)
    for _, value_ptr in ipairs(up_values) do
        table.insert(keys, rel_key .. sep .. value_ptr)
        table.insert(values, redis.call('get', full_key .. ':' .. value_ptr))
    end
    -- todo: KEYS[2] as max depth
    for _, branch_ptr in ipairs(up_branches) do
        get_upper(rel_key .. sep .. branch_ptr, ':')
    end
end

get_upper('', '')
return { keys, values }