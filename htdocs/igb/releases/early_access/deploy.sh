#!/usr/bin/env bash
# run this to deploy IGB early access (master branch)
release="master"
installers="IGB-$release.dmg IGB-$release.sh IGB-$release.exe IGB-$release-x64.exe IGB-master.sh"
base="https://bitbucket.org/lorainelab/integrated-genome-browser/downloads"
for installer in $installers;
do
    url="$base/$installer"
    cmd="wget $url"
    $cmd
done
