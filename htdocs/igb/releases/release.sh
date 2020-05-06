#!/usr/bin/env bash
release="9.1.4"
installers="IGB-macos-$release.dmg IGB-unix-$release.sh IGB-windows-$release.exe IGB-windows-x64-$release.exe"
base="https://bitbucket.org/lorainelab/integrated-genome-browser/downloads"
for installer in $installers; do
    if [ -f $installer ]
    then
	rm $installer
    fi
    url="$base/$installer"
    cmd="wget $url"
    $cmd
done

files="igb_exe.jar updates.xml"
for file in $files; do
    if [ -f $file ]
    then
	rm $file
    fi
    url="$base/$file"
    cmd="wget $url"
    $cmd
done

ln -sfn IGB-macos-$release.dmg IGB_macos_current.dmg
ln -sfn IGB-unix-$release.sh IGB_unix_current.sh
ln -sfn IGB-windows-$release.exe IGB_windows_current.exe
ln -sfn IGB-windows-x64-$release.exe IGB_windows-x64_current.exe
