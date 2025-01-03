#!/bin/bash

# Detect if we're running in a container
# Returns 0 (true) if in container, 1 (false) if not
is_in_container() {
    if [ -f "/.dockerenv" ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
        return 0
    fi
    return 1
}
