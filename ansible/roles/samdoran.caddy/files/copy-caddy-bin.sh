#!/usr/bin/env bash

PREFIX="/var/tmp/caddy"
install_path="/usr/local/bin"
caddy_bin="caddy"

# Back up existing caddy, if any found in path
if caddy_path="$(type -p "$caddy_bin")"; then
    caddy_backup="${caddy_path}_old"
    mv "$caddy_path" "$caddy_backup"
fi

cp -a "$PREFIX/$caddy_bin" "$install_path/$caddy_bin"
