#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
parent=~/'.local/share/gnome-shell/extensions'
name='disper-menu@wieczorek1990.gmail.com'
dest="${parent}/${name}"
rm -rf "${dest}"
mkdir -p "${parent}"
cp -r "${DIR}" "${dest}"
cd "${dest}"
glib-compile-schemas 'schemas'
mkdir 'locale'
for po in 'translation'/*'.po'
do
  lang=`basename "${po}" .po`
  dir="locale/${lang}/LC_MESSAGES"
  mkdir -p "${dir}"
  msgfmt -o "${dir}/disper-menu.mo" "${po}"
done
read -d '' sources << EOF
.git
.gitignore
.idea
images/*.png
LICENSE
README.md
schemas/*.xml
scripts
translation
VERSIONS
EOF
rm -rf ${sources}
gnome-shell-extension-tool -e "${name}"
