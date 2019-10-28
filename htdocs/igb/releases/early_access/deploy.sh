#!/usr/bin/env bash
# run this to deploy IGB early access (master branch)
release="master"
installers="$release.dmg $release.sh $release.exe"
base="https://bitbucket.org/lorainelab/integrated-genome-browser/downloads"
for installer in $installers;
do
    url="$base/$installer"
    cmd="wget -O $installer.tmp $url"
    $cmd
    mv $installer.tmp IGB-$installer
done
