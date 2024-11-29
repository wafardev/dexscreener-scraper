#!/bin/bash

echo "Running Node.js cleanup script..."
node ./src/utils/cleanUp.js ./downloaded-sites ./saved-contracts

ALLOWED_PATHS=(
    "downloaded-sites"
    "saved-contracts"
    "node_modules"
    ".git"
    "src"
    ".env"
    ".env.sample"
    ".gitignore"
    "package.json"
    "package-lock.json"
    "README.md"
)

ALLOWED_PATHS_ABS=()
for path in "${ALLOWED_PATHS[@]}"; do
    if [ -e "$path" ]; then
        ALLOWED_PATHS_ABS+=("$(realpath "$path")")
    else
        echo "Warning: Allowed entry does not exist: $path"
    fi
done

is_allowed() {
    local path="$1"
    for allowed in "${ALLOWED_PATHS_ABS[@]}"; do
        if [ "$(realpath "$path")" == "$allowed" ]; then
            return 0
        fi
    done
    return 1
}

ls -i | while IFS= read -r line; do
    inode=$(echo "$line" | awk '{print $1}')     # Extract inode number
    file=$(echo "$line" | awk '{$1=""; print $0}' | sed 's/^ *//')  # Extract file name

    if ! is_allowed "$file"; then
        # Handle files with strange characters by quoting the file path
        echo "Deleting file: '$file' with inode $inode"
        
        # Delete the file using its inode number
        find . -maxdepth 1 -inum "$inode" -exec rm -f {} \;
    fi
done

echo "Unwanted file removal completed."
