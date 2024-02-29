#!/usr/bin/env bash
# run this to deploy IGB early access (development branch)
# assumes bitbucket custom pipeline build-master-branch-installers was run
branch="main-JDK21-with-javafx-no-theme"
installers="IGB-macos-universal-$branch.dmg IGB-windows-$branch_amd64.exe.sh IGB-linux-$branch_amd64.sh"
base="https://bitbucket.org/lorainelab/integrated-genome-browser/downloads"
for installer in $installers;
do
    url="$base/$installer"
    cmd="wget -O IGB-$installer $url"
    $cmd
done
