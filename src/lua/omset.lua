local function get_parent(str) --cut last element (foo:baz remains)
    return string.match(str, "(.*):[^:]*$")
end

local function get_last(str)
    return string.match(str, "[^:]*$")
end

local function down_iter(key)
    return function ()
        local last = get_last(key)
        key = get_parent(key)
        return key, last
    end
end

local function fill_lower(key)
    local filled = 0
    for child, parent in down_iter(key) do
        local added = redis.call('sadd', '$' .. child, parent) --x 1
        if added == 0 then break end
        if redis.call('del', child) then
            redis.call('srem', '#' .. child, parent)
        end
        filled = filled + 1
    end
    return filled
end

local function delete_upper(key, deleted)
    local up_values = redis.call('smembers', '#' .. key)
    local up_branches = redis.call('smembers', '$' .. key)
    deleted = #up_values + #up_branches
    for _, value in ipairs(up_values) do
        redis.call('srem', '#' .. key, value)
        redis.call('del', key .. ':' .. value)
    end

    for _, branch in ipairs(up_branches) do
        redis.call('srem', '$' .. key, branch)
        return delete_upper(key .. ':' .. branch)
    end
    return deleted
end

local function odel(key)
    local deleted = redis.call('del', key)

    if deleted == 1 then
        local parent = get_parent(key)
        redis.call('srem', '#' .. parent, get_last(key))
        local still_alive = redis.call('exists', '#' .. parent)
        if still_alive == 1 then return 1 end
        for parent, child in down_iter(parent) do
            redis.call('srem', '$' .. parent, child)
            if redis.call('exists', '#' .. parent, '$' .. parent) > 0 then
                return 1
            end
        end
        return
    end

    deleted = delete_upper(key)
    if deleted == 0 then return end

    for parent, child in down_iter(key) do
        if  redis.call('srem', '$' .. parent, child) == 0
        or  redis.call('exists', '$' .. parent, '#' .. parent) > 0
            then break end
    end

end

local function oset(key, value)
    if value == 'null' then return odel(key) end

    redis.call('set', key, value)

    local branch_ptr = get_parent(key)
    local value_ptr = get_last(key)
    local added = redis.call('sadd', '#' .. branch_ptr, value_ptr)
    if added == 0 then return 1 end

    -- the fact that lower branch already filled
    -- may suggest that we may be somewhere in the middle
    if fill_lower(branch_ptr) == 0 then
        if redis.call('exists', '$' .. branch_ptr) == 1 then
            redis.call('srem', '$' .. branch_ptr, value_ptr)
            delete_upper(key)
        end
    end
end

local prefix = table.remove(KEYS, 1)

if KEYS[1] == '' then
    oset(prefix, ARGV[1])
else
    for i, key in ipairs(KEYS) do
        oset(prefix .. ':' .. key, ARGV[i])
    end
end

return 1