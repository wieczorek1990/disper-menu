#!/bin/bash
parent=~/'.local/share/gnome-shell/extensions'
name='disper-menu@wieczorek1990.gmail.com'
cd "$parent"
7z a -tzip ~/"${name}.zip" ./"$name"/*
